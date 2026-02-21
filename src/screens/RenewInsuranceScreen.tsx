import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
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

export default function RenewInsuranceScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles } = useApp();
    const insets = useSafeAreaInsets();

    const insuranceToEdit = route.params?.insurance;
    const isEdit = !!insuranceToEdit;

    const initialVehicleId = route.params?.vehicleId || insuranceToEdit?.vehicleId?.toString() || (vehicles.length > 0 ? vehicles[0].id : '');

    const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
    const [policyNumber, setPolicyNumber] = useState(insuranceToEdit?.policyNumber || '');
    const [provider, setProvider] = useState(insuranceToEdit?.insuranceProvider || '');
    const [amount, setAmount] = useState(insuranceToEdit?.premiumAmount?.toString() || '');
    const [startDate, setStartDate] = useState(insuranceToEdit?.policyStartDate ? new Date(insuranceToEdit.policyStartDate) : new Date());
    const [expiryDate, setExpiryDate] = useState(insuranceToEdit?.expiryDate ? new Date(insuranceToEdit.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleSubmit = async () => {
        if (!selectedVehicleId) {
            if (Platform.OS === 'android') ToastAndroid.show('Please select a vehicle', ToastAndroid.SHORT);
            return;
        }
        if (!policyNumber.trim()) {
            if (Platform.OS === 'android') ToastAndroid.show('Please enter policy number', ToastAndroid.SHORT);
            return;
        }
        if (!provider.trim()) {
            if (Platform.OS === 'android') ToastAndroid.show('Please enter insurance provider', ToastAndroid.SHORT);
            return;
        }
        const amt = parseFloat(amount.replace(/,/g, ''));
        if (!amount || isNaN(amt) || amt <= 0) {
            if (Platform.OS === 'android') ToastAndroid.show('Please enter a valid premium amount', ToastAndroid.SHORT);
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                id: isEdit ? insuranceToEdit.id : 0,
                vehicleId: parseInt(selectedVehicleId),
                policyNumber: policyNumber.trim(),
                insuranceProvider: provider.trim(),
                premiumAmount: amt,
                policyStartDate: startDate.toISOString().split('T')[0],
                expiryDate: expiryDate.toISOString().split('T')[0],
                status: "ACTIVE"
            };

            let response;
            if (isEdit) {
                response = await apiClient.put(`/insurance/${insuranceToEdit.id}`, payload);
            } else {
                response = await apiClient.post('/insurance', payload);
            }

            if (response.status >= 200 && response.status < 300) {
                if (Platform.OS === 'android') {
                    ToastAndroid.show(
                        `Insurance policy ${isEdit ? 'updated' : 'added'} successfully`,
                        ToastAndroid.SHORT
                    );
                }
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error saving insurance:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to save insurance policy', ToastAndroid.SHORT);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const onChangeStartDate = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };

    const onChangeExpiryDate = (event: any, selectedDate?: Date) => {
        setShowExpiryDatePicker(false);
        if (selectedDate) setExpiryDate(selectedDate);
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

                    {/* Policy Details */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Policy Number <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={policyNumber}
                            onChangeText={setPolicyNumber}
                            placeholder="e.g. POL12345678"
                            maxLength={20}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Insurance Provider <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={provider}
                            onChangeText={setProvider}
                            placeholder="e.g. HDFC ERGO"
                            maxLength={30}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Premium Amount (₹) <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="e.g. 12000"
                            maxLength={8}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>
                                Start Date <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.dateDisplay}
                                onPress={() => setShowStartDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>
                                Expiry Date <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.dateDisplay}
                                onPress={() => setShowExpiryDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                                <Text style={styles.dateText}>{formatDate(expiryDate)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showStartDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeStartDate}
                        />
                    )}

                    {showExpiryDatePicker && (
                        <DateTimePicker
                            value={expiryDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeExpiryDate}
                            minimumDate={startDate}
                        />
                    )}

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Sticky Footer */}
                {!isKeyboardVisible && (
                    <View style={[
                        styles.footer,
                        { paddingBottom: Math.max(insets.bottom, 20) }
                    ]}>
                        <View style={styles.footerButtons}>
                            {!isSaving && (
                                <TouchableOpacity
                                    style={[styles.submitBtn, styles.cancelBtn]}
                                    onPress={() => navigation.goBack()}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleSubmit}
                                activeOpacity={0.8}
                                disabled={isSaving}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    style={styles.submitGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <>
                                            <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                                            <Text style={styles.submitText}>{isEdit ? 'Update' : 'Renew'} Policy</Text>
                                        </>
                                    )}
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
    row: { flexDirection: 'row' },
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
