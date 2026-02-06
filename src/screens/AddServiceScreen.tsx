import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

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

    const handleSave = () => {
        if (!selectedVehicleId || !title || !amount || !odometer) {
            Alert.alert('Required Fields', 'Please fill in all mandatory fields (*)');
            return;
        }

        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle) return;

        // 1. Add as a service expense
        addExpense({
            type: 'Service',
            amount: parseFloat(amount),
            date: date.toISOString(),
            vehicleId: selectedVehicleId,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            note: `${title}${provider ? ` @ ${provider}` : ''}${note ? ` - ${note}` : ''}`,
            icon: 'build',
            color: COLORS.primary
        });

        // 2. Update vehicle odometer if it's higher
        const currentMileage = parseFloat(vehicle.mileage || '0');
        const newOdometer = parseFloat(odometer);
        if (newOdometer > currentMileage) {
            updateVehicle(selectedVehicleId, {
                mileage: odometer
            });
        }

        Alert.alert('Success', 'Service record saved successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <Text style={styles.label}>Select Vehicle <Text style={styles.required}>*</Text></Text>
                <View style={styles.vehicleSelector}>
                    {vehicles.map(v => (
                        <TouchableOpacity
                            key={v.id}
                            style={[
                                styles.vehicleChip,
                                selectedVehicleId === v.id && styles.vehicleChipActive
                            ]}
                            onPress={() => setSelectedVehicleId(v.id)}
                        >
                            <Ionicons
                                name={v.vehicleType === 'bike' ? 'bicycle' : 'car'}
                                size={16}
                                color={selectedVehicleId === v.id ? COLORS.white : COLORS.textLight}
                            />
                            <Text style={[
                                styles.vehicleChipText,
                                selectedVehicleId === v.id && styles.vehicleChipTextActive
                            ]}>{v.model}</Text>
                        </TouchableOpacity>
                    ))}
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
                        maxLength={30}
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

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 20) }
            ]}>
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
                        <Text style={styles.saveBtnText}>Save Service Record</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SIZES.padding,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 16,
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
        marginBottom: 16,
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
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    saveGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
