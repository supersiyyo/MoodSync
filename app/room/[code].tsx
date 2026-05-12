import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, updateDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import EmojiSelector from '../../components/EmojiSelector';
import HistoryDrawer from '../../components/HistoryDrawer';
import RoomBackground from '../../components/RoomBackground';
import SessionHeader from '../../components/SessionHeader';
import TrackDisplay from '../../components/TrackDisplay';
import { interpretEmojis } from '../../services/aiService';
import { db } from '../../services/firebase';
import { ITunesTrack, searchSong } from '../../services/itunesService';
import { getSpotifyPlaybackState, playSpotifyTrack, queueSpotifyTrack, searchSpotifyTrack, skipToNextSpotifyTrack } from '../../services/spotifyService';


const { width, height } = Dimensions.get('window');

// Color Palette
const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

// --- Floating Emoji Particle ---
interface ParticleProps {
    emoji: string;
    startX: number;
    delay: number;
}

function FloatingEmojiParticle({ emoji, startX, delay }: ParticleProps) {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(delay, withSpring(1.3, { damping: 8, stiffness: 180 }));
        translateY.value = withDelay(delay, withTiming(-height * 0.7, { duration: 3500 }));
        opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 1500 }));
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[{ position: 'absolute', left: startX, bottom: 160 }, animStyle]}
            pointerEvents="none"
        >
            <Text style={{ fontSize: 52 }}>{emoji}</Text>
        </Animated.View>
    );
}

