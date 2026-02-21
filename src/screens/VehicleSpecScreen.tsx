import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    Image,
    Share,
    FlatList,
    Modal,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { BROWSE_CARS } from '../constants/cars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// Removed static SPECS as we now use dynamic data from vehicle.specs

const COLORS_DATA = [
    { name: 'Blue', color: '#3182CE', images: [] },
    { name: 'White', color: '#FFFFFF', images: [] },
    { name: 'Red', color: '#E53E3E', images: [] },
    { name: 'Black', color: '#1A202C', images: [] },
];

const FEATURES = [
    '360-Degree Camera',
    'Ventilated Seats',
    '10.25" Touchscreen with JBL Audio',
    '6 Airbags Standard',
];

import apiClient from '../api/apiClient';
const getMarketInventoryById = (id: number) => apiClient.get(`/market-inventory/${id}`);
import { MarketInventory } from '../types/market';
import { Car } from '../constants/cars';

// ... (existing imports)

export default function VehicleSpecScreen({ navigation, route }: { navigation: any; route: any }) {
    const { vehicle: initialVehicle, id } = route.params;
    const [vehicle, setVehicle] = useState<Car | undefined>(initialVehicle || BROWSE_CARS.find(c => c.id === id));
    const [isLoading, setIsLoading] = useState<boolean>(!initialVehicle && !!id);

    const insets = useSafeAreaInsets();
    const { wishlist, toggleWishlist, addToHistory } = useApp();
    const flatListRef = React.useRef<FlatList>(null);

    useEffect(() => {
        const loadVehicleDetails = async () => {
            // If we already have a vehicle passed via params, we might still want to fetch details 
            // to get the latest price/status/specs, but for now let's rely on params if present
            // OR fetch if we only have an ID.
            // given the MarketScreen passes the mapped object, initialVehicle is likely populated. 
            // However, for deep linking (id only) or reliability, fetching by ID is good.

            if (id) {
                setIsLoading(true);
                try {
                    const response = await getMarketInventoryById(Number(id));
                    const item: MarketInventory = response.data;

                    // Helper to map color name to hex if missing
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
                        : (item.colors?.find(c => c.images?.length > 0)?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1542362567-b05500269774');

                    // Map API data to UI Car interface (Same mapping logic as MarketScreen)
                    const mappedCar: Car = {
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
                        status: item.status === 'new' ? 'new' : item.status === 'upcoming' ? 'upcoming' : undefined,
                        specs: {
                            power: `${item.powerHp} HP`,
                            engine: `${item.engineCc} cc`,
                            topSpeed: `${item.topSpeedKmh} km/h`,
                            transmission: item.transmissionType,
                            ...(item.specifications ? JSON.parse(item.specifications) : {})
                        },
                        colorOptions: item.colors?.map(c => ({
                            name: c.colorName,
                            color: getColorHex(c.colorName, c.hexCode),
                            images: c.images?.map(img => img.imageUrl) || []
                        }))
                    };
                    setVehicle(mappedCar);
                } catch (error) {
                    console.error('Failed to load vehicle details:', error);
                    // Fallback to initialVehicle if available, otherwise stay undefined to show error
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadVehicleDetails();
    }, [id]);

    useEffect(() => {
        if (vehicle?.id) {
            addToHistory(vehicle.id);
        }
    }, [vehicle?.id]);

    // Update derived states when vehicle changes
    const availableColors = vehicle?.colorOptions || COLORS_DATA;
    const [selectedColor, setSelectedColor] = useState(availableColors[0]?.name || 'Default');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isViewerVisible, setIsViewerVisible] = useState(false);

    // Get current color's images
    const selectedColorData = availableColors.find(c => c.name === selectedColor);
    const currentImages = (selectedColorData?.images && selectedColorData.images.length > 0)
        ? selectedColorData.images
        : (vehicle?.image ? [vehicle.image] : ['https://images.unsplash.com/photo-1542362567-b05500269774']);

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!vehicle) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Vehicle not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: COLORS.primary, marginTop: 10 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isWishlisted = wishlist.includes(vehicle.id);

    const onShare = async () => {
        try {
            // Generates a link that works in Expo Go, development, and production
            const shareUrl = Linking.createURL(`spec/${vehicle.id}`);

            const message = `🔥 Check out this amazing ${vehicle.brand} ${vehicle.model} (${vehicle.year}) on CarTrack!\n\n` +
                `💰 Price: ${vehicle.price}\n` +
                `⚡ Power: ${vehicle.specs.power}\n` +
                `🏎️ Top Speed: ${vehicle.specs.topSpeed}\n\n` +
                `View full details here: ${shareUrl}`;

            await Share.share({
                message,
                url: shareUrl,
                title: `${vehicle.brand} ${vehicle.model} Details`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Icon Header Section */}
            <View style={[styles.headerContainer, { height: 350 + insets.top }]}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={[styles.gradientHeader, { height: 370 + insets.top }]}
                />

                <View style={[styles.headerActions, { top: insets.top + 10 }]}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
                            <Ionicons name="share-social-outline" size={18} color={COLORS.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => toggleWishlist(vehicle.id)}
                        >
                            <Ionicons
                                name={isWishlisted ? "heart" : "heart-outline"}
                                size={18}
                                color={isWishlisted ? "#ef4444" : COLORS.text}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero Car Image Card */}
                <View style={[styles.imageWrapper, { top: insets.top + 60 }]}>
                    <TouchableOpacity
                        style={styles.carImageHero}
                        onPress={() => setIsViewerVisible(true)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.carImageHeroContent}>
                            <FlatList
                                ref={flatListRef}
                                data={currentImages}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                getItemLayout={(_, index) => ({
                                    length: width - 30,
                                    offset: (width - 30) * index,
                                    index,
                                })}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / (width - 30));
                                    setActiveImageIndex(index);
                                }}
                                renderItem={({ item }) => (
                                    <Image source={{ uri: item }} style={styles.headerImage} />
                                )}
                                keyExtractor={(_, index) => index.toString()}
                            />

                            {/* Pagination Dots */}
                            {currentImages.length > 1 && (
                                <View style={styles.paginationDots}>
                                    {currentImages.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                activeImageIndex === index && styles.dotActive
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}

                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.imageGradientOverlay}
                            />

                            {/* Bottom Bar Content Over Image */}
                            <View style={styles.imageBottomContent}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.brandTitleOverlay} numberOfLines={1}>{vehicle.brand}</Text>
                                    <Text style={styles.modelTitleOverlay} numberOfLines={1}>{vehicle.model} • {vehicle.year}</Text>
                                </View>
                                <View style={styles.fullScreenBadge}>
                                    <Ionicons name="expand-outline" size={16} color={COLORS.white} />
                                    <Text style={styles.fullScreenText}>Full Screen</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
            >
                {/* Market Intelligence - Price Analysis */}
                <View style={styles.priceContainer}>
                    <View>
                        <View style={styles.priceHeaderRow}>
                            <Text style={styles.priceLabel}>Ex-Showroom Price</Text>
                            <View style={[styles.marketBadge, { backgroundColor: vehicle.priceNumeric > 80 ? '#fefce8' : '#f0fdf4' }]}>
                                <Text style={[styles.marketBadgeText, { color: vehicle.priceNumeric > 80 ? '#854d0e' : '#15803d' }]}>
                                    {vehicle.priceNumeric > 80 ? 'Premium Choice' : 'Great Deal'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.priceValue}>{vehicle.price}</Text>
                        <Text style={styles.onRoadEstimate}>Est. On-Road: ₹{(vehicle.priceNumeric * 1.15).toFixed(1)} Lakh*</Text>
                    </View>
                    <TouchableOpacity style={styles.emiCard} onPress={() => navigation.navigate('LoanCalculator', { amount: (vehicle.priceNumeric * 100000).toString() })}>
                        <Text style={styles.emiLabel}>Est. EMI</Text>
                        <Text style={styles.emiValue}>{vehicle.emi?.split(' ')[2] || '₹1.2L'}</Text>
                        <Text style={styles.emiLink}>Calculate →</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Trust Badges */}
                <View style={styles.trustRow}>
                    <View style={styles.trustItem}>
                        <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                        <Text style={styles.trustText}>Verified</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Ionicons name="person" size={16} color="#3b82f6" />
                        <Text style={styles.trustText}>1st Owner</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Ionicons name="leaf" size={16} color="#10b981" />
                        <Text style={styles.trustText}>{vehicle.specs?.safety || '5 Star'}</Text>
                    </View>
                </View>

                {/* Dynamic Specifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Specifications</Text>
                    <View style={styles.specsGrid}>
                        <View style={styles.specItem}>
                            <View style={styles.specIconBox}>
                                <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.specTextContent}>
                                <Text style={styles.specLabel} numberOfLines={1}>Power</Text>
                                <Text style={styles.specValue} numberOfLines={1} adjustsFontSizeToFit>{vehicle.specs?.power || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.specItem}>
                            <View style={styles.specIconBox}>
                                <Ionicons name="cog-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.specTextContent}>
                                <Text style={styles.specLabel} numberOfLines={1}>Engine</Text>
                                <Text style={styles.specValue} numberOfLines={1} adjustsFontSizeToFit>{vehicle.specs?.engine || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.specItem}>
                            <View style={styles.specIconBox}>
                                <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.specTextContent}>
                                <Text style={styles.specLabel} numberOfLines={1}>Top Speed</Text>
                                <Text style={styles.specValue} numberOfLines={1} adjustsFontSizeToFit>{vehicle.specs?.topSpeed || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.specItem}>
                            <View style={styles.specIconBox}>
                                <Ionicons name="git-network-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.specTextContent}>
                                <Text style={styles.specLabel} numberOfLines={1}>Gearbox</Text>
                                <Text style={styles.specValue} numberOfLines={1} adjustsFontSizeToFit>{vehicle.specs.transmission || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Colors */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Colors</Text>
                    <View style={styles.colorsRow}>
                        {availableColors.map((color) => (
                            <TouchableOpacity
                                key={color.name}
                                onPress={() => {
                                    setSelectedColor(color.name);
                                    setActiveImageIndex(0);
                                    // Only scroll if there are images to scroll to
                                    if (color.images && color.images.length > 0) {
                                        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
                                    }
                                }}
                                style={[
                                    styles.colorOutline,
                                    selectedColor === color.name && styles.colorOutlineActive
                                ]}
                            >
                                <View style={[styles.colorDot, { backgroundColor: color.color }]} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Business Highlights & Resale Value */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Business Intelligence</Text>
                    <View style={styles.intelligenceGrid}>
                        <View style={styles.intelCard}>
                            <Text style={styles.intelLabel}>Expected Resale (3Yr)</Text>
                            <Text style={styles.intelValue}>₹{(vehicle.priceNumeric * 0.7).toFixed(1)}L</Text>
                            <Text style={styles.intelTrend}>-30% Depreciation</Text>
                        </View>
                        <View style={styles.intelCard}>
                            <Text style={styles.intelLabel}>Avg. Service Cost</Text>
                            <Text style={styles.intelValue}>₹12,450/yr</Text>
                            <Text style={styles.intelTrend}>Verified History</Text>
                        </View>
                    </View>
                </View>

                {/* Dimensions & Capacities */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dimensions & Capacities</Text>
                    <View style={styles.dimensionsCard}>
                        <View style={styles.dimRow}>
                            <View style={styles.dimItem}>
                                <Text style={styles.dimLabel}>Length</Text>
                                <Text style={styles.dimValue}>{vehicle.specs?.length || '4,500 mm'}</Text>
                            </View>
                            <View style={styles.dimItem}>
                                <Text style={styles.dimLabel}>Width</Text>
                                <Text style={styles.dimValue}>{vehicle.specs?.width || '1,800 mm'}</Text>
                            </View>
                        </View>
                        <View style={styles.dimDivider} />
                        <View style={styles.dimRow}>
                            <View style={styles.dimItem}>
                                <Text style={styles.dimLabel}>Fuel Tank</Text>
                                <Text style={styles.dimValue}>{vehicle.specs?.tank || '50 Litres'}</Text>
                            </View>
                            <View style={styles.dimItem}>
                                <Text style={styles.dimLabel}>Boot Space</Text>
                                <Text style={styles.dimValue}>{vehicle.specs?.bootSpace || '450 L'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Seller Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Seller Information</Text>
                    <View style={styles.sellerCard}>
                        <View style={styles.sellerTop}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100' }}
                                style={styles.sellerAvatar}
                            />
                            <View style={styles.sellerInfo}>
                                <Text style={styles.sellerName}>Premium Wheels India</Text>
                                <View style={styles.sellerRating}>
                                    <Text style={styles.ratingTextMain}>4.9</Text>
                                    <Ionicons name="star" size={12} color="#f59e0b" />
                                    <Text style={styles.ratingCount}>(124 reviews)</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.contactIconBtn}>
                                <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sellerLocation}>
                            <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
                            <Text style={styles.locationText}>Andheri West, Mumbai • 4.2 km away</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Full Screen Image Viewer Modal */}
            <Modal
                visible={isViewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsViewerVisible(false)}
            >
                <View style={styles.viewerContainer}>
                    <SafeAreaView style={styles.viewerHeader}>
                        <TouchableOpacity
                            style={styles.viewerCloseBtn}
                            onPress={() => setIsViewerVisible(false)}
                        >
                            <Ionicons name="close" size={28} color={COLORS.white} />
                        </TouchableOpacity>

                        <View style={styles.viewerPagination}>
                            <Text style={styles.viewerPaginationText}>
                                {activeImageIndex + 1} / {currentImages.length}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.viewerCloseBtn} onPress={onShare}>
                            <Ionicons name="share-outline" size={22} color={COLORS.white} />
                        </TouchableOpacity>
                    </SafeAreaView>

                    <FlatList
                        data={currentImages}
                        horizontal
                        pagingEnabled
                        initialScrollIndex={activeImageIndex}
                        getItemLayout={(_, index) => ({
                            length: width,
                            offset: width * index,
                            index,
                        })}
                        showsHorizontalScrollIndicator={false}
                        snapToAlignment="center"
                        snapToInterval={width}
                        decelerationRate="fast"
                        scrollEventThrottle={16}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(index);
                        }}
                        renderItem={({ item }) => (
                            <View style={styles.fullImageWrap}>
                                <ScrollView
                                    maximumZoomScale={4}
                                    minimumZoomScale={1}
                                    showsHorizontalScrollIndicator={false}
                                    showsVerticalScrollIndicator={false}
                                    centerContent={true}
                                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                                    nestedScrollEnabled={true}
                                >
                                    <Image
                                        source={{ uri: item.replace('w=800', 'w=1200') }} // Higher res for full screen
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                </ScrollView>
                            </View>
                        )}
                    />

                    {/* Thumbnail Strip at Bottom */}
                    <View style={styles.viewerFooter}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailContainer}>
                            {currentImages.map((img, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setActiveImageIndex(idx)}
                                    style={[
                                        styles.thumbnailWrap,
                                        activeImageIndex === idx && styles.thumbnailActive
                                    ]}
                                >
                                    <Image source={{ uri: img }} style={styles.thumbnail} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    headerContainer: {
        height: 420,
        position: 'relative',
    },
    gradientHeader: {
        height: 320,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerActions: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    imageWrapper: {
        position: 'absolute',
        top: 80,
        width: width,
        alignItems: 'center',
        paddingHorizontal: 15,
        zIndex: 5,
    },
    carImageHero: {
        width: '100%',
        height: 260,
        borderRadius: 25,
        backgroundColor: '#000',
        ...SHADOWS.dark,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    carImageHeroContent: {
        width: '100%',
        height: '100%',
    },
    headerImage: {
        width: width - 30,
        height: 260,
    },
    imageGradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    imageBottomContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brandTitleOverlay: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    modelTitleOverlay: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        fontWeight: '500',
    },
    fullScreenBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    fullScreenText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    intelligenceGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    intelCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    intelLabel: {
        fontSize: 10,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    intelValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    intelTrend: {
        fontSize: 10,
        color: '#10b981',
        marginTop: 2,
        fontWeight: '600',
    },
    dimensionsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        ...SHADOWS.light,
    },
    dimRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dimItem: {
        flex: 1,
    },
    dimLabel: {
        fontSize: 10,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dimValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 2,
    },
    dimDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    ratingBadgeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    scrollContent: {
        flex: 1,
        marginTop: -10,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        ...SHADOWS.medium,
    },
    scrollInner: {
        padding: 20,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    priceHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    priceLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    marketBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    marketBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    onRoadEstimate: {
        fontSize: 11,
        color: COLORS.textExtraLight,
        marginTop: 4,
    },
    emiCard: {
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 14,
        alignItems: 'center',
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minWidth: 100,
    },
    emiLabel: {
        fontSize: 10,
        color: COLORS.textExtraLight,
        fontWeight: '600',
    },
    emiValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginVertical: 2,
    },
    emiLink: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '700',
    },
    trustRow: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allow badges to wrap if too long
        justifyContent: 'flex-start',
        marginBottom: 25,
        gap: 8,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        minWidth: '25%', // Ensure reasonable size
    },
    trustText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 6,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
    },
    specsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    specItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 8,
    },
    specTextContent: {
        flex: 1,
        justifyContent: 'center',
    },
    specIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...SHADOWS.light,
    },
    specLabel: {
        fontSize: 10,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    specValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 1,
    },
    highlightsCard: {
        backgroundColor: '#f1f5f9',
        padding: 18,
        borderRadius: 20,
        gap: 12,
    },
    highlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    highlightText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500',
        flex: 1,
    },
    sellerCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        ...SHADOWS.light,
    },
    sellerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sellerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    sellerInfo: {
        flex: 1,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sellerRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingTextMain: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    ratingCount: {
        fontSize: 11,
        color: COLORS.textExtraLight,
    },
    contactIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sellerLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    locationText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    colorsRow: {
        flexDirection: 'row',
        gap: 15,
    },
    colorOutline: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOutlineActive: {
        borderColor: COLORS.primary,
    },
    colorDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        ...SHADOWS.light,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    paginationDots: {
        position: 'absolute',
        bottom: 80, // Moved up slightly from the very bottom to clear the text overlay
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        zIndex: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    dotActive: {
        width: 24,
        backgroundColor: COLORS.primary,
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    viewerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
    },
    viewerCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerPagination: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    viewerPaginationText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    fullImageWrap: {
        width: width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: '100%',
    },
    viewerFooter: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    thumbnailContainer: {
        gap: 12,
        paddingHorizontal: 10,
    },
    thumbnailWrap: {
        width: 60,
        height: 40,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        opacity: 0.6,
    },
    thumbnailActive: {
        borderColor: COLORS.primary,
        opacity: 1,
        transform: [{ scale: 1.1 }],
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
});
