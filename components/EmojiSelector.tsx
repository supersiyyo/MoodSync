import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    FadeOutDown
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

const EMOJI_CATEGORIES = [
    {
        title: 'Vibes & Feelings',
        emojis: [
            '😎', '🥺', '😡', '🥳', '😭', '🤯', '😴', '🤪', '🤠', '👽', '😈', '😇',
            '😍', '🤩', '🫠', '🙃', '🤔', '🥶', '🥵', '🤢', '🤮', '🤒', '🤕', '🤑'
        ],
    },
    {
        title: 'Activities & Sports',
        emojis: [
            '🏄‍♂️', '🧗‍♀️', '🏂', '�️‍♂️', '🧘‍♀️', '🎮', '🚗', '🚀', '✈️', '⛵', '⚽', '🏀',
            '🏈', '🎾', '�', '🥊', '🥋', '🤿', '🎣', '🎯', '🎰', '🎟️', '🎭', '🎢'
        ],
    },
    {
        title: 'Nature & Location',
        emojis: [
            '🏔️', '🌋', '⛺', '🏖️', '🏜️', '🏝️', '🏙️', '🌃', '🌉', '🌌', '�🌧️', '⚡',
            '🔥', '🌊', '🌴', '🌲', '🌵', '🌻', '🌸', '🍂', '🍁', '🍄', '🌍', '🪐'
        ],
    },
    {
        title: 'Food & Drink',
        emojis: [
            '☕', '🍵', '🍷', '🥂', '🍻', '🍹', '🍕', '🍔', '🍟', '🌮', '🍣', '🍦',
            '🍩', '🍪', '🎂', '🍿', '🍓', '🍉', '🥑', '🌶️', '🧀', '🥩', '🍳', '🥞'
        ],
    },
    {
        title: 'Music & Art',
        emojis: [
            '🎸', '🎧', '🎹', '🎨', '🎬', '🎤', '🥁', '🎷', '📱', '💿', '📼', '📻',
            '🎻', '🎺', '🎼', '🎵', '🎶', '📓', '📚', '🖋️', '🖌️', '🖍️', '📸', '📽️'
        ],
    },
];

interface EmojiSelectorProps {
    onSubmit: (emojis: string) => void;
    isLoading: boolean;
}

