import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent, Image, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface HeaderProps {
    title?: string;
    logoImage?: ImageSourcePropType;
    subtitle?: string;
    notificationCount?: number;
    onNotificationPress?: (event: GestureResponderEvent) => void;
    icon?: keyof typeof Ionicons.glyphMap;
    onIconPress?: (event: GestureResponderEvent) => void;
    children?: React.ReactNode;
    showRightIcon?: boolean;
    rightComponent?: React.ReactNode;
}

export default function Header({
    title,
    logoImage,
    subtitle,
    notificationCount = 0,
    onNotificationPress,
    icon,
    onIconPress,
    children,
    showRightIcon = true,
    rightComponent
}: HeaderProps) {
    const insets = useSafeAreaInsets();
    const handleIconPress = onIconPress || onNotificationPress;
    const iconName = icon || "notifications-outline";

    return (
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={[styles.header, { paddingTop: insets.top + 10 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.headerTop}>
                <View>
                    <View style={styles.titleContainer}>
                        {logoImage && (
                            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                        )}
                        {title && <Text style={styles.title}>{title}</Text>}
                    </View>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {rightComponent}
                {showRightIcon && !rightComponent && (
                    <TouchableOpacity style={styles.notificationIcon} onPress={handleIconPress}>
                        <Ionicons name={iconName} size={24} color={COLORS.white} />
                        {notificationCount > 0 && !icon && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{notificationCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: 15,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...SHADOWS.medium,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginBottom: 5,
    },
    subtitle: {
        color: COLORS.white,
        fontSize: SIZES.body2,
        opacity: 0.9,
        marginBottom: 5,
    },
    title: {
        color: COLORS.white,
        fontSize: SIZES.h2,
        fontWeight: 'bold',
    },
    logo: {
        height: 38,
        width: 38, // Made it square to act as an icon next to title
    },
    notificationIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 25,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
});
