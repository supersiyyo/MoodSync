import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const refreshSpotifyToken = async (refreshToken: string): Promise<SpotifyTokenResponse | null> => {
    try {
        const response = await fetch(discovery.tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: CLIENT_ID!,
            }).toString(),
        });

        const data = await response.json();
        if (data.error) return null;

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken,
            expiresIn: data.expires_in,
        };
    } catch (error) {
        return null;
    }
};

export const searchSpotifyTrack = async (query: string, accessToken: string): Promise<string | null> => {
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        const track = data.tracks.items[0];
        return track ? track.uri : null;
    } catch (error) {
        console.error("[Spotify] Search error:", error);
        return null;
    }
};

export const queueSpotifyTrack = async (trackUri: string, accessToken: string) => {
    if (!trackUri || typeof trackUri !== 'string') {
        console.error("[Spotify] Invalid trackUri for queue:", trackUri);
        return false;
    }
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
            headers: { Authorization: `Bearer ${accessToken}` },
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
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ device_ids: [deviceId], play: true }),
        });
    } catch (error) {
        console.error("Spotify transfer error:", error);
    }
};

export const playSpotifyTrack = async (trackUri: string, accessToken?: string) => {
    if (!trackUri || typeof trackUri !== 'string') {
        console.error("[Spotify] Invalid trackUri for play:", trackUri);
        return false;
    }

    let currentToken = accessToken;

    // If no token provided, get from storage
    if (!currentToken) {
        const tokenData = await AsyncStorage.getItem('spotify_token_data');
        if (tokenData) currentToken = JSON.parse(tokenData).accessToken;
    }

    if (!currentToken) {
        console.log("[Spotify] No access token available. Skipping playback.");
        return false;
    }

    const playAttempt = async (token: string, targetDeviceId?: string) => {
        const url = targetDeviceId 
            ? `https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`
            : 'https://api.spotify.com/v1/me/player/play';

        const body = { uris: [trackUri] };
        console.log(`[Spotify] Attempting play at ${url} with body:`, JSON.stringify(body));

        return fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    };

    try {
        let response = await playAttempt(currentToken);

        // If 401 (Unauthorized), refresh and retry
        if (response.status === 401) {
            console.log("[Spotify] Token expired. Refreshing...");
            const tokenData = await AsyncStorage.getItem('spotify_token_data');
            if (tokenData) {
                const parsed = JSON.parse(tokenData);
                const refreshed = await refreshSpotifyToken(parsed.refreshToken);
                if (refreshed) {
                    await AsyncStorage.setItem('spotify_token_data', JSON.stringify(refreshed));
                    currentToken = refreshed.accessToken;
                    response = await playAttempt(currentToken);
                }
            }
        }

        if (!response.ok) {
            console.log(`[Spotify] Playback failed: ${response.status}`);
            if (response.status === 404 || response.status === 403) {
                const devices = await getAvailableDevices(currentToken!);
                if (devices.length > 0) {
                    const bestDevice = devices.find(d => d.is_active) || devices[0];
                    await transferPlayback(currentToken!, bestDevice.id);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    response = await playAttempt(currentToken!, bestDevice.id);
                }
            }
        }

        return response.ok;
    } catch (error: any) {
        console.error("[Spotify] Playback Exception:", error.message);
        return false;
    }
};

export const getSpotifyPlaybackState = async (accessToken: string) => {
    try {
        const response = await fetch(`https://api.spotify.com/v1/me/player`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 204 || response.status === 404) return { isActive: false, error: response.status };
        if (response.status === 401) return { isActive: false, error: 401 };
        
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
        return { isActive: false, error: 500 };
    }
};

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
