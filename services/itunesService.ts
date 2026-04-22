export interface ITunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    previewUrl: string;
    artworkUrl100: string;
}

export const searchSongs = async (query: string, limit = 5): Promise<ITunesTrack[]> => {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://itunes.apple.com/search?term=${encodedQuery}&media=music&entity=song&limit=${limit}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`iTunes API error: ${response.status}`);

        const data = await response.json();
        return (data.results ?? [])
            .filter((t: any) => t.previewUrl)
            .map((t: any) => ({
                trackId: t.trackId,
                trackName: t.trackName,
                artistName: t.artistName,
                previewUrl: t.previewUrl,
                artworkUrl100: t.artworkUrl100,
            }));
    } catch (error) {
        console.error("Failed to fetch from iTunes API:", error);
        return [];
    }
};

export const searchSong = async (query: string): Promise<ITunesTrack | null> => {
    const results = await searchSongs(query, 1);
    return results[0] ?? null;
};
