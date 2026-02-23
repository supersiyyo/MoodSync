import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Color Palette
const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

export default function JoinScreen() {
    const [roomCode, setRoomCode] = useState('');

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
    }, [ambientScale, ambientOpacity]);

    const animatedAmbient = useAnimatedStyle(() => {
        return {
            transform: [{ scale: ambientScale.value }],
            opacity: ambientOpacity.value,
        };
    });

    return (
        <View style={styles.container}>
            {/* Ambient Background Glows */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <Animated.View style={[styles.ambientGlow, { top: height * 0.1, right: -width * 0.1, backgroundColor: PURPLE }, animatedAmbient]} />
                <Animated.View style={[styles.ambientGlow, { bottom: height * 0.1, left: -width * 0.1, backgroundColor: CYAN }, animatedAmbient]} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.titleText}>Join Room</Text>

                        <View style={styles.formContainer}>
                            {/* Room Code Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Room Code</Text>
                                <View style={styles.inputWrapper}>
                                    <LinearGradient
                                        colors={[PURPLE, CYAN]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.inputGradientBorder}
                                    >
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. ABCD"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={roomCode}
                                            onChangeText={(text) => setRoomCode(text.toUpperCase())}
                                            autoCapitalize="characters"
                                            maxLength={4}
                                            selectionColor={PURPLE}
                                        />
                                    </LinearGradient>
                                </View>
                            </View>
                        </View>

                        {/* Join Room Button */}
                        <TouchableOpacity activeOpacity={0.8} style={styles.startButtonContainer}>
                            <LinearGradient
                                colors={[PURPLE, '#FF00A0']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.gradientBorder, { shadowColor: PURPLE }]}
                            >
                                <View style={styles.innerButton}>
                                    <Text style={styles.buttonText}>JOIN</Text>
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
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
    },
    keyboardView: {
        flex: 1,
    },
    ambientGlow: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        filter: 'blur(70px)',
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 70,
        elevation: 20,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
        zIndex: 10,
    },
    titleText: {
        fontSize: 42,
        fontWeight: '800',
        color: '#E0F8FF',
        letterSpacing: 2,
        marginBottom: 50,
        textAlign: 'center',
        textShadowColor: PURPLE,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    formContainer: {
        width: '100%',
        marginBottom: 40,
    },
    inputGroup: {
        width: '100%',
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        marginLeft: 4,
        textShadowColor: CYAN,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    inputWrapper: {
        width: '100%',
    },
    inputGradientBorder: {
        borderRadius: 16,
        padding: 2, // Border thickness
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    input: {
        backgroundColor: '#091428', // Slightly lighter than background for depth
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 24, // slightly larger for 4-letter codes
        textAlign: 'center',
        letterSpacing: 4,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    startButtonContainer: {
        width: '80%',
        marginTop: 10,
    },
    gradientBorder: {
        borderRadius: 30,
        padding: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 15,
    },
    innerButton: {
        backgroundColor: DARK_BG,
        borderRadius: 27,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 4,
        textShadowColor: CYAN,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
});
