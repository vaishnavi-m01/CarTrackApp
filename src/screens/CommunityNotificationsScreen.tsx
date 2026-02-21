import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

const MOCK_COMMUNITY_NOTIFICATIONS = [
    {
        id: '1',
        type: 'like',
        user: 'TurboTom99',
        userImage: 'https://randomuser.me/api/portraits/men/32.jpg',
        message: 'liked your post about the new exhaust system',
        time: '3 days ago',
        isRead: true,
    },
    {
        id: '2',
        type: 'comment',
        user: 'RevHigh_Sarah',
        userImage: 'https://randomuser.me/api/portraits/women/44.jpg',
        message: 'commented on your track day photos',
        time: '5 hours ago',
        isRead: false,
    },
    {
        id: '3',
        type: 'follow',
        user: 'DriftKing_Leo',
        userImage: 'https://randomuser.me/api/portraits/men/85.jpg',
        message: 'started following you',
        time: '1 day ago',
        isRead: false,
    },
    {
        id: '4',
        type: 'like',
        user: 'Classic_Clara',
        userImage: 'https://randomuser.me/api/portraits/women/12.jpg',
        message: 'liked your BMW restoration post',
        time: '1 day ago',
        isRead: true,
    },
];

import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export default function CommunityNotificationsScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchPendingRequests = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/users/${user.id}/pending-requests`);
            setPendingRequests(response.data || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPendingRequests();
    }, [user?.id]);

    const handleAcceptRequest = async (followerId: number) => {
        if (!user) return;
        try {
            await apiClient.post(`/users/${user.id}/follow-request/${followerId}/accept`);
            setPendingRequests(prev => prev.filter(req => req.id !== followerId));
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

    const getIconName = (type: string) => {
        switch (type) {
            case 'like': return 'heart';
            case 'comment': return 'chatbubble';
            case 'follow': return 'person-add';
            default: return 'notifications';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'like': return COLORS.danger;
            case 'comment': return COLORS.primary;
            case 'follow': return COLORS.success;
            default: return COLORS.textLight;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView style={styles.notificationList}>
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
                                        source={{ uri: request.profilePicUrl }}
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

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Earlier</Text>
                    {MOCK_COMMUNITY_NOTIFICATIONS.map((notification) => (
                        <TouchableOpacity
                            key={notification.id}
                            style={[
                                styles.notificationItem,
                                !notification.isRead && styles.notificationItemUnread,
                            ]}
                        >
                            <Image
                                source={{ uri: notification.userImage }}
                                style={styles.userAvatar}
                            />

                            <View style={styles.notificationIconContainer}>
                                <Ionicons
                                    name={getIconName(notification.type)}
                                    size={16}
                                    color={getIconColor(notification.type)}
                                />
                            </View>

                            <View style={styles.notificationContent}>
                                <Text style={styles.notificationText}>
                                    <Text style={styles.notificationUser}>{notification.user}</Text>{' '}
                                    {notification.message}
                                </Text>
                                <Text style={styles.notificationTime}>{notification.time}</Text>
                            </View>
                            {!notification.isRead && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
        marginRight: 12,
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
        left: 50,
        top: 38,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
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
});
