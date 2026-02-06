import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

const MOCK_SYSTEM_NOTIFICATIONS = [
    {
        id: '1',
        type: 'service',
        title: 'Service Due',
        message: 'Your Hyundai i20 is due for service in 3 days.',
        time: '2 hours ago',
        isRead: false,
    },
    {
        id: '2',
        type: 'insurance',
        title: 'Insurance Expiring',
        message: 'Your Insurance for Honda City expires on Feb 15.',
        time: '5 hours ago',
        isRead: false,
    },
    {
        id: '3',
        type: 'price_alert',
        title: 'Price Drop Alert',
        message: 'The price of Audi A4 has dropped by ₹50,000!',
        time: '1 day ago',
        isRead: false,
    },
    {
        id: '4',
        type: 'article',
        title: 'New Article',
        message: 'Top 10 Maintenance Tips for Summer 2024.',
        time: '1 day ago',
        isRead: true,
    },
    {
        id: '5',
        type: 'new_car',
        title: 'New Launch',
        message: 'The all-new Tata Curvv has been launched!',
        time: '2 days ago',
        isRead: true,
    },
];

export default function SystemNotificationsScreen() {
    const navigation = useNavigation();

    const getIconName = (type: string) => {
        switch (type) {
            case 'service': return 'construct';
            case 'insurance': return 'shield-checkmark';
            case 'price_alert': return 'pricetag';
            case 'article': return 'newspaper';
            case 'new_car': return 'car-sport';
            default: return 'notifications';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'service': return COLORS.warning;
            case 'insurance': return COLORS.info;
            case 'price_alert': return COLORS.success;
            case 'article': return COLORS.secondary;
            case 'new_car': return COLORS.primaryDark;
            default: return COLORS.textLight;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView style={styles.notificationList}>
                {MOCK_SYSTEM_NOTIFICATIONS.map((notification) => (
                    <TouchableOpacity
                        key={notification.id}
                        style={[
                            styles.notificationItem,
                            !notification.isRead && styles.notificationItemUnread,
                        ]}
                    >
                        <View style={[styles.systemIconContainer, { backgroundColor: getIconColor(notification.type) + '20' }]}>
                            <Ionicons name={getIconName(notification.type)} size={24} color={getIconColor(notification.type)} />
                        </View>

                        <View style={styles.notificationContent}>
                            <Text style={styles.notificationText}>
                                <Text style={styles.notificationUser}>{notification.title}</Text>{'\n'}
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
});
