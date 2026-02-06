import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface NewsItem {
    type: 'trending' | 'launch' | 'price' | string;
    badgeText: string;
    title: string;
    source: string;
    time: string;
    id: number;
}

interface NewsCardProps {
    news: NewsItem;
    onPress?: (event: GestureResponderEvent) => void;
    onSave?: (event: GestureResponderEvent) => void;
    isSaved?: boolean;
}

export default function NewsCard({ news, onPress, onSave, isSaved }: NewsCardProps) {
    const badgeColors: { [key: string]: string } = {
        trending: COLORS.danger,
        launch: COLORS.primary,
        price: COLORS.success,
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: badgeColors[news.type] || COLORS.gray }]}>
                    <Text style={styles.badgeText}>{news.badgeText}</Text>
                </View>
                {onSave && (
                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onSave(e);
                        }}
                    >
                        <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={isSaved ? COLORS.primary : COLORS.gray}
                        />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.title}>{news.title}</Text>
            <View style={styles.meta}>
                <View style={styles.source}>
                    <Text style={styles.sourceIcon}>📰</Text>
                    <Text style={styles.sourceText}>{news.source}</Text>
                </View>
                <Text style={styles.time}>{news.time}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 15,
        marginBottom: 15,
        ...SHADOWS.light,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginBottom: 10,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    saveBtn: {
        padding: 5,
    },
    title: {
        fontSize: SIZES.body1,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        lineHeight: 22,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    source: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sourceIcon: {
        fontSize: 12,
        marginRight: 5,
    },
    sourceText: {
        fontSize: SIZES.body3,
        color: COLORS.textExtraLight,
    },
    time: {
        fontSize: SIZES.body3,
        color: COLORS.textLight,
    },
});
