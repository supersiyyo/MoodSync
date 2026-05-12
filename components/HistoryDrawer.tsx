import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight, runOnJS } from 'react-native-reanimated';
import { db } from '../services/firebase';
import { getGradientFromEmojis } from '../utils/emojiGradient';

const { height } = Dimensions.get('window');

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';

interface HistoryItem {
    id: string;
    inputEmojis: string;
    userName?: string;
    aiModel?: string;
    selectedSong: {
        title: string;
        artist: string;
    };
    timestamp: string;
}

interface HistoryDrawerProps {
    visible: boolean;
    onClose: () => void;
    roomCode: string;
    currentUser: string;
}

export default function HistoryDrawer({ visible, onClose, roomCode, currentUser }: HistoryDrawerProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        if (!visible || !roomCode) return;

        const promptsRef = collection(db, 'sessions', roomCode, 'prompts');
        const q = query(promptsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: HistoryItem[] = [];
            snapshot.forEach((doc) => {
                const docData = doc.data();
                data.push({
                    id: doc.id,
                    inputEmojis: docData.inputEmojis,
                    userName: docData.userName || 'Anonymous',
                    aiModel: docData.aiModel || null,
                    selectedSong: docData.selectedSong,
                    timestamp: docData.timestamp,
                } as HistoryItem);
            });
            setHistory(data);
        });

        return () => unsubscribe();
    }, [visible, roomCode]);

    const closeGesture = Gesture.Pan()
        .onEnd((event) => {
            if (event.translationX > 50) {
                runOnJS(onClose)();
            }
        });

    const renderItem = ({ item }: { item: HistoryItem }) => {
        const isMe = item.userName === currentUser;
        const gradientColors = getGradientFromEmojis(item.inputEmojis);

        return (
            <View style={[styles.chatMessageContainer, isMe ? styles.chatMessageContainerRight : styles.chatMessageContainerLeft]}>
                {!isMe && <Text style={styles.chatUserName}>{item.userName}</Text>}
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.chatMainBubble, isMe ? styles.chatMainBubbleRight : styles.chatMainBubbleLeft]}
                >
                    <Text style={styles.chatSongText}>
                        <Text style={styles.chatSongTitle}>"{item.selectedSong?.title || 'Unknown'}"</Text> by {item.selectedSong?.artist || 'Unknown'}
                    </Text>
                    {item.aiModel && (
                        <Text style={styles.chatAiModelText}>AI: {item.aiModel}</Text>
                    )}
                </LinearGradient>
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.chatSubBubble, isMe ? styles.chatSubBubbleRight : styles.chatSubBubbleLeft]}
                >
                    <Text style={styles.chatEmojiText}>{item.inputEmojis}</Text>
                </LinearGradient>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.modalOverlay}
                >
                    <TouchableWithoutFeedback>
                        <GestureDetector gesture={closeGesture}>
                            <Animated.View
                                entering={SlideInRight.springify().damping(20).stiffness(200)}
                                exiting={SlideOutRight.duration(200)}
                                style={styles.fullDrawer}
                            >
                                <View style={styles.sheetHeader}>
                                    <Text style={styles.headerTitle}>ROOM HISTORY</Text>
                                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                        <LinearGradient
                                            colors={['#333', '#444']}
                                            style={styles.closeGradient}
                                        >
                                            <Text style={styles.closeText}>✕</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                {history.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyStateText}>No vibes set yet!</Text>
                                        <Text style={styles.emptyStateSubtext}>Drop some emojis to start the history.</Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={history}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderItem}
                                        contentContainerStyle={styles.listContent}
                                        showsVerticalScrollIndicator={false}
                                        inverted
                                    />
                                )}
                            </Animated.View>
                        </GestureDetector>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    fullDrawer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#0F172A',
        paddingTop: 60,
        shadowColor: CYAN,
        shadowOffset: { width: -10, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: CYAN,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
    },
    closeGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
        paddingBottom: 50,
    },
    chatMessageContainer: {
        marginBottom: 20,
    },
    chatMessageContainerLeft: {
        alignItems: 'flex-start',
    },
    chatMessageContainerRight: {
        alignItems: 'flex-end',
    },
    chatUserName: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    chatMainBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        maxWidth: '90%',
        marginBottom: 0,
    },
    chatMainBubbleLeft: {
        borderTopLeftRadius: 4,
    },
    chatMainBubbleRight: {
        borderTopRightRadius: 4,
    },
    chatSongText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 22,
    },
    chatSongTitle: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    chatAiModelText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 4,
        fontStyle: 'italic',
    },
    chatSubBubble: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        maxWidth: '80%',
        marginTop: -10,
        borderWidth: 2,
        borderColor: '#0F172A',
    },
    chatSubBubbleLeft: {
        borderTopLeftRadius: 4,
    },
    chatSubBubbleRight: {
        borderTopRightRadius: 4,
    },
    chatEmojiText: {
        fontSize: 22,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyStateText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textAlign: 'center',
    },
});