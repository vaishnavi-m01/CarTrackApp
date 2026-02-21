import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    FlatList,
    LayoutAnimation,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { CommunityPost } from '../types/Community';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommunityPostCard from '../components/CommunityPostCard';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3 - 1;

type Props = StackScreenProps<RootStackParamList, 'OtherUserProfile'>;

export default function OtherUserProfileScreen({ route, navigation }: Props) {
    const { userId, userName } = route.params;
    const { vehicles, wishlist, toggleWishlist, fetchWishlist } = useApp();
    const { user, followUser, unfollowUser } = useAuth();
    const insets = useSafeAreaInsets();

    const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [followStatus, setFollowStatus] = useState<'PENDING' | 'ACCEPTED' | 'NONE'>('NONE');
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const isFollowing = followStatus === 'ACCEPTED';

    // Data filtering
    const userVehicles = vehicles.filter(v => String(v.ownerId) === String(userId));

    React.useEffect(() => {
        fetchUserContent();
        fetchOtherUserProfile();
        if (user) {
            fetchRelationship();
            fetchSuggestedUsers();
        }
    }, [userId, user?.id]);

    const fetchOtherUserProfile = async () => {
        try {
            const response = await apiClient.get(`/users/${userId}`);
            setOtherUser(response.data);
        } catch (error) {
            console.error('Error fetching other user profile:', error);
        }
    };

    const fetchRelationship = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/users/${user.id}/relationship/${userId}`);
            setFollowStatus(response.data.status);
        } catch (error) {
            console.error('Error fetching relationship status:', error);
        }
    };

    const fetchSuggestedUsers = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/users/${user.id}/suggestions`);
            setSuggestedUsers(response.data.map((u: any) => ({
                userId: u.id,
                userName: u.username,
                userAvatar: u.profilePicUrl,
                reason: 'Suggested for you'
            })));
        } catch (error) {
            console.error('Error fetching suggested users:', error);
        }
    };

    const fetchUserContent = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/post?userId=${userId}`);
            const data = response.data || [];

            const mappedPosts: CommunityPost[] = data.map((dto: any) => {
                if (!dto) return null;
                const post = dto.post || dto;
                if (!post || typeof post !== 'object' || !post.id) return null;
                return {
                    id: post.id,
                    userId: post.userId,
                    userName: post.user?.username || `User ${post.userId}`,
                    userAvatar: post.user?.profilePicUrl,
                    user: post.user,
                    content: post.content,
                    media: (post.media || []).map((m: any) => ({
                        id: m.id,
                        postId: m.postId,
                        mediaUrl: m.mediaUrl,
                        type: m.type || 'image',
                        aspectRatio: m.aspectRatio || 1
                    })),
                    createdAt: post.createdAt,
                    likes: post.likesCount || 0,
                    likesCount: post.likesCount,
                    likedByUser: dto.likedByUser || post.likedByUser || false,
                    isSaved: dto.isSaved || dto.saved || post.saved || false,
                    comments: (post.comments || []).map((c: any) => ({
                        id: c.id,
                        userId: c.userId,
                        userName: c.userName || 'Unknown',
                        content: c.content,
                        timestamp: c.createdAt,
                        likes: 0
                    })),
                    commentCount: post.commentsCount || 0,
                    commentsCount: post.commentsCount,
                    views: post.viewsCount || 0,
                    viewsCount: post.viewsCount,
                    savesCount: post.savesCount,
                    location: post.location,
                    feeling: post.feeling,
                    allowComments: post.allowComments ?? true,
                    isPublic: post.isPublic ?? true,
                    vehicleId: post.vehicleId
                };
            }).filter((p: any) => p !== null);

            setUserPosts(mappedPosts);
        } catch (error) {
            console.error('Error fetching user posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePostLike = async (postId: string | number) => {
        if (!user) return;
        const postToToggle = userPosts.find(p => p.id === postId);
        if (!postToToggle) return;
        const willBeLiked = !postToToggle.likedByUser;

        setUserPosts((prev) => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    likedByUser: willBeLiked,
                    likes: willBeLiked ? (post.likes + 1) : Math.max(0, post.likes - 1)
                };
            }
            return post;
        }));

        try {
            await apiClient.post(`/post/${postId}/like?userId=${user.id}`);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const togglePostSave = async (postId: string | number) => {
        if (!user) return;
        try {
            await apiClient.post(`/post/${postId}/save?userId=${user.id}`);
            await fetchWishlist();
        } catch (error) {
            console.error('Error toggling post save:', error);
        }
    };


    const toggleSuggestions = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowSuggestions(!showSuggestions);
    };

    const handleFollowToggle = async () => {
        if (!user) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        try {
            if (isFollowing || followStatus === 'PENDING') {
                await unfollowUser(userId);
                setFollowStatus('NONE');
                setShowSuggestions(false);
            } else {
                await followUser(userId);
                // If the user being followed is private, status is PENDING
                if (otherUser?.isPrivate) {
                    setFollowStatus('PENDING');
                } else {
                    setFollowStatus('ACCEPTED');
                    if (suggestedUsers.length > 0) {
                        setShowSuggestions(true);
                    }
                }
            }
            // Refresh counts
            fetchOtherUserProfile();
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerSection}>
            {/* Simple Integrated Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{userName}</Text>
                    <TouchableOpacity style={styles.navBtn}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileMasterInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: `https://ui-avatars.com/api/?name=${userName}&background=3B82F6&color=fff&size=128` }}
                            style={styles.avatar}
                        />
                    </View>
                    <View style={styles.profileTextInfo}>
                        <Text style={styles.name}>{userName}</Text>
                        <Text style={styles.handle}>@{userName.toLowerCase().replace(/\s+/g, '_')}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{otherUser?.postsCount || userPosts.length}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{otherUser?.followersCount || 0}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{otherUser?.followingCount || 0}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.followBtn, isFollowing && styles.followingBtn]}
                        onPress={handleFollowToggle}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                            {followStatus === 'ACCEPTED' ? 'Following' : followStatus === 'PENDING' ? 'Requested' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.messageBtn]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ChatDetail', { userId, userName })}
                    >
                        <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
                        <Text style={styles.messageBtnText}>Message</Text>
                    </TouchableOpacity>

                    {/* Suggestions Toggle Button (Instagram style) */}
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.suggestionToggleBtn, showSuggestions && styles.suggestionToggleActive]}
                        onPress={toggleSuggestions}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={showSuggestions ? "person-remove-outline" : "person-add-outline"}
                            size={20}
                            color={showSuggestions ? COLORS.white : COLORS.primary}
                        />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Suggestions Section (Instagram style) */}
            {showSuggestions && suggestedUsers.length > 0 && (
                <View style={styles.suggestionsSection}>
                    <View style={styles.suggestionsHeader}>
                        <Text style={styles.suggestionsTitle}>Suggested for you</Text>
                        <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                            <Ionicons name="close" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestionsScroll}
                    >
                        {suggestedUsers.map((sUser) => (
                            <View key={sUser.userId} style={styles.suggestionCard}>
                                <TouchableOpacity
                                    style={styles.suggestionClose}
                                    onPress={() => {
                                        // This is a simple mock close for one item
                                        // in a real app we'd remove from state
                                    }}
                                >
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => navigation.push('OtherUserProfile', { userId: sUser.userId, userName: sUser.userName })}
                                    style={styles.suggestionMain}
                                >
                                    <View style={styles.suggestionAvatarContainer}>
                                        <Image
                                            source={{ uri: sUser.userAvatar || `https://ui-avatars.com/api/?name=${sUser.userName}&background=3B82F6&color=fff` }}
                                            style={styles.suggestionAvatar}
                                        />
                                    </View>
                                    <Text style={styles.suggestionName} numberOfLines={1}>{sUser.userName}</Text>
                                    <Text style={styles.suggestionReason} numberOfLines={1}>{sUser.reason}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.suggestionFollowBtn}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        followUser(String(sUser.userId));
                                    }}
                                >
                                    <Text style={styles.suggestionFollowText}>Follow</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Garage Section */}
            {userVehicles.length > 0 && (
                <View style={styles.garageSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Garage</Text>
                        <Text style={styles.sectionCount}>{userVehicles.length} vehicles</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.garageScroll}
                    >
                        {userVehicles.map(vehicle => (
                            <TouchableOpacity key={vehicle.id} style={styles.vehicleCard}>
                                <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
                                <View style={styles.vehicleInfo}>
                                    <Text style={styles.vehicleName} numberOfLines={1}>{vehicle.brand} {vehicle.model}</Text>
                                    <Text style={styles.vehicleYear}>{vehicle.year}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Posts Tab Control */}
            <View style={styles.postsControl}>
                <TouchableOpacity
                    style={[styles.modeBtn, viewMode === 'grid' && styles.modeBtnActive]}
                    onPress={() => setViewMode('grid')}
                >
                    <Ionicons name="grid" size={20} color={viewMode === 'grid' ? COLORS.primary : COLORS.textLight} />
                    <Text style={[styles.modeText, viewMode === 'grid' && styles.modeTextActive]}>Grid View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}
                    onPress={() => setViewMode('list')}
                >
                    <Ionicons name="list" size={20} color={viewMode === 'list' ? COLORS.primary : COLORS.textLight} />
                    <Text style={[styles.modeText, viewMode === 'list' && styles.modeTextActive]}>List View</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPostItem = ({ item }: { item: any }) => {
        if (viewMode === 'list') {
            return (
                <View style={styles.listPostWrapper}>
                    <CommunityPostCard
                        post={item}
                        onLike={() => togglePostLike(item.id)}
                        onComment={() => { }}
                        onShare={() => { }}
                        onImagePress={() => navigation.navigate('PostDetail', { initialPost: item, allPosts: userPosts })}
                        isSaved={wishlist.includes(String(item.id))}
                        onToggleSave={() => togglePostSave(item.id)}
                    />
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate('PostDetail', { initialPost: item, allPosts: userPosts })}
            >
                <Image source={{ uri: item.media?.[0]?.mediaUrl }} style={styles.gridImage} />
                {item.media.length > 1 && (
                    <View style={styles.multiMediaBadge}>
                        <Ionicons name="copy" size={12} color={COLORS.white} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent />
            <FlatList
                data={userPosts}
                renderItem={renderPostItem}
                keyExtractor={item => String(item.id)}
                ListHeaderComponent={renderHeader}
                numColumns={viewMode === 'grid' ? 3 : 1}
                key={viewMode} // Trigger re-render on mode change
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="images-outline" size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>No posts yet</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        paddingBottom: 40,
    },
    headerSection: {
        backgroundColor: COLORS.white,
    },
    headerGradient: {
        paddingBottom: 25,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...SHADOWS.medium,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.white,
    },
    profileMasterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: COLORS.white,
        backgroundColor: COLORS.white,
        ...SHADOWS.light,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
    },
    profileTextInfo: {
        marginLeft: 15,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    handle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        marginBottom: 25,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    followBtn: {
        backgroundColor: COLORS.white,
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    messageBtn: {
        backgroundColor: COLORS.white,
        flex: 1,
    },
    suggestionToggleBtn: {
        width: 44,
        flex: 0,
        backgroundColor: COLORS.white,
    },
    suggestionToggleActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    followBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    followingBtnText: {
        color: COLORS.white,
    },
    messageBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    garageSection: {
        paddingVertical: 20,
        backgroundColor: COLORS.white,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionCount: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    garageScroll: {
        paddingHorizontal: 15,
    },
    vehicleCard: {
        width: 130,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginHorizontal: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.light,
    },
    vehicleImage: {
        width: '100%',
        height: 80,
    },
    vehicleInfo: {
        padding: 8,
    },
    vehicleName: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    vehicleYear: {
        fontSize: 11,
        color: COLORS.textLight,
        marginTop: 2,
    },
    postsControl: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        marginTop: 5,
    },
    modeBtn: {
        flex: 1,
        height: 46,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    modeBtnActive: {
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
    },
    modeText: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    modeTextActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    gridItem: {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH,
        margin: 0.5,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    multiMediaBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 18,
        height: 18,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listPostWrapper: {
        backgroundColor: COLORS.white,
        marginBottom: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textLight,
        marginTop: 10,
    },
    // Suggestions Styles
    suggestionsSection: {
        backgroundColor: '#F8FAFC',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    suggestionsScroll: {
        paddingHorizontal: 15,
        gap: 12,
    },
    suggestionCard: {
        width: 150,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.light,
    },
    suggestionMain: {
        alignItems: 'center',
        width: '100%',
    },
    suggestionAvatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
        backgroundColor: COLORS.background,
    },
    suggestionAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    suggestionName: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    suggestionReason: {
        fontSize: 11,
        color: COLORS.textLight,
        marginBottom: 12,
    },
    suggestionFollowBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 6,
        width: '100%',
        alignItems: 'center',
    },
    suggestionFollowText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
    },
    suggestionClose: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
    },
});
