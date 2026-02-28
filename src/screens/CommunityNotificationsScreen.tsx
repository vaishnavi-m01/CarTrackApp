import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { useApp } from '../context/AppContext';

export default function CommunityNotificationsScreen() {
    const { user } = useAuth();
    const { communityUnreadCount, setCommunityUnreadCount, fetchUnreadCount } = useApp();
    const navigation = useNavigation();
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        (navigation as any).setParams({ scrollY });
    }, []);

    // Mark a single notification as read when tapped
    const markOneAsRead = async (notifId: number) => {
        try {
            await apiClient.post(`/notifications/${notifId}/read`);
            // Update local state immediately (no re-fetch needed)
            setNotifications(prev =>
                prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
            );
            // Decrease badge count by 1
            setCommunityUnreadCount(Math.max(0, communityUnreadCount - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
            fetchUnreadCount();
        }, [user?.id])
    );

    // Only these community/social types are shown here.
    const COMMUNITY_TYPES = ['POST_LIKE', 'POST_COMMENT', 'STORY_LIKE', 'STORY_COMMENT', 'NEW_FOLLOWER', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPTED'];

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [notifRes, requestsRes] = await Promise.all([
                apiClient.get(`/notifications/user/${user.id}?types=POST_LIKE,POST_COMMENT,STORY_LIKE,STORY_COMMENT,NEW_FOLLOWER,FOLLOW_REQUEST,FOLLOW_ACCEPTED`),
                apiClient.get(`/users/${user.id}/pending-requests`)
            ]);
            const all = notifRes.data.content || [];
            // Frontend safety filter — only show community/social types
            const filtered = all.filter((n: any) => COMMUNITY_TYPES.includes(n.type));
            setNotifications(filtered);
            setPendingRequests(requestsRes.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const groupedNotifications = React.useMemo(() => {
        const today: any[] = [];
        const yesterday: any[] = [];
        const earlier: any[] = [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

        notifications.forEach(n => {
            const date = new Date(n.createdAt).getTime();
            if (date >= startOfToday) {
                today.push(n);
            } else if (date >= startOfYesterday) {
                yesterday.push(n);
            } else if (date >= thirtyDaysAgo) {
                earlier.push(n);
            }
        });

        return [
            { title: 'Today', data: today },
            { title: 'Yesterday', data: yesterday },
            { title: 'Earlier (30d)', data: earlier }
        ].filter(section => section.data.length > 0);
    }, [notifications]);

    // Data is fetched via useFocusEffect above, no need for a separate useEffect

    const handleAcceptRequest = async (followerId: number) => {
        if (!user) return;
        try {
            await apiClient.post(`/users/${user.id}/follow-request/${followerId}/accept`);
            setPendingRequests(prev => prev.filter(req => req.id !== followerId));
            // Refresh notifications after accepting
            fetchData();
        } catch (error) {
            console.error('Error accepting follow request:', error);
        }
    };

    const handleRejectRequest = async (followerId: number) => {
        if (!user) return;
        try {
            await apiClient.post(`/users/${user.id}/follow-request/${followerId}/reject`);
            setPendingRequests(prev => prev.filter(req => req.id !== followerId));
        } catch (error) {
            console.error('Error rejecting follow request:', error);
        }
    };

    const formatTime = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now.getTime() - past.getTime();
        const diffInSecs = Math.floor(diffInMs / 1000);
        const diffInMins = Math.floor(diffInSecs / 60);
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) return `${diffInDays}d ago`;
        if (diffInHours > 0) return `${diffInHours}h ago`;
        if (diffInMins > 0) return `${diffInMins}m ago`;
        return 'Just now';
    };

    const getIconName = (type: string) => {
        switch (type) {
            case 'POST_LIKE':
            case 'STORY_LIKE': return 'heart';
            case 'POST_COMMENT':
            case 'STORY_COMMENT': return 'chatbubble';
            case 'NEW_FOLLOWER':
            case 'FOLLOW_REQUEST': return 'person-add';
            case 'FOLLOW_ACCEPTED': return 'checkmark-circle';
            default: return 'notifications';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'POST_LIKE':
            case 'STORY_LIKE': return COLORS.danger;
            case 'POST_COMMENT':
            case 'STORY_COMMENT': return COLORS.primary;
            case 'NEW_FOLLOWER':
            case 'FOLLOW_REQUEST':
            case 'FOLLOW_ACCEPTED': return COLORS.success;
            default: return COLORS.textLight;
        }
    };

    const handleNotificationPress = async (notification: any) => {
        // Mark this specific notification as read
        if (!(notification.isRead || notification.read)) {
            markOneAsRead(notification.id);
        }

        const type = notification.type || '';
        if (type.includes('POST') && notification.referenceId) {
            // Fetch the full post data before navigating (PostDetail expects initialPost object)
            try {
                const response = await apiClient.get(`/post/${notification.referenceId}`);
                const postData = response.data?.post || response.data;
                if (postData) {
                    const mappedPost = {
                        id: postData.id,
                        userId: postData.userId,
                        userName: postData.user?.username || `User ${postData.userId}`,
                        userAvatar: postData.user?.profilePicUrl,
                        user: postData.user,
                        content: postData.content || '',
                        media: (postData.media || []).map((m: any) => ({
                            id: m.id, postId: m.postId, mediaUrl: m.mediaUrl,
                            type: m.type || 'image', aspectRatio: m.aspectRatio || 1
                        })),
                        createdAt: postData.createdAt,
                        likes: postData.likesCount || 0,
                        likesCount: postData.likesCount,
                        likedByUser: postData.likedByUser || false,
                        isSaved: postData.saved || false,
                        comments: [],
                        commentCount: postData.commentsCount || 0,
                        commentsCount: postData.commentsCount,
                        views: postData.viewsCount || 0,
                        location: postData.location,
                        feeling: postData.feeling,
                        allowComments: postData.allowComments ?? true,
                        isPublic: postData.isPublic ?? true,
                        vehicleId: postData.vehicleId,
                    };
                    (navigation as any).navigate('PostDetail', { initialPost: mappedPost, allPosts: [mappedPost] });
                }
            } catch (error) {
                console.error('Error fetching post for notification:', error);
            }
        } else if (type.includes('STORY')) {
            // Logic for story navigation if needed
        } else if (type.includes('FOLLOW')) {
            (navigation as any).navigate('OtherUserProfile', { userId: notification.sender?.id, userName: notification.sender?.username || '' });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <Animated.ScrollView
                style={styles.notificationList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Follow Requests Section */}
                {pendingRequests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Follow Requests</Text>
                        {pendingRequests.map((request) => (
                            <View key={request.id} style={styles.requestItem}>
                                <TouchableOpacity
                                    style={styles.requestInfo}
                                    onPress={() => (navigation as any).navigate('OtherUserProfile', { userId: request.id })}
                                >
                                    <Image
                                        source={{ uri: request.profilePicUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                                        style={styles.userAvatar}
                                    />
                                    <View style={styles.requestTextContainer}>
                                        <Text style={styles.notificationText}>
                                            <Text style={styles.notificationUser}>{request.username || request.name}</Text>{' '}
                                            wants to follow you
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.acceptButton]}
                                        onPress={() => handleAcceptRequest(request.id)}
                                    >
                                        <Text style={styles.acceptButtonText}>Confirm</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => handleRejectRequest(request.id)}
                                    >
                                        <Text style={styles.rejectButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {notifications.length > 0 ? (
                    groupedNotifications.map((section) => (
                        <View key={section.title} style={styles.section}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            {section.data.map((notif: any) => (
                                <TouchableOpacity
                                    key={notif.id}
                                    style={[
                                        styles.notificationItem,
                                        !(notif.isRead || notif.read) && styles.notificationItemUnread,
                                    ]}
                                    onPress={() => handleNotificationPress(notif)}
                                >
                                    <View style={styles.avatarWrapper}>
                                        <Image
                                            source={{ uri: notif.sender?.profilePicUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                                            style={styles.userAvatar}
                                        />
                                        <View style={styles.notificationIconContainer}>
                                            <Ionicons
                                                name={getIconName(notif.type)}
                                                size={12}
                                                color={getIconColor(notif.type)}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.notificationContent}>
                                        <Text style={styles.notificationText}>
                                            <Text style={styles.notificationUser}>{notif.sender?.username || 'Someone'}</Text>{' '}
                                            {notif.message}
                                        </Text>
                                        <Text style={styles.notificationTime}>{formatTime(notif.createdAt)}</Text>
                                    </View>
                                    {!notif.isRead && <View style={styles.unreadDot} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={48} color={COLORS.lightGray} />
                        <Text style={styles.emptyText}>No new notifications</Text>
                    </View>
                )}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    notificationList: {
        flex: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    notificationItemUnread: {
        backgroundColor: '#F0F9FF',
    },
    section: {
        paddingTop: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginHorizontal: 20,
        marginBottom: 10,
    },
    requestItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    requestInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    requestTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
    },
    rejectButton: {
        backgroundColor: '#E5E7EB',
    },
    acceptButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    rejectButtonText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '600',
    },
    notificationIconContainer: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.white,
        ...SHADOWS.light,
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 18,
    },
    notificationUser: {
        fontWeight: '700',
        color: COLORS.text,
    },
    notificationTime: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.textLight,
        fontSize: 16,
    },
});
