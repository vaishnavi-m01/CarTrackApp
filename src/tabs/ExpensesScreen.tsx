import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';


import { useApp } from '../context/AppContext';
import { Modal } from 'react-native';

export default function ExpensesScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [selectedPeriod, setSelectedPeriod] = useState('Month');
    const tabBarHeight = useBottomTabBarHeight();
    const periods = ['Week', 'Month', 'Year'];

    const { expenses, vehicles } = useApp();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [isVehicleModalVisible, setVehicleModalVisible] = useState(false);

    // Filter expenses based on selection
    const filteredExpenses = selectedVehicleId
        ? expenses.filter(e => e.vehicleId === selectedVehicleId)
        : expenses;

    // Filter for current period logic (approximate for demo or real?)
    // Using filteredExpenses to calculate summary
    const calculateSummary = (exps: typeof expenses, period: string) => {
        // Simple logic for Demo: Just summing up everything for now or implementing basic date check
        // Ideally matches period logic in History Screen
        // For now, let's just sum up the visible filtered expenses for the "Total" to show responsiveness
        const total = exps.reduce((sum, e) => sum + e.amount, 0);
        const fuel = exps.filter(e => e.type === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
        const service = exps.filter(e => e.type === 'Service').reduce((sum, e) => sum + e.amount, 0);
        const other = total - fuel - service;

        return {
            total: `₹${total.toLocaleString()}`,
            fuel: `₹${fuel.toLocaleString()}`,
            service: `₹${service.toLocaleString()}`,
            other: `₹${other.toLocaleString()}`
        };
    };

    const summary = useMemo(() => calculateSummary(filteredExpenses, selectedPeriod), [filteredExpenses, selectedPeriod, expenses]);
    const recentExpenses = useMemo(() => {
        return [...filteredExpenses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [filteredExpenses, expenses]);

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Expenses</Text>
                        <Text style={styles.headerSubtitle}>Track and manage your spending</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.headerVehicleSelector}
                        onPress={() => setVehicleModalVisible(true)}
                    >
                        <Ionicons name="car" size={16} color={COLORS.white} />
                        <Text style={styles.headerVehicleText} numberOfLines={1}>
                            {selectedVehicle ? selectedVehicle.model : 'All'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Period Selector */}
                <View style={styles.periodContainer}>
                    {periods.map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodBtn,
                                selectedPeriod === period && styles.periodBtnActive,
                            ]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text
                                style={[
                                    styles.periodText,
                                    selectedPeriod === period && styles.periodTextActive,
                                ]}
                            >
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    {selectedVehicle && (
                        <View style={styles.selectedVehicleCard}>
                            <View style={styles.vehicleInfoRow}>
                                <View>
                                    <Text style={styles.vehicleDetailLabel}>Registration</Text>
                                    <Text style={styles.vehicleDetailValue}>{selectedVehicle.registration}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.vehicleDetailLabel}>Fuel Type</Text>
                                    <Text style={styles.vehicleDetailValue}>{selectedVehicle.fuelType}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.summaryMain}>
                        <Text style={styles.summaryLabel}>Total Expenses</Text>
                        <Text style={styles.summaryValue}>{summary.total}</Text>
                        <Text style={styles.summaryPeriod}>This {selectedPeriod.toLowerCase()}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Ionicons name="water" size={20} color={COLORS.primary} />
                            <Text style={styles.summaryCardLabel}>Fuel</Text>
                            <Text style={styles.summaryCardValue}>{summary.fuel}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Ionicons name="build" size={20} color={COLORS.warning} />
                            <Text style={styles.summaryCardLabel}>Service</Text>
                            <Text style={styles.summaryCardValue}>{summary.service}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.success} />
                            <Text style={styles.summaryCardLabel}>Other</Text>
                            <Text style={styles.summaryCardValue}>{summary.other}</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Expenses */}
                <View style={[styles.section, { marginTop: 25 }]}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                {selectedVehicle ? `${selectedVehicle.model} Expenses` : 'Recent Expenses'}
                            </Text>
                            <Text style={styles.sectionSubtitle}>Last few activities</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewAllBtn}
                            onPress={() => navigation.navigate('ExpenseHistory', { vehicleId: selectedVehicleId || undefined })}
                        >
                            <Text style={styles.viewAll}>View All</Text>
                            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {recentExpenses.length === 0 ? (
                        <View style={styles.emptyRecent}>
                            <Ionicons name="receipt-outline" size={40} color={COLORS.textExtraLight} />
                            <Text style={styles.emptyText}>No expenses found</Text>
                        </View>
                    ) : (
                        recentExpenses.map((expense) => (
                            <TouchableOpacity
                                key={expense.id}
                                style={styles.expenseCard}
                                onPress={() => { }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.expenseIcon, { backgroundColor: `${expense.color || COLORS.primary}15` }]}>
                                    <Ionicons name={(expense.icon as any) || 'receipt'} size={22} color={expense.color || COLORS.primary} />
                                </View>
                                <View style={styles.expenseDetails}>
                                    <Text style={styles.expenseType}>{expense.type}</Text>
                                    <Text style={styles.expenseMeta}>
                                        {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {expense.vehicleName}
                                    </Text>
                                </View>
                                <View style={styles.amountContainer}>
                                    <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString()}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Vehicle Selection Modal (Dropdown style) */}
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
                        <View style={styles.dropdownCaret} />
                        <TouchableOpacity
                            style={[styles.modalItem, !selectedVehicleId && styles.modalItemActive]}
                            onPress={() => {
                                setSelectedVehicleId(null);
                                setVehicleModalVisible(false);
                            }}
                        >
                            <View style={styles.modalItemContent}>
                                <Ionicons
                                    name="apps-outline"
                                    size={18}
                                    color={!selectedVehicleId ? COLORS.primary : COLORS.textLight}
                                    style={{ marginRight: 10 }}
                                />
                                <Text style={[styles.modalItemText, !selectedVehicleId && styles.modalItemTextActive]}>All Vehicles</Text>
                            </View>
                            {!selectedVehicleId && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                        </TouchableOpacity>

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
                                        size={18}
                                        color={selectedVehicleId === v.id ? COLORS.primary : COLORS.textLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <Text style={[styles.modalItemText, selectedVehicleId === v.id && styles.modalItemTextActive]}>
                                        {v.brand} {v.model}
                                    </Text>
                                </View>
                                {selectedVehicleId === v.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Add Expense Button */}
            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate("AddExpense")}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.addBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={28} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: SIZES.padding,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: SIZES.h2,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: SIZES.body2,
        color: COLORS.white,
        opacity: 0.9,
    },
    periodContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginTop: 20,
        gap: 10,
    },
    periodBtn: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    periodBtnActive: {
        backgroundColor: COLORS.primary,
    },
    periodText: {
        color: COLORS.text,
        fontSize: SIZES.body2,
        fontWeight: '600',
    },
    periodTextActive: {
        color: COLORS.white,
    },
    summaryContainer: {
        paddingHorizontal: SIZES.padding,
        marginTop: 20,
    },
    summaryMain: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginBottom: 15,
        ...SHADOWS.light,
    },
    summaryLabel: {
        fontSize: SIZES.body2,
        color: COLORS.textLight,
        marginBottom: 10,
    },
    summaryValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5,
    },
    summaryPeriod: {
        fontSize: SIZES.body3,
        color: COLORS.textExtraLight,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    summaryCardLabel: {
        fontSize: SIZES.body4,
        color: COLORS.textLight,
        marginTop: 8,
        marginBottom: 5,
    },
    summaryCardValue: {
        fontSize: SIZES.body2,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    section: {
        paddingHorizontal: SIZES.padding,
        marginTop: 25,
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
    expenseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: SIZES.radius,
        marginBottom: 12,
        ...SHADOWS.light,
    },
    expenseIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    expenseDetails: {
        flex: 1,
    },
    expenseType: {
        fontSize: SIZES.body1,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 3,
    },
    expenseVehicle: {
        fontSize: SIZES.body3,
        color: COLORS.textLight,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        borderRadius: 30,
        ...SHADOWS.dark,
    },
    addBtnGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleSelector: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    vehicleSelectorText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerVehicleSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        maxWidth: 150,
    },
    headerVehicleText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    dropdownContent: {
        backgroundColor: COLORS.white,
        width: 220,
        position: 'absolute',
        top: 105, // Adjusted to sit higher
        right: SIZES.padding,
        borderRadius: 18,
        padding: 8,
        ...SHADOWS.dark,
        elevation: 10,
    },
    dropdownCaret: {
        position: 'absolute',
        top: -8,
        right: 25,
        width: 16,
        height: 16,
        backgroundColor: COLORS.white,
        transform: [{ rotate: '45deg' }],
        zIndex: -1,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalItemActive: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        borderBottomWidth: 0,
    },
    modalItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalItemText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    modalItemTextActive: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    closeModalBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    closeModalText: {
        color: COLORS.textLight,
        fontSize: 14,
        fontWeight: '600',
    },
    vehicleSection: {
        paddingHorizontal: SIZES.padding,
        marginTop: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textLight,
        marginBottom: 8,
        marginLeft: 4,
    },
    vehicleInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...SHADOWS.light,
    },
    vehicleInputContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    vehicleInputText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    selectedVehicleCard: {
        backgroundColor: '#F8FAFC',
        marginTop: 12,
        marginBottom: 20,
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    vehicleInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vehicleDetailLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    vehicleDetailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: COLORS.textExtraLight,
        marginTop: 2,
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expenseMeta: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    emptyRecent: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.textLight,
        fontSize: 14,
    },
});
