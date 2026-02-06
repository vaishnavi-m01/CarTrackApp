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
import NewsCard from '../components/NewsCard';

type NewsDetailRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;

export default function NewsDetailScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<NewsDetailRouteProp>();
    const { savedNewsIds, toggleSavedNews } = useApp();
    const { news } = route.params;

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
                <View style={[styles.badge, { backgroundColor: news.type === 'trending' ? COLORS.danger : news.type === 'launch' ? COLORS.primary : COLORS.success }]}>
                    <Text style={styles.badgeText}>{news.badgeText}</Text>
                </View>

                <Text style={styles.title}>{news.title}</Text>

                <View style={styles.meta}>
                    <View style={styles.source}>
                        <Text style={styles.sourceIcon}>📰</Text>
                        <Text style={styles.sourceText}>{news.source}</Text>
                    </View>
                    <Text style={styles.time}>{news.time}</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.description}>{news.description}</Text>

                <Text style={styles.bodyText}>
                    The automotive industry is witnessing a significant shift towards electrification and smart mobility. This latest update marks a crucial milestone in how manufacturers are approaching the future of transportation.
                    {"\n\n"}
                    With improved battery technology and autonomous driving features, users can expect a more seamless and safer driving experience. Experts suggest that these innovations will redefine the standards for the next generation of vehicles.
                </Text>

                {/* Related News Section */}
                <View style={styles.relatedSection}>
                    <Text style={styles.relatedTitle}>Related News</Text>
                    {[
                        {
                            id: 101,
                            type: 'trending',
                            badgeText: '🔥 TRENDING',
                            title: 'How Electric Vehicles are Changing the Indian Market',
                            source: 'AutoToday',
                            time: '3 hours ago',
                            description: 'A deep dive into the rapid adoption of EVs across major Indian cities and the infrastructure growth supporting it.',
                        },
                        {
                            id: 102,
                            type: 'launch',
                            badgeText: '⚡ NEW LAUNCH',
                            title: 'Upcoming SUV Launches to Watch Out For in 2026',
                            source: 'CarWale',
                            time: '6 hours ago',
                            description: 'A comprehensive list of the most anticipated SUV launches from top brands like Maruti, Hyundai, and Tata.',
                        }
                    ].map((item) => (
                        <NewsCard
                            key={item.id}
                            news={item}
                            isSaved={savedNewsIds.includes(item.id)}
                            onSave={() => toggleSavedNews(item.id)}
                            onPress={() => navigation.push('NewsDetail', { news: item })}
                        />
                    ))}
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
});
