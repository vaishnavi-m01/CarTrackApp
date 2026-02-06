import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface FormData {
    brand: string;
    model: string;
    year: string;
    registration: string;
    purchaseDate: string;
    purchasePrice: string;
    fuelType: string;
    vehicleType: string;
    insuranceExpiry: string;
    image?: string;
    engine?: string;
    transmission?: string;
    color?: string;
}

export default function AddVehicleScreen({ navigation, route }: { navigation: any, route: any }) {
    const editVehicle = route?.params?.vehicle;
    const insets = useSafeAreaInsets();
    const [formData, setFormData] = useState<FormData>({
        brand: editVehicle?.brand || '',
        model: editVehicle?.model || '',
        year: editVehicle?.year || '',
        registration: editVehicle?.registration || '',
        purchaseDate: editVehicle?.purchaseDate || '',
        purchasePrice: editVehicle?.purchasePrice || '',
        fuelType: editVehicle?.fuelType || 'Petrol',
        vehicleType: editVehicle?.vehicleType || 'car',
        insuranceExpiry: editVehicle?.insuranceExpiry || '',
        image: editVehicle?.image || undefined,
        engine: editVehicle?.engine || '',
        transmission: editVehicle?.transmission || 'Manual',
        color: editVehicle?.color || '',
    });

    const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];

    const { addVehicle } = useApp();
    const [uploading, setUploading] = useState(false);

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

    const handleSubmit = () => {
        if (!formData.brand || !formData.model || !formData.registration) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        addVehicle({
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
            registration: formData.registration,
            purchaseDate: formData.purchaseDate,
            purchasePrice: formData.purchasePrice,
            fuelType: formData.fuelType,
            vehicleType: formData.vehicleType,
            insuranceExpiry: formData.insuranceExpiry,
            image: formData.image,
            engine: formData.engine,
            transmission: formData.transmission,
            color: formData.color,
            mileage: '0',
            fuelAvg: '0'
        });

        Alert.alert('Success', 'Vehicle added successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() },
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
                    {/* Image Picker Section */}
                    <View style={styles.imagePickerCard}>
                        {formData.image ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: formData.image }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => setFormData({ ...formData, image: undefined })}
                                >
                                    <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.pickerOptions}>
                                <TouchableOpacity style={styles.pickerBtn} onPress={pickImage}>
                                    <View style={[styles.pickerIcon, { backgroundColor: '#eef2ff' }]}>
                                        <Ionicons name="images" size={24} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.pickerText}>Gallery</Text>
                                </TouchableOpacity>
                                <View style={styles.pickerDivider} />
                                <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
                                    <View style={[styles.pickerIcon, { backgroundColor: '#fdf2f8' }]}>
                                        <Ionicons name="camera" size={24} color={COLORS.secondaryDark} />
                                    </View>
                                    <Text style={styles.pickerText}>Camera</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.imagePickerLabel}>{editVehicle ? 'Update Vehicle Photo' : 'Add Vehicle Photo'}</Text>
                    </View>
                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Vehicle Type *</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.vehicleType === 'car' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, vehicleType: 'car' })}
                            >
                                <Ionicons
                                    name="car"
                                    size={24}
                                    color={formData.vehicleType === 'car' ? COLORS.white : COLORS.primary}
                                />
                                <Text style={[styles.typeBtnText, formData.vehicleType === 'car' && styles.typeBtnTextActive]}>Car</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.vehicleType === 'bike' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, vehicleType: 'bike' })}
                            >
                                <Ionicons
                                    name="bicycle"
                                    size={24}
                                    color={formData.vehicleType === 'bike' ? COLORS.white : COLORS.primary}
                                />
                                <Text style={[styles.typeBtnText, formData.vehicleType === 'bike' && styles.typeBtnTextActive]}>Bike</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Vehicle Brand *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.brand}
                            onChangeText={(text) => setFormData({ ...formData, brand: text })}
                            placeholder="e.g. Honda, Toyota, BMW"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Model *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.model}
                            onChangeText={(text) => setFormData({ ...formData, model: text })}
                            placeholder="e.g. Civic, Fortuner"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formCard, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.formLabel}>Year</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.year}
                                onChangeText={(text) => setFormData({ ...formData, year: text })}
                                placeholder="2024"
                                keyboardType="numeric"
                                placeholderTextColor={COLORS.textExtraLight}
                            />
                        </View>

                        <View style={[styles.formCard, { flex: 1 }]}>
                            <Text style={styles.formLabel}>Registration *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.registration}
                                onChangeText={(text) => setFormData({ ...formData, registration: text })}
                                placeholder="TN 01 AB 1234"
                                placeholderTextColor={COLORS.textExtraLight}
                            />
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Fuel Type</Text>
                        <View style={styles.fuelTypes}>
                            {fuelTypes.map((fuel) => (
                                <TouchableOpacity
                                    key={fuel}
                                    style={[
                                        styles.fuelBtn,
                                        formData.fuelType === fuel && styles.fuelBtnActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, fuelType: fuel })}
                                >
                                    <Text
                                        style={[
                                            styles.fuelText,
                                            formData.fuelType === fuel && styles.fuelTextActive,
                                        ]}
                                    >
                                        {fuel}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Purchase Date</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.purchaseDate}
                            onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Purchase Price (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.purchasePrice}
                            onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
                            placeholder="e.g. 2250000"
                            keyboardType="numeric"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Insurance Expiry</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.insuranceExpiry}
                            onChangeText={(text) => setFormData({ ...formData, insuranceExpiry: text })}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Engine Capacity (e.g. 1.2L, 1200cc)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.engine}
                            onChangeText={(text) => setFormData({ ...formData, engine: text })}
                            placeholder="e.g. 1.5L i-VTEC"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Transmission</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.transmission === 'Manual' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, transmission: 'Manual' })}
                            >
                                <Text style={[styles.typeBtnText, formData.transmission === 'Manual' && styles.typeBtnTextActive]}>Manual</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.transmission === 'Automatic' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, transmission: 'Automatic' })}
                            >
                                <Text style={[styles.typeBtnText, formData.transmission === 'Automatic' && styles.typeBtnTextActive]}>Automatic</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Exterior Color</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.color}
                            onChangeText={(text) => setFormData({ ...formData, color: text })}
                            placeholder="e.g. Polar White"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>
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
                            <Text style={styles.submitText}>{editVehicle ? 'Update Vehicle' : 'Add Vehicle'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
                <View style={{ height: insets.bottom }} />
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
    fuelTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    fuelBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    fuelBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    fuelText: { fontSize: SIZES.body3, color: COLORS.textLight },
    fuelTextActive: { color: COLORS.white, fontWeight: '600' },
    submitBtn: { marginTop: 20 },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 25, gap: 10, ...SHADOWS.medium },
    submitText: { fontSize: SIZES.body1, fontWeight: 'bold', color: COLORS.white },
    imagePickerCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    imagePickerLabel: {
        marginTop: 12,
        fontSize: SIZES.body2,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    pickerOptions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 10,
    },
    pickerBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    pickerIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: SIZES.body3,
        color: COLORS.text,
        fontWeight: '500',
    },
    pickerDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border,
        marginHorizontal: 10,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 180,
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: COLORS.white,
        borderRadius: 12,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 15,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    typeBtnActive: {
        backgroundColor: COLORS.primary,
    },
    typeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    typeBtnTextActive: {
        color: COLORS.white,
    },
});
