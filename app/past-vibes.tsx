import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { ChevronLeft, Clock, Music, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { db } from '../services/firebase';

const { width, height } = Dimensions.get('window');
const CYAN = '#00F2FF';
const PURPLE = '#BC00FF';
const DARK_BG = '#050B18';

interface PastSession {
    id: string;
    roomName: string;
    timestamp: string;
}

interface SongHistoryItem {
    id: string;
    title: string;
    artist: string;
    emojis: string;
    timestamp: string;
}

export default function PastVibesScreen() {
    const router = useRouter();
    const [sessions, setSessions] = useState<PastSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [songHistory, setSongHistory] = useState<SongHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const jsonValue = await AsyncStorage.getItem('MOODSYNC_PAST_SESSIONS');
            if (jsonValue != null) {
                setSessions(JSON.parse(jsonValue));
            }
        } catch (e) {
            console.error("Failed to load past sessions", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSongHistory = async (sessionId: string) => {
        setIsFetchingHistory(true);
        setSelectedSessionId(sessionId);
        try {
            const promptsRef = collection(db, 'sessions', sessionId, 'prompts');
            const q = query(promptsRef, orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const history: SongHistoryItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    title: data.selectedSong?.title || 'Unknown',
                    artist: data.selectedSong?.artist || 'Unknown',
                    emojis: data.inputEmojis || '',
                    timestamp: data.timestamp
                });
            });
            setSongHistory(history);
        } catch (e) {
            console.error("Failed to fetch song history", e);
            setSongHistory([]);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    const deleteSession = async (id: string) => {
        try {
            const updated = sessions.filter(s => s.id !== id);
            setSessions(updated);
            await AsyncStorage.setItem('MOODSYNC_PAST_SESSIONS', JSON.stringify(updated));
            if (selectedSessionId === id) {
                setSelectedSessionId(null);
                setSongHistory([]);
            }
        } catch (e) {
            console.error("Failed to delete session", e);
        }
    };

    const renderSessionItem = ({ item, index }: { item: PastSession; index: number }) => {
        const isSelected = selectedSessionId === item.id;
        const date = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        return (
            <Animated.View entering={FadeInRight.delay(index * 100)}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.sessionCard, isSelected && styles.sessionCardSelected]}
                    onPress={() => fetchSongHistory(item.id)}
                >
                    <View style={styles.sessionCardHeader}>
                        <View style={styles.sessionInfo}>
                            <Text style={styles.roomNameText}>{item.roomName}</Text>
                            <Text style={styles.dateText}>{date} • ID: {item.id}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteSession(item.id)} style={styles.deleteBtn}>
                            <Trash2 size={16} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderSongItem = ({ item, index }: { item: SongHistoryItem; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.songItem}>
            <View style={styles.songEmojiContainer}>
                <Text style={styles.songEmojiText}>{item.emojis}</Text>
            </View>
            <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {/* Ambient Background Glows */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <View style={[styles.ambientGlow, { top: -100, left: -100, backgroundColor: CYAN, opacity: 0.2 }]} />
                <View style={[styles.ambientGlow, { bottom: -100, right: -100, backgroundColor: PURPLE, opacity: 0.2 }]} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>PAST VIBES</Text>
                    <View style={{ width: 28 }} />
                </View>

                {isLoading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={CYAN} />
                    </View>
                ) : sessions.length === 0 ? (
                    <View style={styles.centerContent}>
                        <Clock size={64} color="rgba(255,255,255,0.1)" style={{ marginBottom: 20 }} />
                        <Text style={styles.emptyText}>No past vibes yet.</Text>
                        <Text style={styles.emptySubtext}>Host and end a session to save your history!</Text>
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Session List (Horizontal) */}
                        <View style={styles.sessionListSection}>
                            <FlatList
                                horizontal
                                data={sessions}
                                keyExtractor={(item) => item.id}
                                renderItem={renderSessionItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.sessionListPadding}
                            />
                        </View>

                        {/* Song History Section */}
                        <View style={styles.historySection}>
                            {selectedSessionId ? (
                                isFetchingHistory ? (
                                    <View style={styles.centerContent}>
                                        <ActivityIndicator color={PURPLE} />
                                    </View>
                                ) : songHistory.length > 0 ? (
                                    <FlatList
                                        data={songHistory}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderSongItem}
                                        contentContainerStyle={styles.songListPadding}
                                        showsVerticalScrollIndicator={false}
                                    />
                                ) : (
                                    <View style={styles.centerContent}>
                                        <Music size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 15 }} />
                                        <Text style={styles.emptySubtext}>No songs were played in this session.</Text>
                                    </View>
                                )
                            ) : (
                                <View style={styles.centerContent}>
                                    <Text style={styles.emptySubtext}>Select a session above to view details</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
    },
    safeArea: {
        flex: 1,
    },
    ambientGlow: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        filter: 'blur(80px)',
        shadowColor: CYAN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 80,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 4,
        textShadowColor: CYAN,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    backButton: {
        padding: 5,
    },
    content: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        textAlign: 'center',
    },
    sessionListSection: {
        height: 100,
        marginTop: 10,
    },
    sessionListPadding: {
        paddingHorizontal: 20,
        gap: 15,
        alignItems: 'center',
    },
    sessionCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 15,
        minWidth: 160,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sessionCardSelected: {
        borderColor: CYAN,
        backgroundColor: 'rgba(0, 242, 255, 0.1)',
    },
    sessionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sessionInfo: {
        flex: 1,
    },
    roomNameText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    dateText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 4,
    },
    historySection: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: 20,
        overflow: 'hidden',
    },
    songListPadding: {
        padding: 25,
        gap: 20,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    songEmojiContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    songEmojiText: {
        fontSize: 24,
    },
    songDetails: {
        flex: 1,
    },
    songTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    songArtist: {
        color: CYAN,
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.8,
    },
});
