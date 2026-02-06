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

export default function AddTripScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles, addTrip } = useApp();
    const insets = useSafeAreaInsets();

    // Default to passed vehicleId or the first vehicle
    const initialVehicleId = route.params?.vehicleId || (vehicles.length > 0 ? vehicles[0].id : '');

    const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [note, setNote] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSubmit = () => {
        if (!selectedVehicleId) {
            Alert.alert('Error', 'Please select a vehicle');
            return;
        }
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a trip title');
            return;
        }
        const dist = parseFloat(distance);
        if (!distance || isNaN(dist) || dist <= 0) {
            Alert.alert('Error', 'Please enter a valid distance');
            return;
        }
        if (!duration.trim()) {
            Alert.alert('Error', 'Please enter trip duration');
            return;
        }

        const vehicle = vehicles.find(v => v.id === selectedVehicleId);

        addTrip({
            vehicleId: selectedVehicleId,
            vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown',
            title: title.trim(),
            date: date.toISOString(),
            distance: dist,
            duration: duration.trim(),
            note: note.trim(),
        });

        Alert.alert('Success', 'Trip recorded!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
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

                    {/* Trip Details */}
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
                            Trip Title <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Weekend at Hills"
                            maxLength={30}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formCard, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.formLabel}>
                                Date <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.dateSelector}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.dateText}>{formatDate(date)}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.formCard, { flex: 1 }]}>
                            <Text style={styles.formLabel}>
                                Distance (km) <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={distance}
                                onChangeText={setDistance}
                                keyboardType="numeric"
                                placeholder="e.g. 450"
                                maxLength={6}
                            />
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>
                            Duration <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="e.g. 6h 30m"
                            maxLength={10}
                        />
                    </View>

                    {/* Note */}
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Note (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={note}
                            onChangeText={setNote}
                            placeholder="e.g. Smooth highway drive"
                            maxLength={50}
                        />
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeDate}
                            maximumDate={new Date()}
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
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                            <Text style={styles.submitText}>Save Trip</Text>
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
