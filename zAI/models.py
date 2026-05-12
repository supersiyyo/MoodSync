import uuid
import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import SQLModel, Field, Relationship, Column, JSON

class ExamBase(SQLModel):
    title: str
    questions_json: List[Dict[str, Any]] = Field(default=[], sa_column=Column(JSON))
    status: str = Field(default="open") # "open" or "closed"
    show_score: bool = Field(default=True)
    shuffle_questions: bool = Field(default=False)
    shuffle_choices: bool = Field(default=False)


class Exam(ExamBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    secret_id: str = Field(default_factory=lambda: str(uuid.uuid4()), unique=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    submissions: List["Submission"] = Relationship(back_populates="exam", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class SubmissionBase(SQLModel):
    student_email: str
    student_id: str
    answers_json: List[int] = Field(default=[], sa_column=Column(JSON))
    score: Optional[float] = None

class Submission(SubmissionBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    exam_id: str = Field(foreign_key="exam.id", nullable=False)
    submitted_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    exam: Exam = Relationship(back_populates="submissions")