export default function EmojiSelector({ onSubmit, isLoading }: EmojiSelectorProps) {
    const [isSheetVisible, setIsSheetVisible] = useState(false);
    const [selectedEmojis, setSelectedEmojis] = useState('');

    const handleEmojiTap = (emoji: string) => {
        if (selectedEmojis.length < 15) { // Limit to prevent crazy long strings
            setSelectedEmojis(prev => prev + emoji);
        }
    };

    const handleBackspace = () => {
        // Simple backspace (might have issues with complex emojis like family, but fine for basic ones)
        if (selectedEmojis.length > 0) {
            const arr = Array.from(selectedEmojis);
            arr.pop();
            setSelectedEmojis(arr.join(''));
        }
    };

    const handleSubmit = () => {
        if (selectedEmojis.trim().length > 0 && !isLoading) {
            onSubmit(selectedEmojis.trim());
            setIsSheetVisible(false);
            setSelectedEmojis('');
        }
    };

    return (
        <View style={styles.container}>
            {/* The Big Smiling Face Button */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsSheetVisible(true)}
                disabled={isLoading}
                style={styles.mainButtonWrapper}
            >
                <Animated.View style={styles.mainButtonShadow} />
                <LinearGradient
                    colors={[CYAN, PURPLE]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mainButtonGradient}
                >
                    <View style={styles.mainButtonInner}>
                        <Text style={styles.mainButtonEmoji}>😎</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.mainButtonLabel}>CHOOSE VIBE</Text>

            {/* Bottom Sheet Modal */}
            <Modal
                visible={isSheetVisible}
                transparent={true}
                animationType="none"
                onRequestClose={() => setIsSheetVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsSheetVisible(false)}>
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        style={styles.modalOverlay}
                    >
                        <TouchableWithoutFeedback>
                            <Animated.View
                                entering={FadeInDown.springify().damping(20).stiffness(200)}
                                exiting={FadeOutDown.duration(200)}
                                style={styles.bottomSheet}
                            >
                                {/* Header / Current Selection */}
                                <View style={styles.sheetHeader}>
                                    <View style={styles.selectionArea}>
                                        <Text
                                            style={[styles.selectedText, !selectedEmojis && { color: 'rgba(255,255,255,0.3)' }]}
                                            numberOfLines={1}
                                        >
                                            {selectedEmojis || 'Pick your vibe...'}
                                        </Text>

                                        {selectedEmojis.length > 0 && (
                                            <TouchableOpacity onPress={handleBackspace} style={styles.backspaceBtn}>
                                                <Text style={styles.backspaceIcon}>⌫</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.analyzeBtn, (!selectedEmojis || isLoading) && styles.analyzeBtnDisabled]}
                                        onPress={handleSubmit}
                                        disabled={!selectedEmojis || isLoading}
                                    >
                                        <LinearGradient
                                            colors={selectedEmojis && !isLoading ? [CYAN, PURPLE] : ['#333', '#444']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.analyzeGradient}
                                        >
                                            <Text style={styles.analyzeText}>
                                                {isLoading ? 'ANALYZING...' : 'PLAY VIBE'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                {/* Emoji Grid */}
                                <ScrollView
                                    style={styles.gridScroll}
                                    contentContainerStyle={styles.gridContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {EMOJI_CATEGORIES.map((cat, i) => (
                                        <View key={i} style={styles.categorySection}>
                                            <Text style={styles.categoryTitle}>{cat.title}</Text>
                                            <View style={styles.emojiGrid}>
                                                {cat.emojis.map((emoji, j) => (
                                                    <TouchableOpacity
                                                        key={j}
                                                        style={styles.emojiCell}
                                                        onPress={() => handleEmojiTap(emoji)}
                                                    >
                                                        <Text style={styles.emojiCellText}>{emoji}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </Animated.View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 20,
    },
    // Main Button Styles
    mainButtonWrapper: {
        width: width * 0.56, // 80% of original 0.70
        height: width * 0.56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainButtonShadow: {
        position: 'absolute',
        width: width * 0.56,
        height: width * 0.56,
        borderRadius: (width * 0.56) / 2,
        backgroundColor: CYAN,
        filter: 'blur(30px)',
        opacity: 0.5,
    },
    mainButtonGradient: {
        width: width * 0.48, // 80% of original 0.60
        height: width * 0.48,
        borderRadius: (width * 0.48) / 2,
        padding: 4,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15,
    },
    mainButtonInner: {
        flex: 1,
        backgroundColor: DARK_BG,
        borderRadius: (width * 0.48) / 2 - 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainButtonEmoji: {
        fontSize: width * 0.24, // 80% of original 0.30
    },
    mainButtonLabel: {
        marginTop: 25,
        color: CYAN,
        fontWeight: 'bold',
        letterSpacing: 3,
        fontSize: 14,
    },

    // Modal & Sheet Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        width: '100%',
        height: height * 0.6,
        backgroundColor: '#0F172A', // Slightly lighter than pure background
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    sheetHeader: {
        paddingHorizontal: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    selectionArea: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 15,
        minHeight: 60,
    },
    selectedText: {
        flex: 1,
        fontSize: 28,
        color: '#FFF',
    },
    backspaceBtn: {
        padding: 5,
        marginLeft: 10,
    },
    backspaceIcon: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 24,
    },
    analyzeBtn: {
        width: '100%',
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    analyzeBtnDisabled: {
        opacity: 0.5,
    },
    analyzeGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    analyzeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 2,
    },

    // Grid Styles
    gridScroll: {
        flex: 1,
    },
    gridContent: {
        padding: 25,
        paddingBottom: 50,
    },
    categorySection: {
        marginBottom: 30,
    },
    categoryTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 15,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    emojiCell: {
        width: (width - 50 - 45) / 4, // 4 columns, considering padding and gap
        aspectRatio: 1,
        backgroundColor: '#1E293B',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiCellText: {
        fontSize: 32,
    },
});
