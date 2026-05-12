import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

const REDIRECT_URI = process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI || AuthSession.makeRedirectUri({
    useProxy: true,
});

console.log('--- SPOTIFY REDIRECT CONFIGURATION ---');
console.log('Current Redirect URI:', REDIRECT_URI);
console.log('---------------------------------------');

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

export const loginWithSpotify = async (): Promise<SpotifyTokenResponse | null> => {
    try {
        const request = new AuthSession.AuthRequest({
            clientId: CLIENT_ID!,
            scopes: scopes,
            redirectUri: REDIRECT_URI,
            usePKCE: true,
            responseType: AuthSession.ResponseType.Code,
        });

        const result = await request.promptAsync(discovery, { useProxy: true });

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
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID!,
                code_verifier: codeVerifier,
            }).toString(),
        });

        const data = await response.json();
        if (data.error) return null;

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        };
    } catch (error) {
        return null;
    }
};

export const searchSpotifyTrack = async (query: string, accessToken: string) => {
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        return data.tracks.items[0] || null;
    } catch (error) {
        return null;
    }
};

export const queueSpotifyTrack = async (trackUri: string, accessToken: string) => {
    try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};

export const getAvailableDevices = async (accessToken: string) => {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.devices || [];
    } catch (error) {
        return [];
    }
};

export const transferPlayback = async (accessToken: string, deviceId: string) => {
    try {
        await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_ids: [deviceId], play: false })
        });
    } catch (error) {
        console.error("Spotify transfer error:", error);
    }
};

export const playSpotifyTrack = async (trackUri: string, accessToken: string) => {
    const playAttempt = async (targetDeviceId?: string) => {
        const url = targetDeviceId 
            ? `https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`
            : 'https://api.spotify.com/v1/me/player/play';

        return fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uris: [trackUri] })
        });
    };

    try {
        let response = await playAttempt();

        if (response.status === 404 || response.status === 403) {
            console.log("[Spotify] No active device. Attempting recovery...");
            const devices = await getAvailableDevices(accessToken);
            if (devices.length > 0) {
                const bestDevice = devices.find(d => d.is_active) || devices[0];
                await transferPlayback(accessToken, bestDevice.id);
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = await playAttempt(bestDevice.id);
            }
        }

        return response.ok;
    } catch (error) {
        return false;
    }
};

export const getSpotifyPlaybackState = async (accessToken: string) => {
    try {
        const response = await fetch(`https://api.spotify.com/v1/me/player`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 204 || response.status === 404) return { isActive: false };
        const data = await response.json();
        return { 
            isActive: true, 
            isPlaying: data.is_playing,
            deviceName: data.device?.name,
            progressMs: data.progress_ms,
            durationMs: data.item?.duration_ms,
            uri: data.item?.uri
        };
    } catch (error) {
        return { isActive: false };
    }
};

/**
 * Skips to the next track in the Spotify queue.
 */
export const skipToNextSpotifyTrack = async (accessToken: string) => {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.ok;
    } catch (error) {
        console.error("Spotify skip error:", error);
        return false;
    }
};
