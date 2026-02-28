import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    StatusBar,
    RefreshControl,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Messages'>;

export default function MessagesScreen() {
    const navigation = useNavigation<MessagesScreenNavigationProp>();
    const { user } = useAuth();

    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [followedResults, setFollowedResults] = useState<any[]>([]);
    const [otherResults, setOtherResults] = useState<any[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [followingIds, setFollowingIds] = useState<number[]>([]);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({
            scrollY,
            headerRight: () => (
                <TouchableOpacity onPress={() => setIsSearching(true)} style={{ marginRight: 15 }}>
                    <Ionicons name="search" size={24} color={COLORS.white} />
                </TouchableOpacity>
            ),
            showSearch: isSearching,
            searchQuery: searchQuery,
            onSearchChange: handleSearchChange,
            onSearchClose: () => {
                setIsSearching(false);
                setSearchQuery('');
                setFollowedResults([]);
                setOtherResults([]);
            }
        } as any);
    }, [isSearching, searchQuery]);

    const fetchFollowing = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await apiClient.get(`/users/${user.id}/following`);
            const ids = response.data.map((u: any) => u.id);
            setFollowingIds(ids);
        } catch (error) {
            console.error('Error fetching following for search prioritization:', error);
        }
    }, [user?.id]);

    const searchUsers = useCallback(async (text: string) => {
        if (!text.trim()) {
            setFollowedResults([]);
            setOtherResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        setIsLoadingSearch(true);
        try {
            const response = await apiClient.get('/users/search', {
                params: { query: text.trim() },
            });
            const allUsers = response.data || [];

            // Categorize results
            const followed = allUsers.filter((u: any) => followingIds.includes(u.id));
            const others = allUsers.filter((u: any) => !followingIds.includes(u.id));

            setFollowedResults(followed);
            setOtherResults(others);
        } catch (error) {
            console.error('User search error:', error);
            setFollowedResults([]);
            setOtherResults([]);
        } finally {
            setIsLoadingSearch(false);
        }
    }, [followingIds]);

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchUsers(text);
        }, 400);
    };

    const fetchRecentChats = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const response = await apiClient.get('/chat/recent-chats', {
                params: { userId: user.id }
            });
            setChats(response.data);
        } catch (error) {
            console.error("❌ Error fetching recent chats:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchRecentChats();
            fetchFollowing();
        }, [fetchRecentChats, fetchFollowing])
    );

    const filteredChats = chats.filter(chat => {
        const isMe = String(chat.senderId) === String(user?.id);
        const otherName = isMe ? chat.receiverName : chat.senderName;
        return otherName?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${diffInDays}d ago`;
    };

    const renderChatItem = ({ item }: { item: any }) => {
        const isMe = String(item.senderId) === String(user?.id);
        const otherId = isMe ? item.receiverId : item.senderId;
        const otherName = isMe ? item.receiverName : item.senderName;
        const otherImage = isMe ? item.receiverImage : item.senderImage;
        const isUnread = !item.isRead && !isMe;

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('ChatDetail', {
                    userId: otherId,
                    userName: otherName,
                    userImage: otherImage || COLORS.defaultProfileImage
                })}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={otherImage ? { uri: otherImage } : COLORS.defaultProfileImage}
                        style={styles.avatar}
                    />
                </View>
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.userName}>{otherName}</Text>
                        <Text style={[styles.timeText, isUnread && styles.unreadTime]}>
                            {formatTime(item.timestamp)}
                        </Text>
                    </View>
                    <Text style={[styles.lastMessage, isUnread && styles.unreadMessage]} numberOfLines={1}>
                        {isMe ? `You: ${item.content}` : item.content}
                    </Text>
                </View>
                {isUnread && <View style={styles.unreadIndicator} />}
            </TouchableOpacity>
        );
    };

    const renderSearchUser = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                style={styles.searchUserItem}
                onPress={() =>
                    navigation.navigate('ChatDetail', {
                        userId: String(item.id),
                        userName: item.username,
                        userImage: item.profilePicUrl,
                    })
                }
                activeOpacity={0.7}
            >
                <View style={styles.searchAvatarWrapper}>
                    <Image
                        source={item.profilePicUrl ? { uri: item.profilePicUrl } : COLORS.defaultProfileImage}
                        style={styles.searchAvatar}
                    />
                </View>

                <View style={styles.searchUserInfo}>
                    <Text style={styles.searchUsernameText}>{item.username}</Text>
                    <Text style={styles.searchNameText} numberOfLines={1}>
                        {item.name || item.username}
                        {item.bio ? ` • ${item.bio}` : ''}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    type MessageSearchItem =
        | { type: 'header'; title: string; showSeeAll: boolean }
        | { type: 'user'; data: any };

    const searchSectionData: MessageSearchItem[] = [
        ...followedResults.map(u => ({ type: 'user', data: u } as const)),
        ...(otherResults.length > 0 ? [{ type: 'header', title: 'More accounts', showSeeAll: true } as const] : []),
        ...otherResults.map(u => ({ type: 'user', data: u } as const)),
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {isSearching ? (
                <Animated.FlatList
                    data={searchSectionData}
                    keyExtractor={(item, index) => item.type === 'header' ? `header-${item.title}` : `user-${item.data.id}-${index}`}
                    renderItem={({ item }) => {
                        if (item.type === 'header') {
                            return (
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>{item.title}</Text>
                                    {item.showSeeAll && (
                                        <TouchableOpacity>
                                            <Text style={styles.seeAllText}>See All</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }
                        return renderSearchUser({ item: item.data });
                    }}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
            ) : (
                <Animated.FlatList
                    data={filteredChats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchRecentChats} />
                    }
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        paddingTop: 15,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.extraLightGray,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatContent: {
        flex: 1,
        marginLeft: 15,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    unreadTime: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    unreadMessage: {
        color: COLORS.text,
        fontWeight: '600',
    },
    unreadIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: 10,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.dark,
        elevation: 8,
    },
    // Search specific styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    searchUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    searchAvatarWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: COLORS.extraLightGray,
    },
    searchAvatar: {
        width: 60,
        height: 60,
    },
    searchAvatarPlaceholder: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    searchAvatarInitial: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchUserInfo: {
        flex: 1,
    },
    searchUsernameText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    searchNameText: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.extraLightGray,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginHorizontal: 20,
        marginBottom: 15,
        height: 44,
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 10,
        color: COLORS.text,
        fontSize: 15,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    contactAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    contactName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
});
