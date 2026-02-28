import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    Modal,
    RefreshControl,
    Image,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Header from '../components/Header';
import VehicleCard from '../components/VehicleCard';
import NewsCard from '../components/NewsCard';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import apiClient from '../api/apiClient';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const { vehicles, savedNewsIds, toggleSavedNews, fetchVehicles, isLoading: isAppLoading, AndroidToast, systemUnreadCount } = useApp();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [isVehicleModalVisible, setVehicleModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [latestNews, setLatestNews] = useState<any[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [serviceStat, setServiceStat] = useState<{ label: string; urgent: boolean } | null>(null);
    const [insuranceStat, setInsuranceStat] = useState<{ label: string; urgent: boolean } | null>(null);

    // Fetch latest news on mount
    React.useEffect(() => {
        fetchLatestNews();
        fetchSuggestions();
    }, [user?.id]);

    // Refresh vehicles every time the screen is focused
    useFocusEffect(
        React.useCallback(() => {
            fetchVehicles();
        }, [])
    );

    const fetchSuggestions = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/users/${user.id}/suggestions`);
            let users = response.data?.filter((u: any) => u.roleId === 2) || [];

            if (users.length === 0) {
                // Fallback data if API returns empty
                users = [
                    { id: 991, username: 'car_enthusiast', profilePicUrl: 'https://ui-avatars.com/api/?name=Car+Enthusiast&background=random', roleId: 2 },
                    { id: 992, username: 'speed_demon', profilePicUrl: 'https://ui-avatars.com/api/?name=Speed+Demon&background=random', roleId: 2 },
                    { id: 993, username: 'vintage_collector', profilePicUrl: 'https://ui-avatars.com/api/?name=Vintage+Collector&background=random', roleId: 2 }
                ];
            }
            setSuggestedUsers(users);
        } catch (error) {
            console.error('Error fetching suggestions for home screen:', error);
            setSuggestedUsers([
                { id: 991, username: 'car_enthusiast', profilePicUrl: 'https://ui-avatars.com/api/?name=Car+Enthusiast&background=random', roleId: 2 },
                { id: 992, username: 'speed_demon', profilePicUrl: 'https://ui-avatars.com/api/?name=Speed+Demon&background=random', roleId: 2 },
            ]);
        }
    };

    const fetchLatestNews = async () => {
        try {
            const response = await apiClient.get('/news-highlights');
            const data = response.data || [];
            // Take the top 3 items for the home screen
            setLatestNews(data.slice(0, 3));
        } catch (error) {
            console.error('Error fetching latest news for home screen:', error);
        }
    };

    // Sync selected vehicle with available vehicles
    React.useEffect(() => {
        if (vehicles.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(vehicles[0].id);
        }
    }, [vehicles, selectedVehicleId]);

    // Fetch real-time service and insurance stats when vehicle changes
    React.useEffect(() => {
        if (selectedVehicleId) {
            fetchServiceStat(selectedVehicleId);
            fetchInsuranceStat(selectedVehicleId);
        }
    }, [selectedVehicleId]);

    // Parse "yyyy-MM-dd" as LOCAL date (avoids UTC timezone shift from new Date("yyyy-MM-dd"))
    const getDaysFromNow = (dateStr: string): number => {
        const parts = dateStr.split('-'); // ["2026", "02", "28"]
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // month is 0-indexed
        const day = parseInt(parts[2], 10);
        const target = new Date(year, month, day); // local midnight, no UTC shift
        const today = new Date();
        today.setHours(0, 0, 0, 0); // compare date only, not time
        return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const fetchServiceStat = async (vehicleId: string) => {
        try {
            const res = await apiClient.get(`/services/upcoming/${vehicleId}`);
            const data = res.data;
            if (data?.targetDate) {
                const days = getDaysFromNow(data.targetDate);
                if (days <= 0) {
                    setServiceStat({ label: 'Overdue!', urgent: true });
                } else {
                    setServiceStat({ label: `${days} Days`, urgent: days <= 7 });
                }
            } else {
                setServiceStat({ label: 'N/A', urgent: false });
            }
        } catch {
            setServiceStat({ label: 'N/A', urgent: false });
        }
    };

    const fetchInsuranceStat = async (vehicleId: string) => {
        try {
            const res = await apiClient.get(`/insurance?vehicleId=${vehicleId}`);
            const insurances: any[] = res.data || [];
            console.log('🛡️ Insurance API response:', JSON.stringify(insurances));
            // Case-insensitive status check to handle enum variations
            const active = insurances
                .filter((i: any) => i.expiryDate && String(i.status).toUpperCase() === 'ACTIVE')
                .sort((a: any, b: any) => {
                    const dateA = a.expiryDate.split('-');
                    const dateB = b.expiryDate.split('-');
                    const dA = new Date(+dateA[0], +dateA[1] - 1, +dateA[2]).getTime();
                    const dB = new Date(+dateB[0], +dateB[1] - 1, +dateB[2]).getTime();
                    return dA - dB; // nearest first
                });
            console.log('🛡️ Filtered active insurances:', active.length, active[0]?.expiryDate);
            if (active.length > 0) {
                const days = getDaysFromNow(active[0].expiryDate);
                console.log('🛡️ Days remaining:', days);
                if (days <= 0) {
                    setInsuranceStat({ label: 'Expired!', urgent: true });
                } else {
                    setInsuranceStat({ label: `${days} Days`, urgent: days <= 15 });
                }
            } else {
                setInsuranceStat({ label: 'N/A', urgent: false });
            }
        } catch (err) {
            console.error('🛡️ Insurance fetch error:', err);
            setInsuranceStat({ label: 'N/A', urgent: false });
        }
    };

    const selectedVehicle = vehicles.length > 0 ? (vehicles.find(v => v.id === selectedVehicleId) || vehicles[0]) : null;

    // Dynamic Loan Estimations for Home Screen Banner
    const loanPrincipal = selectedVehicle?.purchasePrice ? parseFloat(selectedVehicle.purchasePrice.replace(/,/g, '')) : 1000000;
    const loanRate = 8.5 / 12 / 100;
    const loanMonths = 5 * 12;
    const estimatedEmi = loanPrincipal > 0 ? (loanPrincipal * loanRate * Math.pow(1 + loanRate, loanMonths)) / (Math.pow(1 + loanRate, loanMonths) - 1) : 0;

    const formattedPrincipal = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(loanPrincipal);
    const formattedEmi = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(estimatedEmi));

    const stats = [
        {
            icon: '📅',
            label: 'Next Service',
            value: serviceStat?.label ?? '...',
            subtext: selectedVehicle?.model || 'General',
            urgent: serviceStat?.urgent ?? false,
        },
        {
            icon: '🛡️',
            label: 'Insurance',
            value: insuranceStat?.label ?? '...',
            subtext: 'Expiry',
            urgent: insuranceStat?.urgent ?? false,
        },
    ];

    const quickActions = [
        { icon: 'water', label: 'Add Fuel', color: COLORS.primary },
        { icon: 'car-sport', label: 'Add Vehicle', color: COLORS.primary },
        { icon: 'wallet', label: 'Expenses', color: COLORS.primary },
        { icon: 'build', label: 'Service', color: COLORS.primary },
        { icon: 'document-text', label: 'Documents', color: COLORS.primary },
        { icon: 'cart', label: 'Market', color: COLORS.primary },
        { icon: 'map', label: 'Trips', color: COLORS.primary },
        { icon: 'shield-checkmark', label: 'Insurance', color: COLORS.primary },
    ];

    const handleNotification = () => {
        navigation.navigate('SystemNotifications' as any);
    };

    const handleQuickAction = (label: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        switch (label) {
            case 'Add Fuel':
                navigation.navigate('AddFuel', { vehicleId: selectedVehicle?.id });
                break;
            case 'Add Vehicle':
                navigation.navigate('AddVehicle');
                break;
            case 'Expenses':
                navigation.navigate('Expenses');
                break;
            case 'Service':
                navigation.navigate('ServiceRecords', { vehicleId: selectedVehicle?.id });
                break;
            case 'Reports':
                navigation.navigate('Reports', { vehicleId: selectedVehicle?.id });
                break;
            case 'Market':
                // @ts-ignore - Market is part of MainTabs
                navigation.navigate('Market');
                break;
            case 'Trips':
                navigation.navigate('Trips', { vehicleId: selectedVehicle?.id });
                break;
            case 'Insurance':
                navigation.navigate('Insurance', { vehicleId: selectedVehicle?.id });
                break;
            case 'Documents':
                navigation.navigate('VehicleDocuments', { vehicleId: selectedVehicle?.id || '' });
                break;
            default:
                Alert.alert('Quick Action', `Opening ${label}...`);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Promise.all([fetchVehicles(), fetchLatestNews(), fetchSuggestions()]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchVehicles, user]);

    const handleFollowSuggestedUser = async (targetId: number) => {
        if (!user) return;
        try {
            await apiClient.post(`/users/${user.id}/follow/${targetId}`);
            setSuggestedUsers(prev => prev.filter(u => u.id !== targetId));
            AndroidToast('Follow request sent successfully!');
        } catch (error) {
            console.error('Error following suggested user from home screen:', error);
            AndroidToast('Failed to follow user', 'error');
        }
    };

    // Filter content
    const filteredVehicles = (vehicles || []).filter(v => {
        return true; // Search query logic removed
    });

    const filteredNews = (latestNews || []);

    const filteredSuggestions = (suggestedUsers || []).filter(s => {
        // Only show regular users (roleId 2), exclude admins or other roles
        return s.roleId === 2;
    });

    const scrollY = React.useRef(new Animated.Value(0)).current;

    return (
        <View style={styles.container}>
            {/* Header */}
            <Header
                title='CarTrack Pro'
                logoImage={require('../assets/motorideLogo.png')}
                subtitle={selectedVehicle ? `Managing ${selectedVehicle.brand} ${selectedVehicle.model}` : "Welcome back,"}
                notificationCount={systemUnreadCount}
                onNotificationPress={handleNotification}
                scrollY={scrollY}
            />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 10 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >

                <View style={[styles.section, { marginTop: 5 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionHeaderLeft}>
                            <Text style={styles.sectionTitle}>My Vehicles</Text>
                            <TouchableOpacity
                                style={styles.addIconBtn}
                                onPress={() => navigation.navigate('AddVehicle')}
                            >
                                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sectionHeaderRight}>
                            <TouchableOpacity
                                style={styles.switchVehicleBtn}
                                onPress={() => setVehicleModalVisible(true)}
                            >
                                <Text style={styles.switchVehicleText}>Switch</Text>
                                <Ionicons name="swap-horizontal" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('MyVehicles')}>
                                <Text style={styles.viewAll}>View All →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {filteredVehicles.length > 0 ? (
                        <View>
                            <VehicleCard
                                vehicle={filteredVehicles[0]}
                                isActive={true}
                                onPress={() => navigation.navigate('VehicleDetails', { vehicle: filteredVehicles[0] })}
                            />
                            {/* Service & Insurance Indicators */}
                            <View style={styles.indicatorsContainer}>
                                <View style={styles.indicatorCard}>
                                    <View style={[styles.indicatorIcon, { backgroundColor: serviceStat?.urgent ? '#FEF3C7' : '#FFEDD5' }]}>
                                        <Ionicons name="construct" size={18} color={serviceStat?.urgent ? '#D97706' : '#D97706'} />
                                    </View>
                                    <View>
                                        <Text style={styles.indicatorLabel}>Next Service</Text>
                                        <Text style={[styles.indicatorValue, serviceStat?.urgent && { color: '#D97706', fontWeight: '700' }]}>
                                            {serviceStat?.label ?? '...'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.indicatorCard}>
                                    <View style={[styles.indicatorIcon, { backgroundColor: insuranceStat?.urgent ? '#FEE2E2' : '#FEE2E2' }]}>
                                        <Ionicons name="shield-checkmark" size={18} color={insuranceStat?.urgent ? '#DC2626' : '#DC2626'} />
                                    </View>
                                    <View>
                                        <Text style={styles.indicatorLabel}>Insurance</Text>
                                        <Text style={[styles.indicatorValue, insuranceStat?.urgent && { color: '#DC2626', fontWeight: '700' }]}>
                                            {insuranceStat?.label ?? '...'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="car-sport-outline" size={40} color={COLORS.gray} />
                            <Text style={styles.emptyText}>No vehicles added yet</Text>
                        </View>
                    )}

                    {/* <TouchableOpacity
                        style={styles.addVehicleBtn}
                        onPress={() => navigation.navigate('AddVehicle')}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.addVehicleGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="add" size={24} color={COLORS.white} />
                            <Text style={styles.addVehicleText}>Add New Vehicle</Text>
                        </LinearGradient>
                    </TouchableOpacity> */}
                </View>

                {/* Quick Actions (2x4 Grid) */}
                <View style={styles.quickActionsSection}>
                    <Text style={styles.sectionTitleSmall}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.actionBtn}
                                onPress={() => handleQuickAction(action.label)}
                            >
                                <View style={styles.actionIconContainer}>
                                    <LinearGradient
                                        colors={['#F8FAFC', '#F1F5F9']}
                                        style={styles.actionIconBg}
                                    >
                                        <Ionicons name={action.icon as any} size={24} color={COLORS.primary} />
                                    </LinearGradient>
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Suggested Users Section */}
                {suggestedUsers.length > 0 && (
                    <View style={styles.suggestionsSection}>
                        <View style={styles.suggestionsHeader}>
                            <Text style={styles.sectionTitle}>Suggested for You</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('DiscoverPeople')}>
                                <Text style={styles.viewAll}>See All →</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsList}>
                            {filteredSuggestions.map((sUser) => (
                                <View key={sUser.id} style={styles.suggestionCard}>
                                    <TouchableOpacity
                                        style={styles.suggestionDismissBtn}
                                        onPress={() => setSuggestedUsers(prev => prev.filter(u => u.id !== sUser.id))}
                                    >
                                        <Ionicons name="close" size={16} color={COLORS.gray} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.suggestionAvatarContainer}
                                        onPress={() => (navigation as any).navigate('OtherUserProfile', { userId: sUser.id, userName: sUser.username || sUser.name || 'User' })}
                                    >
                                        <Image
                                            source={sUser.profilePicUrl ? { uri: sUser.profilePicUrl } : COLORS.defaultProfileImage}
                                            style={styles.suggestionAvatar}
                                        />
                                    </TouchableOpacity>
                                    <Text style={styles.suggestionName} numberOfLines={1}>{sUser.username || sUser.name}</Text>
                                    <Text style={styles.suggestionReason} numberOfLines={1}>Suggested for you</Text>
                                    <TouchableOpacity
                                        style={styles.followBtnSmall}
                                        onPress={() => handleFollowSuggestedUser(sUser.id)}
                                    >
                                        <Text style={styles.followBtnTextSmall}>Follow</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Vehicle Comparison Feature */}
                <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    style={styles.compareCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.compareHeader}>
                        <Text style={styles.compareTitle}>Compare Vehicles</Text>
                        <Text style={styles.compareIcon}>🔄</Text>
                    </View>
                    <Text style={styles.compareDescription}>
                        Compare specs, prices, and features of your favorite cars side by side
                    </Text>
                    <TouchableOpacity
                        style={styles.compareBtn}
                        onPress={() => navigation.navigate('Comparison')}
                    >
                        <Text style={styles.compareBtnText}>⚖️ Start Comparing</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Loan Calculator */}
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.loanCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.loanHeader}>
                        <View style={styles.loanTitleContainer}>
                            <Ionicons name="calculator" size={24} color={COLORS.white} />
                            <Text style={styles.loanTitle}>Loan Calculator</Text>
                        </View>
                        <View style={styles.loanIconContainer}>
                            <Ionicons name="card" size={28} color={COLORS.white} />
                        </View>
                    </View>
                    <View style={styles.loanInfo}>
                        <View style={styles.loanItem}>
                            <Text style={styles.loanLabel}>Vehicle</Text>
                            <Text style={styles.loanValue} numberOfLines={1}>{selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Generic Car'}</Text>
                        </View>
                        <View style={styles.loanItem}>
                            <Text style={styles.loanLabel}>Est. Price</Text>
                            <Text style={styles.loanValue}>₹{formattedPrincipal}</Text>
                        </View>
                        <View style={styles.loanItem}>
                            <Text style={styles.loanLabel}>Est. EMI</Text>
                            <Text style={styles.loanValue}>₹{formattedEmi}</Text>
                        </View>
                        <View style={styles.loanItem}>
                            <Text style={styles.loanLabel}>Rate/Tenure</Text>
                            <Text style={styles.loanValue}>8.5% / 5 Yrs</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.loanBtn}
                        onPress={() => navigation.navigate('LoanCalculator', { amount: loanPrincipal.toString() })}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loanBtnText}>Calculate Your EMI</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Latest News Section */}
                {latestNews.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Latest Auto News</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('News')}>
                                <Text style={styles.viewAll}>View All →</Text>
                            </TouchableOpacity>
                        </View>
                        {filteredNews.map((news) => (
                            <NewsCard
                                key={news.id}
                                news={{ ...news, id: news.id }}
                                isSaved={savedNewsIds.includes(news.id)}
                                onSave={() => toggleSavedNews(news.id)}
                                onPress={() => navigation.navigate('NewsDetail', { news })}
                            />
                        ))}
                    </View>
                )}

                <View style={{ height: 20 }} />
            </Animated.ScrollView>

            {/* Vehicle Selection Modal */}
            <Modal
                visible={isVehicleModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setVehicleModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVehicleModalVisible(false)}
                >
                    <View style={styles.dropdownContent}>
                        <Text style={styles.modalHeader}>Select Your Vehicle</Text>
                        {vehicles.map((v, index) => (
                            <TouchableOpacity
                                key={v.id}
                                style={[
                                    styles.modalItem,
                                    selectedVehicleId === v.id && styles.modalItemActive,
                                    index === vehicles.length - 1 && { borderBottomWidth: 0 }
                                ]}
                                onPress={() => {
                                    setSelectedVehicleId(v.id);
                                    setVehicleModalVisible(false);
                                }}
                            >
                                <View style={styles.modalItemContent}>
                                    <Ionicons
                                        name="car-outline"
                                        size={20}
                                        color={selectedVehicleId === v.id ? COLORS.primary : COLORS.textLight}
                                        style={{ marginRight: 12 }}
                                    />
                                    <Text style={[styles.modalItemText, selectedVehicleId === v.id && styles.modalItemTextActive]}>
                                        {v.brand} {v.model}
                                    </Text>
                                </View>
                                {selectedVehicleId === v.id && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: SIZES.padding,
        // marginTop: -15,
        marginTop: 10
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 25,
        ...SHADOWS.light,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: SIZES.body2,
        color: COLORS.text,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginTop: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
    },
    quickActionsSection: {
        backgroundColor: COLORS.white,
        marginHorizontal: SIZES.padding,
        marginTop: 15,
        padding: 15,
        borderRadius: 20,
        ...SHADOWS.light,
    },
    sectionTitleSmall: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
        marginLeft: 5,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionBtn: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 15,
    },
    actionIconContainer: {
        marginBottom: 8,
    },
    actionIconBg: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    actionLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        fontWeight: '600',
        textAlign: 'center',
    },
    suggestionsSection: {
        marginTop: 20,
        paddingBottom: 5,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        marginBottom: 15,
    },
    suggestionsList: {
        paddingHorizontal: SIZES.padding,
    },
    suggestionCard: {
        width: 140,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#DBDBDB',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginRight: 10,
        // ...SHADOWS.light, // Uncomment if you want a slight shadow
    },
    suggestionDismissBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        padding: 4,
    },
    suggestionAvatarContainer: {
        marginTop: 5,
        marginBottom: 10,
    },
    suggestionAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    suggestionName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 2,
        width: '100%'
    },
    suggestionReason: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: 15,
    },
    followBtnSmall: {
        backgroundColor: COLORS.primary, // Instagram bright blue
        width: '100%',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    followBtnTextSmall: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: 'bold',
    },
    indicatorsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    indicatorCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 15,
        gap: 10,
        ...SHADOWS.light,
    },
    indicatorIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorLabel: {
        fontSize: 10,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    indicatorValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    compareCard: {
        marginHorizontal: SIZES.padding,
        marginTop: 15,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        ...SHADOWS.medium,
    },
    compareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    compareTitle: {
        fontSize: SIZES.h4,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    compareIcon: {
        fontSize: 32,
    },
    compareDescription: {
        fontSize: SIZES.body3,
        color: COLORS.white,
        opacity: 0.9,
        marginBottom: 12,
    },
    compareBtn: {
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        alignSelf: 'flex-start',
    },
    compareBtnText: {
        color: '#f5576c',
        fontWeight: 'bold',
        fontSize: SIZES.body2,
    },
    loanCard: {
        marginHorizontal: SIZES.padding,
        marginTop: 15,
        padding: 20,
        borderRadius: 24,
        ...SHADOWS.medium,
    },
    loanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    loanTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loanTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    loanIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loanInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 15,
    },
    loanItem: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        padding: 14,
        borderRadius: 16,
        width: '47%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    loanLabel: {
        fontSize: 12,
        color: COLORS.white,
        opacity: 0.95,
        marginBottom: 6,
        fontWeight: '500',
    },
    loanValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    loanBtn: {
        backgroundColor: COLORS.white,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...SHADOWS.light,
    },
    loanBtnText: {
        color: '#059669',
        fontWeight: 'bold',
        fontSize: 15,
    },
    section: {
        paddingHorizontal: SIZES.padding,
        marginTop: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: SIZES.h3,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    viewAll: {
        color: COLORS.primary,
        fontSize: SIZES.body2,
    },
    addVehicleBtn: {
        marginTop: 20,
    },
    addVehicleGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        gap: 10,
        ...SHADOWS.medium,
    },
    addVehicleText: {
        color: COLORS.white,
        fontSize: SIZES.body1,
        fontWeight: 'bold',
    },
    emptyCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.textLight,
        fontSize: 14,
        fontWeight: '500',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    addIconBtn: {
        marginLeft: -2,
    },
    switchVehicleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    switchVehicleText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    headerVehicleSelector: {
        display: 'none', // Removed from header
    },
    headerVehicleText: {
        display: 'none',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContent: {
        backgroundColor: COLORS.white,
        width: '85%',
        maxHeight: '60%',
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.dark,
        elevation: 15,
    },
    dropdownCaret: {
        display: 'none', // No caret needed for center modal
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalItemActive: {
        backgroundColor: '#F0F9FF',
        borderRadius: 15,
        borderBottomWidth: 0,
    },
    modalItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalItemText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    modalItemTextActive: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    addIconSmall: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
});
