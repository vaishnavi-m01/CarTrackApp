import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface StoryCircleProps {
    userName: string;
    userAvatar?: string;
    hasUnviewed: boolean;
    isAddStory?: boolean;
    onPress: () => void;
    onAddPress?: () => void;
}

export default function StoryCircle({
    userName,
    userAvatar,
    hasUnviewed,
    isAddStory = false,
    onPress,
    onAddPress,
}: StoryCircleProps) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            {/* Gradient Border */}
            <LinearGradient
                colors={hasUnviewed ? [COLORS.primary, COLORS.primaryDark, '#FF6B9D'] : ['#E5E7EB', '#E5E7EB']}
                style={styles.gradientBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.innerCircle}>
                    {userAvatar ? (
                        <Image source={{ uri: userAvatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {/* Render Plus Icon if isAddStory OR if onAddPress is provided (meaning we have a story but want to show add option) */}
                    {(isAddStory || onAddPress) && (
                        <TouchableOpacity
                            style={styles.addIconContainer}
                            onPress={onAddPress || onPress} // If specific add handler, use it (stops bubbling?), otherwise fallback to main press
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
            <Text style={styles.userName} numberOfLines={1}>
                {isAddStory ? 'Your Story' : userName}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginRight: 12,
        width: 72,
    },
    gradientBorder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        padding: 3,
        marginBottom: 6,
    },
    innerCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 33,
        backgroundColor: COLORS.white,
        padding: 2,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 31,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    addIconContainer: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: COLORS.white,
        borderRadius: 12,
    },
    userName: {
        fontSize: 12,
        color: COLORS.text,
        textAlign: 'center',
        maxWidth: 72,
    },
});
