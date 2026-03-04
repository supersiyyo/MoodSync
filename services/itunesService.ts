export interface ITunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    previewUrl: string;
    artworkUrl100: string;
}

export const searchSong = async (query: string): Promise<ITunesTrack | null> => {
    try {
        // Encode the query for URL
        const encodedQuery = encodeURIComponent(query);
        // Search iTunes API for top 1 music track
        const url = `https://itunes.apple.com/search?term=${encodedQuery}&media=music&entity=song&limit=1`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`iTunes API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const track = data.results[0];
            return {
                trackId: track.trackId,
                trackName: track.trackName,
                artistName: track.artistName,
                previewUrl: track.previewUrl,
                artworkUrl100: track.artworkUrl100
            };
        }

        return null; // No results found
    } catch (error) {
        console.error("Failed to fetch from iTunes API:", error);
        return null;
    }
};
