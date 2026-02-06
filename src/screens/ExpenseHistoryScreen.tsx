import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp, Expense } from '../context/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';

type Period = 'Week' | 'Month' | 'Year';

export default function ExpenseHistoryScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { vehicleId } = route.params as { vehicleId?: string } || {};
    const { expenses, getVehicleById } = useApp();
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('Month');

    const vehicle = vehicleId ? getVehicleById(vehicleId) : null;

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: vehicle ? `${vehicle.model} Expenses` : 'All Expenses',
            headerSubtitle: vehicle ? vehicle.registration : undefined,
        } as any);
    }, [navigation, vehicle]);

    const filteredExpenses = useMemo(() => {
        let filtered = expenses;

        // 1. Filter by Vehicle
        if (vehicleId) {
            filtered = filtered.filter(e => e.vehicleId === vehicleId);
        }

        // 2. Filter by Period
        const now = new Date();
        filtered = filtered.filter(e => {
            const expDate = new Date(e.date);
            if (selectedPeriod === 'Week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return expDate >= oneWeekAgo;
            } else if (selectedPeriod === 'Month') {
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            } else {
                return expDate.getFullYear() === now.getFullYear();
            }
        });

        // Sort by date desc
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, vehicleId, selectedPeriod]);

    const renderExpenseItem = ({ item }: { item: Expense }) => (
        <View style={styles.expenseCard}>
            <View style={[styles.iconBox, { backgroundColor: `${item.color || COLORS.primary}20` }]}>
                <Ionicons name={(item.icon as any) || 'receipt'} size={24} color={item.color || COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.expenseType}>{item.type}</Text>
                    <Text style={styles.expenseAmount}>₹{item.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                        {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    {!vehicleId && (
                        <Text style={styles.vehicleChip}>{item.vehicleName}</Text>
                    )}
                </View>
            </View>
        </View>
    );

    const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <SafeAreaView style={styles.container}>
            {/* Period Filters */}
            <View style={styles.periodsContainer}>
                {(['Week', 'Month', 'Year'] as Period[]).map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
                        onPress={() => setSelectedPeriod(p)}
                    >
                        <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                            This {p}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Summary Banner */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryBanner}
            >
                <View>
                    <Text style={styles.bannerLabel}>Total Spent (This {selectedPeriod})</Text>
                    <Text style={styles.bannerAmount}>₹{totalAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.bannerIcon}>
                    <Ionicons name="wallet-outline" size={32} color="rgba(255,255,255,0.8)" />
                </View>
            </LinearGradient>

            <FlatList
                data={filteredExpenses}
                keyExtractor={item => item.id}
                renderItem={renderExpenseItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color={COLORS.textExtraLight} />
                        <Text style={styles.emptyText}>No expenses found for this period.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
    },
    backBtn: { padding: 8, marginRight: 12, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
    periodsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    periodBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    periodBtnActive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    periodText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
    periodTextActive: { color: COLORS.primary, fontWeight: '700' },
    summaryBanner: {
        margin: 16,
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
    bannerAmount: { color: COLORS.white, fontSize: 28, fontWeight: 'bold' },
    bannerIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: { padding: 16, paddingTop: 0, paddingBottom: 100 },
    expenseCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    expenseType: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    expenseAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 12, color: COLORS.textLight },
    vehicleChip: {
        fontSize: 10,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        color: COLORS.textLight,
        overflow: 'hidden',
    },
    emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.6 },
    emptyText: { marginTop: 16, fontSize: 14, color: COLORS.textLight },
});
