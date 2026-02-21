import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Share,
    Modal,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback,
    Image,
    ToastAndroid,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/apiClient';

// Keyboard avoiding behavior
const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import CommunityPostCard from '../components/CommunityPostCard';
import CommentBottomSheet from '../components/CommentBottomSheet';
import StoryList from '../components/StoryList';
import { CommunityPost } from '../types/Community';
import { Story, StoryGroup } from '../types/Story';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

type CommunityScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface CommunityScreenProps {
    navigation: CommunityScreenNavigationProp;
}

export default function CommunityScreen({ navigation }: CommunityScreenProps) {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('Feed');
    const { wishlist, fetchWishlist } = useApp();

    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [postComments, setPostComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [activePostId, setActivePostId] = useState<string | number | null>(null);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActivePostId(viewableItems[0].item.id);
        }
    }).current;

    const AndroidToast = (message: string, type: 'success' | 'error' = 'success') => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert(type === 'error' ? 'Error' : 'Success', message);
        }
    };

    // Fetch community posts
    const fetchCommunityPosts = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/post${user ? `?viewerId=${user.id}` : ''}`);
            console.log('Community posts response:', response.data ? response.data.length : 'no data');
            const data = response.data || [];

            if (!Array.isArray(data)) {
                console.error('API response data is not an array:', data);
                setCommunityPosts([]);
                return;
            }

            const mappedPosts: CommunityPost[] = data.map((dto: any) => {
                if (!dto) return null;
                const post = dto.post || dto;
                if (!post || typeof post !== 'object' || !post.id) {
                    console.warn('Invalid post data in DTO:', dto);
                    return null;
                }
                return {
                    id: post.id,
                    userId: post.userId || post.user?.id,
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
                    vehicleId: post.vehicleId,
                    tags: post.tags
                };
            }).filter((p: any) => p !== null);

            setCommunityPosts(mappedPosts);
        } catch (error) {
            console.error('Error fetching community posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch active stories
    const fetchStories = async () => {
        try {
            const url = user ? `/story/active?userId=${user.id}` : '/story/active';
            const response = await apiClient.get(url);
            const data = response.data || [];

            const mappedStories: Story[] = await Promise.all(
                data.map(async (story: any) => {
                    let hasLiked = story.isLikedByCurrentUser || false;
                    let isFetched = false;

                    // Fallback to checking the likers list directly if the user is logged in
                    if (!hasLiked && user) {
                        try {
                            const likersResponse = await apiClient.get(`/story/${story.id}/likers`);
                            const likersList = likersResponse.data || [];
                            hasLiked = likersList.some((liker: any) => String(liker.id) === String(user.id));
                            isFetched = true;
                        } catch (e) {
                            console.error(`Failed to fetch likers for story ${story.id}`);
                        }
                    }

                    return {
                        id: story.id.toString(),
                        userId: story.userId.toString(),
                        userName: story.user?.username || `User ${story.userId}`,
                        userAvatar: story.user?.profilePicUrl,
                        mediaUri: story.mediaUrl,
                        mediaType: story.mediaType?.toLowerCase() || 'image',
                        caption: story.caption,
                        captionPosition: story.captionMetadata?.captionPosition,
                        captionStyle: story.captionMetadata?.captionStyle,
                        timestamp: new Date(story.createdAt).getTime(),
                        expiresAt: new Date(story.expiresAt).getTime(),
                        likesCount: story.likesCount || 0,
                        viewsCount: story.viewsCount || 0,
                        isLiked: hasLiked,
                        isLikedFetched: isFetched,
                        viewed: false
                    };
                })
            );

            setStories(mappedStories);
        } catch (error) {
            console.error('Error fetching stories:', error);
        }
    };

    const togglePostLike = async (postId: string | number) => {
        if (!user) return;
        const postToToggle = communityPosts.find(p => p.id === postId);
        if (!postToToggle) return;
        const willBeLiked = !postToToggle.likedByUser;

        setCommunityPosts((prev) => prev.map(post => {
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
            AndroidToast(willBeLiked ? 'Post Liked' : 'Like removed');
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const togglePostSave = async (postId: string | number) => {
        if (!user) return;
        const postToToggle = communityPosts.find(p => p.id === postId);
        if (!postToToggle) return;
        const willBeSaved = !postToToggle.isSaved;

        setCommunityPosts((prev) => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    isSaved: willBeSaved
                };
            }
            return post;
        }));

        try {
            await apiClient.post(`/post/${postId}/save?userId=${user.id}`);
            AndroidToast(willBeSaved ? 'Post saved to profile' : 'Post removed from saved');
        } catch (error) {
            console.error('Error toggling post save:', error);
            // Rollback
            setCommunityPosts((prev) => prev.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        isSaved: !willBeSaved
                    };
                }
                return post;
            }));
        }
    };

    const fetchComments = async (postId: string | number) => {
        setIsCommentsLoading(true);
        try {
            const response = await apiClient.get(`/post/${postId}/comments`);
            setPostComments(response.data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setPostComments([]);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const addCommentToPost = async (postId: string | number, commentText: string) => {
        if (!user) return;
        try {
            const response = await apiClient.post(`/post/${postId}/comment?userId=${user.id}`, commentText, {
                headers: { 'Content-Type': 'text/plain' }
            });
            const newCommentData = response.data;

            setCommunityPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    const newComment = {
                        id: newCommentData.id,
                        userId: Number(user.id),
                        userName: user.username || user.name || 'You',
                        content: commentText,
                        timestamp: new Date().toISOString(),
                        likes: 0
                    };
                    return {
                        ...p,
                        comments: [...p.comments, newComment],
                        commentCount: p.commentCount + 1
                    };
                }
                return p;
            }));
            await fetchComments(postId);
            AndroidToast('Comment added successfully!');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const deletePost = async (postId: string | number) => {
        const originalPosts = [...communityPosts];
        setCommunityPosts((prev) => prev.filter(post => post.id !== postId));

        try {
            await apiClient.delete(`/post/${postId}`);
            AndroidToast('Post deleted successfully!');
        } catch (error) {
            console.error('Error deleting post:', error);
            setCommunityPosts(originalPosts);
            AndroidToast('Failed to delete post', 'error');
        }
    };

    const editPost = async (postId: string | number, updates: any) => {
        try {
            await apiClient.put(`/post/${postId}`, updates);
            setCommunityPosts((prev) => prev.map(post => {
                if (post.id === postId) {
                    return { ...post, ...updates, tags: typeof updates.tags === 'string' ? updates.tags.split(',').filter(Boolean) : updates.tags };
                }
                return post;
            }));
            AndroidToast('Post updated successfully!');
        } catch (error) {
            console.error('Error editing post:', error);
            AndroidToast('Failed to update post', 'error');
        }
    };

    const getStoryGroups = (): StoryGroup[] => {
        const now = Date.now();
        const activeStories = stories.filter(story => story.expiresAt > now);

        const grouped = activeStories.reduce((acc, story) => {
            const userId = story.userId.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    userId: story.userId,
                    userName: story.userName,
                    userAvatar: story.userAvatar,
                    stories: [],
                    hasUnviewed: false,
                };
            }
            acc[userId].stories.push(story);
            if (!story.viewed) {
                acc[userId].hasUnviewed = true;
            }
            return acc;
        }, {} as Record<string, StoryGroup>);

        return Object.values(grouped);
    };
    const scrollRef = React.useRef<FlatList>(null);

    // Comment sheet state
    const [commentSheetVisible, setCommentSheetVisible] = useState(false);
    const [selectedPostForComment, setSelectedPostForComment] = useState<CommunityPost | null>(null);

    // Search state
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [unreadNotifications, setUnreadNotifications] = useState(3);

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editTags, setEditTags] = useState('');

    const categories = ['Feed', 'Trending', 'Following'];

    const allPosts = communityPosts;

    // Logical Filtering Definitions
    const TRENDING_THRESHOLD_LIKES = 150;
    const TRENDING_THRESHOLD_VIEWS = 1000;
    const TRENDING_THRESHOLD_COMMENTS = 10;

    // Filter posts based on selected category
    const filteredPosts = allPosts.filter(post => {
        if (selectedCategory === 'Feed') return true;

        if (selectedCategory === 'Trending') {
            // Trending = Official/Verified content OR High Engagement
            return (
                post.isVerified === true ||
                post.likes >= TRENDING_THRESHOLD_LIKES ||
                post.views >= TRENDING_THRESHOLD_VIEWS ||
                (post.comments?.length || 0) >= TRENDING_THRESHOLD_COMMENTS
            );
        }

        if (selectedCategory === 'Following') {
            // Following = Only from followed users OR your own posts
            const isFollowed = user?.following.includes(post.userId.toString());
            const isOwnPost = user && post.userId.toString() === user.id;
            // Also include posts specifically categorized as 'following' for mock data
            return isFollowed || isOwnPost || post.category === 'following';
        }

        return true;
    }).sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
    });

    // Scroll to top when category changes
    React.useEffect(() => {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [selectedCategory]);

    // Initial fetch and refresh on focus
    useFocusEffect(
        useCallback(() => {
            fetchCommunityPosts();
            fetchStories();
        }, [user?.id])
    );

    const handleLike = (postId: string | number) => {
        togglePostLike(postId);
    };

    const handleComment = (postId: string | number) => {
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            setSelectedPostForComment(post);
            setPostComments([]); // Clear previous comments
            fetchComments(postId);
            setCommentSheetVisible(true);
        }
    };

    const handleAddComment = (commentText: string) => {
        if (selectedPostForComment) {
            addCommentToPost(selectedPostForComment.id, commentText);
        }
    };

    const handleShare = async (postId: string | number) => {
        try {
            const result = await Share.share({
                message: `Check out this post on CarTrack Community! https://cartrack.app/post/${postId}`,
                url: `https://cartrack.app/post/${postId}`,
            });
        } catch (error) {
            Alert.alert('Error', 'Unable to share post');
        }
    };

    const handleEditPost = (postId: string | number) => {
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            setEditContent(post.content);
            setEditLocation(post.location || '');
            setEditTags(Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''));
            setEditingPost(post);
            setEditModalVisible(true);
        }
    };

    const handleSaveEdit = () => {
        if (editingPost && editContent.trim()) {
            const payload = {
                content: editContent.trim(),
                location: editLocation.trim(),
                feeling: editingPost.feeling || "",
                tags: editTags.trim(),
                allowComments: editingPost.allowComments ?? true,
                isPublic: editingPost.isPublic ?? true,
                userId: editingPost.userId,
                vehicleId: editingPost.vehicleId || 0,
                likedByUser: editingPost.likedByUser || false,
                isSaved: editingPost.isSaved || false
            };

            editPost(editingPost.id, payload);

            setEditModalVisible(false);
            setEditingPost(null);
            setEditContent('');
            setEditLocation('');
            setEditTags('');
        }
    };


    const handleDeletePost = (postId: string | number) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deletePost(postId);
                    },
                },
            ]
        );
    };

    const handleAddStory = () => {
        (navigation as any).navigate('AddStory');
    };

    const handleViewStory = (storyGroup: any) => {
        const allGroups = getStoryGroups();
        const startIndex = allGroups.findIndex(g => g.userId === storyGroup.userId);
        (navigation as any).navigate('StoryViewer', {
            storyGroup,
            allGroups,
            startIndex: startIndex >= 0 ? startIndex : 0,
            onUpdateStoryLike: (storyId: string | number, newIsLiked: boolean, newLikesCount: number) => {
                setStories(prev => prev.map(s => {
                    if (String(s.id) === String(storyId)) {
                        return { ...s, isLiked: newIsLiked, likesCount: newLikesCount };
                    }
                    return s;
                }));
            }
        });
    };

    const handlePostImagePress = (postId: string | number) => {
        const post = filteredPosts.find(p => p.id === postId);
        if (post) {
            (navigation as any).navigate('PostDetail', {
                initialPost: post,
                allPosts: filteredPosts,
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.headerTop, { alignItems: 'center' }]}>
                    {searchActive ? (
                        <View style={styles.headerSearchBar}>
                            <Ionicons name="search" size={20} color={COLORS.textLight} />
                            <TextInput
                                style={styles.headerSearchInput}
                                placeholder="Search community..."
                                placeholderTextColor={COLORS.textLight}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            <TouchableOpacity onPress={() => {
                                setSearchActive(false);
                                setSearchQuery('');
                            }}>
                                <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Ionicons name="car-sport" size={28} color={COLORS.white} />
                                <Text style={styles.headerTitle}>Community</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                <TouchableOpacity onPress={() => setSearchActive(true)}>
                                    <Ionicons name="search" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Messages' as any)}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => {
                                    navigation.navigate('CommunityNotifications' as any);
                                    setUnreadNotifications(0);
                                }}>
                                    <View>
                                        <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
                                        {unreadNotifications > 0 && (
                                            <View style={styles.notificationBadge}>
                                                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </LinearGradient>

            {/* Categories Chips */}
            <View style={styles.tabBar}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.tabItem,
                            selectedCategory === category && styles.tabItemActive,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                selectedCategory === category && styles.tabTextActive,
                            ]}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Posts List */}
            <FlatList
                ref={scrollRef as any}
                data={filteredPosts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <CommunityPostCard
                        post={item}
                        onLike={handleLike}
                        onComment={handleComment}
                        onShare={handleShare}
                        onEdit={user && String(item.userId) === String(user.id) ? handleEditPost : undefined}
                        onDelete={user && String(item.userId) === String(user.id) ? handleDeletePost : undefined}
                        onImagePress={handlePostImagePress}
                        isSaved={item.isSaved}
                        onToggleSave={() => togglePostSave(item.id)}
                        isActive={activePostId === item.id}
                    />
                )}
                ListHeaderComponent={() => (
                    <View>
                        {/* Story List */}
                        <StoryList
                            storyGroups={getStoryGroups()}
                            onAddStory={handleAddStory}
                            onViewStory={handleViewStory}
                        />
                        <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />

                        {selectedCategory === 'Following' && (
                            <View style={styles.followingHeader}>
                                <Text style={styles.sectionTitle}>People You Follow</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll}>
                                    {[
                                        { name: 'Rajesh', initial: 'R' },
                                        { name: 'Amit', initial: 'A' },
                                        { name: 'Hyundai', image: 'https://www.hyundai.com/content/dam/hyundai/ww/en/images/common/hyundai-logo.png' }
                                    ].map((person, idx) => (
                                        <View key={idx} style={styles.personCircle}>
                                            {person.image ? (
                                                <Image source={{ uri: person.image }} style={styles.avatarImageSmall} />
                                            ) : (
                                                <LinearGradient
                                                    colors={[COLORS.primary, COLORS.secondary]}
                                                    style={styles.avatarGradient}
                                                >
                                                    <Text style={styles.avatarInitial}>{person.initial}</Text>
                                                </LinearGradient>
                                            )}
                                            <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color={COLORS.textLight} />
                        <Text style={styles.emptyText}>No posts found in {selectedCategory}</Text>
                    </View>
                )}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={styles.postsList}
            />

            {/* Floating Create Post Button */}
            <TouchableOpacity
                style={styles.floatingBtn}
                activeOpacity={0.8}
                onPress={() => (navigation as any).navigate('CreatePost')}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.floatingGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={28} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>

            {/* Comment Bottom Sheet */}
            <CommentBottomSheet
                visible={commentSheetVisible}
                onClose={() => setCommentSheetVisible(false)}
                comments={postComments}
                isLoading={isCommentsLoading}
                onAddComment={handleAddComment}
            />

            {/* Edit Post Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.editModalContainer}>
                            <View style={styles.editHeader}>
                                <Text style={styles.editTitle}>Edit Post</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <TextInput
                                    style={styles.editInput}
                                    value={editContent}
                                    onChangeText={setEditContent}
                                    multiline
                                    placeholder="What's on your mind?"
                                    placeholderTextColor={COLORS.textLight}
                                />

                                <Text style={styles.inputLabel}>Location</Text>
                                <TextInput
                                    style={styles.simpleInput}
                                    value={editLocation}
                                    onChangeText={setEditLocation}
                                    placeholder="Add location"
                                    placeholderTextColor={COLORS.textLight}
                                />

                                <Text style={styles.inputLabel}>Tags (comma separated)</Text>
                                <TextInput
                                    style={styles.simpleInput}
                                    value={editTags}
                                    onChangeText={setEditTags}
                                    placeholder="car, travel, music"
                                    placeholderTextColor={COLORS.textLight}
                                />
                                <TouchableOpacity
                                    style={[styles.saveButton, !editContent.trim() && styles.saveButtonDisabled]}
                                    onPress={handleSaveEdit}
                                    disabled={!editContent.trim()}
                                >
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>


        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    headerSearchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
    },
    headerSearchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: COLORS.text,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 15,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tabItem: {
        flex: 1,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    tabItemActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    tabTextActive: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 16,
        marginTop: 10,
    },
    followingHeader: {
        marginBottom: 25,
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    peopleScroll: {
        flexDirection: 'row',
    },
    personCircle: {
        alignItems: 'center',
        marginRight: 20,
        width: 60,
    },
    avatarGradient: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    avatarImageSmall: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarInitial: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    personName: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '600',
    },
    postsList: {
        paddingTop: 10,
        paddingBottom: 100,
    },
    floatingBtn: {
        position: 'absolute',
        bottom: 25,
        right: 20,
        borderRadius: 30,
        ...SHADOWS.dark,
        elevation: 8,
    },
    floatingGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    editModalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxHeight: '70%',
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        color: COLORS.text,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    simpleInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 15,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Notification Badge
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    notificationBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Suggested Users
    suggestionsSection: {
        paddingVertical: 15,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    suggestionsList: {
        paddingHorizontal: 20,
        gap: 15,
    },
    suggestionCard: {
        width: 120,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...SHADOWS.light,
    },
    suggestionAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    suggestionName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 10,
    },
    followBtnSmall: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
    },
    followBtnTextSmall: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
