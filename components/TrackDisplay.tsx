import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { 
    FadeIn, 
    useAnimatedStyle, 
    useSharedValue, 
    withRepeat, 
    withTiming 
} from 'react-native-reanimated';
import { ITunesTrack } from '../services/itunesService';

const { width } = Dimensions.get('window');
const CYAN = '#00F2FF';

interface TrackDisplayProps {
    track: ITunesTrack | null;
    isLoading: boolean;
    interpretation: string;
    aiModel?: string;
    onSkip?: () => void;
    isHost?: boolean;
}

const MoodOrbitParticle = ({ emoji, index }: { emoji: string; index: number }) => {
    const angle = (index * (Math.PI * 2)) / 8;
    const radius = 120 + Math.random() * 40;
    
    const translateX = useSharedValue(Math.cos(angle) * radius);
    const translateY = useSharedValue(Math.sin(angle) * radius);
    const opacity = useSharedValue(0.3);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(Math.cos(angle) * (radius + 20), { duration: 4000 + Math.random() * 2000 }),
            -1,
            true
        );
        translateY.value = withRepeat(
            withTiming(Math.sin(angle) * (radius + 20), { duration: 4000 + Math.random() * 2000 }),
            -1,
            true
        );
        opacity.value = withRepeat(
            withTiming(0.7, { duration: 3000 }),
            -1,
            true
        );
        scale.value = withRepeat(
            withTiming(1.2, { duration: 3000 }),
            -1,
            true
        );
    }, [angle, opacity, radius, scale, translateX, translateY]);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value,
        fontSize: 24,
    }));

    return <Animated.Text style={style}>{emoji}</Animated.Text>;
};

export default function TrackDisplay({ track, isLoading, interpretation, aiModel, onSkip, isHost }: TrackDisplayProps) {
    const moodEmojis = interpretation?.match(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g)?.slice(0, 8) || ['✨', '🎵', '💫', '🌟'];

    if (isLoading) {
        return (
            <View style={styles.trackInfoWrapper}>
                <ActivityIndicator size="large" color={CYAN} style={{ marginVertical: 30 }} />
            </View>
        );
    }

    if (track) {
        return (
            <View style={[styles.trackContainer, styles.trackInfoWrapper]}>
                <View style={styles.artworkContainer}>
                    <View style={StyleSheet.absoluteFillObject}>
                        <View style={styles.orbitCenter}>
                            {moodEmojis.map((emoji, i) => (
                                <MoodOrbitParticle key={`${emoji}-${i}`} emoji={emoji} index={i} />
                            ))}
                        </View>
                    </View>
                    <Animated.Image
                        source={{ uri: track.artworkUrl100.replace('100x100', '300x300') }}
                        style={styles.artwork}
                        entering={FadeIn.duration(1000)}
                    />
                </View>
                <View style={styles.trackDetails}>
                    <Text style={styles.trackTitle} numberOfLines={2}>{track.trackName}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artistName}</Text>
                    
                    {isHost && onSkip && (
                        <TouchableOpacity 
                            onPress={onSkip}
                            activeOpacity={0.7}
                            style={styles.skipButton}
                        >
                            <Text style={styles.skipIcon}>⏭️</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.emptyStateContainer, styles.trackInfoWrapper]}>
            <Text style={styles.placeholderEmoji}>🎵</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    trackInfoWrapper: {
        flex: 1, // Expand to take available middle space
        justifyContent: 'center',
        width: '100%',
    },
    trackContainer: {
        width: '100%',
        alignItems: 'center',
    },
    artworkContainer: {
        width: width * 0.7,
        height: width * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    orbitCenter: {
        position: 'absolute',
        width: 1,
        height: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    artwork: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    trackDetails: {
        alignItems: 'center',
        paddingHorizontal: 20,
        width: '100%',
        flexShrink: 1, // Wrap text gracefully without dominating height
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
    aiModelTag: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
        marginTop: 5,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    skipButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    skipIcon: {
        fontSize: 24,
    },
    emptyStateContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
});
