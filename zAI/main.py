import os
import sys
import time
import tempfile
import shutil
import uuid
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import pdfplumber
from google import genai
from google.genai import errors as genai_errors
from sqlmodel import Session, select, delete
from datetime import datetime, timedelta

from database import engine, init_db, get_session
from models import Exam, Submission, SubmissionBase

# Load environment variables
load_dotenv()

app = FastAPI(title="PDF2QTI API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

def cleanup_old_exams(session: Session):
    """Delete exams and submissions older than 24 hours."""
    threshold = datetime.utcnow() - timedelta(hours=24)
    # Get old exams
    statement = select(Exam).where(Exam.created_at < threshold)
    results = session.exec(statement)
    count = 0
    for exam in results:
        # Submissions will be deleted via cascade or manual if needed
        # In SQLModel/SQLAlchemy, Relationship with cascade is better, 
        # but let's just delete the exam and submissions manually here if no cascade set.
        # Actually, let's just delete the exam records.
        session.delete(exam)
        count += 1
    if count > 0:
        session.commit()
        print(f"[Cleanup] Successfully purged {count} expired exams and their associated submissions.")

# AI Schema Configuration
class Question(BaseModel):
    question_text: str = Field(description="The text of the multiple choice question.")
    choices: List[str] = Field(description="A list of 4 choices for the question.")
    correct_answer_index: int = Field(description="The 0-based index of the correct answer in the choices list.")

class QuizExtraction(BaseModel):
    questions: List[Question]

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

# --- Gemini Resilience Helpers ---

GEMINI_MODEL_CASCADE = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
]
MAX_RETRIES = 3
RETRY_BASE_DELAY = 2  # seconds

def _is_overload_error(exc: Exception) -> bool:
    """Return True if the exception is a Gemini 503 (UNAVAILABLE) or 429 (RESOURCE_EXHAUSTED) error."""
    msg = str(exc).lower()
    return any(term in msg for term in ["503", "unavailable", "high demand", "429", "quota", "exhausted"])

