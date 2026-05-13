const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_MODEL_CASCADE = [
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-2.5-flash-lite"
];

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 1000; // 1 second

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetriableError = (status: number, message: string) => {
    return status === 429 || status === 503 || message.toLowerCase().includes('overloaded') || message.toLowerCase().includes('high demand');
};

export interface AIResponse {
    query: string;
    interpretation: string;
    modelUsed: string;
}

export const interpretEmojis = async (
    emojis: string, 
    history: string[] = [],
    onStatusUpdate?: (status: string) => void
): Promise<AIResponse> => {
    let AI_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY;

    if (!AI_API_KEY || AI_API_KEY.includes('REPLACE')) {
        console.warn("AI API KEY is missing or default. Returning mock data.");
        return {
            query: "Dua Lipa Dance The Night",
            interpretation: "High energy, fun, party vibes.",
            modelUsed: "Mock Data"
        };
    }

    AI_API_KEY = AI_API_KEY.replace(/^"|"$/g, '').trim();

    const historyContext = history.length > 0 
        ? `The last played songs were: ${history.join(', ')}. Use this to ensure a smooth sonic transition.`
        : "This is the first song of the session.";

    const promptText = `
    You are the "MoodSync DJ," an expert in emoji-based emotional analysis and music curation.
    
    User Input Emojis: ${emojis}
    ${historyContext}

    YOUR TASK:
    1. DECONSTRUCT the emojis: Analyze how they interact (e.g., contrast, harmony, metaphors).
    2. DEFINE the "Mood DNA": (Energy, Valence, Tempo, Genre).
    3. SELECT a song that matches this deep emotional state. Avoid literal interpretations.

    Return ONLY a JSON object with this structure:
    {
      "interpretation": "A deep 1-sentence analysis of the emoji interaction.",
      "query": "Song Title by Artist Name"
    }
    `;

    for (let modelIdx = 0; modelIdx < GEMINI_MODEL_CASCADE.length; modelIdx++) {
        const modelName = GEMINI_MODEL_CASCADE[modelIdx];

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const statusMsg = attempt === 1 
                    ? `Consulting ${modelName}...` 
                    : `Retrying with ${modelName} (${attempt})...`;
                if (onStatusUpdate) onStatusUpdate(statusMsg);
                
                console.log(`[AI] Trying ${modelName} (Attempt ${attempt})...`);
                
                const apiUrl = `${BASE_URL}/${modelName}:generateContent?key=${AI_API_KEY}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }]
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errText = await response.text();
                    const status = response.status;
                    
                    if (isRetriableError(status, errText)) {
                        const msg = `${modelName} busy. Trying backup...`;
                        if (onStatusUpdate) onStatusUpdate(msg);
                        
                        if (attempt < MAX_RETRIES) {
                            await wait(RETRY_BASE_DELAY);
                            continue;
                        } else {
                            break; 
                        }
                    }
                    throw new Error(`AI API error: ${status}`);
                }

                const data = await response.json();
                let rawText = data.candidates[0].content.parts[0].text;
                
                // Robust JSON extraction
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                const cleanedText = jsonMatch ? jsonMatch[0] : rawText;
                const result = JSON.parse(cleanedText);

                return {
                    query: result.query,
                    interpretation: result.interpretation,
                    modelUsed: modelName
                };

            } catch (error: any) {
                if (error.name === 'AbortError') {
                    const msg = `${modelName} timed out. Pivoting...`;
                    if (onStatusUpdate) onStatusUpdate(msg);
                    console.warn(`[AI] ${modelName} (Attempt ${attempt}): Timeout.`);
                } else {
                    console.error(`[AI] Error on ${modelName}:`, error.message);
                }
                
                if (attempt < MAX_RETRIES) {
                    await wait(RETRY_BASE_DELAY);
                } else {
                    break;
                }
            }
        }
    }

    return {
        query: "The Weeknd Blinding Lights",
        interpretation: "Fallback: Models overloaded.",
        modelUsed: "None (Fallback)"
    };
};
