import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Platform,
    Modal,
    Keyboard,
    KeyboardAvoidingView,
    ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import apiClient from '../api/apiClient';
import { ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';

export default function AddServiceScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles, addExpense, updateVehicle } = useApp();
    const insets = useSafeAreaInsets();
    const initialVehicleId = route.params?.vehicleId;

    const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId || (vehicles[0]?.id || ''));
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [odometer, setOdometer] = useState('');
    const [provider, setProvider] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const isEdit = !!route.params?.service;
    const serviceToEdit = route.params?.service;

    useEffect(() => {
        if (serviceToEdit) {
            setTitle(serviceToEdit.serviceTitle);
            setAmount(serviceToEdit.amount.toString());
            setOdometer(serviceToEdit.odometer.toString());
            setProvider(serviceToEdit.serviceCenter);
            setNote(serviceToEdit.note);
            setDate(new Date(serviceToEdit.date));
            setSelectedVehicleId(serviceToEdit.vehicleId.toString());
        }
    }, [serviceToEdit]);

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleSave = async () => {
        if (!selectedVehicleId || !title || !amount || !odometer) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please fill in all mandatory fields (*)', ToastAndroid.SHORT);
            }
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                id: isEdit ? serviceToEdit.id : 0,
                vehicleId: parseInt(selectedVehicleId),
                serviceTitle: title,
                odometer: parseInt(odometer.replace(/,/g, '')),
                serviceCenter: provider,
                amount: parseFloat(amount.replace(/,/g, '')),
                date: date.toISOString().split('T')[0], // yyyy-mm-dd
                note: note
            };

            let response;
            if (isEdit) {
                response = await apiClient.put(`/services/${serviceToEdit.id}`, payload);
            } else {
                response = await apiClient.post('/services', payload);
            }

            if (response.status >= 200 && response.status < 300) {
                // Update vehicle odometer if it's higher
                const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                if (vehicle) {
                    const currentMileage = parseFloat(vehicle.mileage || '0');
                    const newOdometer = parseFloat(odometer.replace(/,/g, ''));
                    if (newOdometer > currentMileage) {
                        updateVehicle(selectedVehicleId, {
                            mileage: odometer
                        });
                    }
                }

                if (Platform.OS === 'android') {
                    ToastAndroid.show(
                        `Service ${isEdit ? 'updated' : 'added'} successfully`,
                        ToastAndroid.SHORT
                    );
                }
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error saving service record:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to save service record', ToastAndroid.SHORT);
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
                    <View style={[styles.inputGroup, { marginTop: 0 }]}>
                        <Text style={styles.label}>Select Vehicle <Text style={styles.required}>*</Text></Text>
                        <TouchableOpacity
                            style={[
                                styles.dropdownBtn,
                                isVehicleModalVisible && styles.dropdownBtnOpen
                            ]}
                            onPress={() => setIsVehicleModalVisible(!isVehicleModalVisible)}
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
                                name={isVehicleModalVisible ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={COLORS.textLight}
                            />
                        </TouchableOpacity>

                        {/* Inline Vehicle Selection */}
                        {isVehicleModalVisible && (
                            <View style={styles.inlineDropdown}>
                                {vehicles.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.vehicleOption,
                                            selectedVehicleId === item.id && styles.vehicleOptionActive
                                        ]}
                                        onPress={() => {
                                            setSelectedVehicleId(item.id);
                                            setIsVehicleModalVisible(false);
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Ionicons
                                                name={item.vehicleType === 'bike' ? "bicycle" : "car"}
                                                size={20}
                                                color={selectedVehicleId === item.id ? COLORS.white : COLORS.primary}
                                            />
                                            <Text style={[
                                                styles.vehicleOptionText,
                                                selectedVehicleId === item.id && styles.vehicleOptionTextActive
                                            ]}>
                                                {item.brand} {item.model}
                                            </Text>
                                        </View>
                                        {selectedVehicleId === item.id && (
                                            <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Service Title <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Engine Oil Change"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={40}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Amount (₹) <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                maxLength={7}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Odometer (km) <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Current km"
                                value={odometer}
                                onChangeText={setOdometer}
                                keyboardType="numeric"
                                maxLength={8}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Service Center / Provider</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Bosch Car Service"
                            value={provider}
                            onChangeText={setProvider}
                        // maxLength={300}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Service Date <Text style={styles.required}>*</Text></Text>
                        <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.dateText}>{formatDate(date)}</Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeDate}
                        />
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Additional Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Any extra details..."
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={4}
                            maxLength={100}
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
                                style={[styles.saveBtn, styles.cancelBtn]}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primaryDark]}
                                    style={styles.saveGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Save'}</Text>
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
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SIZES.padding,
        paddingTop: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 6,
        marginTop: 4,
    },
    required: {
        color: COLORS.danger,
    },
    vehicleSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    vehicleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 6,
    },
    vehicleChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    vehicleChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    vehicleChipTextActive: {
        color: COLORS.white,
    },
    inputGroup: {
        marginBottom: 12,
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 10,
    },
    dateText: {
        fontSize: 15,
        color: COLORS.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SIZES.padding,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    saveBtn: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    saveGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0,
        elevation: 0,
    },
    cancelBtnText: {
        color: COLORS.textLight,
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dropdownBtnOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomWidth: 0,
    },
    dropdownText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    inlineDropdown: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        padding: 5,
        marginTop: -1,
        ...SHADOWS.light,
    },
    vehicleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        marginBottom: 2,
    },
    vehicleOptionActive: {
        backgroundColor: COLORS.primary,
    },
    vehicleOptionText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    vehicleOptionTextActive: {
        color: COLORS.white,
    },
});
