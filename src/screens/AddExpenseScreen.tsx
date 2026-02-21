import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import apiClient from '../api/apiClient';

interface Category {
    id: number;
    name: string;
}

export default function AddExpenseScreen({ navigation, route }: { navigation: any, route?: any }) {
    const { vehicles, fetchExpenses } = useApp();
    const expense = route?.params?.expense;
    const isEdit = !!expense;
    const insets = useSafeAreaInsets();

    const [selectedVehicleId, setSelectedVehicleId] = useState(expense?.vehicleId || vehicles[0]?.id || '');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(expense?.categoryId || null);
    const [amount, setAmount] = useState(expense?.amount ? expense.amount.toString() : '');
    const [note, setNote] = useState(expense?.note || '');
    const [date, setDate] = useState(expense?.date ? new Date(expense.date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        fetchCategories();
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await apiClient.get('/expense-categories');
            setCategories(response.data);
            if (!isEdit && response.data.length > 0) {
                // Pre-select first category if not editing
                setSelectedCategoryId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to load expense categories', ToastAndroid.SHORT);
            }
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedVehicleId) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please select a vehicle', ToastAndroid.SHORT);
            }
            return;
        }
        if (!selectedCategoryId) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please select a category', ToastAndroid.SHORT);
            }
            return;
        }
        const amt = parseFloat(amount.replace(/,/g, ''));
        if (!amount || isNaN(amt) || amt <= 0) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please enter a valid amount', ToastAndroid.SHORT);
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                vehicleId: parseInt(selectedVehicleId),
                categoryId: selectedCategoryId,
                amount: amt,
                date: date.toISOString().split('T')[0], // YYYY-MM-DD
                note: note.trim()
            };

            if (isEdit) {
                await apiClient.put(`/expenses/${expense.id}`, payload);
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Expense updated successfully!', ToastAndroid.LONG);
                }
            } else {
                await apiClient.post('/expenses', payload);
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Expense added successfully!', ToastAndroid.LONG);
                }
            }

            await fetchExpenses(); // Refresh global list

            navigation.goBack();
        } catch (error) {
            console.error('Error saving expense:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to save expense', ToastAndroid.SHORT);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIconForCategory = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('service')) return 'build';
        if (n.includes('repair')) return 'hammer';
        if (n.includes('insurance')) return 'shield-checkmark';
        if (n.includes('tax') || n.includes('toll')) return 'document-text';
        if (n.includes('fuel')) return 'water';
        return 'wallet';
    };

    const getColorForCategory = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('service')) return COLORS.warning;
        if (n.includes('repair')) return COLORS.danger;
        if (n.includes('insurance')) return COLORS.success;
        if (n.includes('tax') || n.includes('toll')) return COLORS.info;
        if (n.includes('fuel')) return COLORS.primary;
        return COLORS.gray;
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <View style={styles.container}>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Vehicle Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Select Vehicle <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.dropdownBtn,
                                isVehicleDropdownOpen && styles.dropdownBtnOpen
                            ]}
                            onPress={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                            activeOpacity={0.7}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Ionicons
                                    name={vehicles.find(v => v.id === selectedVehicleId)?.vehicleType === 'bike' ? "bicycle-outline" : "car-outline"}
                                    size={22}
                                    color={COLORS.primary}
                                />
                                <Text style={styles.dropdownText}>
                                    {vehicles.find(v => v.id === selectedVehicleId)
                                        ? `${vehicles.find(v => v.id === selectedVehicleId).brand} ${vehicles.find(v => v.id === selectedVehicleId).model}`
                                        : 'Select Vehicle'}
                                </Text>
                            </View>
                            <Ionicons
                                name={isVehicleDropdownOpen ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={COLORS.textLight}
                            />
                        </TouchableOpacity>

                        {isVehicleDropdownOpen && (
                            <View style={styles.inlineDropdown}>
                                {vehicles.map((v) => (
                                    <TouchableOpacity
                                        key={v.id}
                                        style={[
                                            styles.vehicleOption,
                                            selectedVehicleId === v.id && styles.vehicleOptionActive
                                        ]}
                                        onPress={() => {
                                            setSelectedVehicleId(v.id);
                                            setIsVehicleDropdownOpen(false);
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Ionicons
                                                name={v.vehicleType === 'bike' ? "bicycle" : "car"}
                                                size={20}
                                                color={selectedVehicleId === v.id ? COLORS.white : COLORS.primary}
                                            />
                                            <Text style={[
                                                styles.vehicleOptionText,
                                                selectedVehicleId === v.id && styles.vehicleOptionTextActive
                                            ]}>
                                                {v.brand} {v.model}
                                            </Text>
                                        </View>
                                        {selectedVehicleId === v.id && (
                                            <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Expense Category */}
                    <View style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={styles.label}>
                                Expense Category <Text style={styles.requiredStar}>*</Text>
                            </Text>
                        </View>

                        {/* Redirection Notice */}
                        <View style={styles.noticeBox}>
                            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.noticeText}>
                                For Fuel or Service records, please use the specialized forms in the Maintenance section for better tracking.
                            </Text>
                        </View>

                        {isLoadingCategories ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                        ) : (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {categories
                                    .filter(cat => !['fuel', 'service'].includes(cat.name.toLowerCase()))
                                    .map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.typeChip,
                                                selectedCategoryId === cat.id ? styles.typeChipActive : styles.typeChipInactive
                                            ]}
                                            onPress={() => setSelectedCategoryId(cat.id)}
                                        >
                                            <Ionicons
                                                name={getIconForCategory(cat.name) as any}
                                                size={16}
                                                color={selectedCategoryId === cat.id ? COLORS.white : COLORS.primary}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={[
                                                styles.typeChipText,
                                                selectedCategoryId === cat.id && styles.typeChipTextActive
                                            ]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        )}
                    </View>

                    {/* Amount */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Amount (₹) <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="e.g. 5000"
                            maxLength={7}
                        />
                    </View>

                    {/* Date Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Date <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.dateDisplay}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.dateText}>{formatDate(date)}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onChangeDate}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    {/* Note */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Note (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={note}
                            onChangeText={setNote}
                            placeholder="e.g. Annual Service"
                            maxLength={50}
                        />
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {!isKeyboardVisible && (
                    <View style={[
                        styles.footer,
                        { paddingBottom: Math.max(insets.bottom, 20) }
                    ]}>
                        <View style={styles.footerButtons}>
                            <TouchableOpacity
                                style={[styles.submitBtn, styles.cancelBtn]}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                                onPress={handleSubmit}
                                activeOpacity={0.8}
                                disabled={isSubmitting}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    style={styles.submitGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Save Expense'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SIZES.padding, paddingTop: 10 },
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 0, marginTop: 4 },
    input: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: '#e2e8f0' },
    requiredStar: { color: COLORS.danger, fontWeight: 'bold' },
    noticeBox: { flexDirection: 'row', backgroundColor: COLORS.primary + '10', padding: 10, borderRadius: 10, marginBottom: 12, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.primary + '20' },
    noticeText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 18 },
    typeChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    typeChipInactive: { backgroundColor: COLORS.white },
    typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeChipText: { color: COLORS.textLight, fontWeight: '500' },
    typeChipTextActive: { color: COLORS.white, fontWeight: 'bold' },
    dateDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
    dateText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SIZES.padding, paddingTop: 15, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F1F5F9', ...SHADOWS.medium },
    footerButtons: { flexDirection: 'row', gap: 15 },
    submitBtn: { flex: 1, borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 25, gap: 10 },
    submitText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    cancelBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0, elevation: 0 },
    cancelBtnText: { color: COLORS.textLight, fontSize: 16, fontWeight: '600' },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    dropdownBtnOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
    dropdownText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
    inlineDropdown: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#e2e8f0', borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 5, marginTop: -1, ...SHADOWS.light },
    vehicleOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, marginBottom: 2 },
    vehicleOptionActive: { backgroundColor: COLORS.primary },
    vehicleOptionText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
    vehicleOptionTextActive: { color: COLORS.white },
});
