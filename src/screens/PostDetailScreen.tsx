import React, { useState, useRef, memo, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { COLORS } from '../constants/theme';
import { CommunityPost } from '../types/Community';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import CommentBottomSheet from '../components/CommentBottomSheet';

type PostDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PostDetail'>;

interface PostDetailScreenProps {
    navigation: PostDetailScreenNavigationProp;
    route: any;
}

const PostItem = ({
    item,
    isActive,
    isScrolling,
    commentSheetVisible,
    wishlist,
    toggleWishlist,
    handleLike,
    handleShare,
    handleDelete,
    user,
    setCommentSheetVisible,
    screenHeight,
    screenWidth,
    postIndex,
    totalPosts,
    onUserPress
}: any) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [mountDelayed, setMountDelayed] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [playbackStatus, setPlaybackStatus] = useState<any>(null);
    const [isSeeking, setIsSeeking] = useState(false);
    const isMounted = useRef(true);
    const videoRef = useRef<Video>(null);
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
            if (videoRef.current) {
                videoRef.current.unloadAsync().catch(() => { });
            }
        };
    }, []);

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    const handlePlaybackUpdate = (status: any) => {
        if (!isMounted.current || isSeeking) return;
        if (status.isLoaded) {
            setPlaybackStatus(status);
        }
    };

    const handleSeek = (event: any) => {
        if (!videoRef.current || !playbackStatus?.durationMillis) return;

        // Use pageX for global accuracy relative to screen width
        const touchX = event.nativeEvent.pageX;
        const seekProgress = Math.max(0, Math.min(1, touchX / screenWidth));
        const seekTime = seekProgress * playbackStatus.durationMillis;

        // Immediate visual update
        setPlaybackStatus({ ...playbackStatus, positionMillis: seekTime });
        videoRef.current.setPositionAsync(seekTime).catch(() => { });
    };

    const isLiked = item.likedByUser || false;
    const isOwnPost = user?.id === item.userId;
    const isSaved = wishlist && wishlist.includes(item.id);

    const renderMediaItem = ({ item: mediaItem, index: mIndex }: any) => {
        const isSelectedMedia = mIndex === currentMediaIndex;
        const isMediaActive = isActive && isSelectedMedia;

        if (mediaItem.type === 'video') {
            // ONLY MOUNT if cooldown has passed AND we are active
            if (!mountDelayed || !isActive) {
                return (
                    <View style={{ width: screenWidth, height: screenHeight, backgroundColor: '#000' }}>
                        {item.media && item.media[0] && (
                            <Image
                                source={{ uri: mediaItem.uri }}
                                style={[styles.postImage, { width: screenWidth, height: screenHeight, opacity: 0.5 }]}
                                resizeMode="cover"
                            />
                        )}
                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.4)" />
                        </View>
                    </View>
                );
            }

            const progress = (playbackStatus?.positionMillis || 0) / (playbackStatus?.durationMillis || 1);

            return (
                <View
                    style={{ width: screenWidth, height: screenHeight }}
                    collapsable={false} // CRITICAL: Stop Android from optimizing this view away (Fixes ViewState crash)
                >
                    <TouchableWithoutFeedback onPress={togglePause}>
                        <View style={{ width: screenWidth, height: screenHeight }}>
                            <Video
                                key={`video-${mediaItem.id || mediaItem.uri}`}
                                ref={videoRef}
                                source={{ uri: mediaItem.uri }}
                                style={[styles.postImage, { width: screenWidth, height: screenHeight }]}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={isMediaActive && !commentSheetVisible && !isPaused && !isSeeking}
                                isLooping={true}
                                isMuted={false}
                                shouldCorrectPitch={false}
                                useNativeControls={false}
                                progressUpdateIntervalMillis={500}
                                onPlaybackStatusUpdate={handlePlaybackUpdate}
                            />
                            {isPaused && !isSeeking && (
                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 40, padding: 15 }}>
                                        <Ionicons name="play" size={40} color="rgba(255,255,255,0.9)" />
                                    </View>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>

                    {/* Premium Instagram-Style Scrubber */}
                    {isMediaActive && (
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
                                {/* Scrubber Handle (Dot) - Always visible when seeking, otherwise subtle line end */}
                                <View
                                    style={[
                                        styles.scrubberHandle,
                                        { left: `${progress * 100}%` },
                                        isSeeking && styles.scrubberHandleActive
                                    ]}
                                />
                            </View>
                        </View>
                    )}
                </View>
            );
        }

        return (
            <Image
                source={{ uri: mediaItem.uri }}
                style={[styles.postImage, { width: screenWidth, height: screenHeight }]}
                resizeMode={mediaItem.resizeMode || 'cover'}
            />
        );
    };

    return (
        <View style={[styles.postContainer, { width: screenWidth, height: screenHeight }]}>
            {/* Top Shroud for Header area */}
            <LinearGradient
                colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.5)', 'transparent']}
                style={styles.topShroud}
                pointerEvents="none"
            />

            {item.media && item.media.length > 0 && (
                <View style={[styles.horizontalMediaContainer, { height: screenHeight }]}>
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

            {/* Bottom Shroud for User Info */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bottomShroud}
                pointerEvents="none"
            />

            {/* Persistent Details Overlay Area (Transparent) */}
            <View style={styles.detailsOverlay} pointerEvents="box-none">
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => onUserPress(item.userId, item.userName)}
                    activeOpacity={0.7}
                >
                    <View style={styles.userHeader}>
                        <View style={styles.userBasic}>
                            {item.userAvatar ? (
                                <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
                            ) : (
                                <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
                                </View>
                            )}
                            <View>
                                <View style={styles.nameRow}>
                                    <Text style={styles.userName}>{item.userName}</Text>
                                    {totalPosts > 1 && (
                                        <Text style={styles.postIndexText}>{postIndex + 1}/{totalPosts}</Text>
                                    )}
                                </View>
                                <Text style={styles.userHandle}>@{item.userName.toLowerCase().replace(/\s+/g, '_')}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.captionContainer}>
                    {item.content && <Text style={styles.caption} numberOfLines={3}>{item.content}</Text>}
                    {item.location && (
                        <Text style={styles.location}>
                            <Ionicons name="location" size={12} color="#fff" /> {item.location}
                        </Text>
                    )}
                </View>
            </View>

            {/* Floating Action Buttons (Instagram Reels Style) */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
                    <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={30} color={isLiked ? "#EF4444" : "#fff"} />
                    <Text style={styles.actionText}>{item.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => setCommentSheetVisible(true)}>
                    <Ionicons name="chatbubble-outline" size={28} color="#fff" />
                    <Text style={styles.actionText}>{item.commentCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => toggleWishlist(item.id)}>
                    <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={28} color={isSaved ? COLORS.primary : "#fff"} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} activeOpacity={1}>
                    <Ionicons name="eye-outline" size={28} color="#fff" />
                    <Text style={styles.actionText}>{item.views || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
                    <Ionicons name="share-social-outline" size={28} color="#fff" />
                </TouchableOpacity>

                {isOwnPost && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={28} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default function PostDetailScreen({ navigation, route }: PostDetailScreenProps) {
    const { initialPost, allPosts: navPosts } = route.params || {};
    const { width: screenWidth } = useWindowDimensions();
    const screenHeight = Dimensions.get('screen').height;
    const { user } = useAuth();
    const { communityPosts, togglePostLike, deletePost, wishlist, toggleWishlist, addCommentToPost } = useApp();

    const headerHeight = Platform.OS === 'ios' ? 60 : 60;
    const adjustedHeight = screenHeight;

    // STABILIZE the data: Use navigation posts if available, fallback to global filtered
    const stablePosts = useMemo(() => {
        const sourcePosts = navPosts || communityPosts.filter(p => p.userId === initialPost?.userId);
        return sourcePosts;
    }, [navPosts, communityPosts, initialPost?.userId]);

    const [currentIndex, setCurrentIndex] = useState(() => {
        const index = stablePosts.findIndex(p => p.id === initialPost?.id);
        return index !== -1 ? index : 0;
    });

    const [commentSheetVisible, setCommentSheetVisible] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleLike = (postId: string) => togglePostLike(postId);
    const handleDelete = (postId: string) => {
        Alert.alert('Delete Post', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { deletePost(postId); if (stablePosts.length === 1) navigation.goBack(); } },
        ]);
    };

    const handleShare = async (post: CommunityPost) => {
        try {
            const appUrl = `https://cartrack.app/post/${post.id}`;
            await Share.share({
                message: appUrl,
                url: appUrl,
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleClose = () => navigation.goBack();
    const handleUserPress = (userId: string, userName: string) => {
        if (userId === user?.id) {
            navigation.navigate('Profile' as any);
        } else {
            navigation.navigate('OtherUserProfile', { userId, userName });
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const renderItem = ({ item, index }: { item: CommunityPost, index: number }) => {
        // Map to reactive state from context
        const reactivePost = communityPosts.find(p => p.id === item.id) || item;
        return (
            <PostItem
                item={reactivePost}
                isActive={index === currentIndex}
                isScrolling={isScrolling}
                commentSheetVisible={commentSheetVisible}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
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
            />
        );
    };

    const currentId = stablePosts[currentIndex]?.id;
    const reactiveCurrentPost = communityPosts.find(p => p.id === currentId);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />
            <View style={[styles.header, { height: headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0) }]}>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Posts</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>
            <FlatList
                ref={flatListRef}
                data={stablePosts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={{ height: screenHeight, width: screenWidth, flexGrow: 0 }}
                contentContainerStyle={{ flexGrow: 0 }}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                pagingEnabled={true}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 150 }}
                initialScrollIndex={stablePosts.findIndex(p => p.id === initialPost?.id)}
                getItemLayout={(data, index) => ({ length: screenHeight, offset: screenHeight * index, index })}
                onScrollToIndexFailed={(info) => {
                    flatListRef.current?.scrollToOffset({ offset: screenHeight * info.index, animated: false });
                }}
                onScrollBeginDrag={() => setIsScrolling(true)}
                onScrollEndDrag={(e) => {
                    if (Math.abs(e.nativeEvent.velocity?.y || 0) < 0.1) {
                        setIsScrolling(false);
                    }
                }}
                onMomentumScrollEnd={() => setIsScrolling(false)}
                removeClippedSubviews={false}
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
                <CommentBottomSheet
                    visible={commentSheetVisible}
                    onClose={() => setCommentSheetVisible(false)}
                    comments={reactiveCurrentPost.comments || []}
                    onAddComment={(text) => addCommentToPost(reactiveCurrentPost.id, text)}
                />
            )}
        </View>
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
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
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
        top: -2.5, // Centered on 5px line (5/2 - 10/2 = -2.5 is not right, wait)
        // Dot height is 10. Center of bar is 2.5. Top should be 2.5 - 5 = -2.5. Correct.
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: -5,
        zIndex: 120,
        opacity: 0.9,
    },
    scrubberHandleActive: {
        opacity: 1,
        width: 16,
        height: 16,
        borderRadius: 8,
        top: -6.5,
        marginLeft: -8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
});
