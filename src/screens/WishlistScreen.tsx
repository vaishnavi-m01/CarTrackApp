import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { BROWSE_CARS, Car } from '../constants/cars';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function WishlistScreen({ navigation }: { navigation: any }) {
    const insets = useSafeAreaInsets();
    const { wishlist, toggleWishlist } = useApp();

    const wishlistedCars = BROWSE_CARS.filter(car => wishlist.includes(car.id));

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

            {wishlistedCars.length > 0 ? (
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
