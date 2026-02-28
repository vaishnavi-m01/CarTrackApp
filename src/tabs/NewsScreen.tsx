import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import NewsCard from '../components/NewsCard';
import { useApp } from '../context/AppContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import apiClient from '../api/apiClient';
import { NewsHighlight, NewsCategory } from '../types/Community';

export default function NewsScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { savedNewsIds, toggleSavedNews } = useApp();
    const [selectedCategoryName, setSelectedCategoryName] = useState('All');
    const [newsHighlights, setNewsHighlights] = useState<NewsHighlight[]>([]);
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        navigation.setParams({ scrollY } as any);
    }, []);

    // Initial load: Fetch categories only
    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch news whenever the selected category changes
    useEffect(() => {
        fetchNews(selectedCategoryName);
    }, [selectedCategoryName, categories]); // categories dependency ensures we have IDs

    const fetchCategories = async () => {
        try {
            const response = await apiClient.get('/news-categories');
            const catData: NewsCategory[] = response.data || [];
            setCategories(catData);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchNews = async (categoryName: string) => {
        setIsLoading(true);
        try {
            let endpoint = '/news-highlights';

            if (categoryName === 'Trending') {
                endpoint = '/news-highlights/trending';
            } else if (categoryName !== 'All') {
                const selectedCat = categories.find(c => c.name === categoryName);
                if (selectedCat) {
                    endpoint = `/news-highlights/category/${selectedCat.id}`;
                } else if (categories.length > 0) {
                    // Category not found yet, wait for categories to load
                    setIsLoading(false);
                    return;
                }
            }

            const response = await apiClient.get(endpoint);
            setNewsHighlights(response.data || []);
        } catch (error) {
            console.error('Error fetching news:', error);
            setNewsHighlights([]);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchCategories(),
            fetchNews(selectedCategoryName)
        ]);
        setIsRefreshing(false);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

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
                    {['All', 'Trending', ...categories.map(c => c.name)].map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryBtn,
                                selectedCategoryName === category && styles.categoryBtnActive,
                            ]}
                            onPress={() => setSelectedCategoryName(category)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategoryName === category && styles.categoryTextActive,
                                ]}
                            >
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* News List */}
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.newsList}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            >
                {newsHighlights.length > 0 ? (
                    newsHighlights.map((news) => (
                        <NewsCard
                            key={news.id}
                            news={news}
                            isSaved={savedNewsIds.includes(news.id)}
                            onSave={() => toggleSavedNews(news.id)}
                            onPress={() =>
                                navigation.navigate('NewsDetail', { news })
                            }
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="newspaper-outline" size={60} color={COLORS.gray} />
                        <Text style={styles.emptyText}>No news highlights available for this category</Text>
                    </View>
                )}
            </Animated.ScrollView>
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 15,
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
