import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
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

    const handleSubmit = () => {
        if (!selectedVehicleId) {
            Alert.alert('Error', 'Please select a vehicle');
            return;
        }
        const amt = parseFloat(amount);
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

                    {/* Expense Type */}
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Expense Category</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {expenseTypes.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.typeChip,
                                        type === t && styles.typeChipActive
                                    ]}
                                    onPress={() => setType(t)}
                                >
                                    <Ionicons name={getIconForType(t) as any} size={16} color={type === t ? COLORS.white : COLORS.textLight} style={{ marginRight: 5 }} />
                                    <Text style={[
                                        styles.typeChipText,
                                        type === t && styles.typeChipTextActive
                                    ]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Amount */}
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
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
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
                            Date <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
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
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Note (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={note}
                            onChangeText={setNote}
                            placeholder="e.g. Annual Service"
                            maxLength={50}
                        />
                    </View>

                </ScrollView>

                <View style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, 20) }
                ]}>
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
                            {isSubmitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                            )}
                            <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Save Expense'}</Text>
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
    input: { fontSize: SIZES.body1, color: COLORS.text, borderBottomWidth: 2, borderBottomColor: COLORS.border, paddingBottom: 8 },
    vehicleChip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 10 },
    vehicleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    vehicleChipText: { color: COLORS.textLight, fontWeight: '600' },
    vehicleChipTextActive: { color: COLORS.white },
    typeChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeChipText: { color: COLORS.textLight },
    typeChipTextActive: { color: COLORS.white, fontWeight: '600' },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dateText: {
        fontSize: SIZES.body1,
        color: COLORS.text,
    },
    submitBtn: { width: '100%' },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 25, gap: 10, ...SHADOWS.medium },
    submitText: { fontSize: SIZES.body1, fontWeight: 'bold', color: COLORS.white },
    footer: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 15,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...SHADOWS.medium,
    },
    requiredStar: {
        color: COLORS.danger,
        fontWeight: 'bold',
    },
});
