import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Keyboard avoiding behavior
const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import CommunityPostCard from '../components/CommunityPostCard';
import CommentBottomSheet from '../components/CommentBottomSheet';
import StoryList from '../components/StoryList';
import { CommunityPost } from '../types/Community';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

type CommunityScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface CommunityScreenProps {
    navigation: CommunityScreenNavigationProp;
}

export default function CommunityScreen({ navigation }: CommunityScreenProps) {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('Feed');
    const { communityPosts, togglePostLike, addCommentToPost, deletePost, editPost, getStoryGroups, wishlist, toggleWishlist } = useApp();
    const scrollRef = React.useRef<ScrollView>(null);

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
            const isFollowed = user?.following.includes(post.userId);
            const isOwnPost = user && post.userId === user.id;
            // Also include posts specifically categorized as 'following' for mock data
            return isFollowed || isOwnPost || post.category === 'following';
        }

        return true;
    }).sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return timeB - timeA;
    });

    // Scroll to top when category changes
    React.useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, [selectedCategory]);

    const handleLike = (postId: string) => {
        togglePostLike(postId);
    };

    const handleComment = (postId: string) => {
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            setSelectedPostForComment(post);
            setCommentSheetVisible(true);
        }
    };

    const handleAddComment = (commentText: string) => {
        if (selectedPostForComment) {
            addCommentToPost(selectedPostForComment.id, commentText);
        }
    };

    const handleShare = async (postId: string) => {
        try {
            const result = await Share.share({
                message: `Check out this post on CarTrack Community! https://cartrack.app/post/${postId}`,
                url: `https://cartrack.app/post/${postId}`,
            });
        } catch (error) {
            Alert.alert('Error', 'Unable to share post');
        }
    };

    const handleEditPost = (postId: string) => {
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            setEditContent(post.content);
            setEditLocation(post.location || '');
            setEditTags(post.tags ? post.tags.join(', ') : '');
            setEditingPost(post);
            setEditModalVisible(true);
        }
    };

    const handleSaveEdit = () => {
        if (editingPost && editContent.trim()) {
            const tagsArray = editTags.split(',')
                .map(tag => tag.trim().replace(/^#+/, ''))
                .filter(tag => tag.length > 0);

            editPost(editingPost.id, {
                content: editContent.trim(),
                location: editLocation.trim(),
                tags: tagsArray
            });

            setEditModalVisible(false);
            setEditingPost(null);
            setEditContent('');
            setEditLocation('');
            setEditTags('');
        }
    };

    const handleDeletePost = (postId: string) => {
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
        });
    };

    const handlePostImagePress = (postId: string) => {
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

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[1]}
            >
                {/* Story List */}
                <StoryList
                    storyGroups={getStoryGroups()}
                    onAddStory={handleAddStory}
                    onViewStory={handleViewStory}
                />

                <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />

                {/* Posts List */}
                <View style={styles.postsList}>
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

                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
                            <CommunityPostCard
                                key={post.id}
                                post={post}
                                onLike={handleLike}
                                onComment={handleComment}
                                onShare={handleShare}
                                onEdit={user && post.userId === user.id ? handleEditPost : undefined}
                                onDelete={user && post.userId === user.id ? handleDeletePost : undefined}
                                onImagePress={handlePostImagePress}
                                isSaved={wishlist.includes(post.id)}
                                onToggleSave={toggleWishlist}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="documents-outline" size={64} color={COLORS.textLight} />
                            <Text style={styles.emptyText}>No posts found in {selectedCategory}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

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
                comments={
                    selectedPostForComment
                        ? (allPosts.find(p => p.id === selectedPostForComment.id)?.comments || [])
                        : []
                }
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
});
