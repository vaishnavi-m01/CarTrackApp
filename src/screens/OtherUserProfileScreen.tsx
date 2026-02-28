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
import LikersBottomSheet from '../components/LikersBottomSheet';

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
    const canSeeContent = !otherUser?.isPrivate || isFollowing;

    // Likers sheet state
    const [likersSheetVisible, setLikersSheetVisible] = useState(false);
    const [selectedPostIdForLikers, setSelectedPostIdForLikers] = useState<string | number | null>(null);

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
            let users = response.data;
            if (!users || users.length === 0) {
                // Fallback data if API returns empty so the UI still works
                users = [
                    { id: 991, username: 'car_enthusiast', profilePicUrl: 'https://ui-avatars.com/api/?name=Car+Enthusiast&background=random' },
                    { id: 992, username: 'speed_demon', profilePicUrl: 'https://ui-avatars.com/api/?name=Speed+Demon&background=random' },
                    { id: 993, username: 'vintage_collector', profilePicUrl: 'https://ui-avatars.com/api/?name=Vintage+Collector&background=random' }
                ];
            }

            setSuggestedUsers(users.map((u: any) => ({
                userId: u.id,
                userName: u.username,
                userAvatar: u.profilePicUrl || COLORS.defaultProfileImage,
                reason: 'Suggested for you'
            })));
        } catch (error) {
            console.error('Error fetching suggested users:', error);
            // Fallback on error
            setSuggestedUsers([
                { userId: 991, userName: 'car_enthusiast', userAvatar: 'https://ui-avatars.com/api/?name=Car+Enthusiast&background=random', reason: 'Suggested for you' },
                { userId: 992, userName: 'speed_demon', userAvatar: 'https://ui-avatars.com/api/?name=Speed+Demon&background=random', reason: 'Suggested for you' },
            ]);
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

    const handleShowLikers = (postId: string | number) => {
        setSelectedPostIdForLikers(postId);
        setLikersSheetVisible(true);
    };

    const handleLikerUserPress = (userId: string, userName: string) => {
        setLikersSheetVisible(false);
        if (userId === user?.id?.toString()) {
            navigation.navigate('Profile' as any);
        } else {
            // Use push to allow navigating to another profile from the current profile
            navigation.push('OtherUserProfile', { userId, userName });
        }
    };


    const toggleSuggestions = () => {
        setShowSuggestions(!showSuggestions);
    };

    const handleFollowToggle = async () => {
        if (!user) return;

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

                <View style={styles.profileHeaderRow}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={otherUser?.profilePicUrl ? { uri: otherUser.profilePicUrl } : COLORS.defaultProfileImage}
                            style={styles.avatar}
                        />
                    </View>

                    <View style={styles.statsContainer}>
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
                </View>

                <View style={styles.bioSection}>
                    <Text style={styles.name}>{userName}</Text>
                    {/* <Text style={styles.handle}>@{(userName || otherUser?.username || 'user').toLowerCase().replace(/\s+/g, '_')}</Text> */}
                    {otherUser?.bio && (
                        <Text style={styles.bioText}>{otherUser.bio}</Text>
                    )}
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.followBtn, (isFollowing || followStatus === 'PENDING') && styles.followingBtn]}
                        onPress={handleFollowToggle}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.followBtnText, (isFollowing || followStatus === 'PENDING') && styles.followingBtnText]}>
                            {followStatus === 'ACCEPTED' ? 'Following' : followStatus === 'PENDING' ? 'Requested' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.messageBtn]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ChatDetail', { userId, userName })}
                    >
                        <Text style={styles.messageBtnText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.suggestionToggleBtn, showSuggestions && styles.suggestionToggleActive]}
                        onPress={toggleSuggestions}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={showSuggestions ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={COLORS.white}
                        />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Suggestions Section (Instagram style) */}
            {showSuggestions && suggestedUsers.length > 0 && canSeeContent && (
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
                                            source={sUser.userAvatar ? { uri: sUser.userAvatar } : COLORS.defaultProfileImage}
                                            style={styles.suggestionAvatar}
                                        />
                                    </View>
                                    <Text style={styles.suggestionName} numberOfLines={1}>{sUser.userName}</Text>
                                    <Text style={styles.suggestionReason} numberOfLines={1}>{sUser.reason}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.suggestionFollowBtn}
                                    onPress={() => {
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

            {!canSeeContent && (
                <View style={styles.privateAccountContainer}>
                    <View style={styles.privateIconCircle}>
                        <Ionicons name="lock-closed-outline" size={32} color={COLORS.text} />
                    </View>
                    <Text style={styles.privateTitle}>This Account is Private</Text>
                    <Text style={styles.privateSubtitle}>
                        Follow this account to see their garage and posts.
                    </Text>
                </View>
            )}

            {/* Garage Section */}
            {canSeeContent && userVehicles.length > 0 && (
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
            {canSeeContent && (
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
            )}
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
                        onImagePress={() => {
                            const mediaOnlyPosts = userPosts.filter(p => p.media && p.media.length > 0);
                            navigation.navigate('PostDetail', { initialPost: item, allPosts: mediaOnlyPosts });
                        }}
                        isSaved={wishlist.includes(String(item.id))}
                        onToggleSave={() => togglePostSave(item.id)}
                        onShowLikers={handleShowLikers}
                    />
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={styles.gridItem}
                onPress={() => {
                    const mediaOnlyPosts = userPosts.filter(p => p.media && p.media.length > 0);
                    navigation.navigate('PostDetail', { initialPost: item, allPosts: mediaOnlyPosts });
                }}
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
                data={canSeeContent ? (viewMode === 'grid' ? userPosts.filter(p => p.media && p.media.length > 0) : userPosts) : []}
                renderItem={renderPostItem}
                keyExtractor={item => String(item.id)}
                ListHeaderComponent={renderHeader}
                numColumns={viewMode === 'grid' ? 3 : 1}
                key={viewMode} // Trigger re-render on mode change
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'flex-start' } : undefined}
                ListEmptyComponent={() => canSeeContent ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="images-outline" size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>No posts yet</Text>
                    </View>
                ) : null}
            />

            <LikersBottomSheet
                visible={likersSheetVisible}
                onClose={() => setLikersSheetVisible(false)}
                postId={selectedPostIdForLikers}
                onUserPress={handleLikerUserPress}
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
    profileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
        justifyContent: 'space-between',
    },
    avatarContainer: {
        width: 86,
        height: 86,
        borderRadius: 43,
        padding: 3,
        backgroundColor: COLORS.white,
        ...SHADOWS.medium,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginLeft: 20,
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
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    bioSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    handle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 1,
    },
    bioText: {
        fontSize: 14,
        color: COLORS.white,
        marginTop: 6,
        lineHeight: 18,
    },
    actionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        height: 36,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    followBtn: {
        backgroundColor: COLORS.white,
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    messageBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    suggestionToggleBtn: {
        width: 36,
        flex: 0,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    suggestionToggleActive: {
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    followBtnText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    followingBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 14,
    },
    messageBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 14,
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
    // Private Account Styles
    privateAccountContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 30,
        backgroundColor: COLORS.white,
        marginTop: 15,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        minHeight: 500,
    },
    privateIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...SHADOWS.light,
    },
    privateTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    privateSubtitle: {
        fontSize: 15,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500',
        paddingHorizontal: 20,
    },
});
