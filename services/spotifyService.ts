import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: 'moodsync'
});

const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-modify-public',
    'playlist-modify-private',
    'streaming',
    'user-read-email',
    'user-read-private'
];

export interface SpotifyTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * Initiates the Spotify OAuth flow.
 */
export const loginWithSpotify = async (): Promise<SpotifyTokenResponse | null> => {
    try {
        const request = new AuthSession.AuthRequest({
            clientId: CLIENT_ID!,
            scopes: scopes,
            redirectUri: REDIRECT_URI,
            usePKCE: true,
            responseType: AuthSession.ResponseType.Code,
        });

        const result = await request.promptAsync(discovery);

        if (result.type === 'success') {
            const { code } = result.params;
            return await exchangeCodeForToken(code, request.codeVerifier!);
        }
        return null;
    } catch (error) {
        console.error("Spotify login error:", error);
        return null;
    }
};

const exchangeCodeForToken = async (code: string, codeVerifier: string): Promise<SpotifyTokenResponse | null> => {
    try {
        const response = await fetch(discovery.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID!,
                code_verifier: codeVerifier,
            }).toString(),
        });

        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        };
    } catch (error) {
        console.error("Token exchange error:", error);
        return null;
    }
};

/**
 * Searches for a track on Spotify.
 */
export const searchSpotifyTrack = async (query: string, accessToken: string) => {
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await response.json();
        return data.tracks.items[0] || null;
    } catch (error) {
        console.error("Spotify search error:", error);
        return null;
    }
};

/**
 * Adds a track to the host's playback queue.
 */
export const queueSpotifyTrack = async (trackUri: string, accessToken: string) => {
    try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.ok;
    } catch (error) {
        console.error("Spotify queue error:", error);
        return false;
    }
};
