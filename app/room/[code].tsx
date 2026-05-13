import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, updateDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
    FadeIn, 
    FadeOut, 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring, 
    withTiming, 
    withDelay, 
    withSequence,
    withRepeat,
    runOnJS
} from 'react-native-reanimated';
import EmojiSelector from '../../components/EmojiSelector';
import TrackDisplay from '../../components/TrackDisplay';
import SessionHeader from '../../components/SessionHeader';
import HistoryDrawer from '../../components/HistoryDrawer';
import RoomBackground from '../../components/RoomBackground';
import NotificationToast, { ToastHandle } from '../../components/NotificationToast';
import { interpretEmojis } from '../../services/aiService';
import { db } from '../../services/firebase';
import { ITunesTrack, searchSong } from '../../services/itunesService';
import { getSpotifyPlaybackState, playSpotifyTrack, queueSpotifyTrack, searchSpotifyTrack, skipToNextSpotifyTrack } from '../../services/spotifyService';

const { width, height } = Dimensions.get('window');

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

// Background Particles for "Vibe Atmosphere"
const BackgroundEmojiParticle = ({ emoji }: { emoji: string }) => {
    // Start from center of artwork area
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 50;
    
    const translateX = useSharedValue(Math.cos(angle) * distance);
    const translateY = useSharedValue(Math.sin(angle) * distance);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        // Move outwards slowly
        const targetX = Math.cos(angle) * (width * 0.8);
        const targetY = Math.sin(angle) * (height * 0.6);
        
        translateX.value = withTiming(targetX, { duration: 10000 + Math.random() * 5000 });
        translateY.value = withTiming(targetY, { duration: 10000 + Math.random() * 5000 });
        
        opacity.value = withSequence(
            withTiming(0.4, { duration: 2000 }),
            withDelay(6000, withTiming(0, { duration: 3000 }))
        );
        scale.value = withTiming(1.5, { duration: 10000 });
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        left: width / 2 - 20,
        top: height / 2 - 100, // Roughly the artwork center
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
        opacity: opacity.value,
        fontSize: 24,
    }));

    return <Animated.Text style={style}>{emoji}</Animated.Text>;
};

