const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const interpretEmojis = async (emojis: string): Promise<{ query: string, interpretation: string }> => {
    // Fetch the API key dynamically and strip quotes in case it was explicitly quoted in .env
    let AI_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY;

    if (!AI_API_KEY || AI_API_KEY.includes('REPLACE')) {
        console.warn("AI API KEY is missing or default. Returning mock data.");
        return {
            query: "Dua Lipa Dance The Night",
            interpretation: "High energy, fun, party vibes."
        };
    }

    // Strip trailing or leading quotes
    AI_API_KEY = AI_API_KEY.replace(/^"|"$/g, '').trim();

    try {
        const promptText = `
        I will give you a sequence of emojis representing a user's mood: ${emojis}
        1. interpret the mood in 1 sentence.
        2. Give me ONE song that most closely matches the mood in the format "Title by Artist".

        Return ONLY a JSON object with this exact structure:
        {"interpretation": "your short sentence", "query": "Song Title Artist Name"}
        `;

        // Ensure clean URL without spaces
        const apiUrl = `${GEMINI_API_URL}?key=${AI_API_KEY.trim()}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`AI API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();

        // Extract raw JSON string from Gemini response structure
        let rawText = data.candidates[0].content.parts[0].text;

        // Clean markdown backticks if present (e.g., ```json\n{...}\n```)
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const result = JSON.parse(rawText);

        return {
            query: result.query,
            interpretation: result.interpretation
        };

    } catch (error) {
        console.warn("Failed to interpret emojis via AI:", error);
        // Fallback incase of API failure
        return {
            query: "The Weeknd Blinding Lights",
            interpretation: "Fallback: Energetic pop."
        };
    }
};
