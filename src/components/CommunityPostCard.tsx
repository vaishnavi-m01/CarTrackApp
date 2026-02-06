import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { CommunityPost } from '../types/Community';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';

const { width } = Dimensions.get('window');
const MEDIA_WIDTH = width;

interface CommunityPostCardProps {
    post: CommunityPost;
    onLike: (postId: string) => void;
    onComment: (postId: string) => void;
    onShare: (postId: string) => void;
    onEdit?: (postId: string) => void;
    onDelete?: (postId: string) => void;
    onImagePress?: (postId: string) => void;
    isSaved?: boolean;
    onToggleSave?: (postId: string) => void;
}

export default function CommunityPostCard({
    post,
    onLike,
    onComment,
    onShare,
    onEdit,
    onDelete,
    onImagePress,
    isSaved,
    onToggleSave
}: CommunityPostCardProps) {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [numLines, setNumLines] = useState(0);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const handleProfilePress = () => {
        navigation.navigate('OtherUserProfile', {
            userId: post.userId,
            userName: post.userName
        });
    };

    const formatTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        const mins = Math.floor(diff / (1000 * 60));
        if (mins > 0) return `${mins}m ago`;
        return 'Just now';
    };

    const renderMediaItem = ({ item }: { item: any }) => {
        const itemRatio = item.aspectRatio || 0;
        let dynamicHeight = 400; // Default

        if (itemRatio === 1) {
            dynamicHeight = width; // Square
        } else if (itemRatio === 0.8) {
            dynamicHeight = width / 0.8; // Portrait 4:5
        } else if (itemRatio === 1.91) {
            dynamicHeight = width / 1.91; // Landscape
        }

        const content = item.type === 'video' ? (
            <View style={[styles.mediaContainer, { height: dynamicHeight }]}>
                <Video
                    source={{ uri: item.uri }}
                    style={styles.videoPlayer}
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay={videoPlaying}
                />
            </View>
        ) : (
            <Image
                source={{ uri: item.uri }}
                style={[styles.mediaImage, { height: dynamicHeight }]}
                resizeMode={item.resizeMode || 'cover'}
            />
        );

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onImagePress?.(post.id)}
            >
                {content}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={handleProfilePress}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatar}>
                        {post.userAvatar ? (
                            <Image source={{ uri: post.userAvatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {post.userName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.userTextContainer}>
                        <View style={styles.userNameRow}>
                            <Text style={styles.userName}>{post.userName}</Text>
                            {post.isVerified && (
                                <Ionicons name="checkmark-circle" size={14} color="#3B82F6" style={styles.verifiedBadge} />
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                            {post.vehicleInfo && (
                                <>
                                    <Text style={[styles.vehicleInfo, { flexShrink: 1 }]} numberOfLines={1}>{post.vehicleInfo}</Text>
                                    <Text style={styles.timestamp}>•</Text>
                                </>
                            )}
                            {post.location && (
                                <>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1 }}>
                                        <Ionicons name="location" size={12} color={COLORS.textLight} />
                                        <Text style={styles.locationText} numberOfLines={1}>{post.location}</Text>
                                    </View>
                                    <Text style={styles.timestamp}>•</Text>
                                </>
                            )}
                            <Text style={styles.timestamp}>{formatTime(post.timestamp)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                {(onEdit || onDelete) && (
                    <View style={styles.menuWrapper}>
                        <TouchableOpacity
                            onPress={() => setMenuVisible(!menuVisible)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} />
                        </TouchableOpacity>

                        {menuVisible && (
                            <>
                                <TouchableOpacity
                                    style={styles.menuBackdrop}
                                    activeOpacity={1}
                                    onPress={() => setMenuVisible(false)}
                                />
                                <View style={styles.popupMenu}>
                                    {onEdit && (
                                        <TouchableOpacity
                                            style={styles.popupMenuItem}
                                            onPress={() => {
                                                setMenuVisible(false);
                                                onEdit(post.id);
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                                            <Text style={styles.popupMenuText}>Edit</Text>
                                        </TouchableOpacity>
                                    )}
                                    {onEdit && onDelete && <View style={styles.popupMenuDivider} />}
                                    {onDelete && (
                                        <TouchableOpacity
                                            style={styles.popupMenuItem}
                                            onPress={() => {
                                                setMenuVisible(false);
                                                onDelete(post.id);
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                                            <Text style={[styles.popupMenuText, { color: COLORS.danger }]}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                )}
            </View>

            {/* Media Gallery */}
            {post.media.length > 0 && (
                <View style={styles.mediaSection}>
                    <FlatList
                        data={post.media}
                        renderItem={renderMediaItem}
                        horizontal
                        pagingEnabled
                        scrollEnabled={post.media.length > 1}
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / MEDIA_WIDTH);
                            setCurrentMediaIndex(index);
                        }}
                        keyExtractor={(_, index) => `media-${index}`}
                    />
                    {post.media.length > 1 && (
                        <View style={styles.pagination}>
                            {post.media.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.paginationDot,
                                        currentMediaIndex === index && styles.paginationDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onLike(post.id)}
                >
                    <Ionicons
                        name={post.likedByUser ? "heart" : "heart-outline"}
                        size={24}
                        color={post.likedByUser ? "#EF4444" : COLORS.text}
                    />
                    <Text style={styles.actionText}>{post.likes.toLocaleString()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onComment(post.id)}
                >
                    <Ionicons name="chatbubble-outline" size={22} color={COLORS.text} />
                    <Text style={styles.actionText}>{post.commentCount?.toLocaleString() || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onShare(post.id)}
                >
                    <Ionicons name="paper-plane-outline" size={22} color={COLORS.text} />
                    <Text style={styles.actionText}>{post.commentCount ? Math.floor(post.commentCount * 1.5) : 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={1}
                >
                    <Ionicons name="eye-outline" size={22} color={COLORS.text} />
                    <Text style={styles.actionText}>{post.views?.toLocaleString() || 0}</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onToggleSave?.(post.id)}
                >
                    <Ionicons
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        size={22}
                        color={isSaved ? COLORS.primary : COLORS.text}
                    />
                </TouchableOpacity>
            </View>

            {/* Content & Caption */}
            <View style={styles.contentContainer}>
                {post.content ? (
                    <View style={styles.captionRow}>
                        <Text style={styles.captionUserName}>{post.userName.toLowerCase().replace(/\s+/g, '_')} </Text>
                        <Text
                            style={styles.content}
                            numberOfLines={expanded ? undefined : 4}
                            onTextLayout={(e) => {
                                if (!expanded) {
                                    setNumLines(e.nativeEvent.lines.length);
                                }
                            }}
                        >
                            {post.content}
                        </Text>
                        {numLines >= 4 && !expanded && (
                            <TouchableOpacity onPress={() => setExpanded(true)}>
                                <Text style={styles.moreText}> ...more</Text>
                            </TouchableOpacity>
                        )}
                        {expanded && (
                            <TouchableOpacity onPress={() => setExpanded(false)}>
                                <Text style={styles.moreText}> Show less</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {post.tags.map((tag, index) => (
                            <Text key={index} style={styles.tagText}>#{tag.replace(/^#+/, '')} </Text>
                        ))}
                    </View>
                )}

                <Text style={styles.timestampBottom}>{formatTime(post.timestamp)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userTextContainer: {
        flex: 1,
    },
    avatar: {
        marginRight: 10,
    },
    avatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    avatarPlaceholder: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    verifiedBadge: {
        marginLeft: 4,
    },
    vehicleInfo: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 11,
        color: COLORS.textLight,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    mediaSection: {
        position: 'relative',
    },
    mediaContainer: {
        width: width,
        height: 400,
        backgroundColor: '#000',
    },
    mediaImage: {
        width: width,
        height: 400,
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    paginationDotActive: {
        backgroundColor: COLORS.white,
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        gap: 18,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    actionText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '600',
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    captionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    captionUserName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 18,
    },
    moreText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    tagText: {
        fontSize: 14,
        color: '#3B82F6',
    },
    timestampBottom: {
        fontSize: 10,
        color: COLORS.textLight,
        marginTop: 8,
        textTransform: 'uppercase',
    },
    menuWrapper: {
        position: 'relative',
        zIndex: 10,
    },
    menuBackdrop: {
        position: 'absolute',
        top: -500,
        left: -500,
        right: -500,
        bottom: -500,
        zIndex: 9,
    },
    popupMenu: {
        position: 'absolute',
        top: 30,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 4,
        minWidth: 140,
        ...SHADOWS.medium,
        zIndex: 10,
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