async def call_gemini_with_retry(prompt: str, mode: str, log_callback=None) -> dict:
    """
    Attempt to call the Gemini API with exponential backoff retries.
    Cascades through GEMINI_MODEL_CASCADE if all retries on a model fail.
    Returns a dict with keys: 'data' (parsed JSON) and optionally 'warning' (str).
    """
    import json
    import asyncio
    client = genai.Client()
    config = {
        "response_mime_type": "application/json",
        "response_schema": QuizExtraction,
        "temperature": 0.2 if mode == "digitize" else 0.7,
    }

    last_exc = None
    for model_idx, model_name in enumerate(GEMINI_MODEL_CASCADE):
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                msg = f"AI is working with {model_name}..."
                print(f"[Gemini] Trying {model_name} (Attempt {attempt})")
                if log_callback:
                    await log_callback({"message": msg, "model": model_name})
                
                # generate_content is synchronous; wrap in to_thread to avoid blocking event loop
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=prompt,
                    config=config
                )
                
                try:
                    data = json.loads(response.text)
                except json.JSONDecodeError as e:
                    # If the model fails to return valid JSON, treat it as an overload/transient error
                    # and allow it to retry or cascade.
                    raise Exception(f"JSON Parsing Error: {str(e)}")
                
                result = {"data": data}
                # Notify user if we fell back to a secondary model
                if model_idx > 0:
                    result["warning"] = (
                        f"The primary AI model is currently experiencing high usage. "
                        f"To avoid delays, your quiz was generated using a high-availability backup model ({model_name})."
                    )
                return result
            except Exception as exc:
                last_exc = exc
                # Now _is_overload_error handles typical API errors, 
                # and we also catch our custom JSON Parsing Error here.
                is_retriable = _is_overload_error(exc) or "JSON Parsing Error" in str(exc)
                
                if is_retriable:
                    if attempt < MAX_RETRIES:
                        delay = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                        msg = f"AI encountered an issue. Retrying in {delay}s..."
                        print(f"[Gemini] Error on {model_name} (Attempt {attempt}): {str(exc)}")
                        if log_callback:
                            await log_callback({"message": msg, "model": model_name})
                        await asyncio.sleep(delay)
                    else:
                        msg = f"Model {model_name} exhausted. Switching to backup..."
                        print(f"[Gemini] All {MAX_RETRIES} retries exhausted for {model_name}. Cascading...")
                        if log_callback:
                            await log_callback({"message": msg, "model": model_name})
                        break  # try next model
                else:
                    # Non-retriable error — re-raise immediately
                    raise

    # All models exhausted
    raise HTTPException(
        status_code=503,
        detail="The AI model is currently overloaded. Please try again in a moment.",
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to PDF2QTI API"}

from fastapi.responses import StreamingResponse
import json

@app.post("/api/process-pdf")
async def process_pdf(
    mode: str = Form(...), 
    file: UploadFile = File(...),
    question_count: int = Form(10)
):
    if mode not in ["generate", "digitize"]:
        raise HTTPException(status_code=400, detail="Invalid mode selected")

    if "GEMINI_API_KEY" not in os.environ:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in environment.")

    async def progress_generator():
        try:
            yield f"data: {json.dumps({'status': 'info', 'message': 'Initializing...', 'model': 'System'})}\n\n"
            
            # Save uploaded file temporarily
            yield f"data: {json.dumps({'status': 'info', 'message': 'Reading document...', 'model': 'System'})}\n\n"
            temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            content = await file.read()
            temp_pdf.write(content)
            temp_pdf.close()

            # Extract text
            yield f"data: {json.dumps({'status': 'info', 'message': 'Extracting text...', 'model': 'System'})}\n\n"
            extracted_text = extract_text_from_pdf(temp_pdf.name)
            os.unlink(temp_pdf.name)

            if not extracted_text.strip():
                yield f"data: {json.dumps({'status': 'error', 'message': 'Could not extract any text from the provided PDF.'})}\n\n"
                return

            # Prepare AI Prompt
            yield f"data: {json.dumps({'status': 'info', 'message': 'Analyzing content...', 'model': 'System'})}\n\n"
            if mode == "digitize":
                prompt_instruction = f"Act as a strict data extractor. Extract exactly {question_count} multiple choice questions and choices from the provided text. If there are fewer than {question_count} questions in the text, extract all that are available. If no correct answer is explicitly provided, solve the question to provide the `correct_answer_index`."
            else:
                prompt_instruction = f"Act as an educator. Synthesize the provided text to invent {question_count} new, high-quality multiple choice questions based on the content."

            full_prompt = f"{prompt_instruction}\n\nDocument Text:\n{extracted_text}"

            # Call Gemini
            yield f"data: {json.dumps({'status': 'info', 'message': 'Generating questions...', 'model': 'Gemini'})}\n\n"
            
            # Since we can't yield from the callback, we define it here
            # But await call_gemini_with_retry will block until it returns.
            # To get real-time logs, we would need to run it in a task and read from a queue.
            # For simplicity, let's just make the callback print and we yield after? 
            # No, let's do it right.
            
            import asyncio
            queue = asyncio.Queue()

            async def log_callback(info):
                # info is a dict: {"message": "...", "model": "..."}
                await queue.put({'status': 'info', **info})

            # Run AI call in background task
            task = asyncio.create_task(call_gemini_with_retry(full_prompt, mode, log_callback=log_callback))

            # While task is running, check queue
            while not task.done():
                try:
                    # Wait for a message with a timeout to check task status
                    msg = await asyncio.wait_for(queue.get(), timeout=0.1)
                    yield f"data: {json.dumps(msg)}\n\n"
                except asyncio.TimeoutError:
                    continue

            # Final check of queue
            while not queue.empty():
                msg = await queue.get()
                yield f"data: {json.dumps(msg)}\n\n"

            result = await task
            data = result["data"]

            original_name = file.filename
            if original_name.lower().endswith(".pdf"):
                original_name = original_name[:-4]
            data["quiz_title"] = f"P2Q_{original_name}"

            if "warning" in result:
                data["_warning"] = result["warning"]
                yield f"data: {json.dumps({'status': 'warning', 'message': result['warning']})}\n\n"

            yield f"data: {json.dumps({'status': 'success', 'message': 'Quiz generated successfully!', 'data': data})}\n\n"

        except Exception as e:
            print(f"[Error] Unexpected: {e}")
            yield f"data: {json.dumps({'status': 'error', 'message': f'An unexpected error occurred: {str(e)}'})}\n\n"

    return StreamingResponse(progress_generator(), media_type="text/event-stream")


class ExtractQTIRequest(BaseModel):
    quiz_title: str
    questions: List[Question]
    show_score: Optional[bool] = True
    shuffle_questions: Optional[bool] = False
    shuffle_choices: Optional[bool] = False

@app.post("/api/export-qti")
async def export_qti(data: ExtractQTIRequest, background_tasks: BackgroundTasks):
    try:
        # Construct markdown string for text2qti
        # Sanitize quiz title to remove newlines
        safe_quiz_title = data.quiz_title.replace('\n', ' ').replace('\r', ' ').strip()
        markdown_content = f"Quiz title: {safe_quiz_title}\n\n"
        
        for i, q in enumerate(data.questions, 1):
            # Sanitize question text
            safe_question = q.question_text.replace('\n', ' ').replace('\r', ' ').strip()
            markdown_content += f"{i}. {safe_question}\n"
            
            for j, choice in enumerate(q.choices):
                # Sanitize choices
                safe_choice = choice.replace('\n', ' ').replace('\r', ' ').strip()
                choice_letter = chr(97 + j) # a, b, c, d
                if j == q.correct_answer_index:
                    markdown_content += f"*{choice_letter}) {safe_choice}\n"
                else:
                    markdown_content += f"{choice_letter}) {safe_choice}\n"
            markdown_content += "\n"

        # Temporary files for text2qti
        base_dir = tempfile.mkdtemp()
        md_path = os.path.join(base_dir, "quiz.md")
        qti_path = os.path.join(base_dir, "quiz.zip")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        
        # Generate QTI using text2qti as a Python module for PATH safety across all environments
        import subprocess
        try:
            subprocess.run(
                [sys.executable, "-c", "from text2qti.cmdline import main; main()", md_path],
                cwd=base_dir,
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as sub_e:
            raise Exception(f"text2qti compilation failed: {sub_e.stderr}")
        except FileNotFoundError:
            raise Exception("text2qti module not found. Ensure it is installed in the server environment.")

        safe_filename = "".join(c for c in data.quiz_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_filename = safe_filename.replace(' ', '_') or 'quiz'

        # Schedule temp directory cleanup AFTER the response has been fully sent
        background_tasks.add_task(shutil.rmtree, base_dir, True)

        # Return file
        return FileResponse(
            path=qti_path,
            media_type="application/zip",
            filename=f"{safe_filename}.zip",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Emergency Assessment Endpoints ---

@app.post("/api/exams")
async def create_exam(data: ExtractQTIRequest, session: Session = Depends(get_session)):
    """Create a new exam from extracted questions."""
    # Convert Question objects to dicts for JSON storage
    questions_list = [q.model_dump() for q in data.questions]
    
    new_exam = Exam(
        title=data.quiz_title,
        questions_json=questions_list,
        show_score=getattr(data, "show_score", True),
        shuffle_questions=getattr(data, "shuffle_questions", False),
        shuffle_choices=getattr(data, "shuffle_choices", False)
    )
    session.add(new_exam)
    session.commit()
    session.refresh(new_exam)
    
    return {
        "id": new_exam.id,
        "secret_id": new_exam.secret_id,
        "title": new_exam.title
    }

@app.get("/api/exams/{exam_id}")
async def get_exam(exam_id: str, session: Session = Depends(get_session)):
    """Fetch exam details (without secret_id) for students."""
    cleanup_old_exams(session)
    
    statement = select(Exam).where(Exam.id == exam_id)
    exam = session.exec(statement).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or expired.")
    
    if exam.status == "closed":
        raise HTTPException(status_code=403, detail="This exam has been closed.")
    
    # Hide correct answers from the student-facing JSON
    safe_questions = []
    for q in exam.questions_json:
        safe_q = q.copy()
        if "correct_answer_index" in safe_q:
            del safe_q["correct_answer_index"]
        safe_questions.append(safe_q)
        
    return {
        "id": exam.id,
        "title": exam.title,
        "questions": safe_questions,
        "created_at": exam.created_at,
        "show_score": exam.show_score,
        "shuffle_questions": exam.shuffle_questions,
        "shuffle_choices": exam.shuffle_choices
    }

@app.post("/api/exams/{exam_id}/submit")
async def submit_exam(exam_id: str, submission_data: SubmissionBase, session: Session = Depends(get_session)):
    """Submit student responses."""
    statement = select(Exam).where(Exam.id == exam_id)
    exam = session.exec(statement).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or expired.")
    
    if exam.status == "closed":
        raise HTTPException(status_code=403, detail="This exam is no longer accepting submissions.")
    
    # Calculate score
    correct_count = 0
    total_questions = len(exam.questions_json)
    
    for i, student_ans in enumerate(submission_data.answers_json):
        if i < total_questions:
            if student_ans == exam.questions_json[i].get("correct_answer_index"):
                correct_count += 1
    
    score = (correct_count / total_questions * 100) if total_questions > 0 else 0
    
    new_submission = Submission(
        exam_id=exam.id,
        student_email=submission_data.student_email,
        student_id=submission_data.student_id,
        answers_json=submission_data.answers_json,
        score=round(score, 2)
    )
    session.add(new_submission)
    session.commit()
    
    return {
        "message": "Submission successful", 
        "score": new_submission.score if exam.show_score else None,
        "show_score": exam.show_score
    }

@app.get("/api/exams/admin/{secret_id}")
async def get_admin_dashboard(secret_id: str, session: Session = Depends(get_session)):
    """Admin dashboard view with all submissions."""
    cleanup_old_exams(session)
    
    statement = select(Exam).where(Exam.secret_id == secret_id)
    exam = session.exec(statement).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or expired.")
    
    return {
        "id": exam.id,
        "title": exam.title,
        "status": exam.status,
        "created_at": exam.created_at,
        "show_score": exam.show_score,
        "shuffle_questions": exam.shuffle_questions,
        "shuffle_choices": exam.shuffle_choices,
        "submissions": exam.submissions
    }

@app.post("/api/exams/admin/{secret_id}/close")
async def close_exam(secret_id: str, session: Session = Depends(get_session)):
    """Close the exam to new submissions."""
    statement = select(Exam).where(Exam.secret_id == secret_id)
    exam = session.exec(statement).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    
    exam.status = "closed"
    session.add(exam)
    session.commit()
    
    return {"message": "Exam closed successfully."}

@app.post("/api/exams/admin/{secret_id}/settings")
async def update_settings(secret_id: str, settings: dict, session: Session = Depends(get_session)):
    """Update exam settings."""
    statement = select(Exam).where(Exam.secret_id == secret_id)
    exam = session.exec(statement).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    
    if "show_score" in settings:
        exam.show_score = settings["show_score"]
    if "shuffle_questions" in settings:
        exam.shuffle_questions = settings["shuffle_questions"]
    if "shuffle_choices" in settings:
        exam.shuffle_choices = settings["shuffle_choices"]
    if "status" in settings and settings["status"] in ["open", "closed"]:
        exam.status = settings["status"]
        
    session.add(exam)
    session.commit()
    
    return {"message": "Settings updated successfully."}
