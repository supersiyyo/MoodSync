const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_MODEL_CASCADE = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
];

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 1000; // 1 second

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks if the error is a retriable overload error.
 */
const isRetriableError = (status: number, message: string) => {
    return status === 429 || status === 503 || message.toLowerCase().includes('overloaded') || message.toLowerCase().includes('high demand');
};

export const interpretEmojis = async (
    emojis: string, 
    lastPlayedTracks: string[] = []
): Promise<{ query: string, interpretation: string, modelUsed: string }> => {
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

    const historyContext = lastPlayedTracks.length > 0 
        ? `The last played songs were: ${lastPlayedTracks.join(', ')}. Use this to ensure a smooth sonic transition.`
        : "This is the first song of the session.";

    const promptText = `
    You are the "MoodSync DJ," an expert in emoji-based emotional analysis and music curation.
    
    User Input Emojis: ${emojis}
    ${historyContext}

    YOUR TASK:
    1. DECONSTRUCT the emojis: Analyze how they interact (e.g., contrast, harmony, metaphors).
    2. DEFINE the "Mood DNA": (Energy, Valence, Tempo, Genre).
    3. SELECT a song that matches this deep emotional state. Avoid literal interpretations (e.g., 🌊 doesn't have to be a song about the ocean, it could be "fluid" synth-pop).

    Return ONLY a JSON object with this structure:
    {
      "interpretation": "A deep 1-sentence analysis of the emoji interaction.",
      "query": "Song Title by Artist Name"
    }
    `;

    let lastError = null;

    // Outer Loop: Models
    for (let modelIdx = 0; modelIdx < GEMINI_MODEL_CASCADE.length; modelIdx++) {
        const modelName = GEMINI_MODEL_CASCADE[modelIdx];

        // Inner Loop: Retries
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[AI] Trying ${modelName} (Attempt ${attempt})...`);
                
                const apiUrl = `${BASE_URL}/${modelName}:generateContent?key=${AI_API_KEY}`;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
                        if (attempt < MAX_RETRIES) {
                            const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
                            console.warn(`[AI] ${modelName} overloaded. Retrying in ${delay}ms...`);
                            await wait(delay);
                            continue; // Try next attempt
                        } else {
                            console.warn(`[AI] ${modelName} exhausted. Cascading to next model...`);
                            break; // Exit retry loop, move to next model
                        }
                    }
                    throw new Error(`AI API error: ${status} - ${errText}`);
                }

                const data = await response.json();
                let rawText = data.candidates[0].content.parts[0].text;
                rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

                const result = JSON.parse(rawText);

                if (modelIdx > 0) {
                    console.log(`[AI] Success using backup model: ${modelName}`);
                }

                return {
                    query: result.query,
                    interpretation: result.interpretation,
                    modelUsed: modelName
                };

            } catch (error: any) {
                lastError = error;
                console.error(`[AI] Error on ${modelName} (Attempt ${attempt}):`, error.message);
                
                if (attempt < MAX_RETRIES) {
                    await wait(RETRY_BASE_DELAY);
                } else {
                    break; // Exhausted retries for this model
                }
            }
        }
    }

    console.error("All AI models in cascade exhausted.");
    return {
        query: "The Weeknd Blinding Lights",
        interpretation: "Fallback: AI models currently overloaded.",
        modelUsed: "None (Fallback)"
    };
};
