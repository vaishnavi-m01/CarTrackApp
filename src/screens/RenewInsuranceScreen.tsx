import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function RenewInsuranceScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles, updateVehicle, addExpense } = useApp();
    const insets = useSafeAreaInsets();

    const initialVehicleId = route.params?.vehicleId || (vehicles.length > 0 ? vehicles[0].id : '');

    const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
    const [policyNumber, setPolicyNumber] = useState('');
    const [provider, setProvider] = useState('');
    const [amount, setAmount] = useState('');
    const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // Default +1 year
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSubmit = () => {
        if (!selectedVehicleId) {
            Alert.alert('Error', 'Please select a vehicle');
            return;
        }
        if (!policyNumber.trim()) {
            Alert.alert('Error', 'Please enter policy number');
            return;
        }
        if (!provider.trim()) {
            Alert.alert('Error', 'Please enter insurance provider');
            return;
        }
        const amt = parseFloat(amount);
        if (!amount || isNaN(amt) || amt <= 0) {
            Alert.alert('Error', 'Please enter a valid premium amount');
            return;
        }

        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle) return;

        // 1. Update Vehicle Insurance Expiry and Details
        updateVehicle(selectedVehicleId, {
            insuranceExpiry: expiryDate.toISOString(),
            policyNumber: policyNumber.trim(),
            insuranceProvider: provider.trim(),
        });

        // 2. Add as an Insurance Expense
        addExpense({
            type: 'Insurance',
            amount: amt,
            date: new Date().toISOString(),
            vehicleId: selectedVehicleId,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            note: `Policy: ${policyNumber} (${provider})`,
            icon: 'shield-checkmark',
            color: '#10b981'
        });

        Alert.alert('Success', 'Insurance policy renewed!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
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
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
                            Select Vehicle <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {vehicles.map((v) => (
                                <TouchableOpacity
                                    key={v.id}
                                    style={[
                                        styles.vehicleChip,
                                        selectedVehicleId === v.id && styles.vehicleChipActive
                                    ]}
                                    onPress={() => setSelectedVehicleId(v.id)}
                                >
                                    <Text style={[
                                        styles.vehicleChipText,
                                        selectedVehicleId === v.id && styles.vehicleChipTextActive
                                    ]}>{v.brand} {v.model}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Policy Details */}
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
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

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
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

                    <View style={styles.row}>
                        <View style={[styles.formCard, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.formLabel}>
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

                        <View style={[styles.formCard, { flex: 1 }]}>
                            <Text style={styles.formLabel}>
                                Expiry Date <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.dateSelector}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.dateText}>{formatDate(expiryDate)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={expiryDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeDate}
                            minimumDate={new Date()}
                        />
                    )}

                </ScrollView>

                {/* Sticky Footer */}
                <View style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, 20) }
                ]}>
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
                            <Ionicons name="shield-checkmark" size={24} color={COLORS.white} />
                            <Text style={styles.submitText}>Renew Policy</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SIZES.padding, paddingBottom: 40 },
    formCard: { backgroundColor: COLORS.white, padding: 15, borderRadius: 15, marginBottom: 15, ...SHADOWS.light },
    formLabel: { fontSize: SIZES.body2, color: COLORS.textLight, marginBottom: 10, fontWeight: '600' },
    input: { fontSize: SIZES.body1, color: COLORS.text, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8 },
    requiredStar: { color: COLORS.danger, fontWeight: 'bold' },
    vehicleChip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 10 },
    vehicleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    vehicleChipText: { color: COLORS.textLight, fontWeight: '600' },
    vehicleChipTextActive: { color: COLORS.white },
    row: { flexDirection: 'row' },
    dateSelector: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
    dateText: { fontSize: SIZES.body1, color: COLORS.text },
    footer: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 15,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...SHADOWS.medium,
    },
    submitBtn: { width: '100%' },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 25, gap: 10 },
    submitText: { fontSize: SIZES.body1, fontWeight: 'bold', color: COLORS.white },
});
