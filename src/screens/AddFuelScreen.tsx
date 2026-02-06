import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function AddFuelScreen({ navigation }: { navigation: any }) {
    const { vehicles, addFuelLog } = useApp();
    const insets = useSafeAreaInsets();

    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [odometer, setOdometer] = useState('');
    const [pricePerLiter, setPricePerLiter] = useState('');
    const [totalCost, setTotalCost] = useState('');
    const [liters, setLiters] = useState('');
    const [isFullTank, setIsFullTank] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

    // Auto-select first vehicle
    useEffect(() => {
        if (vehicles.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(vehicles[0].id);
        }
    }, [vehicles]);

    const handleCostChange = (cost: string) => {
        setTotalCost(cost);
        if (pricePerLiter && cost) {
            setLiters((parseFloat(cost) / parseFloat(pricePerLiter)).toFixed(2));
        }
    };

    const handlePriceChange = (price: string) => {
        setPricePerLiter(price);
        if (totalCost && price) {
            setLiters((parseFloat(totalCost) / parseFloat(price)).toFixed(2));
        }
    };

    const handleSubmit = () => {
        if (!selectedVehicleId) {
            Alert.alert('Error', 'Please select a vehicle');
            return;
        }
        const odo = parseFloat(odometer);
        if (!odometer || isNaN(odo) || odo <= 0) {
            Alert.alert('Error', 'Please enter a valid odometer reading');
            return;
        }
        const cost = parseFloat(totalCost);
        if (!totalCost || isNaN(cost) || cost <= 0) {
            Alert.alert('Error', 'Please enter a valid total cost');
            return;
        }
        const price = parseFloat(pricePerLiter);
        if (!pricePerLiter || isNaN(price) || price <= 0) {
            Alert.alert('Error', 'Please enter a valid price per liter');
            return;
        }

        addFuelLog({
            vehicleId: selectedVehicleId,
            date: new Date().toISOString(),
            odometer: odo,
            liters: parseFloat(liters),
            pricePerLiter: price,
            totalCost: cost,
            isFullTank,
        });

        Alert.alert('Success', 'Fuel log added!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
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
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                            {vehicles.map((v) => (
                                <TouchableOpacity
                                    key={v.id}
                                    style={[
                                        styles.vehicleChip,
                                        selectedVehicleId === v.id && styles.vehicleChipActive
                                    ]}
                                    onPress={() => {
                                        setSelectedVehicleId(v.id);
                                    }}
                                >
                                    <Text style={[
                                        styles.vehicleChipText,
                                        selectedVehicleId === v.id && styles.vehicleChipTextActive
                                    ]}>{v.brand} {v.model}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Odometer */}
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
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
                        <View style={[styles.formCard, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.formLabel}>
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
                        <View style={[styles.formCard, { flex: 1 }]}>
                            <Text style={styles.formLabel}>
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
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Fuel Volume (Liters)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                            value={liters}
                            editable={false}
                        />
                    </View>

                    {/* Full Tank Toggle */}
                    <TouchableOpacity
                        style={styles.formCard}
                        onPress={() => setIsFullTank(!isFullTank)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.formLabel}>Full Tank?</Text>
                            <Ionicons
                                name={isFullTank ? "checkbox" : "square-outline"}
                                size={24}
                                color={COLORS.primary}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Date */}
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Date</Text>
                        <Text style={{ fontSize: SIZES.body1, color: COLORS.text }}>{date}</Text>
                    </View>

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
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                            <Text style={styles.submitText}>Save Fuel Log</Text>
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
    row: { flexDirection: 'row' },
    vehicleChip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 10 },
    vehicleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    vehicleChipText: { color: COLORS.textLight, fontWeight: '600' },
    vehicleChipTextActive: { color: COLORS.white },
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
