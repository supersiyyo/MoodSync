import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';

interface EmojiSelectorProps {
    onSubmit: (emojis: string) => void;
    isLoading: boolean;
}

export default function EmojiSelector({ onSubmit, isLoading }: EmojiSelectorProps) {
    const [emojis, setEmojis] = useState('');

    const handleSubmit = () => {
        if (emojis.trim().length > 0 && !isLoading) {
            onSubmit(emojis.trim());
            setEmojis('');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>How are we vibing today?</Text>

            <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                    <LinearGradient
                        colors={[CYAN, PURPLE]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBorder}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Type emojis here... (e.g. ☀️🏄‍♂️)"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={emojis}
                            onChangeText={setEmojis}
                            selectionColor={CYAN}
                            editable={!isLoading}
                            autoFocus={true} // Helpful for quick testing
                        />
                    </LinearGradient>
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={isLoading || emojis.trim().length === 0}
                    style={[styles.playButtonWrapper, { opacity: (isLoading || emojis.trim().length === 0) ? 0.5 : 1 }]}
                >
                    <LinearGradient
                        colors={[CYAN, PURPLE]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.playButtonGradient}
                    >
                        <View style={styles.playButtonInner}>
                            {/* Play Icon Placeholder (triangle) */}
                            <View style={styles.playIcon} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        marginLeft: 5,
        textShadowColor: PURPLE,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    inputWrapper: {
        flex: 1,
    },
    gradientBorder: {
        borderRadius: 20,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    input: {
        backgroundColor: '#091428',
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 24, // Larger font for emojis
        color: '#FFFFFF',
    },
    playButtonWrapper: {
        width: 65,
        height: 65,
    },
    playButtonGradient: {
        flex: 1,
        borderRadius: 35, // Fully rounded
        padding: 2,
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    playButtonInner: {
        flex: 1,
        backgroundColor: '#050B18', // Dark background
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 16,
        borderRightWidth: 0,
        borderBottomWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: '#FFFFFF',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderTopColor: 'transparent',
        marginLeft: 6, // Offset to center visually
    }
});
