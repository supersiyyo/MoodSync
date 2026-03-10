import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';
import { db } from '../services/firebase';

const { height } = Dimensions.get('window');

const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';

interface HistoryItem {
    id: string;
    inputEmojis: string;
    userName?: string;
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
}

export default function HistoryDrawer({ visible, onClose, roomCode }: HistoryDrawerProps) {
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
                    selectedSong: docData.selectedSong,
                    timestamp: docData.timestamp,
                } as HistoryItem);
            });
            setHistory(data);
        });

        return () => unsubscribe();
    }, [visible, roomCode]);

    const renderItem = ({ item }: { item: HistoryItem }) => (
        <View style={styles.historyItem}>
            <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>{item.inputEmojis}</Text>
            </View>
            <View style={styles.songInfoContainer}>
                <Text style={styles.userNameText}>{item.userName} sent:</Text>
                <Text style={styles.songTitle} numberOfLines={1}>{item.selectedSong?.title || 'Unknown Song'}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{item.selectedSong?.artist || 'Unknown Artist'}</Text>
            </View>
        </View>
    );

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
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(200)}
                            exiting={FadeOutDown.duration(200)}
                            style={styles.bottomSheet}
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
                                />
                            )}
                        </Animated.View>
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
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        width: '100%',
        height: height * 0.7, // Slightly taller since it's a list
        backgroundColor: '#0F172A',
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
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
    },
    emojiContainer: {
        width: 60,
        height: 60,
        backgroundColor: '#0F172A',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    emojiText: {
        fontSize: 24,
    },
    songInfoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    userNameText: {
        color: CYAN,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    songTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    songArtist: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
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
