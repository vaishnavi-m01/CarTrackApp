import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { RootStackParamList } from '../navigation/MainNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsHighlight } from '../types/Community';

type NewsDetailRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;

export default function NewsDetailScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<NewsDetailRouteProp>();
    const { savedNewsIds, toggleSavedNews } = useApp();
    const news: NewsHighlight = route.params.news;

    const isSaved = savedNewsIds.includes(news.id);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${news.title}\n\nRead more at CarTrack Pro`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>News Details</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => toggleSavedNews(news.id)}
                    >
                        <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={22}
                            color={COLORS.white}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-social-outline" size={22} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={[styles.badge, { backgroundColor: news.isTrending ? COLORS.danger : COLORS.primary }]}>
                    <Text style={styles.badgeText}>{news.badgeText || (news.isTrending ? '🔥 TRENDING' : 'NEWS')}</Text>
                </View>

                <Text style={styles.title}>{news.title}</Text>

                <View style={styles.meta}>
                    <View style={styles.source}>
                        <Text style={styles.sourceIcon}>📰</Text>
                        <Text style={styles.sourceText}>{news.source || 'AutoNews'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.description}>{news.description}</Text>

                {/* Related News Section - Hidden when using real data to avoid crashes */}
                <View style={styles.relatedSection}>
                    <Text style={styles.relatedTitle}>Related News</Text>
                    <Text style={styles.emptyText}>Find more news in the News tab</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        gap: 10,
    },
    headerBtn: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    content: {
        padding: SIZES.padding,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 15,
        marginBottom: 15,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        lineHeight: 32,
        marginBottom: 15,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    source: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sourceIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    sourceText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    time: {
        fontSize: 14,
        color: COLORS.textExtraLight,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 20,
    },
    description: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        lineHeight: 26,
        marginBottom: 20,
    },
    bodyText: {
        fontSize: 16,
        color: COLORS.textLight,
        lineHeight: 24,
        marginBottom: 30,
    },
    relatedSection: {
        marginTop: 10,
        paddingBottom: 40,
    },
    relatedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
});