// Floating Emoji Particle for Submissions
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
    const [currentTrack, setCurrentTrack] = useState<ITunesTrack | null>(null);
    const [aiInterpretation, setAiInterpretation] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [playbackMode, setPlaybackMode] = useState<'host' | 'client'>('host');
    const [spotifyConfig, setSpotifyConfig] = useState<any>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const lastPlayedTimestamp = useRef<string | null>(null);
    const activeRequestId = useRef<number>(0);

    const toastRef = useRef<ToastHandle>(null);

    // Background "Vibe Rain" Particles
    const [bgParticles, setBgParticles] = useState<{ id: string; emoji: string }[]>([]);

    const showToast = (message: string) => {
        toastRef.current?.show(message);
    };

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
        setTimeout(() => setParticles([]), 5000);
    }, []);

    useEffect(() => {
        if (!currentTrack || !aiInterpretation) return;
        const moodEmojis = aiInterpretation.match(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g) || ['✨', '🎵'];
        const interval = setInterval(() => {
            const id = Math.random().toString();
            const emoji = moodEmojis[Math.floor(Math.random() * moodEmojis.length)];
            setBgParticles(prev => [...prev.slice(-15), { id, emoji }]);
        }, 4000);
        return () => clearInterval(interval);
    }, [currentTrack, aiInterpretation]);

    useEffect(() => {
        return sound ? () => { sound.unloadAsync(); } : undefined;
    }, [sound]);

    useEffect(() => {
        if (!code || typeof code !== 'string') return;
        const roomRef = doc(db, 'sessions', code);
        const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.playbackMode) setPlaybackMode(data.playbackMode);
                if (data.spotifyConfig) setSpotifyConfig(data.spotifyConfig);
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
                            const { sound: newSound } = await Audio.Sound.createAsync({ uri: trackData.previewUrl }, { shouldPlay: true });
                            setSound(newSound);
                        } catch (err) { console.error("Failed to play synced track", err); }
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [code, sound, isHostUser]);

    useEffect(() => {
        if (!isHostUser || !spotifyConfig?.accessToken || !code) return;
        const interval = setInterval(async () => {
            try {
                const queueRef = collection(db, 'sessions', code, 'queue');
                const q = query(queueRef, orderBy('submittedAt', 'asc'), limit(20));
                const querySnapshot = await getDocs(q);
                const nextTrackDoc = querySnapshot.docs.find(d => d.data().status === 'pending');
                if (nextTrackDoc) {
                    const nextTrack = nextTrackDoc.data();
                    if (nextTrack.spotifyUri) {
                        await queueSpotifyTrack(nextTrack.spotifyUri, spotifyConfig.accessToken);
                        await updateDoc(nextTrackDoc.ref, { status: 'queued' });
                    }
                }
            } catch (err) { console.error("DJ Sync Loop Error:", err); }
        }, 8000);
        return () => clearInterval(interval);
    }, [isHostUser, spotifyConfig, code]);

    const ensureSpotifyActive = async () => {
        if (!spotifyConfig?.accessToken || !spotifyConfig?.refreshToken) return spotifyConfig?.accessToken;
        
        try {
            const state = await getSpotifyPlaybackState(spotifyConfig.accessToken);
            if (state.error === 401) {
                console.log("[Room] Token expired, refreshing...");
                const refreshed = await refreshSpotifyToken(spotifyConfig.refreshToken);
                if (refreshed) {
                    const newConfig = { ...spotifyConfig, accessToken: refreshed.accessToken };
                    setSpotifyConfig(newConfig);
                    // Update in Firestore too so other listeners get the fresh token
                    await updateDoc(doc(db, 'sessions', code), { spotifyConfig: newConfig });
                    return refreshed.accessToken;
                }
            }
            return spotifyConfig.accessToken;
        } catch (e) {
            return spotifyConfig.accessToken;
        }
    };

    const handleSkip = async () => {
        if (!isHostUser || !code) return;
        
        const reqId = ++activeRequestId.current;
        setIsLoading(true);
        try {
            const token = await ensureSpotifyActive();
            // Spotify is optional. If no token, we proceed with iTunes only.

            const queueRef = collection(db, 'sessions', code, 'queue');
            const q = query(queueRef, orderBy('submittedAt', 'asc'), limit(50));
            const querySnapshot = await getDocs(q);
            const nextTrackDoc = querySnapshot.docs.find(d => ['pending', 'queued'].includes(d.data().status));
            
            if (nextTrackDoc) {
                const nextTrack = nextTrackDoc.data();
                let success = false;
                if (nextTrack.spotifyUri) {
                    success = await playSpotifyTrack(nextTrack.spotifyUri, token);
                    if (!success) showToast("Spotify is sleeping! Open it ✌️");
                }
                
                if (reqId !== activeRequestId.current) return;

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
                if (success) showToast(`Next vibe: ${nextTrack.title} 🎶`);
            } else {
                showToast("AI is pivoting the vibe...");
                const history: string[] = [];
                if (currentTrack) history.push(`${currentTrack.trackName} - ${currentTrack.artistName}`);
                const result = await interpretEmojis("Pivot to a fresh mood", history);
                if (result.query) {
                    const itunesTrack = await searchSong(result.query);
                    const spotifySearchQuery = itunesTrack 
                        ? `track:${itunesTrack.trackName} artist:${itunesTrack.artistName}` 
                        : result.query;
                    
                    let finalSpotifyUri = null;
                    if (token) {
                        finalSpotifyUri = await searchSpotifyTrack(spotifySearchQuery, token);
                    }

                    if (reqId !== activeRequestId.current) return;

                    if (finalSpotifyUri || itunesTrack) {
                        if (finalSpotifyUri) await playSpotifyTrack(finalSpotifyUri, token);
                        const roomRef = doc(db, 'sessions', code);
                        await updateDoc(roomRef, {
                            currentTrack: {
                                title: itunesTrack?.trackName || result.query,
                                artist: itunesTrack?.artistName || "AI Pick",
                                artworkUrl: itunesTrack?.artworkUrl100 || "",
                                previewUrl: itunesTrack?.previewUrl || "",
                                interpretation: result.interpretation,
                                aiModel: result.modelUsed,
                                playedAt: new Date().toISOString(),
                                spotifyUri: finalSpotifyUri
                            }
                        });
                        showToast(`AI Pivot: ${itunesTrack?.trackName || result.query}`);
                    }
                }
            }
        } catch (error) { console.error("Skip error:", error); showToast("Sync Error"); } finally { setIsLoading(false); }
    };

    const handleEmojiSubmit = async (emojis: string) => {
        if (!code || typeof code !== 'string') return;
        const reqId = ++activeRequestId.current;
        triggerFloatingEmojis(emojis);
        setIsLoading(true);
        try {
            const token = await ensureSpotifyActive();
            const history: string[] = [];
            if (currentTrack) history.push(`${currentTrack.trackName} - ${currentTrack.artistName}`);
            const result = await interpretEmojis(emojis, history);

            if (reqId !== activeRequestId.current) return;

            if (result.query) {
                const itunesTrack = await searchSong(result.query);
                let finalSpotifyUri = null;
                if (token) {
                    const spotifySearchQuery = itunesTrack 
                        ? `track:${itunesTrack.trackName} artist:${itunesTrack.artistName}` 
                        : result.query;
                    finalSpotifyUri = await searchSpotifyTrack(spotifySearchQuery, token);
                }
                const queueRef = collection(db, 'sessions', code, 'queue');
                const nextTrackRef = await addDoc(queueRef, {
                    title: itunesTrack?.trackName || result.query,
                    artist: itunesTrack?.artistName || "AI Selection",
                    artworkUrl: itunesTrack?.artworkUrl100 || "",
                    previewUrl: itunesTrack?.previewUrl || "",
                    interpretation: result.interpretation,
                    aiModel: result.modelUsed,
                    submittedAt: new Date().toISOString(),
                    status: 'pending',
                    spotifyUri: finalSpotifyUri,
                    inputEmojis: emojis,
                    userName: userName || 'Anonymous'
                });
                if (!currentTrack) {
                    const roomRef = doc(db, 'sessions', code);
                    let success = false;
                    await updateDoc(roomRef, {
                        activeTrackId: nextTrackRef.id,
                        currentTrack: {
                            title: itunesTrack?.trackName || result.query,
                            artist: itunesTrack?.artistName || "AI Selection",
                            artworkUrl: itunesTrack?.artworkUrl100 || "",
                            previewUrl: itunesTrack?.previewUrl || "",
                            interpretation: result.interpretation,
                            aiModel: result.modelUsed,
                            playedAt: new Date().toISOString(),
                            spotifyUri: finalSpotifyUri
                        }
                    });
                    if (isHostUser && finalSpotifyUri) {
                        success = await playSpotifyTrack(finalSpotifyUri, token);
                        if (!success) showToast("Spotify is sleeping! Open it ✌️");
                    }
                    if (success) showToast(`Vibe Set: ${itunesTrack?.trackName || result.query} 🎶`);
                } else {
                    showToast(`${itunesTrack?.trackName || result.query} is next!`);
                }
            }
        } catch (error) { console.error("Vibe Error:", error); showToast("AI Error"); } finally { setIsLoading(false); }
    };

    const togglePlaybackMode = async () => {
        if (!isHostUser || !code) return;
        const newMode = playbackMode === 'host' ? 'client' : 'host';
        try { await updateDoc(doc(db, 'sessions', code), { playbackMode: newMode }); } catch (err) { console.error(err); }
    };

    const swipeGesture = Gesture.Pan().onEnd((event) => { if (event.translationX < -50) runOnJS(setIsHistoryVisible)(true); });

    return (
        <GestureDetector gesture={swipeGesture}>
        <View style={styles.container}>
            <RoomBackground />
            {bgParticles.map((p) => <BackgroundEmojiParticle key={p.id} emoji={p.emoji} />)}
            <SessionHeader roomCode={code || ''} roomName={roomName || ''} isHost={isHostUser} playbackMode={playbackMode} onTogglePlaybackMode={togglePlaybackMode} onOpenHistory={() => setIsHistoryVisible(true)} onLeave={async () => { if (sound) await sound.unloadAsync(); router.replace('/host'); }} />
            <View style={styles.bodySection}>
                <TrackDisplay track={currentTrack} isLoading={isLoading} interpretation={aiInterpretation} aiModel={aiModel} isHost={isHostUser} />
            </View>
            <View style={styles.footerSection}><EmojiSelector onSubmit={handleEmojiSubmit} isLoading={isLoading} onSkip={isHostUser ? handleSkip : undefined} /></View>
            
            <NotificationToast ref={toastRef} />
            
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">{particles.map(p => <FloatingEmojiParticle key={p.id} emoji={p.emoji} startX={p.x} delay={p.delay} />)}</View>
            <HistoryDrawer visible={isHistoryVisible} onClose={() => setIsHistoryVisible(false)} roomCode={code || ''} currentUser={userName || ''} />
        </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK_BG, paddingTop: 40, paddingBottom: 10, justifyContent: 'space-between' },
    bodySection: { flex: 2, paddingHorizontal: 25, justifyContent: 'center', marginTop: -20 },
    footerSection: { width: '100%', paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 10 },
    toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 999, alignItems: 'center' },
    toastGradient: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, shadowColor: CYAN, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
    toastText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
});
