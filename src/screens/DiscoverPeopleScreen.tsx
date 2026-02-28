import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import apiClient from '../api/apiClient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';

type DiscoverPeopleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DiscoverPeople'>;

interface DiscoverPeopleScreenProps {
    navigation: DiscoverPeopleScreenNavigationProp;
}

export default function DiscoverPeopleScreen({ navigation }: DiscoverPeopleScreenProps) {
    const { user } = useAuth();
    const { AndroidToast } = useApp();
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        navigation.setParams({ scrollY } as any);
    }, []);

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/users/${user.id}/suggestions`);
            // Filter only regular users (roleId 2)
            const filtered = (response.data || []).filter((u: any) => u.roleId === 2);
            setSuggestedUsers(filtered);
        } catch (error) {
            console.error('Error fetching suggestions for discover screen:', error);
            AndroidToast('Failed to load suggestions', 'error');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSuggestions();
    };

    const handleFollowUser = async (targetId: number) => {
        if (!user) return;
        try {
            await apiClient.post(`/users/${user.id}/follow/${targetId}`);
            setSuggestedUsers(prev => prev.filter(u => u.id !== targetId));
            AndroidToast('Follow request sent!');
        } catch (error) {
            console.error('Error following from discover screen:', error);
            AndroidToast('Failed to follow', 'error');
        }
    };

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={styles.userCard}>
            <TouchableOpacity
                style={styles.userInfo}
                onPress={() => navigation.navigate('OtherUserProfile', { userId: item.id.toString(), userName: item.username || item.name || 'User' })}
            >
                <Image
                    source={item.profilePicUrl ? { uri: item.profilePicUrl } : COLORS.defaultProfileImage}
                    style={styles.avatar}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.username} numberOfLines={1}>{item.username || item.name}</Text>
                    <Text style={styles.bio} numberOfLines={1}>{item.bio || 'Suggested for you'}</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.followBtn}
                onPress={() => handleFollowUser(item.id)}
            >
                <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => setSuggestedUsers(prev => prev.filter(u => u.id !== item.id))}
            >
                <Ionicons name="close" size={20} color={COLORS.gray} />
            </TouchableOpacity>
        </View>
    );

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.FlatList
                data={suggestedUsers}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderUserItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color={COLORS.gray} />
                        <Text style={styles.emptyText}>No suggestions available</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: 15,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    username: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    bio: {
        fontSize: 13,
        color: COLORS.textLight,
    },
    followBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 10,
    },
    followBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: 'bold',
    },
    dismissBtn: {
        padding: 5,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.gray,
        fontWeight: '500',
    },
});
