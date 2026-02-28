import React, { ReactNode, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent, Image, ImageSourcePropType, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
    scrollY?: Animated.Value;
    isHomeHeader?: boolean;
    forceExpanded?: boolean;
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
    rightComponent,
    scrollY,
    isHomeHeader = false,
    forceExpanded = false
}: HeaderProps) {
    const insets = useSafeAreaInsets();
    const handleIconPress = onIconPress || onNotificationPress;
    const iconName = icon || "notifications-outline";

    // Animation values
    const zeroValue = useRef(new Animated.Value(0)).current;
    const activeScrollY = (forceExpanded || !scrollY) ? zeroValue : scrollY;

    const headerHeight = activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [insets.top + (forceExpanded ? 80 : (children ? 125 : (subtitle ? 100 : 80))), insets.top + 45],
        extrapolate: 'clamp'
    });

    const topPadding = activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [insets.top + 10, insets.top + 2],
        extrapolate: 'clamp'
    });

    const titleScale = activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0.75],
        extrapolate: 'clamp'
    });

    const subtitleHeight = activeScrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [20, 0],
        extrapolate: 'clamp'
    });

    const subtitleOpacity = activeScrollY.interpolate({
        inputRange: [0, 40],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const paddingBottom = activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [15, 5],
        extrapolate: 'clamp'
    });

    const borderRadius = isHomeHeader ? activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [30, 0],
        extrapolate: 'clamp'
    }) : 30;

    const paddingHorizontal = isHomeHeader ? activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [SIZES.padding, 0],
        extrapolate: 'clamp'
    }) : SIZES.padding;

    const contentPaddingHorizontal = isHomeHeader ? activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [0, 15],
        extrapolate: 'clamp'
    }) : 0;

    const interpolateColor = isHomeHeader ? activeScrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [COLORS.white, '#000000'],
        extrapolate: 'clamp'
    }) : COLORS.white;

    const headerBgOpacity = isHomeHeader && scrollY ? scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    }) : 0;

    const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

    return (
        <Animated.View style={headerHeight ? { height: headerHeight } : {}}>
            <AnimatedLinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={[
                    styles.header,
                    {
                        paddingTop: topPadding,
                        paddingBottom: paddingBottom,
                        borderBottomLeftRadius: borderRadius,
                        borderBottomRightRadius: borderRadius,
                        paddingHorizontal: paddingHorizontal,
                    },
                    headerHeight ? { height: headerHeight } : {}
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {isHomeHeader && (
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: COLORS.white, opacity: headerBgOpacity }
                        ]}
                    />
                )}
                {!forceExpanded && (
                    <Animated.View style={[styles.headerTop, { paddingHorizontal: contentPaddingHorizontal }]}>
                        <Animated.View style={{ transform: [{ scale: titleScale }] }}>
                            <View style={styles.titleContainer}>
                                {logoImage && (
                                    <Animated.Image
                                        source={logoImage}
                                        style={[
                                            styles.logo,
                                            {
                                                transform: [{ scale: titleScale }],
                                                tintColor: isHomeHeader ? interpolateColor : undefined
                                            }
                                        ]}
                                        resizeMode="contain"
                                    />
                                )}
                                {title && (
                                    <Animated.Text style={[
                                        styles.title,
                                        { color: isHomeHeader ? interpolateColor : COLORS.white }
                                    ]}>
                                        {title}
                                    </Animated.Text>
                                )}
                            </View>
                            {subtitle && (
                                <Animated.Text style={[
                                    styles.subtitle,
                                    {
                                        opacity: subtitleOpacity,
                                        height: subtitleHeight,
                                        color: isHomeHeader ? interpolateColor : COLORS.white
                                    }
                                ]}>
                                    {subtitle}
                                </Animated.Text>
                            )}
                        </Animated.View>
                        {rightComponent}
                        {showRightIcon && !rightComponent && (
                            <TouchableOpacity style={styles.notificationIcon} onPress={handleIconPress}>
                                <AnimatedIonicons name={iconName} size={24} color={isHomeHeader ? (interpolateColor as any) : COLORS.white} />
                                {notificationCount > 0 && !icon && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{notificationCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}
                {children}
            </AnimatedLinearGradient>
        </Animated.View>
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
