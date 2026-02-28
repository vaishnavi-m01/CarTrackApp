import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import apiClient from '../api/apiClient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/MainNavigator';

type FollowersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Followers'>;
type FollowersScreenRouteProp = RouteProp<RootStackParamList, 'Followers'>;

interface Props {
    navigation: FollowersScreenNavigationProp;
    route: FollowersScreenRouteProp;
}

const { width } = Dimensions.get('window');

export default function FollowersScreen({ navigation, route }: Props) {
    const { userId, type: initialType } = route.params;
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialType);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const indicatorX = useRef(new Animated.Value(initialType === 'followers' ? 0 : width / 2)).current;

    const scrollY = useRef(new Animated.Value(0)).current;

    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        (navigation as any).setParams({
            scrollY,
            headerRight: () => (
                <TouchableOpacity onPress={() => setIsSearching(true)} style={{ marginRight: 15 }}>
                    <Ionicons name="search" size={24} color={COLORS.white} />
                </TouchableOpacity>
            ),
            showSearch: isSearching,
            searchQuery: search,
            onSearchChange: setSearch,
            onSearchClose: () => {
                setIsSearching(false);
                setSearch('');
            }
        });
    }, [isSearching, search]);

    useEffect(() => {
        fetchBoth();
    }, [userId]);

    const fetchBoth = async () => {
        setIsLoading(true);
        try {
            const [followersRes, followingRes] = await Promise.all([
                apiClient.get<any[]>(`/users/${userId}/followers`),
                apiClient.get<any[]>(`/users/${userId}/following`),
            ]);
            setFollowers(followersRes.data || []);
            setFollowing(followingRes.data || []);
        } catch (error) {
            console.error('Error fetching followers/following:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const switchTab = (tab: 'followers' | 'following') => {
        setActiveTab(tab);
        setSearch('');
        Animated.spring(indicatorX, {
            toValue: tab === 'followers' ? 0 : width / 2,
            useNativeDriver: false,
            tension: 80,
            friction: 12,
        }).start();
    };

    const currentList = activeTab === 'followers' ? followers : following;
    const filtered = currentList.filter(u =>
        !search || u.username?.toLowerCase().includes(search.toLowerCase())
    );

    const handleUserPress = (user: any) => {
        navigation.navigate('OtherUserProfile', {
            userId: String(user.id),
            userName: user.username,
        });
    };

    const renderUser = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleUserPress(item)}
            activeOpacity={0.75}
        >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                {item.profilePicUrl ? (
                    <Image source={{ uri: item.profilePicUrl }} style={styles.avatar} />
                ) : (
                    <Text style={styles.avatarText}>
                        {item.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                )}
            </View>

            {/* Name */}
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                {(item.name || item.fullName) && (
                    <Text style={styles.fullName} numberOfLines={1}>
                        {item.name || item.fullName}
                    </Text>
                )}
            </View>

            {/* Message button */}
            <TouchableOpacity
                style={styles.messageBtn}
                onPress={() =>
                    navigation.navigate('ChatDetail', {
                        userId: String(item.id),
                        userName: item.username,
                        userImage: item.profilePicUrl,
                    })
                }
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.messageBtnGradient}
                >
                    <Text style={styles.messageBtnText}>Message</Text>
                </LinearGradient>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => switchTab('followers')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                        {followers.length} followers
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => switchTab('following')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                        {following.length} following
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Animated Gradient Underline Indicator */}
            <View style={styles.indicatorTrack}>
                <Animated.View style={{ width: width / 2, height: 3, position: 'absolute', left: indicatorX }}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1, borderRadius: 3 }}
                    />
                </Animated.View>
            </View>

            {/* List */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons
                        name="people-outline"
                        size={50}
                        color={COLORS.border}
                    />
                    <Text style={styles.emptyText}>
                        {search ? 'No results found' : `No ${activeTab} yet`}
                    </Text>
                </View>
            ) : (
                <Animated.FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderUser}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
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
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 0,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.textLight,
    },
    activeTabText: {
        color: COLORS.text,
        fontWeight: '700',
    },
    indicatorTrack: {
        height: 2,
        backgroundColor: '#EBEBEB',
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        height: 3,
        borderRadius: 2,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 15,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    messageBtn: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    messageBtnGradient: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    username: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    fullName: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 1,
    },
});
