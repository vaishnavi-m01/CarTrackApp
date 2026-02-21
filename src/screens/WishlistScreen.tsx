import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { Car } from '../constants/cars';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../api/apiClient';
const getWishlist = (userId: string) => apiClient.get(`/wishlist/user/${userId}`);
import { useAuth } from '../context/AuthContext';
import { MarketInventory } from '../types/market';

const { width } = Dimensions.get('window');

export default function WishlistScreen({ navigation }: { navigation: any }) {
    const insets = useSafeAreaInsets();
    const { wishlist, toggleWishlist } = useApp();
    const { user } = useAuth();

    const [wishlistedCars, setWishlistedCars] = useState<Car[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadWishlistData();
    }, [wishlist.length]); // Reload if count changes (toggle happened)

    const loadWishlistData = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const response = await getWishlist(user.id);
            const data = response.data || [];
            // data is List<WishlistEntity> -> { id, user, marketInventory }

            const mappedCars: Car[] = data.map((entry: any) => {
                const item: MarketInventory = entry.marketInventory;

                const getColorHex = (name: string, providedHex?: string) => {
                    if (providedHex) return providedHex;
                    const colors: { [key: string]: string } = {
                        'Red': '#EF4444', 'Blue': '#3B82F6', 'Black': '#171717', 'White': '#FFFFFF',
                        'Silver': '#9CA3AF', 'Grey': '#4B5563', 'Yellow': '#EAB308', 'Green': '#22C55E'
                    };
                    return colors[name] || '#000000';
                };

                const mainImage = (item.imageUrl && item.imageUrl !== 'string')
                    ? item.imageUrl
                    : (item.colors?.find((c: any) => c.images?.length > 0)?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1542362567-b05500269774');

                return {
                    id: item.id.toString(),
                    brand: item.model.brand.name,
                    model: item.vehicleName || item.model.name,
                    year: item.year.toString(),
                    price: `₹${item.priceNumeric >= 100 ? (item.priceNumeric / 100).toFixed(2) + ' Cr' : item.priceNumeric + ' Lakh'}`,
                    priceNumeric: item.priceNumeric,
                    emi: item.emiDisplay,
                    image: mainImage,
                    category: item.category?.name,
                    type: item.vehicleType.name.toUpperCase() === 'BIKE' ? 'BIKE' : 'CAR',
                    status: (item.status && (item.status.toLowerCase() === 'new' || item.status.toLowerCase() === 'new_arrival')) ? 'new'
                        : (item.status && item.status.toLowerCase() === 'upcoming') ? 'upcoming'
                            : (item.status && item.status.toLowerCase() === 'trending') ? 'trending'
                                : undefined,
                    specs: {
                        power: `${item.powerHp} HP`,
                        engine: `${item.engineCc} cc`,
                        topSpeed: `${item.topSpeedKmh} km/h`,
                        transmission: item.transmissionType,
                        ...(item.specifications ? JSON.parse(item.specifications) : {})
                    },
                    colorOptions: item.colors?.map((c: any) => ({
                        name: c.colorName,
                        color: getColorHex(c.colorName, c.hexCode),
                        images: c.images?.map((img: any) => img.imageUrl) || []
                    }))
                };
            });

            setWishlistedCars(mappedCars);
        } catch (error) {
            console.error('Error loading wishlist data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderWishlistItem = ({ item }: { item: Car }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VehicleSpec', { vehicle: item })}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleWishlist(item.id)}
                >
                    <Ionicons name="heart" size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
            <View style={styles.info}>
                <Text style={styles.brand}>{item.brand} {item.model}</Text>
                <Text style={styles.price}>{item.price}</Text>
                <View style={styles.specs}>
                    <View style={styles.specItem}>
                        <Ionicons name="flash-outline" size={14} color={COLORS.textLight} />
                        <Text style={styles.specText}>{item.specs.power}</Text>
                    </View>
                    <View style={styles.specItem}>
                        <Ionicons name="speedometer-outline" size={14} color={COLORS.textLight} />
                        <Text style={styles.specText}>{item.specs.topSpeed}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {isLoading ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : wishlistedCars.length > 0 ? (
                <FlatList
                    data={wishlistedCars}
                    renderItem={renderWishlistItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-outline" size={80} color={COLORS.textLight} />
                    <Text style={styles.emptyTitle}>Wishlist is Empty</Text>
                    <Text style={styles.emptySub}>Save your favorite cars to see them here.</Text>
                    <TouchableOpacity
                        style={styles.browseBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.browseBtnText}>Explore Market</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    listContent: {
        padding: 20,
        gap: 20,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        ...SHADOWS.medium,
    },
    imageContainer: {
        width: '100%',
        height: 180,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    heartBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        padding: 15,
    },
    brand: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    price: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    specs: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 10,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    specText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
    },
    emptySub: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 8,
    },
    browseBtn: {
        marginTop: 30,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 12,
    },
    browseBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
