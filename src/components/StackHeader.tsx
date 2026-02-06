import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StackHeaderProps {
    title: string;
    subtitle?: string;
    headerRight?: () => React.ReactNode;
}

/**
 * Reusable Header component for Stack screens with a back button and title.
 * Refined dimensions for a standard mobile look.
 */
export default function StackHeader({ title, subtitle, headerRight }: StackHeaderProps) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={[
                styles.header,
                { paddingTop: insets.top + 10 }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.headerContent}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                    {subtitle ? <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
                </View>
                <View style={styles.rightContainer}>
                    {headerRight ? headerRight() : null}
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
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
});
