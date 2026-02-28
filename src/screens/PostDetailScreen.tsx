import React, { useState, useRef, memo, useMemo, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Share,
    Alert,
    Platform,
    StatusBar,
    useWindowDimensions,
    TouchableWithoutFeedback,
    ToastAndroid,
    PanResponder,
    Animated,
    Linking,
} from 'react-native';
import apiClient from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { CommunityPost } from '../types/Community';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Modal, TextInput, ScrollView, KeyboardAvoidingView, Keyboard } from 'react-native';
import LikersBottomSheet from '../components/LikersBottomSheet';
import CommentBottomSheet from '../components/CommentBottomSheet';

type PostDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PostDetail'>;

interface PostDetailScreenProps {
    navigation: PostDetailScreenNavigationProp;
    route: any;
}

const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const DetailVideoItem = ({ source, isActive, screenWidth, screenHeight, isMuted, isPaused, togglePause, toggleMute }: any) => {
    const player = useVideoPlayer(source, (player) => {
        player.loop = true;
        player.muted = isMuted;
        if (isActive && !isPaused) {
            player.play();
        }
    });

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    useEffect(() => {
        player.muted = isMuted;
    }, [isMuted, player]);

    useEffect(() => {
        if (isActive && !isPaused && !isSeeking) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, isPaused, isSeeking, player]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isSeeking) {
                setCurrentTime(player.currentTime);
                setDuration(player.duration);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [player, isSeeking]);

    const progress = duration > 0 ? currentTime / duration : 0;

    const handleSeek = (event: any) => {
        const touchX = event.nativeEvent.pageX;
        const seekProgress = Math.max(0, Math.min(1, touchX / screenWidth));
        const seekTime = seekProgress * duration;
        setCurrentTime(seekTime);
        player.seekBy(seekTime - player.currentTime);
    };

    return (
        <View style={{ width: screenWidth, height: screenHeight, justifyContent: 'center' }}>
            <TouchableWithoutFeedback onPress={togglePause}>
                <View style={{ width: screenWidth, height: screenHeight }}>
                    <VideoView
                        player={player}
                        style={[styles.postImage, { width: screenWidth, height: screenHeight }]}
                        contentFit="contain"
                    />
                    {!isSeeking && isPaused && (
                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                            <View style={styles.playIconContainer}>
                                <Ionicons name="play" size={50} color="rgba(255,255,255,0.8)" />
                            </View>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.muteBtnOverlay}
                        onPress={toggleMute}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isMuted ? "volume-mute" : "volume-high"}
                            size={18}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>

            {isActive && (
                <View
                    style={styles.progressBarWrapper}
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={(e) => {
                        setIsSeeking(true);
                        handleSeek(e);
                    }}
                    onResponderMove={handleSeek}
                    onResponderRelease={() => setIsSeeking(false)}
                    onResponderTerminate={() => setIsSeeking(false)}
                >
                    <View style={[styles.progressBarContainer, isSeeking && styles.progressBarContainerActive]}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                        <View
                            style={[
                                styles.scrubberHandle,
                                { left: `${progress * 100}%` },
                                isSeeking && styles.scrubberHandleActive
                            ]}
                        />
                    </View>
                    <View style={styles.durationLabels}>
                        <Text style={styles.durationText}>{formatTime(currentTime * 1000)}</Text>
                        <Text style={styles.durationText}>{formatTime(duration * 1000)}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const PostItem = ({
    item,
    isActive,
    isScrolling,
    commentSheetVisible,
    wishlist,
    toggleWishlist,
    togglePostSave,
    handleLike,
    handleShare,
    handleDelete,
    user,
    setCommentSheetVisible,
    screenHeight,
    screenWidth,
    postIndex,
    totalPosts,
    onUserPress,
    onShowLikers,
    onEdit,
    onDelete,
    insets
}: {
    item: CommunityPost;
    isActive: boolean;
    isScrolling: boolean;
    commentSheetVisible: boolean;
    wishlist: string[];
    toggleWishlist: (id: string) => void;
    togglePostSave: (id: string | number) => void;
    handleLike: (postId: string | number) => void;
    handleShare: (post: CommunityPost) => void;
    handleDelete: (postId: string | number) => void;
    onUserPress: (userId: string | number, userName: string) => void;
    onShowLikers?: (postId: string | number) => void;
    onEdit?: (postId: string | number) => void;
    onDelete?: (postId: string | number) => void;
    user: any;
    setCommentSheetVisible: (visible: boolean) => void;
    screenHeight: number;
    screenWidth: number;
    postIndex: number;
    totalPosts: number;
    insets: any;
}) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [mountDelayed, setMountDelayed] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackStatus, setPlaybackStatus] = useState<any>(null);
    const [isSeeking, setIsSeeking] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [numLines, setNumLines] = useState(0);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const isMounted = useRef(true);
    // Remove individual video state as it's now handled by the DetailVideoItem
    const mountTimer = useRef<any>(null);

    // NUCLEAR STABILITY: Use a "Cool-Down" delay.
    // If we land on a post, wait 600ms before loading the video.
    // If we scroll away before 600ms, the video is NEVER loaded.
    useEffect(() => {
        if (isActive && !isScrolling) {
            mountTimer.current = setTimeout(() => {
                if (isMounted.current) {
                    setMountDelayed(true);
                }
            }, 600);
        } else {
            if (mountTimer.current) clearTimeout(mountTimer.current);
            setMountDelayed(false);
            setIsPaused(false); // Reset pause on scroll
            setIsSeeking(false);
        }
    }, [isActive, isScrolling]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (mountTimer.current) clearTimeout(mountTimer.current);
        };
    }, []);

    const togglePause = () => {
        setIsPaused(!isPaused);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const toggleMute = (e: any) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        Haptics.selectionAsync();
    };

    const renderContentWithLinks = (text: string) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <Text
                        key={index}
                        style={{ color: '#3B82F6', textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL(part)}
                    >
                        {part}
                    </Text>
                );
            }
            return part;
        });
    };

    const isLiked = item.likedByUser || false;
    const isOwnPost = user?.id?.toString() === item.userId?.toString();
    const isSaved = item.isSaved || (wishlist || []).map(String).includes(String(item.id));

    const renderMediaItem = ({ item: mediaItem, index: mIndex }: any) => {
        const isSelectedMedia = mIndex === currentMediaIndex;
        const isMediaActive = isActive && isSelectedMedia;

        if (mediaItem.type === 'video') {
            if (!mountDelayed || !isActive) {
                return (
                    <View style={{ width: screenWidth, height: screenHeight, backgroundColor: '#000' }}>
                        <Image
                            source={{ uri: mediaItem.mediaUrl || mediaItem.uri }}
                            style={[styles.postImage, { width: screenWidth, height: screenHeight }]}
                            resizeMode="contain"
                        />
                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.4)" />
                        </View>
                    </View>
                );
            }

            return (
                <DetailVideoItem
                    source={mediaItem.mediaUrl || mediaItem.uri}
                    isActive={isMediaActive && !commentSheetVisible}
                    screenWidth={screenWidth}
                    screenHeight={screenHeight}
                    isMuted={isMuted}
                    isPaused={isPaused}
                    togglePause={togglePause}
                    toggleMute={toggleMute}
                />
            );
        }

        return (
            <Image
                source={{ uri: mediaItem.mediaUrl || mediaItem.uri }}
                style={[styles.postImage, { width: screenWidth, height: screenHeight }]}
                resizeMode="contain"
            />
        );
    };

    return (
        <View style={[styles.postContainer, { width: screenWidth, height: screenHeight }]}>
            {/* Top Shroud for Header area */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.5)', 'transparent']}
                style={styles.topShroud}
                pointerEvents="none"
            />

            {/* User Info (Overlay at top, but below global header) - DELETED FOR REELS UI */}

            {/* Media Content */}
            <View style={styles.mediaContentWrapper}>
                {item.media && item.media.length > 0 && (
                    <View style={styles.horizontalMediaContainer}>
                        {item.media.length > 1 ? (
                            <FlatList
                                data={item.media}
                                renderItem={renderMediaItem}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                nestedScrollEnabled={false}
                                onMomentumScrollEnd={(e) => {
                                    const mIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                                    setCurrentMediaIndex(mIndex);
                                }}
                                keyExtractor={(_, idx) => `media-${idx}`}
                            />
                        ) : (
                            renderMediaItem({ item: item.media[0], index: 0 })
                        )}
                        {item.media.length > 1 && (
                            <View style={styles.pagination}>
                                {item.media.map((_, idx) => (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.paginationDot,
                                            currentMediaIndex === idx && styles.paginationDotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Bottom Shroud for User Info */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bottomShroud}
                pointerEvents="none"
            />

            {/* Persistent Details Overlay Area (Transparent) */}
            {/* Reels Overlay Components */}
            <View style={styles.reelsOverlay} pointerEvents="box-none">
                {/* Left Side: User Info, Music, Caption */}
                <View style={[styles.reelsInfoContainer, { paddingBottom: insets.bottom + (Platform.OS === 'android' ? 50 : 40) }]}>
                    <View style={styles.reelsUserAndMusic}>
                        <TouchableOpacity
                            style={styles.reelsUserRow}
                            onPress={() => onUserPress(item.userId, item.userName)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.reelsAvatarContainer}>
                                {item.userAvatar ? (
                                    <Image source={{ uri: item.userAvatar }} style={styles.reelsAvatar} />
                                ) : (
                                    <View style={[styles.reelsAvatar, styles.avatarPlaceholder]}>
                                        <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
                                    </View>
                                )}
                            </View>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.reelsUserName}>{item.userName}</Text>
                                    <Ionicons name="checkmark-circle" size={14} color="#3B82F6" style={{ marginLeft: 4 }} />
                                </View>
                                {item.location && (
                                    <View style={[styles.reelsLocationContainer, { marginTop: 2 }]}>
                                        <Ionicons name="location" size={10} color="#fff" />
                                        <Text style={[styles.reelsLocationText, { fontSize: 10 }]}>{item.location}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* <View style={styles.musicRow}>
                            <Ionicons name="musical-notes" size={12} color="#fff" />
                            <Text style={[styles.musicText, { fontSize: 12 }]}>{item.userName} • Original Audio</Text>
                        </View> */}
                    </View>
                </View>

                {/* Persistent Bottom Comment Bar */}
                <View style={[styles.persistentBottomBar, { bottom: insets.bottom + (Platform.OS === 'android' ? 25 : 15) }]}>
                    <TouchableOpacity
                        style={styles.persistentInputContainer}
                        onPress={() => setCommentSheetVisible(true)}
                    >
                        <Text style={styles.persistentInputText}>Add comment...</Text>
                    </TouchableOpacity>
                </View>

                {/* Right Side: Actions Bar */}
                <View style={[styles.reelsActions, { bottom: insets.bottom + (Platform.OS === 'android' ? 85 : 75) }]}>
                    <View style={styles.reelsActionBtn}>
                        <TouchableOpacity onPress={() => handleLike(item.id)}>
                            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={36} color={isLiked ? "#EF4444" : "#fff"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onShowLikers?.(item.id)}>
                            <Text style={styles.reelsActionText}>{item.likes || 0}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.reelsActionBtn} onPress={() => setCommentSheetVisible(true)}>
                        <Ionicons name="chatbubble-outline" size={32} color="#fff" />
                        <Text style={styles.reelsActionText}>{item.commentCount || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reelsActionBtn} onPress={() => handleShare(item)}>
                        <Ionicons name="paper-plane-outline" size={32} color="#fff" />
                        <Text style={styles.reelsActionText}>{item.sharesCount || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reelsActionBtn} onPress={() => togglePostSave(item.id)}>
                        <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={32}
                            color={isSaved ? "#3B82F6" : "#fff"}
                        />
                        <Text style={styles.reelsActionText}>{item.savesCount || 0}</Text>
                    </TouchableOpacity>

                    {isOwnPost && (
                        <TouchableOpacity style={styles.reelsActionBtn} onPress={() => setIsMenuVisible(!isMenuVisible)}>
                            <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {isMenuVisible && (
                        <>
                            <TouchableOpacity
                                style={styles.menuBackdrop}
                                onPress={() => setIsMenuVisible(false)}
                                activeOpacity={1}
                            />
                            <View style={styles.reelsPopupMenu}>
                                {user && String(item.userId) === String(user.id) && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.popupMenuItem}
                                            onPress={() => {
                                                setIsMenuVisible(false);
                                                onEdit?.(item.id);
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={20} color={COLORS.text} />
                                            <Text style={styles.popupMenuText}>Edit Post</Text>
                                        </TouchableOpacity>
                                        <View style={styles.popupMenuDivider} />
                                        <TouchableOpacity
                                            style={styles.popupMenuItem}
                                            onPress={() => {
                                                setIsMenuVisible(false);
                                                onDelete?.(item.id);
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                                            <Text style={[styles.popupMenuText, { color: COLORS.danger }]}>Delete Post</Text>
                                        </TouchableOpacity>
                                        <View style={styles.popupMenuDivider} />
                                    </>
                                )}
                                <TouchableOpacity
                                    style={styles.popupMenuItem}
                                    onPress={() => {
                                        setIsMenuVisible(false);
                                        handleShare(item);
                                    }}
                                >
                                    <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
                                    <Text style={styles.popupMenuText}>Share Post</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                </View>
            </View>

        </View >
    );
};

export default function PostDetailScreen({ navigation, route }: PostDetailScreenProps) {
    const { initialPost, allPosts: navPosts } = route.params || {};
    const { width: screenWidth } = useWindowDimensions();
    const screenHeight = Dimensions.get('screen').height;
    const { user } = useAuth();
    const { wishlist, fetchWishlist } = useApp();
    const insets = useSafeAreaInsets();

    // Internal state for posts to allow updates within this screen
    const [localPosts, setLocalPosts] = useState<CommunityPost[]>(navPosts || [initialPost]);
    const [currentPostComments, setCurrentPostComments] = useState<any[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentSheetVisible, setCommentSheetVisible] = useState(false);
    const [likersSheetVisible, setLikersSheetVisible] = useState(false);
    const [likersPostId, setLikersPostId] = useState<string | number | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editTags, setEditTags] = useState('');
    const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

    const handleShowLikers = (postId: string | number) => {
        setLikersPostId(postId);
        setLikersSheetVisible(true);
    };

    const handleEditPost = (postId: string | number) => {
        const post = localPosts.find(p => p.id === postId);
        if (post) {
            setEditContent(post.content);
            setEditLocation(post.location || '');
            setEditTags(Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''));
            setEditingPost(post);
            setEditModalVisible(true);
        }
    };

    const handleSaveEdit = async () => {
        if (editingPost && editContent.trim()) {
            try {
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

                await apiClient.put(`/post/${editingPost.id}`, payload);

                // Update local state
                setLocalPosts(prev => prev.map(p => {
                    if (p.id === editingPost.id) {
                        return {
                            ...p,
                            content: editContent.trim(),
                            location: editLocation.trim(),
                            tags: editTags.trim().split(',').filter(Boolean)
                        };
                    }
                    return p;
                }));

                setEditModalVisible(false);
                setEditingPost(null);
                setEditContent('');
                setEditLocation('');
                setEditTags('');

                AndroidToast('Post updated successfully');
            } catch (error) {
                Alert.alert('Error', 'Unable to update post');
            }
        }
    };

    const AndroidToast = (message: string, type: 'success' | 'error' = 'success') => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert(type === 'error' ? 'Error' : 'Success', message);
        }
    };

    const togglePostLike = async (postId: string | number) => {
        if (!user) return;
        const postToToggle = localPosts.find(p => p.id === postId);
        if (!postToToggle) return;
        const willBeLiked = !postToToggle.likedByUser;

        setLocalPosts((prev) => prev.map(post => {
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

        // Immediate UI update
        setLocalPosts(prev => prev.map(post => {
            if (post.id === postId) {
                const nowSaved = !post.isSaved;
                return {
                    ...post,
                    isSaved: nowSaved,
                    savesCount: nowSaved ? (post.savesCount + 1) : Math.max(0, post.savesCount - 1)
                };
            }
            return post;
        }));

        try {
            await apiClient.post(`/post/${postId}/save?userId=${user.id}`);
            await fetchWishlist();
        } catch (error) {
            console.error('Error toggling post save:', error);
            // Revert on error
            await fetchWishlist();
        }
    };

    const deletePost = async (postId: string | number) => {
        try {
            await apiClient.delete(`/post/${postId}`);
            setLocalPosts(prev => prev.filter(p => p.id !== postId));
            AndroidToast('Post deleted successfully!');
        } catch (error) {
            console.error('Error deleting post:', error);
            AndroidToast('Failed to delete post', 'error');
        }
    };

    const addCommentToPost = async (postId: string | number, commentText: string) => {
        if (!user) return;
        try {
            const response = await apiClient.post(`/post/${postId}/comment?userId=${user.id}`, commentText, {
                headers: { 'Content-Type': 'text/plain' }
            });
            const newCommentData = response.data;

            setLocalPosts(prev => prev.map(p => {
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
    const recordPostView = async (postId: string | number) => {
        const uId = user?.id || 0;
        console.log(`Recording view for post ${postId}, userId: ${uId}`);
        try {
            await apiClient.post(`/post/${postId}/view?userId=${uId}`);
        } catch (error: any) {
            console.error('Error recording view:', error?.response?.data || error.message);
        }
    };

    const headerHeight = Platform.OS === 'ios' ? 60 : 60;
    const adjustedHeight = screenHeight;

    // STABILIZE the data: Use localPosts which is initialized from nav params
    const stablePosts = useMemo(() => {
        return localPosts;
    }, [localPosts]);

    const [currentIndex, setCurrentIndex] = useState(() => {
        const index = stablePosts.findIndex(p => p.id === initialPost?.id);
        return index !== -1 ? index : 0;
    });

    useEffect(() => {
        const currentPost = stablePosts[currentIndex];
        if (currentPost) {
            recordPostView(currentPost.id);
            if (commentSheetVisible) {
                fetchComments(currentPost.id);
            }
        }
    }, [currentIndex]);

    useEffect(() => {
        const currentPost = stablePosts[currentIndex];
        if (commentSheetVisible && currentPost) {
            fetchComments(currentPost.id);
        }
    }, [commentSheetVisible]);

    const fetchComments = async (postId: string | number) => {
        setIsCommentsLoading(true);
        try {
            const response = await apiClient.get(`/post/${postId}/comments`);
            setCurrentPostComments(response.data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setCurrentPostComments([]);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const [isScrolling, setIsScrolling] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleLike = (postId: string | number) => togglePostLike(postId);
    const handleDelete = (postId: string | number) => {
        Alert.alert('Delete Post', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { deletePost(postId); if (stablePosts.length === 1) navigation.goBack(); } },
        ]);
    };

    const handleShare = async (post: CommunityPost) => {
        try {
            const appUrl = `https://cartrack.app/post/${post.id}`;
            const result = await Share.share({
                message: appUrl,
                url: appUrl,
            });

            if (result.action === Share.sharedAction) {
                // Record share in backend
                await apiClient.post(`/post/${post.id}/share?userId=${user?.id || 0}`);

                // Update local state
                setLocalPosts(prev => prev.map(p => {
                    if (p.id === post.id) {
                        return {
                            ...p,
                            sharesCount: (p.sharesCount || 0) + 1
                        };
                    }
                    return p;
                }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleClose = () => navigation.goBack();
    const handleUserPress = (userId: string | number, userName: string) => {
        if (userId.toString() === user?.id?.toString()) {
            navigation.navigate('MainTabs', { screen: 'Profile' });
        } else {
            navigation.navigate('OtherUserProfile', { userId: userId.toString(), userName });
        }
    };

    // Swipe-down to close
    const swipeTranslateY = useRef(new Animated.Value(0)).current;
    const swipePanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) swipeTranslateY.setValue(gs.dy);
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 100) {
                    Animated.timing(swipeTranslateY, { toValue: Dimensions.get('screen').height, duration: 200, useNativeDriver: true }).start(() => navigation.goBack());
                } else {
                    Animated.spring(swipeTranslateY, { toValue: 0, useNativeDriver: true }).start();
                }
            },
        })
    ).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const renderItem = ({ item, index }: { item: CommunityPost, index: number }) => {
        return (
            <PostItem
                item={item}
                isActive={index === currentIndex}
                isScrolling={isScrolling}
                commentSheetVisible={commentSheetVisible}
                wishlist={wishlist}
                togglePostSave={togglePostSave}
                toggleWishlist={() => { }} // Not used in Reels UI anymore or handled differently
                handleLike={handleLike}
                handleShare={handleShare}
                handleDelete={handleDelete}
                user={user}
                setCommentSheetVisible={setCommentSheetVisible}
                screenHeight={adjustedHeight}
                screenWidth={screenWidth}
                postIndex={index}
                totalPosts={stablePosts.length}
                onUserPress={handleUserPress}
                onShowLikers={handleShowLikers}
                onEdit={handleEditPost}
                onDelete={deletePost}
                insets={insets}
            />
        );
    };

    const reactiveCurrentPost = stablePosts[currentIndex];

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: swipeTranslateY }] }]} {...swipePanResponder.panHandlers}>
            <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />
            <View style={[styles.header, { height: headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0) }]}>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <Ionicons name="chevron-back" size={30} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Reels</Text>
                </View>
                <View style={{ width: 44 }} /> {/* Spacer common pattern for centering */}
            </View>
            <FlatList
                ref={flatListRef}
                data={stablePosts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                style={{ height: screenHeight, width: screenWidth, flexGrow: 0 }}
                contentContainerStyle={{ flexGrow: 0 }}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                pagingEnabled={true}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 150 }}
                initialScrollIndex={(initialPost && stablePosts.findIndex(p => p.id === initialPost.id) !== -1)
                    ? stablePosts.findIndex(p => p.id === initialPost.id)
                    : 0}
                getItemLayout={(data, index) => ({ length: screenHeight, offset: screenHeight * index, index })}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToOffset({ offset: screenHeight * info.index, animated: false });
                    }, 100);
                }}
                onScrollBeginDrag={() => setIsScrolling(true)}
                onScrollEndDrag={(e) => {
                    if (Math.abs(e.nativeEvent.velocity?.y || 0) < 0.1) {
                        setIsScrolling(false);
                    }
                }}
                onMomentumScrollEnd={() => setIsScrolling(false)}
                removeClippedSubviews={true}
                maxToRenderPerBatch={1}
                windowSize={3} // Increase safety margin
                initialNumToRender={1}
                snapToInterval={screenHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                snapToOffsets={stablePosts.map((_, i) => i * screenHeight)}
                scrollsToTop={false}
                keyboardShouldPersistTaps="always"
            />

            {reactiveCurrentPost && (
                <>
                    <CommentBottomSheet
                        visible={commentSheetVisible}
                        onClose={() => setCommentSheetVisible(false)}
                        comments={currentPostComments}
                        isLoading={isCommentsLoading}
                        onAddComment={(text) => addCommentToPost(reactiveCurrentPost.id, text)}
                        allowComments={reactiveCurrentPost.allowComments ?? true}
                    />
                    <LikersBottomSheet
                        visible={likersSheetVisible}
                        onClose={() => setLikersSheetVisible(false)}
                        postId={likersPostId}
                    />

                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={editModalVisible}
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
                </>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    topShroud: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        zIndex: 50,
    },
    bottomShroud: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 280,
        zIndex: 50,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.4)', // Darker background to prevent screen overlap
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    postContainer: {
        backgroundColor: '#000',
    },
    postImage: {
    },
    noImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    detailsOverlay: {
        position: 'absolute',
        bottom: 40, // Elegant lift for caption above seeker
        left: 0,
        right: 0,
        paddingBottom: 4,
        zIndex: 60,
    },
    userInfo: {
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    userBasic: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    userHandle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: -1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    postIndexText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700',
        backgroundColor: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    captionContainer: {
        marginBottom: 8,
        maxHeight: 120,
        paddingHorizontal: 16,
    },
    caption: {
        fontSize: 14,
        color: '#fff',
        lineHeight: 19,
        fontWeight: '400',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    location: {
        fontSize: 10,
        color: '#fff',
        marginTop: 4,
        fontWeight: '600',
        opacity: 0.9,
    },
    actionText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    moreText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    actions: {
        position: 'absolute',
        right: 12,
        bottom: 70 + (Platform.OS === 'ios' ? 40 : 20),
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center',
        zIndex: 5,
    },
    actionButton: {
        width: 44,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    horizontalMediaContainer: {
        flex: 1,
        position: 'relative',
    },
    pagination: {
        position: 'absolute',
        bottom: 50 + (Platform.OS === 'ios' ? 40 : 20),
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
        zIndex: 10,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        // backgroundColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: COLORS.primary
    },
    paginationDotActive: {
        backgroundColor: '#fff',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    progressBarWrapper: {
        position: 'absolute',
        bottom: 40, // Highly visible above system bars
        left: 0,
        right: 0,
        height: 10,
        justifyContent: 'flex-end',
        zIndex: 110,
    },
    progressBarContainer: {
        width: '100%',
        height: 5, // Thick and clearly visible
        backgroundColor: 'rgba(255,255,255,0.3)', // Visible total bar duration
        position: 'relative',
    },
    progressBarContainerActive: {
        height: 6, // Even thicker when scrubbing
        // backgroundColor: 'rgba(255,255,255,0.4)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary, // App theme color for maximum visibility
    },
    scrubberHandle: {
        position: 'absolute',
        top: -2.5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: -5,
        zIndex: 120,
        opacity: 0.9,
    },
    scrubberHandleActive: {
        width: 14,
        height: 14,
        borderRadius: 7,
        top: -4.5,
        marginLeft: -7,
        backgroundColor: '#fff',
    },
    headerRightBtn: {
        width: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    reelsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    reelsInfoContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    reelsUserAndMusic: {
        marginBottom: 10,
    },
    captionArea: {
        maxHeight: 220,
    },
    reelsUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    reelsAvatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700', // Yellow/Gold border like image
        padding: 2,
        marginRight: 10,
    },
    reelsAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    reelsUserName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    followBtn: {
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    followBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    musicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    musicText: {
        color: '#fff',
        fontSize: 13,
        opacity: 0.9,
    },
    reelsCaption: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 20,
        width: '85%',
        marginBottom: 10,
    },
    reelsDescription: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    reelsLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    reelsLocationText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    reelsTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        gap: 6,
    },
    reelsTagText: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 2,
    },
    reelsActions: {
        position: 'absolute',
        right: 12,
        bottom: Platform.OS === 'android' ? 80 : 100, // Balanced for mobile devices
        alignItems: 'center',
        gap: 22,
        zIndex: 110,
    },
    reelsActionBtn: {
        alignItems: 'center',
    },
    reelsActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    mediaContentWrapper: {
        flex: 1,
        backgroundColor: '#000',
    },
    persistentBottomBar: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 16,
        right: 80,
        zIndex: 120,
    },
    persistentInputContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    persistentInputText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    userInfoTop: {
        display: 'none',
    },
    bottomActions: {
        display: 'none',
    },
    playIconContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 50,
        padding: 20
    },
    muteBtnOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    durationLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 4,
    },
    durationText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    menuWrapper: {
        position: 'relative',
        zIndex: 10,
    },
    menuBackdrop: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        zIndex: 9,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    editModalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
        ...SHADOWS.medium,
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    editInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: COLORS.text,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    simpleInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 16,
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
    saveIconContainerDetail: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    reelsPopupMenu: {
        position: 'absolute',
        bottom: 70,
        right: 20,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 4,
        minWidth: 140,
        ...SHADOWS.medium,
        zIndex: 100,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    popupMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderRadius: 8,
    },
    popupMenuDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 8,
    },
    popupMenuText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
});
