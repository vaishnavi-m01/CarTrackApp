import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function AddExpenseScreen({ navigation }: { navigation: any }) {
    const { vehicles, addExpense, AndroidToast } = useApp();
    const insets = useSafeAreaInsets();

    const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
    const [type, setType] = useState('Service');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const expenseTypes = ['Service', 'Repair', 'Insurance', 'Tax', 'Other'];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    React.useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const handleSubmit = () => {
        if (!selectedVehicleId) {
            Alert.alert('Error', 'Please select a vehicle');
            return;
        }
        const amt = parseFloat(amount.replace(/,/g, ''));
        if (!amount || isNaN(amt) || amt <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);

        addExpense({
            type: type as any,
            amount: amt,
            date: date.toISOString(),
            vehicleId: selectedVehicleId,
            vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown',
            note,
            icon: getIconForType(type),
            color: getColorForType(type)
        });

        AndroidToast('Expense added successfully!');

        // Give time for user to see the toast on this screen
        setTimeout(() => {
            navigation.goBack();
        }, 1500);
    };

    const getIconForType = (t: string) => {
        switch (t) {
            case 'Service': return 'build';
            case 'Repair': return 'hammer';
            case 'Insurance': return 'shield-checkmark';
            case 'Tax': return 'document-text';
            default: return 'wallet';
        }
    };

    const getColorForType = (t: string) => {
        switch (t) {
            case 'Service': return COLORS.warning;
            case 'Repair': return COLORS.danger;
            case 'Insurance': return COLORS.success;
            case 'Tax': return COLORS.info;
            default: return COLORS.gray;
        }
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

                    {/* Expense Type */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expense Category</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {expenseTypes.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.typeChip,
                                        type === t ? styles.typeChipActive : styles.typeChipInactive
                                    ]}
                                    onPress={() => setType(t)}
                                >
                                    <Ionicons name={getIconForType(t) as any} size={16} color={type === t ? COLORS.white : COLORS.primary} style={{ marginRight: 6 }} />
                                    <Text style={[
                                        styles.typeChipText,
                                        type === t && styles.typeChipTextActive
                                    ]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
    label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 6, marginTop: 4 },
    input: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: '#e2e8f0' },
    requiredStar: { color: COLORS.danger, fontWeight: 'bold' },
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
