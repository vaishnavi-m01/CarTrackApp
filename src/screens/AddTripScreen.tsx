import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ToastAndroid,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import apiClient from '../api/apiClient';

export default function AddTripScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles } = useApp();
    const insets = useSafeAreaInsets();

    const tripToEdit = route.params?.trip;
    const isEdit = !!tripToEdit;

    // Default to passed vehicleId or the first vehicle
    const initialVehicleId = route.params?.vehicleId || tripToEdit?.vehicleId?.toString() || (vehicles.length > 0 ? vehicles[0].id : '');

    const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
    const [title, setTitle] = useState(tripToEdit?.title || '');
    const [date, setDate] = useState(tripToEdit?.date ? new Date(tripToEdit.date) : new Date());
    const [distance, setDistance] = useState(tripToEdit?.distanceKm?.toString() || '');
    const [duration, setDuration] = useState(tripToEdit?.duration || '');
    const [note, setNote] = useState(tripToEdit?.note || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        navigation.setParams({ scrollY } as any);
    }, []);

    React.useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const handleSubmit = async () => {
        if (!selectedVehicleId) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please select a vehicle', ToastAndroid.SHORT);
            }
            return;
        }
        if (!title.trim()) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please enter a trip title', ToastAndroid.SHORT);
            }
            return;
        }
        const dist = parseFloat(distance.replace(/,/g, ''));
        if (!distance || isNaN(dist) || dist <= 0) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please enter a valid distance', ToastAndroid.SHORT);
            }
            return;
        }
        if (!duration.trim()) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please enter trip duration', ToastAndroid.SHORT);
            }
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                id: isEdit ? tripToEdit.id : 0,
                vehicleId: parseInt(selectedVehicleId),
                title: title.trim(),
                date: date.toISOString().split('T')[0],
                distanceKm: dist,
                duration: duration.trim(),
                note: note.trim(),
            };

            let response;
            if (isEdit) {
                response = await apiClient.put(`/trips/${tripToEdit.id}`, payload);
            } else {
                response = await apiClient.post('/trips', payload);
            }

            if (response.status >= 200 && response.status < 300) {
                if (Platform.OS === 'android') {
                    ToastAndroid.show(
                        `Trip ${isEdit ? 'updated' : 'recorded'} successfully`,
                        ToastAndroid.SHORT
                    );
                }
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error saving trip:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to save trip', ToastAndroid.SHORT);
            }
        } finally {
            setIsSaving(false);
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
                <Animated.ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >

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

                    {/* Trip Details */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
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
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>
                                Date <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.dateDisplay}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                                <Text style={styles.dateText}>{formatDate(date)}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>
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

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Duration <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="e.g. 6h 30m"
                            maxLength={500}
                        />
                    </View>

                    {/* Note */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Note (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={note}
                            onChangeText={setNote}
                            placeholder="e.g. Smooth highway drive"
                            maxLength={50}
                        />
                    </View>


                    <View style={{ height: 120 }} />

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeDate}
                            maximumDate={new Date()}
                        />
                    )}
                </Animated.ScrollView>

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
                                        <Text style={styles.submitText}>Save Trip</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView >
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
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SIZES.padding, paddingTop: 15, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    footerButtons: { flexDirection: 'row', gap: 15 },
    submitBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
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
