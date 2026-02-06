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

export default function CommunityNotificationsScreen() {
    const navigation = useNavigation();

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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
    },
    notificationItemUnread: {
        backgroundColor: '#F0F9FF',
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    notificationIconContainer: {
        position: 'absolute',
        left: 52,
        top: 45,
        width: 24,
        height: 24,
        borderRadius: 12,
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
});
