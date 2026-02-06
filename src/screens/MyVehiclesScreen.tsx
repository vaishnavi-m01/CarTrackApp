import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    SafeAreaView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp, Vehicle } from '../context/AppContext';
import VehicleCard from '../components/VehicleCard';

const MOCK_VEHICLES: Vehicle[] = [
    {
        id: '1',
        brand: 'BMW',
        model: 'M3 Competition',
        year: '2023',
        registration: 'KA 01 MG 1234',
        fuelType: 'Petrol',
        vehicleType: 'car',
        mileage: '12,450',
        fuelAvg: '8.5',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success
    },

    {
        id: '2',
        brand: 'Ducati',
        model: 'Panigale V4',
        year: '2023',
        registration: 'KA 01 BK 9999',
        fuelType: 'Petrol',
        vehicleType: 'bike',
        mileage: '1,200',
        fuelAvg: '15.0',
        image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=400',
        status: 'Inactive',
        statusColor: COLORS.danger
    },
    {
        id: '3',
        brand: 'Toyota',
        model: 'Fortuner Legender',
        year: '2023',
        registration: 'KA 09 PL 3456',
        fuelType: 'Diesel',
        vehicleType: 'car',
        mileage: '8,900',
        fuelAvg: '10.5',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success
    },
    {
        id: '4',
        brand: 'Tata',
        model: 'Safari Dark',
        year: '2024',
        registration: 'KA 03 MK 9012',
        fuelType: 'Diesel',
        vehicleType: 'car',
        mileage: '4,200',
        fuelAvg: '13.5',
        image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success
    },
    {
        id: '5',
        brand: 'Tesla',
        model: 'Model S Plaid',
        year: '2024',
        registration: 'KA 01 EV 0001',
        fuelType: 'Electric',
        vehicleType: 'car',
        mileage: '2,500',
        fuelAvg: '165',
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success,
    },
    {
        id: '6',
        brand: 'Harley-Davidson',
        model: 'LiveWire',
        year: '2023',
        registration: 'KA 01 EL 7777',
        fuelType: 'Electric',
        vehicleType: 'bike',
        mileage: '800',
        fuelAvg: '120',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success,
    },
    {
        id: '7',
        brand: 'Toyota',
        model: 'Camry Hybrid',
        year: '2022',
        registration: 'KA 04 HY 7890',
        fuelType: 'Hybrid',
        vehicleType: 'car',
        mileage: '22,400',
        fuelAvg: '24.5',
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success
    },
    {
        id: '8',
        brand: 'Kawasaki',
        model: 'Ninja 7 Hybrid',
        year: '2024',
        registration: 'KA 05 HY 1111',
        fuelType: 'Hybrid',
        vehicleType: 'bike',
        mileage: '450',
        fuelAvg: '22.0',
        image: 'https://images.unsplash.com/photo-1558981420-c532902e58b4?auto=format&fit=crop&q=80&w=400',
        status: 'Inactive',
        statusColor: COLORS.danger
    },
    {
        id: '9',
        brand: 'Maruti Suzuki',
        model: 'Swift S-CNG',
        year: '2022',
        registration: 'KA 06 CN 3333',
        fuelType: 'CNG',
        vehicleType: 'car',
        mileage: '15,000',
        fuelAvg: '31.5',
        image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success
    },
    {
        id: '10',
        brand: 'Bajaj',
        model: 'Freedom 125',
        year: '2024',
        registration: 'KA 08 CN 8888',
        fuelType: 'CNG',
        vehicleType: 'bike',
        mileage: '120',
        fuelAvg: '102.0',
        image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=400',
        status: 'Active',
        statusColor: COLORS.success
    }
];

export default function MyVehiclesScreen({ navigation }: { navigation: any }) {
    const { vehicles, deleteVehicle } = useApp();
    const allVehicles = [...MOCK_VEHICLES, ...vehicles];

    const handleDeleteVehicle = (vehicleId: string, vehicleName: string) => {
        Alert.alert(
            'Delete Vehicle',
            `Are you sure you want to delete ${vehicleName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteVehicle(vehicleId)
                }
            ]
        );
    };

    const handleServiceVehicle = (vehicleId: string) => {
        navigation.navigate('AddService', { vehicleId });
    };

    return (
        <View style={styles.container}>
            {/* <SafeAreaView style={styles.topHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.topHeaderTitle}>My Vehicles</Text>
                <View style={styles.headerRightBtns}>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="share-social-outline" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="heart-outline" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView> */}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {allVehicles.map((v) => (
                    <VehicleCard
                        key={v.id}
                        vehicle={v}
                        onPress={() => navigation.navigate('VehicleDetails', { vehicle: v })}
                        onService={() => handleServiceVehicle(v.id)}
                        onDelete={() => handleDeleteVehicle(v.id, `${v.brand} ${v.model}`)}
                    />
                ))}

                {/* Extra space for FAB */}
                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddVehicle')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={32} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        ...SHADOWS.light,
    },
    topHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerRightBtns: {
        flexDirection: 'row',
        gap: 8,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionHeader: {
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    sectionSubText: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 4,
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        ...SHADOWS.dark,
        elevation: 8,
    },
    fabGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
});
