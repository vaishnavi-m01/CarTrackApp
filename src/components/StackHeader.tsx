import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface StackHeaderProps {
    title: string;
    subtitle?: string;
    headerRight?: () => React.ReactNode;
    scrollY?: Animated.Value;
    showSearch?: boolean;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
    onSearchClose?: () => void;
}

/**
 * Reusable Header component for Stack screens with a back button and title.
 * Refined dimensions for a standard mobile look with collapsing animation.
 */
export default function StackHeader({
    title,
    subtitle,
    headerRight,
    scrollY,
    showSearch,
    searchQuery,
    onSearchChange,
    onSearchClose
}: StackHeaderProps) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // Animation values
    const headerHeight = scrollY ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [insets.top + (subtitle ? 90 : 70), insets.top + 60],
        extrapolate: 'clamp'
    }) : insets.top + (subtitle ? 90 : 70);

    const titleScale = scrollY ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.9],
        extrapolate: 'clamp'
    }) : 1;

    const subtitleOpacity = scrollY ? scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    }) : 1;

    // For search bar open/close animation
    const searchScale = React.useRef(new Animated.Value(showSearch ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(searchScale, {
            toValue: showSearch ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [showSearch]);

    return (
        <AnimatedLinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={[
                styles.header,
                { height: headerHeight }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={[styles.headerContent, { marginTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Animated.Text
                        style={[
                            styles.headerTitle,
                            { transform: [{ scale: titleScale }] }
                        ]}
                        numberOfLines={1}
                    >
                        {title}
                    </Animated.Text>
                    {subtitle ? (
                        <Animated.Text
                            style={[
                                styles.headerSubtitle,
                                { opacity: subtitleOpacity }
                            ]}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Animated.Text>
                    ) : null}
                </View>

                {showSearch && (
                    <Animated.View style={[StyleSheet.absoluteFill, styles.searchOverlay, { opacity: searchScale }]}>
                        <TouchableOpacity onPress={onSearchClose} style={styles.searchBackBtn}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color={COLORS.textLight} />
                            <TextInput
                                style={styles.headerSearchInput}
                                placeholder="Search..."
                                placeholderTextColor={COLORS.textLight}
                                value={searchQuery}
                                onChangeText={onSearchChange}
                                autoFocus
                            />
                            {searchQuery && searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => onSearchChange && onSearchChange('')}>
                                    <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                )}

                <View style={styles.rightContainer}>
                    {headerRight ? headerRight() : <View style={{ width: 40 }} />}
                </View>
            </View>
        </AnimatedLinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 15,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.white,
        opacity: 0.8,
        marginTop: 2,
    },
    backBtn: {
        width: 40,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    rightContainer: {
        minWidth: 40,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    searchOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    searchBackBtn: {
        width: 40,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        marginLeft: 8,
        marginRight: 10,
    },
    headerSearchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: COLORS.text,
        paddingVertical: 0,
    },
});
