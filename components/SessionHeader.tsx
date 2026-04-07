import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Copy, LogOut, User, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface SessionHeaderProps {
    roomCode: string;
    roomName: string;
    isHost: boolean;
    playbackMode: 'host' | 'client';
    onTogglePlaybackMode: () => void;
    onOpenHistory: () => void;
    onLeave: () => void;
}

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

export default function SessionHeader({
    roomCode,
    roomName,
    isHost,
    playbackMode,
    onTogglePlaybackMode,
    onOpenHistory,
    onLeave
}: SessionHeaderProps) {

    // Animation: Breathing glow
    const glowValue = useSharedValue(0.8);

    useEffect(() => {
        glowValue.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1500 }),
                withTiming(0.8, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedGlowStyle = useAnimatedStyle(() => ({
        textShadowRadius: 15 * glowValue.value,
        opacity: 0.7 + (0.3 * glowValue.value),
        transform: [{ scale: 0.98 + (0.04 * glowValue.value) }]
    }));

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(roomCode);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
        <View style={styles.headerSection}>
            {/* Top Row: 4 Unified Buttons */}
            <View style={styles.topActionRow}>
                {/* 1. Room Code Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.buttonFlexItem}
                    onPress={copyToClipboard}
                >
                    <LinearGradient
                        colors={['rgba(0, 242, 255, 0.4)', 'rgba(0, 136, 255, 0.4)']}
                        style={styles.gradientBtn}
                    >
                        <View style={styles.innerBtn}>
                            <Copy size={12} color={CYAN} style={{ marginBottom: 2 }} />
                            <Text style={styles.codeText} numberOfLines={1} adjustsFontSizeToFit>
                                {roomCode}
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* 2. Host Sync Toggle */}
                {isHost && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.buttonFlexItem}
                        onPress={onTogglePlaybackMode}
                    >
                        <LinearGradient
                            colors={playbackMode === 'host' ? ['#333', '#444'] : [CYAN, '#0088FF']}
                            style={[
                                styles.gradientBtn, 
                                { shadowColor: playbackMode === 'host' ? '#000' : CYAN }
                            ]}
                        >
                            <View style={[
                                styles.innerBtn, 
                                playbackMode === 'client' && { backgroundColor: 'transparent' }
                            ]}>
                                {playbackMode === 'host' ? (
                                    <User size={13} color="rgba(255,255,255,0.7)" style={{ marginBottom: 2 }} />
                                ) : (
                                    <Users size={13} color={DARK_BG} style={{ marginBottom: 2 }} />
                                )}
                                <Text style={[
                                    styles.btnLabel, 
                                    playbackMode === 'client' && { color: DARK_BG, fontWeight: '900' }
                                ]}>
                                    {playbackMode === 'host' ? 'ONLY ME' : 'SYNC ALL'}
                                </Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* 3. History Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.buttonFlexItem}
                    onPress={onOpenHistory}
                >
                    <LinearGradient
                        colors={['#333', '#444']}
                        style={styles.gradientBtn}
                    >
                        <View style={styles.innerBtn}>
                            <Clock size={13} color="rgba(255,255,255,0.7)" style={{ marginBottom: 2 }} />
                            <Text style={styles.btnLabel}>HISTORY</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* 4. Leave Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.buttonFlexItem}
                    onPress={onLeave}
                >
                    <LinearGradient
                        colors={['#2A0845', '#6441A5']}
                        style={[styles.gradientBtn, { shadowColor: PURPLE }]}
                    >
                        <View style={styles.innerBtn}>
                            <LogOut size={13} color="#FFFFFF" style={{ marginBottom: 2 }} />
                            <Text style={[styles.btnLabel, { color: '#FFF' }]}>LEAVE</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Bottom Section: Centered Room Name with Neon Accents */}
            <View style={styles.nameRow}>
                {/* Left Accent Line */}
                <LinearGradient
                    colors={['transparent', PURPLE, CYAN]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentLine}
                />

                <Animated.Text style={[styles.roomNameText, animatedGlowStyle]} numberOfLines={1} adjustsFontSizeToFit>
                    {roomName.toUpperCase() || 'MOODSYNC ROOM'}
                </Animated.Text>

                {/* Right Accent Line */}
                <LinearGradient
                    colors={[CYAN, PURPLE, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentLine}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerSection: {
        paddingHorizontal: 15,
        paddingTop: 10,
        marginBottom: 10,
        gap: 15,
    },
    topActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    buttonFlexItem: {
        flex: 1,
        marginHorizontal: 3,
    },
    gradientBtn: {
        borderRadius: 12,
        padding: 1.2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        overflow: 'hidden',
    },
    innerBtn: {
        backgroundColor: DARK_BG,
        borderRadius: 10.8,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnLabel: {
        fontSize: 8.5,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    codeText: {
        fontSize: 10,
        fontWeight: '900',
        color: CYAN,
        letterSpacing: 1.5,
        textAlign: 'center',
    },

    // --- Name Section Revamp ---
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        paddingHorizontal: 10,
    },
    accentLine: {
        height: 2,
        flex: 1,
        opacity: 0.6,
        borderRadius: 1,
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    roomNameText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 4,
        marginHorizontal: 15,
        textShadowColor: CYAN,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
});
