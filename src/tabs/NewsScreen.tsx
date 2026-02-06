import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import NewsCard from '../components/NewsCard';
import { useApp } from '../context/AppContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';

interface NewsItem {
    id: number;
    type: string;
    badgeText: string;
    title: string;
    source: string;
    time: string;
    description: string;
}

export default function NewsScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { savedNewsIds, toggleSavedNews } = useApp();
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Trending', 'Launches', 'Reviews', 'Tech'];

    const newsData: NewsItem[] = [
        {
            id: 1,
            type: 'trending',
            badgeText: '🔥 TRENDING',
            title: 'Tesla Launches New Model Y with Advanced Autopilot Features',
            source: 'AutoNews India',
            time: '2 hours ago',
            description: 'Tesla has unveiled its latest Model Y variant featuring enhanced autopilot capabilities and improved range.',
        },
        {
            id: 2,
            type: 'launch',
            badgeText: '⚡ NEW LAUNCH',
            title: 'Tata Motors Unveils Electric SUV Harrier EV at ₹32 Lakh',
            source: 'CarDekho',
            time: '5 hours ago',
            description: 'Tata Motors expands its EV portfolio with the new Harrier EV, featuring a 500km range.',
        },
        {
            id: 3,
            type: 'price',
            badgeText: '💰 PRICE DROP',
            title: 'Hyundai Creta Gets ₹1.5 Lakh Discount This Month',
            source: 'Team-BHP',
            time: '1 day ago',
            description: 'Limited time offer on Hyundai Creta with attractive finance schemes and exchange bonuses.',
        },
        {
            id: 4,
            type: 'trending',
            badgeText: '🔥 TRENDING',
            title: 'BMW Unveils All-New M3 Competition with 503 HP',
            source: 'Auto Express',
            time: '1 day ago',
            description: 'The new M3 Competition brings unprecedented performance and luxury to the sports sedan segment.',
        },
        {
            id: 5,
            type: 'launch',
            badgeText: '⚡ NEW LAUNCH',
            title: 'Mahindra Scorpio N Variants Launched Starting at ₹12 Lakh',
            source: 'AutoCar India',
            time: '2 days ago',
            description: 'Mahindra launches the all-new Scorpio N with multiple powertrain options and advanced features.',
        },
        {
            id: 6,
            type: 'price',
            badgeText: '💰 PRICE DROP',
            title: 'Maruti Suzuki Announces Year-End Discounts Up to ₹80,000',
            source: 'CarWale',
            time: '3 days ago',
            description: 'Attractive discounts across multiple Maruti Suzuki models including Brezza, Ertiga, and Swift.',
        },
    ];

    return (
        <View style={styles.container}>
            {/* Categories Filter */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categories}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryBtn,
                                selectedCategory === category && styles.categoryBtnActive,
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategory === category && styles.categoryTextActive,
                                ]}
                            >
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* News List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.newsList}
            >
                {newsData.map((news) => (
                    <NewsCard
                        key={news.id}
                        news={news}
                        isSaved={savedNewsIds.includes(news.id)}
                        onSave={() => toggleSavedNews(news.id)}
                        onPress={() =>
                            navigation.navigate('NewsDetail', { news })
                        }
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    filterContainer: {
        backgroundColor: COLORS.white,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    categories: {
        paddingHorizontal: 15,
    },
    categoriesContent: {
        paddingRight: 30, // Spacing for safe horizontal scroll
    },
    categoryBtn: {
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    categoryBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.light,
    },
    categoryText: {
        color: COLORS.textLight,
        fontSize: 14,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    newsList: {
        padding: SIZES.padding,
        paddingBottom: 100,
    },
});
