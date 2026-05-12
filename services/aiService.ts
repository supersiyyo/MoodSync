const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_MODEL_CASCADE = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
];

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000; // 2 seconds

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks if the error is a retriable overload error.
 */
const isRetriableError = (status: number, message: string) => {
    return status === 429 || status === 503 || message.toLowerCase().includes('overloaded') || message.toLowerCase().includes('high demand');
};

export const interpretEmojis = async (emojis: string): Promise<{ query: string, interpretation: string, modelUsed: string }> => {
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

    const promptText = `
    I will give you a sequence of emojis representing a user's mood: ${emojis}
    1. interpret the mood in 1 sentence.
    2. Give me ONE song that most closely matches the mood in the format "Title by Artist".

    Return ONLY a JSON object with this exact structure:
    {"interpretation": "your short sentence", "query": "Song Title Artist Name"}
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

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }]
                    })
                });

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
