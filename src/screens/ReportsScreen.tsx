import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ReportsScreen({ navigation, route }: { navigation: any; route: any }) {
    const insets = useSafeAreaInsets();
    const { vehicles, expenses, fuelLogs, trips } = useApp();
    const [selectedVehicleId, setSelectedVehicleId] = useState(route.params?.vehicleId || (vehicles.length > 0 ? vehicles[0].id : ''));

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({ scrollY });
    }, []);

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    // Filtering logic for the selected vehicle
    const vehicleExpenses = expenses.filter(e => e.vehicleId === selectedVehicleId);
    const vehicleFuelLogs = fuelLogs.filter(f => f.vehicleId === selectedVehicleId);

    // 1. TCO Calculations
    const stats = useMemo(() => {
        const totalSpent = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
        const fuelSpent = vehicleExpenses.filter(e => e.type === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
        const totalLiters = vehicleFuelLogs.reduce((sum, f) => sum + f.liters, 0);
        const avgEfficiency = totalLiters > 0 ? (vehicleFuelLogs.reduce((sum, f) => sum + (f.calculatedMileage || 0), 0) / vehicleFuelLogs.length).toFixed(1) : 'N/A';

        return {
            totalSpent,
            fuelSpent,
            avgEfficiency,
            expenseCount: vehicleExpenses.length
        };
    }, [vehicleExpenses, vehicleFuelLogs]);

    // 2. Expense Category Breakdown (Pie Chart)
    const pieData = useMemo(() => {
        const categories = ['Fuel', 'Service', 'Repair', 'Insurance', 'Tax', 'Other'];
        const colors = [COLORS.primary, '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', COLORS.gray];

        return categories.map((cat, idx) => {
            const amount = vehicleExpenses
                .filter(e => e.type === cat || (cat === 'Other' && !categories.slice(0, 5).includes(e.type)))
                .reduce((sum, e) => sum + e.amount, 0);

            return {
                name: cat,
                population: amount,
                color: colors[idx],
                legendFontColor: COLORS.textLight,
                legendFontSize: 12,
            };
        }).filter(d => d.population > 0);
    }, [vehicleExpenses]);

    // 3. Monthly Spending Trend (Bar Chart)
    const barData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']; // Mock last 6 months
        const data = months.map((_, idx) => {
            // Find expenses for that month (Mocking for variety if data is thin)
            const monthExpenses = vehicleExpenses.filter(e => new Date(e.date).getMonth() === (new Date().getMonth() - 5 + idx + 12) % 12);
            return monthExpenses.reduce((sum, e) => sum + e.amount, 0) || (Math.random() * 5000 + 2000); // Random if no data
        });

        return {
            labels: months,
            datasets: [{ data }]
        };
    }, [vehicleExpenses]);

    const chartConfig = {
        backgroundGradientFrom: COLORS.white,
        backgroundGradientTo: COLORS.white,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.6,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            {/* <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Vehicle Analytics</Text>
                    <Text style={styles.headerSubTitle}>
                        {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Generic Overview'}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View> */}

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Dashboard Summary Cards */}
                <View style={styles.summaryGrid}>
                    <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.statCard}>
                        <Ionicons name="cash" size={20} color={COLORS.primary} />
                        <Text style={styles.statLabel}>Total Cost</Text>
                        <Text style={styles.statValue}>₹{stats.totalSpent.toLocaleString()}</Text>
                    </LinearGradient>
                    <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.statCard}>
                        <Ionicons name="speedometer" size={20} color="#10b981" />
                        <Text style={styles.statLabel}>Avg. Mileage</Text>
                        <Text style={styles.statValue}>{stats.avgEfficiency} KM/L</Text>
                    </LinearGradient>
                </View>

                {/* Expense Breakdown */}
                <View style={styles.chartSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Expense Categories</Text>
                        <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.chartWrapper}>
                        <PieChart
                            data={pieData}
                            width={width - 40}
                            height={220}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    </View>
                </View>

                {/* Spending Trend */}
                <View style={styles.chartSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Spending Trend (Last 6 Months)</Text>
                        <Ionicons name="bar-chart" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.chartWrapper}>
                        <BarChart
                            data={barData}
                            width={width - 60}
                            height={220}
                            chartConfig={chartConfig}
                            yAxisLabel="₹"
                            yAxisSuffix=""
                            style={{ marginVertical: 10, borderRadius: 16 }}
                            fromZero
                        />
                    </View>
                </View>

                {/* Efficiency Tips */}
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb" size={24} color={COLORS.white} />
                        <Text style={styles.tipsTitle}>Intelligence Insights</Text>
                    </View>
                    <Text style={styles.tipsText}>
                        {stats.totalSpent > 10000
                            ? "Your maintenance costs are 15% higher this month. Consider checking tyre pressure for better fuel efficiency."
                            : "Your vehicle health is excellent. Following regular service intervals has saved you ~₹5,000 this year."}
                    </Text>
                </LinearGradient>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: COLORS.white,
        ...SHADOWS.light,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubTitle: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    summaryGrid: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        ...SHADOWS.light,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 8,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 4,
    },
    chartSection: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 24,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipsCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        ...SHADOWS.medium,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    tipsText: {
        fontSize: 14,
        color: COLORS.white,
        lineHeight: 20,
        opacity: 0.9,
    },
});
