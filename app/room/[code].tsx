import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import EmojiSelector from '../../components/EmojiSelector';
import { interpretEmojis } from '../../services/aiService';
import { db } from '../../services/firebase';
import { ITunesTrack, searchSong } from '../../services/itunesService';

const { width, height } = Dimensions.get('window');

// Color Palette
const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

export default function RoomScreen() {
    const { code, roomName } = useLocalSearchParams<{ code: string; roomName: string }>();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<ITunesTrack | null>(null);
    const [aiInterpretation, setAiInterpretation] = useState('');

    // Audio State
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    const ambientScale = useSharedValue(1);
    const ambientOpacity = useSharedValue(0.3);

    useEffect(() => {
        // Soft ambient breathing effect
        ambientScale.value = withRepeat(
            withSequence(
                withTiming(1.3, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        ambientOpacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.2, { duration: 4500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Cleanup audio on unmount
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [ambientScale, ambientOpacity, sound]);

    const animatedAmbient = useAnimatedStyle(() => {
        return {
            transform: [{ scale: ambientScale.value }],
            opacity: ambientOpacity.value,
        };
    });

    const handleEmojiSubmit = async (emojis: string) => {
        if (!code || typeof code !== 'string') return;

        setIsLoading(true);
        setCurrentTrack(null);
        setAiInterpretation('');

        // Stop currently playing sound if any
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
        }

        try {
            // 1. Interpret Emojis with AI
            const { query, interpretation } = await interpretEmojis(emojis);
            setAiInterpretation(interpretation);

            // 2. Search iTunes
            const track = await searchSong(query);

            if (track) {
                setCurrentTrack(track);

                // 3. Play audio preview
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: track.previewUrl },
                    { shouldPlay: true }
                );
                setSound(newSound);

                // 4. Log to Firestore
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
                    timestamp: new Date().toISOString()
                });
            } else {
                setAiInterpretation("Hmm, AI gave us a suggestion but iTunes couldn't find it.");
            }

        } catch (error) {
            console.error("Error in emoji submission flow:", error);
            setAiInterpretation("Whoops, something went wrong finding the vibe.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Ambient Background Glows */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Animated.View style={[styles.ambientGlow, { top: height * 0.1, left: -width * 0.1, backgroundColor: CYAN }, animatedAmbient]} />
                <Animated.View style={[styles.ambientGlow, { bottom: height * 0.1, right: -width * 0.1, backgroundColor: PURPLE }, animatedAmbient]} />
            </View>

            {/* Leave Button - Top Right */}
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

            <View style={styles.contentContainer}>

                {/* Header Information */}
                <View style={styles.headerContainer}>
                    <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
                    <Text style={styles.roomCodeText}>{code}</Text>
                    <Text style={styles.roomNameText}>{roomName || 'MOODSYNC ROOM'}</Text>
                </View>

                {/* Main Interaction Area */}
                <View style={styles.mainArea}>
                    {/* Track Info Display */}
                    {isLoading ? (
                        <View style={styles.trackInfoWrapper}>
                            <ActivityIndicator size="large" color={CYAN} style={{ marginVertical: 30 }} />
                        </View>
                    ) : currentTrack ? (
                        <View style={[styles.trackContainer, styles.trackInfoWrapper]}>
                            <Image
                                source={{ uri: currentTrack.artworkUrl100.replace('100x100', '300x300') }}
                                style={styles.artwork}
                            />
                            <View style={styles.trackDetails}>
                                <Text style={styles.trackTitle} numberOfLines={2}>{currentTrack.trackName}</Text>
                                <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artistName}</Text>
                                <Text style={styles.interpretationText}>{aiInterpretation}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.emptyStateContainer, styles.trackInfoWrapper]}>
                            <Text style={styles.interpretationText}>
                                {aiInterpretation || "Tap below to set the vibe!"}
                            </Text>
                        </View>
                    )}

                    <View style={styles.selectorWrapper}>
                        <EmojiSelector onSubmit={handleEmojiSubmit} isLoading={isLoading} />
                    </View>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
    },
    ambientGlow: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        filter: 'blur(70px)',
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 70,
        elevation: 20,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingTop: 80,
        paddingBottom: 50,
        zIndex: 10,
    },
    headerContainer: {
        alignItems: 'center',
        width: '100%',
    },
    roomCodeLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 3,
        marginBottom: 5,
    },
    roomCodeText: {
        fontSize: 72,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 10,
        textShadowColor: CYAN,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 30,
    },
    roomNameText: {
        fontSize: 22,
        fontWeight: '600',
        color: PURPLE,
        letterSpacing: 2,
        marginTop: 10,
        textShadowColor: PURPLE,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    mainArea: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between', // Push contents apart (track info to top, selector to bottom)
        alignItems: 'center',
    },
    trackInfoWrapper: {
        flex: 1, // Let track info/loading/empty state take up available space above selector
        justifyContent: 'center',
        paddingTop: 20, // Add a bit of space below the header
    },
    trackContainer: {
        alignItems: 'center',
        width: '100%',
    },
    artwork: {
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    trackDetails: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    trackTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    trackArtist: {
        fontSize: 18,
        color: CYAN,
        fontWeight: '500',
        marginBottom: 15,
    },
    interpretationText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 10,
    },
    emptyStateContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    selectorWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 5, // Lowered closer to bottom
    },
    leaveButtonContainer: {
        position: 'absolute',
        top: 55,
        right: 25,
        zIndex: 100,
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
    leaveButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
