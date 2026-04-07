import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
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
import TrackDisplay from '../../components/TrackDisplay';
import { interpretEmojis } from '../../services/aiService';
import { db } from '../../services/firebase';
import { ITunesTrack, searchSong } from '../../services/itunesService';

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
        translateY.value = withDelay(delay, withTiming(-height * 0.5, { duration: 2200 }));
        opacity.value = withDelay(delay + 900, withTiming(0, { duration: 1000 }));
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
    const { code, roomName, userName, isHost } = useLocalSearchParams<{ code: string; roomName: string; userName: string; isHost?: string }>();
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
        setTimeout(() => setParticles([]), 2500);
    }, []);
    const [currentTrack, setCurrentTrack] = useState<ITunesTrack | null>(null);
    const [aiInterpretation, setAiInterpretation] = useState('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    // Playback sync state
    const [playbackMode, setPlaybackMode] = useState<'host' | 'client'>('host');
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

                // Update mode state
                if (data.playbackMode) {
                    setPlaybackMode(data.playbackMode);
                }

                // New track handling
                if (data.currentTrack && data.currentTrack.playedAt !== lastPlayedTimestamp.current) {
                    lastPlayedTimestamp.current = data.currentTrack.playedAt;

                    // Update UI for Everyone
                    setCurrentTrack({
                        trackName: data.currentTrack.title,
                        artistName: data.currentTrack.artist,
                        artworkUrl100: data.currentTrack.artworkUrl,
                        previewUrl: data.currentTrack.previewUrl,
                    } as ITunesTrack);
                    setAiInterpretation(data.currentTrack.interpretation);

                    // Decide if we play locally
                    if (data.playbackMode === 'client' || isHostUser) {
                        try {
                            if (sound) await sound.unloadAsync();
                            const { sound: newSound } = await Audio.Sound.createAsync(
                                { uri: data.currentTrack.previewUrl },
                                { shouldPlay: true }
                            );
                            setSound(newSound);
                        } catch (err) {
                            console.error("Failed to play synced track remotely", err);
                        }
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [code, sound, isHostUser]);

    const handleEmojiSubmit = async (emojis: string) => {
        if (!code || typeof code !== 'string') return;

        triggerFloatingEmojis(emojis);
        setIsLoading(true);

        try {
            // 1. Interpret Emojis with AI
            const { query, interpretation } = await interpretEmojis(emojis);

            // 2. Search iTunes
            const track = await searchSong(query);

            if (track) {
                const playedAt = new Date().toISOString();

                // 3. Update the remote playback pointer
                const roomRef = doc(db, 'sessions', code);
                await updateDoc(roomRef, {
                    currentTrack: {
                        title: track.trackName,
                        artist: track.artistName,
                        artworkUrl: track.artworkUrl100,
                        previewUrl: track.previewUrl,
                        interpretation: interpretation,
                        playedAt: playedAt
                    }
                });

                // 4. Log to Firestore History
                const promptsRef = collection(db, 'sessions', code, 'prompts');
                await addDoc(promptsRef, {
                    inputEmojis: emojis,
                    aiInterpretation: interpretation,
                    searchQuery: query,
                    selectedSong: {
                        title: track.trackName,
                        artist: track.artistName,
                        previewUrl: track.previewUrl
                    },
                    timestamp: playedAt,
                    userName: typeof userName === 'string' ? userName : 'Anonymous Viber'
                });
            } else {
                // Not found, do simple local update
                setAiInterpretation("Hmm, AI gave us a suggestion but iTunes couldn't find it.");
            }

        } catch (error) {
            console.error("Error in emoji submission flow:", error);
            setAiInterpretation("Whoops, something went wrong finding the vibe.");
            Alert.alert("Network Error", "Could not connect to vibe services.");
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
            <View style={styles.headerSection}>
                <View style={styles.headerTopRow}>
                    <View style={styles.headerTextCol}>
                        <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
                        <Text style={styles.roomCodeText} numberOfLines={1} adjustsFontSizeToFit>{code}</Text>
                        <Text style={styles.roomNameText} numberOfLines={1} adjustsFontSizeToFit>{roomName || 'MOODSYNC ROOM'}</Text>
                    </View>

                    <View style={styles.headerButtonsCol}>
                        {isHostUser && (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.modeToggleContainer}
                                onPress={togglePlaybackMode}
                            >
                                <LinearGradient
                                    colors={playbackMode === 'host' ? ['#555', '#777'] : [CYAN, '#0088FF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.gradientBorder, { shadowColor: playbackMode === 'host' ? '#000' : CYAN }]}
                                >
                                    <View style={styles.innerButton}>
                                        <Text style={[styles.modeToggleText, playbackMode === 'client' && { color: DARK_BG, textShadowRadius: 0 }]}>
                                            {playbackMode === 'host' ? 'ONLY HOST' : 'ALL PHONES'}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.historyButtonContainer}
                            onPress={() => setIsHistoryVisible(true)}
                        >
                            <LinearGradient
                                colors={['#333', '#444']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.gradientBorder, { shadowColor: '#000' }]}
                            >
                                <View style={styles.innerButton}>
                                    <Text style={styles.historyButtonText}>HISTORY</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.leaveButtonContainer}
                            onPress={async () => {
                                if (sound) await sound.unloadAsync();
                                router.replace('/host');
                            }}
                        >
                            <LinearGradient
                                colors={['#2A0845', '#6441A5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.gradientBorder, { shadowColor: PURPLE }]}
                            >
                                <View style={styles.innerButton}>
                                    <Text style={styles.leaveButtonText}>LEAVE</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* 2. Body Section (Takes up completely remaining responsive space) */}
            <View style={styles.bodySection}>
                <TrackDisplay
                    track={currentTrack}
                    isLoading={isLoading}
                    interpretation={aiInterpretation}
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
    // --- 1. Header Section ---
    headerSection: {
        paddingHorizontal: 25,
        marginBottom: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTextCol: {
        flex: 1, // Take up leftover space
    },
    roomCodeLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 3,
        marginBottom: 2,
    },
    roomCodeText: {
        fontSize: 60, // Slightly reduced to fit beside button nicely
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 8,
        textShadowColor: CYAN,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    roomNameText: {
        fontSize: 18,
        fontWeight: '600',
        color: PURPLE,
        letterSpacing: 2,
        marginTop: 5,
        textShadowColor: PURPLE,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    headerButtonsCol: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    historyButtonContainer: {
        marginLeft: 10,
    },
    modeToggleContainer: {
        marginLeft: 10,
    },
    leaveButtonContainer: {
        marginLeft: 10,
    },
    gradientBorder: {
        borderRadius: 20,
        padding: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    innerButton: {
        backgroundColor: DARK_BG,
        borderRadius: 18,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeToggleText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1,
    },
    historyButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1,
    },
    leaveButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
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
