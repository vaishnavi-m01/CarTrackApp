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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Header from '../components/Header';
import VehicleCard from '../components/VehicleCard';
import NewsCard from '../components/NewsCard';
import { useApp } from '../context/AppContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { vehicles, savedNewsIds, toggleSavedNews, fetchVehicles, isLoading: isAppLoading } = useApp();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [isVehicleModalVisible, setVehicleModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Sync selected vehicle with available vehicles
    React.useEffect(() => {
        if (vehicles.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(vehicles[0].id);
        }
    }, [vehicles, selectedVehicleId]);

    const selectedVehicle = vehicles.length > 0 ? (vehicles.find(v => v.id === selectedVehicleId) || vehicles[0]) : null;

    // Dynamic Mock Data based on selected vehicle
    const getDaysRemaining = (id: string, seed: number) => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % seed) + 5; // Variation between 5 and seed+5
    };

    const serviceDays = selectedVehicle ? getDaysRemaining(selectedVehicle.id, 25) : 15;
    const insuranceDays = selectedVehicle ? getDaysRemaining(selectedVehicle.id, 60) : 45;

    const stats = [
        { icon: '📅', label: 'Next Service', value: `${serviceDays} Days`, subtext: selectedVehicle?.model || 'General' },
        { icon: '🛡️', label: 'Insurance', value: `${insuranceDays} Days`, subtext: 'Expires Soon' },
    ];

    const quickActions = [
        { icon: 'water', label: 'Add Fuel', color: COLORS.primary },
        { icon: 'wallet', label: 'Expenses', color: COLORS.primary },
        { icon: 'build', label: 'Service', color: COLORS.primary },
        { icon: 'stats-chart', label: 'Reports', color: COLORS.primary },
        { icon: 'document-text', label: 'Documents', color: COLORS.primary },
        { icon: 'cart', label: 'Market', color: COLORS.primary },
        { icon: 'map', label: 'Trips', color: COLORS.primary },
        { icon: 'shield-checkmark', label: 'Insurance', color: COLORS.primary },
    ];

    const latestNews = [
        {
            id: 1,
            type: 'trending',
            badgeText: '🔥 TRENDING',
            title: 'Tesla Launches New Model Y with Advanced Autopilot Features',
            source: 'AutoNews India',
            time: '2 hours ago',
            description: 'Tesla has unveiled its latest Model Y variant featuring enhanced autopilot capabilities and improved range. The new model includes advanced driver assistance systems and promises a range of over 500 kilometers on a single charge.',
        },
        {
            id: 2,
            type: 'launch',
            badgeText: '⚡ NEW LAUNCH',
            title: 'Tata Motors Unveils Electric SUV Harrier EV at ₹32 Lakh',
            source: 'CarDekho',
            time: '5 hours ago',
            description: 'Tata Motors expands its EV portfolio with the new Harrier EV, featuring a 500km range. The electric SUV comes with fast charging capabilities and advanced connectivity features.',
        },
        {
            id: 3,
            type: 'price',
            badgeText: '💰 PRICE DROP',
            title: 'Hyundai Creta Gets ₹1.5 Lakh Discount This Month',
            source: 'Team-BHP',
            time: '1 day ago',
            description: 'Limited time offer on Hyundai Creta with attractive finance schemes and exchange bonuses. The discount is applicable on select variants and includes additional benefits.',
        },
    ];

    const handleNotification = () => {
        navigation.navigate('SystemNotifications' as any);
    };

    const handleQuickAction = (label: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        switch (label) {
            case 'Add Fuel':
                navigation.navigate('AddFuel');
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
            await fetchVehicles();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchVehicles]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <Header
                title='CarTrack Pro'
                logoImage={require('../assets/motorideLogo.png')}
                subtitle={selectedVehicle ? `Managing ${selectedVehicle.brand} ${selectedVehicle.model}` : "Welcome back,"}
                notificationCount={5}
                onNotificationPress={handleNotification}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 10 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={COLORS.gray} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search cars, brands, news..."
                            placeholderTextColor={COLORS.textExtraLight}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

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

                    {selectedVehicle ? (
                        <View>
                            <VehicleCard
                                vehicle={selectedVehicle!}
                                isActive={true}
                                onPress={() => navigation.navigate('VehicleDetails', { vehicle: selectedVehicle })}
                            />
                            {/* Service & Insurance Indicators */}
                            <View style={styles.indicatorsContainer}>
                                <View style={styles.indicatorCard}>
                                    <View style={[styles.indicatorIcon, { backgroundColor: '#FFEDD5' }]}>
                                        <Ionicons name="construct" size={18} color="#D97706" />
                                    </View>
                                    <View>
                                        <Text style={styles.indicatorLabel}>Next Service</Text>
                                        <Text style={styles.indicatorValue}>{serviceDays} Days Left</Text>
                                    </View>
                                </View>
                                <View style={styles.indicatorCard}>
                                    <View style={[styles.indicatorIcon, { backgroundColor: '#FEE2E2' }]}>
                                        <Ionicons name="shield-checkmark" size={18} color="#DC2626" />
                                    </View>
                                    <View>
                                        <Text style={styles.indicatorLabel}>Insurance</Text>
                                        <Text style={styles.indicatorValue}>{insuranceDays} Days Left</Text>
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
                            <Text style={styles.loanLabel}>Loan Amount</Text>
                            <Text style={styles.loanValue}>₹10 Lakh</Text>
                        </View>
                        <View style={styles.loanItem}>
                            <Text style={styles.loanLabel}>Monthly EMI</Text>
                            <Text style={styles.loanValue}>₹23,456</Text>
                        </View>
                        <View style={styles.loanItem}>
                            <Text style={styles.loanLabel}>Interest Rate</Text>
                            <Text style={styles.loanValue}>8.5% p.a.</Text>
                        </View>
                        <View style={styles.loanItem}>
                            <Text style={styles.loanLabel}>Tenure</Text>
                            <Text style={styles.loanValue}>5 Years</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.loanBtn}
                        onPress={() => navigation.navigate('LoanCalculator')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loanBtnText}>Calculate Your EMI</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Latest News Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Latest Auto News</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('News')}>
                            <Text style={styles.viewAll}>View All →</Text>
                        </TouchableOpacity>
                    </View>
                    {latestNews.map((news) => (
                        <NewsCard
                            key={news.id}
                            news={{ ...news, id: news.id }}
                            isSaved={savedNewsIds.includes(news.id)}
                            onSave={() => toggleSavedNews(news.id)}
                            onPress={() => navigation.navigate('NewsDetail', { news })}
                        />
                    ))}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

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
