import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { db } from '../services/firebase';
import { getCurrentUser } from '../services/authService';
import { SpotifyTokenResponse } from '../services/spotifyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

export default function HostScreen() {
    const router = useRouter();
    const [hostName, setHostName] = useState('');
    const [roomName, setRoomName] = useState('');
    const [isExplicit, setIsExplicit] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [spotifyToken, setSpotifyToken] = useState<SpotifyTokenResponse | null>(null);

    const ambientScale = useSharedValue(1);
    const ambientOpacity = useSharedValue(0.3);

    useEffect(() => {
        const loadSpotify = async () => {
            const data = await AsyncStorage.getItem('spotify_token_data');
            if (data) {
                setSpotifyToken(JSON.parse(data));
            }
        };
        loadSpotify();

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
    }, []);

    const animatedAmbient = useAnimatedStyle(() => ({
        transform: [{ scale: ambientScale.value }],
        opacity: ambientOpacity.value,
    }));

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleStart = async () => {
        if (!hostName.trim() || !roomName.trim()) {
            Alert.alert('Missing Info', 'Please enter your name and a room name.');
            return;
        }

        setIsLoading(true);
        try {
            const code = generateRoomCode();
            const currentUser = getCurrentUser();
            await setDoc(doc(db, 'sessions', code), {
                hostName: hostName.trim(),
                hostId: currentUser?.uid || null,
                roomName: roomName.trim(),
                isExplicit,
                createdAt: new Date().toISOString(),
                status: 'active',
                playbackMode: 'host',
                currentTrack: null,
                spotifyConfig: spotifyToken ? {
                    accessToken: spotifyToken.accessToken,
                    refreshToken: spotifyToken.refreshToken,
                    connectedAt: new Date().toISOString()
                } : null
            });

            router.push(`/room/${code}?roomName=${encodeURIComponent(roomName.trim())}&userName=${encodeURIComponent(hostName.trim())}&isHost=true&userId=${currentUser?.uid || ''}`);
        } catch (error) {
            console.error("Error creating session:", error);
            Alert.alert('Error', 'Failed to create room. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Animated.View style={[styles.ambientGlow, { top: height * 0.1, left: -width * 0.1, backgroundColor: CYAN }, animatedAmbient]} />
                <Animated.View style={[styles.ambientGlow, { bottom: height * 0.1, right: -width * 0.1, backgroundColor: PURPLE }, animatedAmbient]} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.titleText}>Host Settings</Text>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Your Name</Text>
                                <View style={styles.inputWrapper}>
                                    <LinearGradient colors={[CYAN, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inputGradientBorder}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your name"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={hostName}
                                            onChangeText={setHostName}
                                            selectionColor={CYAN}
                                            editable={!isLoading}
                                        />
                                    </LinearGradient>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Room Name</Text>
                                <View style={styles.inputWrapper}>
                                    <LinearGradient colors={[CYAN, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inputGradientBorder}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. VIBECAVE"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={roomName}
                                            onChangeText={(text) => setRoomName(text.toUpperCase())}
                                            autoCapitalize="characters"
                                            maxLength={12}
                                            selectionColor={CYAN}
                                            editable={!isLoading}
                                        />
                                    </LinearGradient>
                                </View>
                            </View>

                            <View style={styles.switchGroup}>
                                <Text style={styles.label}>Explicit Content</Text>
                                <View style={styles.switchWrapper}>
                                    <Text style={[styles.switchText, !isExplicit && styles.activeSwitchText]}>Off</Text>
                                    <Switch
                                        trackColor={{ false: 'rgba(255,255,255,0.2)', true: PURPLE }}
                                        thumbColor={CYAN}
                                        onValueChange={setIsExplicit}
                                        value={isExplicit}
                                        disabled={isLoading}
                                    />
                                    <Text style={[styles.switchText, isExplicit && styles.activeSwitchText]}>On</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.spotifyConnectionContainer}>
                            {spotifyToken ? (
                                <View style={styles.connectedStatus}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.connectedText}>Vibe Sync Active</Text>
                                    <TouchableOpacity onPress={async () => {
                                        await AsyncStorage.removeItem('spotify_token_data');
                                        setSpotifyToken(null);
                                    }}>
                                        <Text style={styles.disconnectText}>Unlink</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.warningBox}>
                                    <Text style={styles.warningText}>Spotify Not Linked</Text>
                                    <Link href="/" asChild>
                                        <TouchableOpacity>
                                            <Text style={styles.linkActionText}>Connect on Home Screen</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity activeOpacity={0.8} style={styles.startButtonContainer} onPress={handleStart} disabled={isLoading}>
                            <LinearGradient colors={[CYAN, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradientBorder, { shadowColor: CYAN, opacity: isLoading ? 0.7 : 1 }]}>
                                <View style={styles.innerButton}>
                                    {isLoading ? <ActivityIndicator color={CYAN} size="large" /> : <Text style={styles.buttonText}>START</Text>}
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK_BG },
    keyboardView: { flex: 1 },
    ambientGlow: { position: 'absolute', width: 350, height: 350, borderRadius: 175, shadowColor: CYAN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 70, elevation: 20 },
    contentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25, zIndex: 10 },
    titleText: { fontSize: 42, fontWeight: '800', color: '#E0F8FF', letterSpacing: 2, marginBottom: 50, textAlign: 'center', textShadowColor: CYAN, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
    formContainer: { width: '100%', gap: 25, marginBottom: 50 },
    inputGroup: { width: '100%' },
    label: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { width: '100%' },
    inputGradientBorder: { borderRadius: 16, padding: 2 },
    input: { backgroundColor: '#091428', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, fontSize: 18, color: '#FFFFFF' },
    switchGroup: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switchWrapper: { flexDirection: 'row', alignItems: 'center' },
    switchText: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
    activeSwitchText: { color: '#FFFFFF' },
    startButtonContainer: { width: '80%', marginTop: 20 },
    gradientBorder: { borderRadius: 30, padding: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 15 },
    innerButton: { backgroundColor: DARK_BG, borderRadius: 27, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: 4 },
    spotifyConnectionContainer: { width: '100%', marginBottom: 30, alignItems: 'center' },
    connectedStatus: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1DB954', shadowColor: '#1DB954', shadowRadius: 5, shadowOpacity: 1 },
    connectedText: { color: '#1DB954', fontSize: 18, fontWeight: '700' },
    disconnectText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecorationLine: 'underline' },
    warningBox: { alignItems: 'center', gap: 8 },
    warningText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
    linkActionText: { color: CYAN, fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
});
