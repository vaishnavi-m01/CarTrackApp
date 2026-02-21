import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp, Expense } from '../context/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';

import apiClient from '../api/apiClient';

type Period = 'Week' | 'Month' | 'Year' | 'Custom';

export default function ExpenseHistoryScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { vehicleId, categoryId: initialCategoryId, startDate: initialStart, endDate: initialEnd, period: initialPeriod } = route.params as any || {};
    const { expenses, getVehicleById, fetchExpenses, isLoading, vehicles } = useApp();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicleId || '');
    const [selectedPeriod, setSelectedPeriod] = useState<Period>(initialPeriod || 'Month');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId || null);
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [activeDateRange, setActiveDateRange] = useState({
        start: initialStart || '',
        end: initialEnd || ''
    });

    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

    // Custom range states
    const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
    const [customEndDate, setCustomEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const vehicle = selectedVehicleId ? getVehicleById(selectedVehicleId) : null;

    // Fetch categories
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/expense-categories');
                setCategories(response.data || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'All Expenses',
            headerSubtitle: vehicle ? vehicle.registration : 'Financial Ledger',
        } as any);
    }, [navigation, vehicle, selectedVehicleId]);

    const filteredExpenses = useMemo(() => {
        let filtered = expenses;

        // 1. Filter by Vehicle
        if (selectedVehicleId) {
            filtered = filtered.filter(e => e.vehicleId.toString() === selectedVehicleId);
        }

        // 2. Filter by Category
        if (selectedCategoryId) {
            filtered = filtered.filter(e => e.categoryId === selectedCategoryId);
        }

        // 3. Filter by Period (Match calculation logic for start/end)
        const getDates = () => {
            const now = new Date();
            let start = new Date(now);
            const endDate = now.toISOString().split('T')[0];

            if (selectedPeriod === 'Week') {
                const day = now.getDay();
                start.setDate(now.getDate() - day);
            } else if (selectedPeriod === 'Month') {
                start.setDate(1);
            } else if (selectedPeriod === 'Year') {
                start.setMonth(0, 1);
            } else if (selectedPeriod === 'Custom') {
                return {
                    startDate: customStartDate.toISOString().split('T')[0],
                    endDate: customEndDate.toISOString().split('T')[0]
                };
            }

            return { startDate: start.toISOString().split('T')[0], endDate };
        };

        const { startDate, endDate } = getDates();

        // Update local active range for UI
        if (activeDateRange.start !== startDate || activeDateRange.end !== endDate) {
            setActiveDateRange({ start: startDate, end: endDate });
        }

        // Sort by date desc
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, selectedVehicleId, selectedPeriod, selectedCategoryId, customStartDate, customEndDate]);

    // Fetch data whenever filters change
    React.useEffect(() => {
        const getDates = () => {
            const now = new Date();
            let start = new Date(now);
            if (selectedPeriod === 'Week') {
                const day = now.getDay();
                start.setDate(now.getDate() - day);
            } else if (selectedPeriod === 'Month') {
                start.setDate(1);
            } else if (selectedPeriod === 'Year') {
                start.setMonth(0, 1);
            } else if (selectedPeriod === 'Custom') {
                return {
                    startDate: customStartDate.toISOString().split('T')[0],
                    endDate: customEndDate.toISOString().split('T')[0]
                };
            }
            return { startDate: start.toISOString().split('T')[0], endDate: now.toISOString().split('T')[0] };
        };

        const { startDate, endDate } = getDates();
        fetchExpenses({
            vehicleId: selectedVehicleId,
            categoryId: selectedCategoryId?.toString(),
            startDate,
            endDate
        });
    }, [selectedPeriod, selectedCategoryId, selectedVehicleId, customStartDate, customEndDate]);

    const formatDateRange = () => {
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        const start = activeDateRange.start ? new Date(activeDateRange.start).toLocaleDateString(undefined, options) : '';
        const end = activeDateRange.end ? new Date(activeDateRange.end).toLocaleDateString(undefined, options) : '';
        return `${start} - ${end}`;
    };

    const getIconForCategory = (name: string) => {
        const n = (name || '').toLowerCase();
        if (n.includes('service')) return 'build';
        if (n.includes('repair')) return 'hammer';
        if (n.includes('insurance')) return 'shield-checkmark';
        if (n.includes('fuel')) return 'water';
        if (n.includes('tax')) return 'document-text';
        return 'wallet';
    };

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

    const totalAmount = (filteredExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with Back button and Info */}
            {/* <View style={styles.headerStyle}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnStyle}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerTitleContainer}
                    onPress={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                >
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.headerTitleStyle}>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'All Expenses'}</Text>
                            <Ionicons name={isVehicleDropdownOpen ? "chevron-up" : "chevron-down"} size={14} color={COLORS.text} />
                        </View>
                        <Text style={styles.headerSubtitleStyle}>{vehicle ? vehicle.registration : 'Financial Ledger'}</Text>
                    </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
            </View> */}

            {/* Vehicle Selection Dropdown */}
            {isVehicleDropdownOpen && (
                <View style={styles.dropdownContainer}>
                    <ScrollView style={{ maxHeight: 200 }} bounces={false}>
                        <TouchableOpacity
                            style={[styles.dropdownItem, !selectedVehicleId && styles.dropdownItemActive]}
                            onPress={() => { setSelectedVehicleId(''); setIsVehicleDropdownOpen(false); }}
                        >
                            <Ionicons name="apps-outline" size={18} color={!selectedVehicleId ? COLORS.primary : COLORS.textLight} />
                            <Text style={[styles.dropdownText, !selectedVehicleId && styles.dropdownTextActive]}>All Vehicles</Text>
                        </TouchableOpacity>
                        {vehicles.map((v) => (
                            <TouchableOpacity
                                key={v.id}
                                style={[styles.dropdownItem, selectedVehicleId === v.id.toString() && styles.dropdownItemActive]}
                                onPress={() => { setSelectedVehicleId(v.id.toString()); setIsVehicleDropdownOpen(false); }}
                            >
                                <Ionicons name={v.vehicleType === 'bike' ? 'bicycle-outline' : 'car-outline'} size={18} color={selectedVehicleId === v.id.toString() ? COLORS.primary : COLORS.textLight} />
                                <Text style={[styles.dropdownText, selectedVehicleId === v.id.toString() && styles.dropdownTextActive]}>
                                    {v.brand} {v.model}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Combined Filter Card */}
            <View style={styles.filterCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodsScroll}>
                    {(['Week', 'Month', 'Year', 'Custom'] as Period[]).map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
                            onPress={() => setSelectedPeriod(p)}
                        >
                            <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                                {p === 'Custom' ? 'Custom' : p}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {selectedPeriod === 'Custom' && (
                    <View style={styles.customDateContainer}>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                            <Text style={styles.datePickerLabel}>From</Text>
                            <Text style={styles.datePickerValue}>{customStartDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</Text>
                        </TouchableOpacity>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.textLight} />
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)}>
                            <Text style={styles.datePickerLabel}>To</Text>
                            <Text style={styles.datePickerValue}>{customEndDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                    <TouchableOpacity
                        style={[styles.categoryPill, !selectedCategoryId && styles.categoryPillActive]}
                        onPress={() => setSelectedCategoryId(null)}
                    >
                        <Ionicons name="apps" size={14} color={!selectedCategoryId ? COLORS.primary : COLORS.textLight} />
                        <Text style={[styles.categoryPillText, !selectedCategoryId && styles.categoryPillTextActive]}>All</Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryPill, selectedCategoryId === cat.id && styles.categoryPillActive]}
                            onPress={() => setSelectedCategoryId(cat.id)}
                        >
                            <Ionicons
                                name={getIconForCategory(cat.name) as any}
                                size={14}
                                color={selectedCategoryId === cat.id ? COLORS.primary : COLORS.textLight}
                            />
                            <Text style={[styles.categoryPillText, selectedCategoryId === cat.id && styles.categoryPillTextActive]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {showStartPicker && (
                <DateTimePicker
                    value={customStartDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => { setShowStartPicker(false); if (date) setCustomStartDate(date); }}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={customEndDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => { setShowEndPicker(false); if (date) setCustomEndDate(date); }}
                />
            )}

            <FlatList
                data={filteredExpenses}
                keyExtractor={item => item.id}
                renderItem={renderExpenseItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.sectionHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.sectionTitleStyle} numberOfLines={1}>Transactions</Text>
                            <Text style={styles.dateDisplayText} numberOfLines={1}>{formatDateRange()}</Text>
                        </View>
                        <View style={[styles.summaryBadge, { minWidth: 100 }]}>
                            <Text style={styles.summaryLabel}>Total:</Text>
                            <Text style={styles.summaryValue} numberOfLines={1}>₹{totalAmount.toLocaleString()}</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No expenses found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FCFCFC' },
    headerStyle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white },
    backBtnStyle: { width: 40, height: 40, justifyContent: 'center' },
    headerTitleContainer: { flex: 1, marginLeft: 4 },
    headerTitleStyle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    headerSubtitleStyle: { fontSize: 13, color: COLORS.textLight },
    dropdownContainer: {
        position: 'absolute',
        top: 60,
        left: 56,
        right: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        zIndex: 1000,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden'
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 10
    },
    dropdownItemActive: { backgroundColor: '#f1f5f9' },
    dropdownText: { fontSize: 14, color: COLORS.textLight },
    dropdownTextActive: { fontWeight: 'bold', color: COLORS.primary },
    filterCard: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
    periodsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
    periodBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    periodText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
    periodTextActive: { color: COLORS.white },
    categoriesScroll: { paddingHorizontal: 16, paddingBottom: 5, gap: 8 },
    categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    categoryPillActive: { backgroundColor: '#f1f5f9', borderColor: COLORS.primary },
    categoryPillText: { fontSize: 11, fontWeight: '600', color: COLORS.textLight },
    categoryPillTextActive: { color: COLORS.primary },
    customDateContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
    datePickerBtn: { flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    datePickerLabel: { fontSize: 9, color: COLORS.textLight, textTransform: 'uppercase' },
    datePickerValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
    listContent: { padding: 16, paddingTop: 10, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    sectionTitleStyle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, letterSpacing: 0.5 },
    dateDisplayText: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
    summaryBadge: { backgroundColor: COLORS.primary + '10', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, alignItems: 'flex-end', borderWidth: 1, borderColor: COLORS.primary + '20' },
    summaryLabel: { fontSize: 10, color: COLORS.textLight, textTransform: 'uppercase' },
    summaryValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    expenseCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', ...SHADOWS.light, borderWidth: 1, borderColor: '#f1f5f9' },
    iconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    expenseType: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
    expenseAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 12, color: COLORS.textLight },
    vehicleChip: { fontSize: 10, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, color: COLORS.textLight, overflow: 'hidden' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 16, fontSize: 14, color: '#94A3B8' },
});
