import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ToastAndroid,
    Pressable,
    Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

interface FormData {
    vehicleName: string;
    brand: string;
    model: string;
    year: string;
    registration: string;
    purchaseDate: string;
    purchasePrice: string;
    fuelTypeId: number;
    vehicleTypeId: number;
    insuranceExpiry: string;
    image?: string;
    engine?: string;
    transmission?: string;
    color?: string;
    mileage?: string;
    fuelAvg?: string;
}

interface TypeData {
    id: number;
    name: string;
}

const formatDateForUI = (dateString?: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}-${month}-${year}`;
};

const formatDateForBackend = (dateString?: string) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    if (!day || !month || !year) return dateString;
    return `${year}-${month}-${day}`;
};

export default function AddVehicleScreen({ navigation, route }: { navigation: any, route: any }) {
    const editVehicle = route?.params?.vehicle;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [formData, setFormData] = useState<FormData>({
        vehicleName: editVehicle?.vehicleName || '',
        brand: editVehicle?.brand || '',
        model: editVehicle?.model || '',
        year: editVehicle?.year || '',
        registration: editVehicle?.registration || '',
        purchaseDate: formatDateForUI(editVehicle?.purchaseDate),
        purchasePrice: editVehicle?.purchasePrice || '',
        fuelTypeId: editVehicle?.fuelTypeId || 1,
        vehicleTypeId: editVehicle?.vehicleTypeId || 1,
        insuranceExpiry: formatDateForUI(editVehicle?.insuranceExpiry),
        image: editVehicle?.image || undefined,
        engine: editVehicle?.engine || '',
        transmission: editVehicle?.transmission?.toLowerCase() === 'automatic' ? 'Automatic' : 'Manual',
        color: editVehicle?.color || '',
        mileage: editVehicle?.mileage || '',
        fuelAvg: editVehicle?.fuelAvg || '',
    });

    const [vehicleTypes, setVehicleTypes] = useState<TypeData[]>([]);
    const [fuelTypes, setFuelTypes] = useState<TypeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // Date Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'purchase' | 'insurance' | null>(null);
    const [pickerDate, setPickerDate] = useState(new Date());

    const handleDateSelect = (event: any, selectedDate?: Date) => {
        setShowPicker(false);
        if (selectedDate && pickerMode) {
            const formatted = `${String(selectedDate.getDate()).padStart(2, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.getFullYear()}`;
            setFormData({ ...formData, [pickerMode === 'purchase' ? 'purchaseDate' : 'insuranceExpiry']: formatted });
        }
        setPickerMode(null);
    };

    const openDatePicker = (mode: 'purchase' | 'insurance') => {
        setPickerMode(mode);
        const dateStr = mode === 'purchase' ? formData.purchaseDate : formData.insuranceExpiry;
        if (dateStr) {
            const [d, m, y] = dateStr.split('-');
            setPickerDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
        } else {
            setPickerDate(new Date());
        }
        setShowPicker(true);
    };


    useEffect(() => {
        fetchMetadata();
        navigation.setOptions({
            title: editVehicle ? 'Edit Vehicle' : 'Add Vehicle'
        });
    }, [editVehicle, navigation]);

    // Auto-fill Vehicle Name
    useEffect(() => {
        if (formData.brand && formData.model) {
            // Only auto-fill if vehicleName is empty or looks like a previous auto-fill
            const generatedName = `${formData.brand} ${formData.model}`;
            // Simple logic: Always update if user hasn't manually set something else custom? 
            // Requirement: "Brand and model type pannra name automatic vehicleName field la show aganum"
            // Let's just update it.
            setFormData(prev => ({ ...prev, vehicleName: generatedName }));
        }
    }, [formData.brand, formData.model]);

    const fetchMetadata = async () => {
        try {
            const [vParams, fParams] = await Promise.all([
                apiClient.get('/vehicle-type'), // Endpoint based on user request /vehicle-type (singular?) user said "/vehicle-type"
                apiClient.get('/fuelType')      // Endpoint /fuelType
            ]);

            if (vParams.data) setVehicleTypes(vParams.data);
            if (fParams.data) setFuelTypes(fParams.data);

        } catch (error) {
            console.error('Error fetching metadata:', error);
            Alert.alert('Error', 'Failed to load vehicle options');
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0].uri });
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0].uri });
        }
    };

    const handleSubmit = async () => {
        if (!formData.brand || !formData.model || !formData.registration || !formData.vehicleName || !formData.mileage) {
            Alert.alert('Error', 'Please fill in all required fields (marked with *)');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                id: editVehicle?.id || 0,
                userId: user?.id ? parseInt(user.id) : 0,
                vehicleTypeId: formData.vehicleTypeId,
                brandId: 0,
                customBrandName: formData.brand,
                modelId: 0,
                customModelName: formData.model,
                vehicleName: formData.vehicleName,
                fuelTypeId: formData.fuelTypeId,
                year: parseInt(formData.year) || 0,
                registration: formData.registration,
                transmission: formData.transmission.toUpperCase(),
                engineCapacity: formData.engine,
                color: formData.color,
                mileage: parseFloat(formData.mileage.toString().replace(/,/g, '')) || 0,
                fuelAvg: parseFloat(formData.fuelAvg.toString().replace(/,/g, '')) || 0,
                purchasePrice: parseFloat(formData.purchasePrice.toString().replace(/,/g, '')) || 0,
                purchaseDate: formatDateForBackend(formData.purchaseDate),
                insuranceExpiry: formatDateForBackend(formData.insuranceExpiry),
                isActive: true,
                imageUrl: "",
            };

            let response;
            if (editVehicle?.id) {
                response = await apiClient.put(`/vehicles/${editVehicle.id}`, payload);
            } else {
                response = await apiClient.post('/vehicles', payload);
            }

            if (response.status >= 200 && response.status < 300) {
                const vehicleId = response.data.id || response.data; // Adjust based on return

                // Upload Image if selected
                if (formData.image && vehicleId) {
                    const uri = formData.image;
                    const uriParts = uri.split('.');
                    const fileType = uriParts[uriParts.length - 1];

                    const formDataImage = new FormData();
                    formDataImage.append('file', {
                        uri,
                        name: `vehicle_${vehicleId}.${fileType}`,
                        type: `image/${fileType}`,
                    } as any);

                    await apiClient.post(`/vehicles/${vehicleId}/image`, formDataImage, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                }

                if (Platform.OS === 'android') {
                    ToastAndroid.show('Vehicle added successfully!', ToastAndroid.LONG);
                } else {
                    Alert.alert('Success', 'Vehicle added successfully!');
                }
                navigation.goBack();
            }
        } catch (error: any) {
            console.error('Error adding vehicle:', error);
            const msg = error.response?.data?.message || 'Failed to save vehicle';
            Alert.alert('Error', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Image Picker Section */}
                    <View style={styles.imagePickerCard}>
                        {formData.image ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: formData.image }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setFormData({ ...formData, image: undefined })}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.changePhotoOverlay} onPress={pickImage}>
                                    <Ionicons name="camera" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ width: '100%', alignItems: 'center' }}>
                                <View style={styles.pickerOptions}>
                                    <TouchableOpacity style={styles.pickerBtn} onPress={pickImage}>
                                        <View style={[styles.pickerIcon, { backgroundColor: '#eff6ff' }]}>
                                            <Ionicons name="images" size={28} color={COLORS.primary} />
                                        </View>
                                        <Text style={styles.pickerText}>Gallery</Text>
                                    </TouchableOpacity>

                                    <View style={styles.pickerDivider} />

                                    <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
                                        <View style={[styles.pickerIcon, { backgroundColor: '#fef2f2' }]}>
                                            <Ionicons name="camera" size={28} color="#ef4444" />
                                        </View>
                                        <Text style={styles.pickerText}>Camera</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.imagePickerLabel}>Add Vehicle Photo</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Type <Text style={styles.required}>*</Text></Text>
                        <View style={styles.typeSelector}>
                            {vehicleTypes.map((vType) => (
                                <TouchableOpacity
                                    key={vType.id}
                                    style={[styles.typeBtn, formData.vehicleTypeId === vType.id ? styles.typeBtnActive : styles.typeBtnInactive]}
                                    onPress={() => setFormData({ ...formData, vehicleTypeId: vType.id })}
                                >
                                    <Ionicons
                                        name={vType.name.toLowerCase().includes('bike') ? "bicycle" : "car"}
                                        size={22}
                                        color={formData.vehicleTypeId === vType.id ? COLORS.white : COLORS.primary}
                                    />
                                    <Text style={[styles.typeBtnText, formData.vehicleTypeId === vType.id && styles.typeBtnTextActive]}>
                                        {vType.name.charAt(0).toUpperCase() + vType.name.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Brand <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={formData.brand}
                            onChangeText={(text) => setFormData({ ...formData, brand: text })}
                            placeholder="e.g. Honda, Toyota, BMW"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Model <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={formData.model}
                            onChangeText={(text) => setFormData({ ...formData, model: text })}
                            placeholder="e.g. Civic, Fortuner"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Name <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={formData.vehicleName}
                            onChangeText={(text) => setFormData({ ...formData, vehicleName: text })}
                            placeholder="e.g. Honda Civic White"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Odometer (km) <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={formData.mileage}
                                onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                                placeholder="e.g. 15000"
                                keyboardType="numeric"
                                placeholderTextColor={COLORS.textExtraLight}
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Avg Fuel (km/l)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.fuelAvg}
                                onChangeText={(text) => setFormData({ ...formData, fuelAvg: text })}
                                placeholder="e.g. 15.5"
                                keyboardType="numeric"
                                placeholderTextColor={COLORS.textExtraLight}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Reg No.</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.registration}
                                onChangeText={(text) => setFormData({ ...formData, registration: text })}
                                placeholder="e.g. KA 01 AB 1234"
                                placeholderTextColor={COLORS.textExtraLight}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Year</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.year}
                                onChangeText={(text) => setFormData({ ...formData, year: text })}
                                placeholder="e.g. 2024"
                                keyboardType="numeric"
                                placeholderTextColor={COLORS.textExtraLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fuel Type <Text style={styles.required}>*</Text></Text>
                        <View style={styles.fuelTypes}>
                            {fuelTypes.map((fType) => (
                                <TouchableOpacity
                                    key={fType.id}
                                    style={[
                                        styles.fuelBtn,
                                        formData.fuelTypeId === fType.id ? styles.fuelBtnActive : styles.fuelBtnInactive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, fuelTypeId: fType.id })}
                                >
                                    <Text
                                        style={[
                                            styles.fuelText,
                                            formData.fuelTypeId === fType.id && styles.fuelTextActive,
                                        ]}
                                    >
                                        {fType.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Purchase Date</Text>
                        <Pressable onPress={() => openDatePicker('purchase')}>
                            <View pointerEvents="none">
                                <TextInput
                                    style={styles.input}
                                    value={formData.purchaseDate}
                                    placeholder="Select Date"
                                    placeholderTextColor={COLORS.textExtraLight}
                                    editable={false}
                                />
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Purchase Price (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.purchasePrice}
                            onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
                            placeholder="e.g. 2250000"
                            keyboardType="numeric"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Insurance Expiry</Text>
                        <Pressable onPress={() => openDatePicker('insurance')}>
                            <View pointerEvents="none">
                                <TextInput
                                    style={styles.input}
                                    value={formData.insuranceExpiry}
                                    placeholder="Select Date"
                                    placeholderTextColor={COLORS.textExtraLight}
                                    editable={false}
                                />
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Engine Capacity</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.engine}
                            onChangeText={(text) => setFormData({ ...formData, engine: text })}
                            placeholder="e.g. 1.5L i-VTEC"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Transmission</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.transmission === 'Manual' ? styles.typeBtnActive : styles.typeBtnInactive]}
                                onPress={() => setFormData({ ...formData, transmission: 'Manual' })}
                            >
                                <Text style={[styles.typeBtnText, formData.transmission === 'Manual' && styles.typeBtnTextActive]}>Manual</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.transmission === 'Automatic' ? styles.typeBtnActive : styles.typeBtnInactive]}
                                onPress={() => setFormData({ ...formData, transmission: 'Automatic' })}
                            >
                                <Text style={[styles.typeBtnText, formData.transmission === 'Automatic' && styles.typeBtnTextActive]}>Automatic</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Exterior Color</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.color}
                            onChangeText={(text) => setFormData({ ...formData, color: text })}
                            placeholder="e.g. Polar White"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>
                    <View style={{ height: 120 }} />
                </ScrollView>

                {showPicker && (
                    <DateTimePicker
                        value={pickerDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateSelect}
                    />
                )}
                {!isKeyboardVisible && (
                    <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <View style={styles.footerInner}>
                            <TouchableOpacity
                                style={[styles.submitBtnHalf, styles.cancelBtnSecondary]}
                                onPress={() => navigation.goBack()}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelBtnTextSecondary}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitBtnHalf, isSubmitting && { opacity: 0.7 }]}
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
                                        <Text style={styles.submitTextSmall}>{editVehicle ? 'Update Vehicle' : 'Save Vehicle'}</Text>
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
    inputGroup: { marginBottom: 12, paddingHorizontal: 4 },
    label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 6, marginTop: 4 },
    input: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: '#e2e8f0' },
    row: { flexDirection: 'row' },
    required: { color: COLORS.danger, fontWeight: 'bold' },
    dateDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
    dateDisplayText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SIZES.padding, paddingTop: 15, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F1F5F9', ...SHADOWS.medium },
    footerInner: { flexDirection: 'row', gap: 15 },
    submitBtnHalf: { flex: 1, borderRadius: 16, overflow: 'hidden', ...SHADOWS.medium },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
    submitTextSmall: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    cancelBtnSecondary: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0, elevation: 0 },
    cancelBtnTextSecondary: { color: COLORS.textLight, fontSize: 16, fontWeight: '600' },
    imagePickerCard: { backgroundColor: COLORS.white, padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    imagePickerLabel: { marginTop: 12, fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
    pickerOptions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 10 },
    pickerBtn: { flex: 1, alignItems: 'center', gap: 8 },
    pickerIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    pickerText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
    pickerDivider: { width: 1, height: 40, backgroundColor: COLORS.border, marginHorizontal: 10 },
    imagePreviewContainer: { width: '100%', height: 200, borderRadius: 15, overflow: 'hidden', position: 'relative', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    changePhotoOverlay: { position: 'absolute', bottom: 15, right: 15, backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
    removeImageBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(255,255,255,0.9)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    typeSelector: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
    typeBtn: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    typeBtnInactive: { backgroundColor: COLORS.white },
    typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeBtnText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight },
    typeBtnTextActive: { color: COLORS.white },
    fuelTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fuelBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    fuelBtnInactive: { backgroundColor: COLORS.white },
    fuelBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    fuelText: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
    fuelTextActive: { color: COLORS.white, fontWeight: 'bold' },
});
