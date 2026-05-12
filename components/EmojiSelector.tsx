import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    FadeOutDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    withRepeat,
    withSequence
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#0B1222';

const EMOJI_REGEX = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

interface EmojiSelectorProps {
    onSubmit: (emojis: string) => void;
    isLoading: boolean;
}

const EmojiParticle = ({ emoji, index }: { emoji: string; index: number }) => {
    const scale = useSharedValue(0);
    const rotate = useSharedValue('0deg');

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });
        rotate.value = withSequence(
            withTiming('-10deg', { duration: 100 }),
            withSpring('0deg')
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: rotate.value }],
        marginHorizontal: 4,
    }));

    return (
        <Animated.View style={style}>
            <Text style={styles.particleEmoji}>{emoji}</Text>
        </Animated.View>
    );
};

export default function EmojiSelector({ onSubmit, isLoading }: EmojiSelectorProps) {
    const [isSheetVisible, setIsSheetVisible] = useState(false);
    const [rawInput, setRawInput] = useState('');
    const [displayEmojis, setDisplayEmojis] = useState<string[]>([]);
    const inputRef = useRef<TextInput>(null);
    const auraOpacity = useSharedValue(0.2);

    useEffect(() => {
        if (isSheetVisible) {
            auraOpacity.value = withRepeat(withTiming(0.4, { duration: 2000 }), -1, true);
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 600);
            return () => clearTimeout(timer);
        } else {
            setRawInput('');
            setDisplayEmojis([]);
        }
    }, [isSheetVisible]);

    const handleTextChange = (text: string) => {
        setRawInput(text);
        const matches = text.match(EMOJI_REGEX);
        const filtered = matches ? matches : [];
        
        if (filtered.length !== displayEmojis.length) {
            setDisplayEmojis(filtered);
        }
    };

    const auraStyle = useAnimatedStyle(() => ({
        opacity: auraOpacity.value * (displayEmojis.length > 0 ? 1.5 : 1),
        transform: [{ scale: 1 + (displayEmojis.length * 0.05) }],
    }));

    const handleSubmit = () => {
        if (displayEmojis.length > 0 && !isLoading) {
            onSubmit(displayEmojis.join(''));
            setIsSheetVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIsSheetVisible(true)} disabled={isLoading} style={styles.mainButtonWrapper}>
                <Animated.View style={styles.mainButtonShadow} />
                <LinearGradient colors={[CYAN, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainButtonGradient}>
                    <View style={styles.mainButtonInner}>
                        <Text style={styles.mainButtonEmoji}>😎</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.mainButtonLabel}>EXPRESS VIBE</Text>

            <Modal visible={isSheetVisible} transparent={true} animationType="none" onRequestClose={() => setIsSheetVisible(false)}>
                <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsSheetVisible(false)} />
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
                        <Animated.View entering={FadeInDown.springify().damping(25).stiffness(100)} exiting={FadeOutDown.duration(250)} style={styles.bottomSheet}>
                            <View style={styles.sheetHeader}>
                                <Animated.View style={[styles.aura, auraStyle]} />
                                
                                <Text style={styles.sheetTitle}>Paint your mood</Text>
                                <Text style={styles.sheetSubtitle}>The AI will listen to the colors of your energy</Text>
                                
                                <View style={styles.inputStack}>
                                    <View style={styles.visualInputArea} pointerEvents="none">
                                        <View style={styles.emojiRow}>
                                            {displayEmojis.length === 0 ? (
                                                <Text style={styles.placeholderText}>✨ Set the vibe...</Text>
                                            ) : (
                                                displayEmojis.map((emoji, i) => (
                                                    <EmojiParticle key={`${emoji}-${i}`} emoji={emoji} index={i} />
                                                ))
                                            )}
                                        </View>
                                    </View>

                                    <TextInput
                                        ref={inputRef}
                                        style={styles.realInput}
                                        value={rawInput}
                                        onChangeText={handleTextChange}
                                        maxLength={15}
                                        caretHidden={true}
                                        autoComplete="off"
                                        autoCorrect={false}
                                        selectionColor="transparent"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.analyzeBtn, (displayEmojis.length === 0 || isLoading) && styles.analyzeBtnDisabled]}
                                    onPress={handleSubmit}
                                    disabled={displayEmojis.length === 0 || isLoading}
                                >
                                    <LinearGradient colors={displayEmojis.length > 0 && !isLoading ? [CYAN, PURPLE] : ['#1E293B', '#1E293B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.analyzeGradient}>
                                        <Text style={styles.analyzeText}>{isLoading ? 'DECONSTRUCTING...' : 'TRANSLATE VIBE'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', alignItems: 'center', paddingVertical: 20 },
    keyboardAvoidingView: { width: '100%' },
    mainButtonWrapper: { width: width * 0.56, height: width * 0.56, justifyContent: 'center', alignItems: 'center' },
    mainButtonShadow: { position: 'absolute', width: width * 0.56, height: width * 0.56, borderRadius: (width * 0.56) / 2, backgroundColor: CYAN, filter: 'blur(30px)', opacity: 0.2 },
    mainButtonGradient: { width: width * 0.48, height: width * 0.48, borderRadius: (width * 0.48) / 2, padding: 4, shadowColor: PURPLE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 15 },
    mainButtonInner: { flex: 1, backgroundColor: DARK_BG, borderRadius: (width * 0.48) / 2 - 4, justifyContent: 'center', alignItems: 'center' },
    mainButtonEmoji: { fontSize: width * 0.24 },
    mainButtonLabel: { marginTop: 25, color: CYAN, fontWeight: 'bold', letterSpacing: 3, fontSize: 13, opacity: 0.8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    bottomSheet: { width: '100%', backgroundColor: '#070C18', borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingTop: 40, paddingBottom: Platform.OS === 'ios' ? 50 : 40, shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 25 },
    sheetHeader: { paddingHorizontal: 30, alignItems: 'center' },
    aura: { position: 'absolute', top: 40, width: width * 0.8, height: 100, backgroundColor: PURPLE, borderRadius: 100, filter: 'blur(60px)', zIndex: -1 },
    sheetTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
    sheetSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 40, textAlign: 'center', letterSpacing: 0.2, maxWidth: '80%' },
    inputStack: { width: '100%', height: 100, marginBottom: 40, justifyContent: 'center', alignItems: 'center' },
    visualInputArea: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    emojiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    particleEmoji: { fontSize: 44, color: '#FFF' },
    placeholderText: { fontSize: 18, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' },
    realInput: { width: '100%', height: '100%', fontSize: 1, color: 'transparent', backgroundColor: 'transparent' },
    analyzeBtn: { width: '100%', height: 64, borderRadius: 32, overflow: 'hidden' },
    analyzeBtnDisabled: { opacity: 0.3 },
    analyzeGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    analyzeText: { color: '#FFF', fontWeight: '900', fontSize: 17, letterSpacing: 3 },
});
