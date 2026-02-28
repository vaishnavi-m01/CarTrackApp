import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import apiClient from '../api/apiClient';

const formatTimeAgo = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    } catch (e) {
        return '';
    }
};

export default function SystemNotificationsScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { fetchUnreadCount, AndroidToast, systemUnreadCount, setSystemUnreadCount } = useApp();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        (navigation as any).setParams({ scrollY });
    }, []);

    // Only these types are allowed in System Alerts.
    // Client-side filter ensures social notifications never appear here,
    // even if the backend (old version) returns unexpected types.
    const SYSTEM_TYPES = ['NEWS_ALERT', 'INSURANCE_ALERT', 'SERVICE_ALERT', 'CAR_LAUNCH', 'SYSTEM_ALERT'];

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const response = await apiClient.get(`/notifications/user/${user.id}?types=NEWS_ALERT,INSURANCE_ALERT,SERVICE_ALERT,CAR_LAUNCH,SYSTEM_ALERT`);
            const all = response.data.content || [];
            // Frontend safety filter — exclude social/community types
            const filtered = all.filter((n: any) => SYSTEM_TYPES.includes(n.type));
            setNotifications(filtered);
        } catch (error) {
            console.error('Error fetching system notifications:', error);
            AndroidToast('Failed to load notifications', 'error');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Mark all as read when opening this screen if needed, 
        // or individually when clicked. For now, let's mark all as read.
        markAllAsRead();
    }, [user?.id]);

    const markAllAsRead = async () => {
        if (!user?.id) return;
        try {
            await apiClient.post(`/notifications/mark-as-read?userId=${user.id}`);
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleNotificationPress = async (notification: any) => {
        if (!notification.isRead) {
            try {
                await apiClient.post(`/notifications/${notification.id}/read`);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                setSystemUnreadCount(Math.max(0, systemUnreadCount - 1));
                fetchUnreadCount();
            } catch (error) {
                console.error('Error marking single notification as read:', error);
            }
        }

        // Navigation logic based on type
        if (notification.type === 'NEWS_ALERT' && notification.referenceId) {
            // Fetch news details and navigate
            try {
                const res = await apiClient.get(`/news-highlights/${notification.referenceId}`);
                (navigation as any).navigate('NewsDetail', { news: res.data });
            } catch (e) {
                AndroidToast('News details not available');
            }
        } else if (notification.type === 'INSURANCE_ALERT') {
            (navigation as any).navigate('Insurance', { vehicleId: notification.referenceId });
        } else if (notification.type === 'SERVICE_ALERT') {
            (navigation as any).navigate('ServiceRecords', { vehicleId: notification.referenceId });
        } else if (notification.type === 'CAR_LAUNCH') {
            (navigation as any).navigate('MarketDetail', { carId: notification.referenceId });
        }
    };

    const getIconName = (type: string) => {
        switch (type) {
            case 'SERVICE_ALERT': return 'construct';
            case 'INSURANCE_ALERT': return 'shield-checkmark';
            case 'NEWS_ALERT': return 'newspaper';
            case 'CAR_LAUNCH': return 'car-sport';
            default: return 'notifications';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'SERVICE_ALERT': return COLORS.warning;
            case 'INSURANCE_ALERT': return COLORS.info;
            case 'NEWS_ALERT': return COLORS.primary;
            case 'CAR_LAUNCH': return '#10B981'; // Emerald/Green for new launch
            default: return COLORS.textLight;
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    if (isLoading && !refreshing) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <Animated.ScrollView
                style={styles.notificationList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={60} color={COLORS.gray} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                ) : (
                    notifications.map((notification) => (
                        <TouchableOpacity
                            key={notification.id}
                            style={[
                                styles.notificationItem,
                                !notification.isRead && styles.notificationItemUnread,
                            ]}
                            onPress={() => handleNotificationPress(notification)}
                        >
                            <View style={[styles.systemIconContainer, { backgroundColor: getIconColor(notification.type) + '20' }]}>
                                <Ionicons name={getIconName(notification.type)} size={24} color={getIconColor(notification.type)} />
                            </View>

                            <View style={styles.notificationContent}>
                                <Text style={styles.notificationText}>
                                    <Text style={styles.notificationUser}>{notification.title}</Text>{'\n'}
                                    {notification.message}
                                </Text>
                                <Text style={styles.notificationTime}>
                                    {notification.createdAt ? formatTimeAgo(notification.createdAt) : ''}
                                </Text>
                            </View>
                            {!notification.isRead && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))
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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
    },
    notificationItemUnread: {
        backgroundColor: '#F0F9FF',
    },
    systemIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
        marginBottom: 4,
    },
    notificationUser: {
        fontWeight: '600',
        color: COLORS.text,
    },
    notificationTime: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.gray,
    },
});
