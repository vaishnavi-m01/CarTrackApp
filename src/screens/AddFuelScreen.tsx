import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Keyboard,
    ToastAndroid,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import apiClient from '../api/apiClient';

export default function AddFuelScreen({ navigation, route }: { navigation: any; route: any }) {
    const { vehicles, updateVehicle } = useApp();
    const insets = useSafeAreaInsets();

    const initialVehicleId = route.params?.vehicleId;
    const fuelLogToEdit = route.params?.fuelLog;
    const isEdit = !!fuelLogToEdit;

    const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId || '');
    const [odometer, setOdometer] = useState('');
    const [pricePerLiter, setPricePerLiter] = useState('');
    const [totalCost, setTotalCost] = useState('');
    const [liters, setLiters] = useState('');
    const [isFullTank, setIsFullTank] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (fuelLogToEdit) {
            setSelectedVehicleId(fuelLogToEdit.vehicleId.toString());
            setOdometer(fuelLogToEdit.odometer.toString());
            setPricePerLiter(fuelLogToEdit.pricePerLiter.toString());
            setLiters(fuelLogToEdit.liters.toString());
            setTotalCost((fuelLogToEdit.liters * fuelLogToEdit.pricePerLiter).toFixed(2));
            setIsFullTank(fuelLogToEdit.isFullTank);
            setDate(fuelLogToEdit.date.split('T')[0]);
        }
    }, [fuelLogToEdit]);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // Auto-select first vehicle if none provided
    useEffect(() => {
        if (vehicles.length > 0 && !selectedVehicleId && !isEdit) {
            setSelectedVehicleId(vehicles[0].id);
        }
    }, [vehicles, selectedVehicleId, isEdit]);

    const handleCostChange = (cost: string) => {
        setTotalCost(cost);
        if (pricePerLiter && cost && parseFloat(pricePerLiter.replace(/,/g, '')) > 0) {
            setLiters((parseFloat(cost.replace(/,/g, '')) / parseFloat(pricePerLiter.replace(/,/g, ''))).toFixed(2));
        }
    };

    const handlePriceChange = (price: string) => {
        setPricePerLiter(price);
        if (totalCost && price && parseFloat(price.replace(/,/g, '')) > 0) {
            setLiters((parseFloat(totalCost.replace(/,/g, '')) / parseFloat(price.replace(/,/g, ''))).toFixed(2));
        }
    };

    const handleSubmit = async () => {
        if (!selectedVehicleId) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please select a vehicle', ToastAndroid.SHORT);
            }
            return;
        }
        const odo = parseFloat(odometer.replace(/,/g, ''));
        if (!odometer || isNaN(odo) || odo <= 0) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please enter a valid odometer reading', ToastAndroid.SHORT);
            }
            return;
        }
        const fuelLiters = parseFloat(liters.replace(/,/g, ''));
        if (!liters || isNaN(fuelLiters) || fuelLiters <= 0) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please enter valid cost and price', ToastAndroid.SHORT);
            }
            return;
        }
        const price = parseFloat(pricePerLiter.replace(/,/g, ''));
        if (!pricePerLiter || isNaN(price) || price <= 0) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please enter a valid price per liter', ToastAndroid.SHORT);
            }
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                id: isEdit ? fuelLogToEdit.id : 0,
                vehicleId: parseInt(selectedVehicleId),
                date: date,
                odometer: odo,
                liters: fuelLiters,
                pricePerLiter: price,
                isFullTank: isFullTank,
            };

            console.log("Fuel payload", payload)
            let response;
            if (isEdit) {
                response = await apiClient.put(`/fuel-logs/${fuelLogToEdit.id}`, payload);
            } else {
                response = await apiClient.post('/fuel-logs', payload);
            }

            if (response.status >= 200 && response.status < 300) {
                // Update vehicle odometer if higher
                const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                if (vehicle) {
                    const currentMileage = parseFloat(vehicle.mileage || '0');
                    if (odo > currentMileage) {
                        updateVehicle(selectedVehicleId, { mileage: odo.toString() });
                    }
                }

                if (Platform.OS === 'android') {
                    ToastAndroid.show(
                        `Fuel log ${isEdit ? 'updated' : 'added'} successfully`,
                        ToastAndroid.SHORT
                    );
                }
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error saving fuel log:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to save fuel log', ToastAndroid.SHORT);
            }
        } finally {
            setIsSaving(false);
        }
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

                    {/* Odometer */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            New Odometer Reading (km) <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={odometer}
                            onChangeText={setOdometer}
                            keyboardType="numeric"
                            placeholder={`Current: ${vehicles.find(v => v.id === selectedVehicleId)?.mileage || '0'} km`}
                            maxLength={8}
                        />
                    </View>

                    {/* Cost & Price */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>
                                Total Cost (₹) <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={totalCost}
                                onChangeText={handleCostChange}
                                keyboardType="numeric"
                                placeholder="e.g. 2500"
                                maxLength={7}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>
                                Price / Liter <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={pricePerLiter}
                                onChangeText={handlePriceChange}
                                keyboardType="numeric"
                                placeholder="e.g. 102.5"
                                maxLength={7}
                            />
                        </View>
                    </View>

                    {/* Calculated Liters */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fuel Volume (Liters)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#f8fafc' }]}
                            value={liters}
                            editable={false}
                        />
                    </View>

                    {/* Full Tank Toggle */}
                    <TouchableOpacity
                        style={styles.inputGroup}
                        onPress={() => setIsFullTank(!isFullTank)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.fullTankCard}>
                            <Text style={styles.label}>Full Tank?</Text>
                            <Ionicons
                                name={isFullTank ? "checkbox" : "square-outline"}
                                size={24}
                                color={COLORS.primary}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date</Text>
                        <View style={styles.dateDisplay}>
                            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.dateText}>{date}</Text>
                        </View>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Sticky Footer */}
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
                                style={styles.submitBtn}
                                onPress={handleSubmit}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    style={styles.submitGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.submitText}>Save Fuel Log</Text>
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
    row: { flexDirection: 'row' },
    requiredStar: { color: COLORS.danger, fontWeight: 'bold' },
    fullTankCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
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