export default function RoomScreen() {
    const { code, roomName, userName, isHost, userId } = useLocalSearchParams<{ code: string; roomName: string; userName: string; isHost?: string; userId?: string }>();
    const router = useRouter();
    const isHostUser = isHost === 'true';

    const [isLoading, setIsLoading] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: string; emoji: string; x: number; delay: number }>>([]);

    const triggerFloatingEmojis = useCallback((emojiString: string) => {
        let emojis: string[] = [];
        try {
            const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
            emojis = [...segmenter.segment(emojiString)]
                .map(s => s.segment)
                .filter(s => s.trim() !== '' && (s.codePointAt(0) ?? 0) > 127);
        } catch {
            emojis = [...emojiString].filter(s => s.trim() !== '' && (s.codePointAt(0) ?? 0) > 127);
        }
        const newParticles = emojis.flatMap((emoji, i) =>
            Array.from({ length: 3 }, (_, j) => ({
                id: `${Date.now()}-${i}-${j}`,
                emoji,
                x: width / 2 - 26 + (Math.random() - 0.5) * 140,
                delay: i * 180 + j * 90,
            }))
        );
        setParticles(newParticles);
        // Increase timeout to 5s to ensure all animations finish
        setTimeout(() => setParticles([]), 5000);
    }, []);

    const [currentTrack, setCurrentTrack] = useState<ITunesTrack | null>(null);
    const [aiInterpretation, setAiInterpretation] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    // Playback sync state
    const [playbackMode, setPlaybackMode] = useState<'host' | 'client'>('host');
    const [spotifyConfig, setSpotifyConfig] = useState<any>(null);
    const lastPlayedTimestamp = useRef<string | null>(null);

    // Audio State
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    useEffect(() => {
        // Cleanup audio on unmount
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    // Remote Playback Listener
    useEffect(() => {
        if (!code || typeof code !== 'string') return;

        const roomRef = doc(db, 'sessions', code);
        const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                if (data.playbackMode) setPlaybackMode(data.playbackMode);
                if (data.spotifyConfig) setSpotifyConfig(data.spotifyConfig);

                // Use activeTrackId to fetch the correct track from the queue
                // For now, we'll keep the currentTrack fallback for backward compat
                const trackData = data.currentTrack;

                if (trackData && trackData.playedAt !== lastPlayedTimestamp.current) {
                    lastPlayedTimestamp.current = trackData.playedAt;

                    setCurrentTrack({
                        trackName: trackData.title,
                        artistName: trackData.artist,
                        artworkUrl100: trackData.artworkUrl,
                        previewUrl: trackData.previewUrl,
                    } as ITunesTrack);
                    setAiInterpretation(trackData.interpretation);
                    setAiModel(trackData.aiModel || '');

                    const shouldPlayLocal = (data.playbackMode === 'client') || (isHostUser && !data.spotifyConfig?.accessToken);

                    if (shouldPlayLocal && trackData.previewUrl) {
                        try {
                            if (sound) await sound.unloadAsync();
                            const { sound: newSound } = await Audio.Sound.createAsync(
                                { uri: trackData.previewUrl },
                                { shouldPlay: true }
                            );
                            setSound(newSound);
                        } catch (err) {
                            console.error("Failed to play synced track", err);
                        }
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [code, sound, isHostUser]);

    // Host Management Loop (Syncs Firestore Queue with Spotify)
    useEffect(() => {
        if (!isHostUser || !spotifyConfig?.accessToken || !code) return;

        const interval = setInterval(async () => {
            try {
                const queueRef = collection(db, 'sessions', code, 'queue');
                // Use a simple query to avoid composite index requirements
                const q = query(queueRef, orderBy('submittedAt', 'asc'), limit(20));
                const querySnapshot = await getDocs(q);

                // Find the first pending item in memory
                const nextTrackDoc = querySnapshot.docs.find(d => d.data().status === 'pending');

                if (nextTrackDoc) {
                    const nextTrack = nextTrackDoc.data();
                    if (nextTrack.spotifyUri) {
                        console.log(`[Host] Syncing next vibe to Spotify: ${nextTrack.title}`);
                        await queueSpotifyTrack(nextTrack.spotifyUri, spotifyConfig.accessToken);
                        await updateDoc(nextTrackDoc.ref, { status: 'queued' });
                    }
                }
            } catch (err) {
                console.error("DJ Sync Loop Error:", err);
            }
        }, 8000);

        return () => clearInterval(interval);
    }, [isHostUser, spotifyConfig, code]);

    const handleSkip = async () => {
        if (!isHostUser || !spotifyConfig?.accessToken || !code) return;
        
        setIsLoading(true);
        try {
            const queueRef = collection(db, 'sessions', code, 'queue');
            const q = query(queueRef, orderBy('submittedAt', 'asc'), limit(50));
            const querySnapshot = await getDocs(q);

            // Find the first pending or queued item in memory
            const nextTrackDoc = querySnapshot.docs.find(d => 
                ['pending', 'queued'].includes(d.data().status)
            );

            if (nextTrackDoc) {
                const nextTrack = nextTrackDoc.data();
                if (nextTrack.spotifyUri) {
                    await playSpotifyTrack(nextTrack.spotifyUri, spotifyConfig.accessToken);
                }

                const roomRef = doc(db, 'sessions', code);
                await updateDoc(roomRef, {
                    activeTrackId: nextTrackDoc.id,
                    currentTrack: {
                        title: nextTrack.title,
                        artist: nextTrack.artist,
                        artworkUrl: nextTrack.artworkUrl,
                        previewUrl: nextTrack.previewUrl,
                        interpretation: nextTrack.interpretation,
                        aiModel: nextTrack.aiModel,
                        playedAt: new Date().toISOString(),
                        spotifyUri: nextTrack.spotifyUri
                    }
                });

                await updateDoc(nextTrackDoc.ref, { status: 'played' });
                console.log(`[Host] Skipped to next vibe: ${nextTrack.title}`);
            } else {
                await skipToNextSpotifyTrack(spotifyConfig.accessToken);
                Alert.alert("Queue Empty", "No more guest vibes! Spotify is playing its own mix.");
            }
        } catch (error) {
            console.error("Skip error:", error);
            Alert.alert("Skip Failed", "Check your Spotify connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmojiSubmit = async (emojis: string) => {
        if (!code || typeof code !== 'string') return;

        triggerFloatingEmojis(emojis);
        setIsLoading(true);

        try {
            // 1. Get history for AI context
            const history: string[] = [];
            if (currentTrack) history.push(`${currentTrack.trackName} by ${currentTrack.artistName}`);
            
            // 2. Interpret Emojis with AI
            const { query, interpretation, modelUsed } = await interpretEmojis(emojis, history);

            let finalTitle = "";
            let finalArtist = "";
            let finalArtwork = "";
            let finalPreview = "";
            let finalSpotifyUri = null;

            // 3. Search Spotify FIRST
            if (spotifyConfig?.accessToken) {
                const sTrack = await searchSpotifyTrack(query, spotifyConfig.accessToken);
                if (sTrack) {
                    finalTitle = sTrack.name;
                    finalArtist = sTrack.artists[0]?.name || "Unknown Artist";
                    finalArtwork = sTrack.album?.images[0]?.url || "";
                    finalSpotifyUri = sTrack.uri;
                }
            }

            // 4. Search iTunes for fallback/preview
            const itunesSearchQuery = finalTitle ? `${finalTitle} ${finalArtist}` : query;
            const itunesTrack = await searchSong(itunesSearchQuery);

            if (itunesTrack) {
                if (!finalTitle) {
                    finalTitle = itunesTrack.trackName;
                    finalArtist = itunesTrack.artistName;
                    finalArtwork = itunesTrack.artworkUrl100;
                }
                finalPreview = itunesTrack.previewUrl;
                if (!finalArtwork) finalArtwork = itunesTrack.artworkUrl100;
            }

            if (finalTitle) {
                const playedAt = new Date().toISOString();
                const roomRef = doc(db, 'sessions', code);
                const queueRef = collection(db, 'sessions', code, 'queue');

                // 5. Add to the Queue Collection
                const newTrackDoc = await addDoc(queueRef, {
                    title: finalTitle,
                    artist: finalArtist,
                    artworkUrl: finalArtwork,
                    previewUrl: finalPreview,
                    interpretation: interpretation,
                    aiModel: modelUsed,
                    submittedAt: playedAt,
                    submittedBy: userName || "Anonymous",
                    spotifyUri: finalSpotifyUri,
                    status: 'pending',
                    votes: 0
                });

                // 6. If no song is active, make this the active one
                if (!currentTrack) {
                    await updateDoc(roomRef, {
                        activeTrackId: newTrackDoc.id,
                        currentTrack: { // Keeping for backward compat temporarily
                            title: finalTitle,
                            artist: finalArtist,
                            artworkUrl: finalArtwork,
                            previewUrl: finalPreview,
                            interpretation: interpretation,
                            aiModel: modelUsed,
                            playedAt: playedAt,
                            spotifyUri: finalSpotifyUri
                        }
                    });

                    // Start Spotify playback if host
                    if (isHostUser && finalSpotifyUri && spotifyConfig?.accessToken) {
                        await playSpotifyTrack(finalSpotifyUri, spotifyConfig.accessToken);
                    }
                } else {
                    // It's a queue!
                    if (finalSpotifyUri && isHostUser && spotifyConfig?.accessToken) {
                        await queueSpotifyTrack(finalSpotifyUri, spotifyConfig.accessToken);
                    }
                    Alert.alert("Vibe Queued", `${finalTitle} is next in the set!`);
                }
            } else {
                setAiInterpretation("Could not find a match for that vibe.");
            }

        } catch (error) {
            console.error("Error in emoji submission flow:", error);
            Alert.alert("Error", "Could not submit your vibe.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlaybackMode = async () => {
        if (!isHostUser || !code || typeof code !== 'string') return;
        const newMode = playbackMode === 'host' ? 'client' : 'host';
        try {
            const roomRef = doc(db, 'sessions', code);
            await updateDoc(roomRef, { playbackMode: newMode });
        } catch (err) {
            console.error("Failed to toggle mode:", err);
            Alert.alert("Error", "Could not change the room playback mode.");
        }
    };

    const openHistoryDrawer = () => {
        setIsHistoryVisible(true);
    };

    const swipeGesture = Gesture.Pan()
        .onEnd((event) => {
            if (event.translationX < -50) {
                runOnJS(openHistoryDrawer)();
            }
        });

    return (
        <GestureDetector gesture={swipeGesture}>
        <View style={styles.container}>
            {/* Ambient Background Glows */}
            <RoomBackground />

            {/* 1. Header Section */}
            <SessionHeader
                roomCode={typeof code === 'string' ? code : ''}
                roomName={typeof roomName === 'string' ? roomName : ''}
                isHost={isHostUser}
                playbackMode={playbackMode}
                onTogglePlaybackMode={togglePlaybackMode}
                onOpenHistory={() => setIsHistoryVisible(true)}
                onLeave={async () => {
                    if (sound) await sound.unloadAsync();
                    router.replace('/host');
                }}
            />

            {/* 2. Body Section (Takes up completely remaining responsive space) */}
            <View style={styles.bodySection}>
                <TrackDisplay
                    track={currentTrack}
                    isLoading={isLoading}
                    interpretation={aiInterpretation}
                    aiModel={aiModel}
                    onSkip={handleSkip}
                    isHost={isHostUser}
                />
            </View>

            {/* 3. Footer Section */}
            <View style={styles.footerSection}>
                <EmojiSelector onSubmit={handleEmojiSubmit} isLoading={isLoading} />
            </View>

            {/* Floating Emoji Particles */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {particles.map(p => (
                    <FloatingEmojiParticle
                        key={p.id}
                        emoji={p.emoji}
                        startX={p.x}
                        delay={p.delay}
                    />
                ))}
            </View>

            {/* Modals & Drawers */}
            <HistoryDrawer
                visible={isHistoryVisible}
                onClose={() => setIsHistoryVisible(false)}
                roomCode={typeof code === 'string' ? code : ''}
                currentUser={typeof userName === 'string' ? userName : ''}
            />
        </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
        paddingTop: 60, // Safe top padding
        paddingBottom: 20, // Safe bottom padding
        justifyContent: 'space-between', // Ensures Header, Body, Footer sit distinct
    },
    // --- 2. Body Section ---
    bodySection: {
        flex: 1, // Crucial: This section will squish/stretch to take all leftover vertical space
        paddingHorizontal: 25,
        justifyContent: 'center', // Centers the track content vertically
    },

    // --- 3. Footer Section ---
    footerSection: {
        paddingHorizontal: 25,
        paddingBottom: 10,
    },
});
