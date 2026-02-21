import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Header from '../components/Header';
import { useApp } from '../context/AppContext';

import apiClient from '../api/apiClient';
import { MarketInventory } from '../types/market';
import { Car } from '../constants/cars';

const getMarketInventory = (params?: any) => apiClient.get('/market-inventory', { params });
const getVehicleTypes = () => apiClient.get('/vehicle-type');
const getVehicleCategories = () => apiClient.get('/vehicle-categories');
const getBrands = () => apiClient.get('/brands');
const getModels = () => apiClient.get('/models');

export default function MarketScreen({ navigation }: { navigation: any }) {
    const { recentlyViewed, wishlist, toggleWishlist } = useApp();
    const [selectedCars, setSelectedCars] = useState<string[]>([]);

    // State for dynamic data
    const [cars, setCars] = useState<Car[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Filter Data States
    const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
    const [vehicleCategories, setVehicleCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [filteredModels, setFilteredModels] = useState<any[]>([]);


    useEffect(() => {
        loadFilterData();
    }, []);

    const loadFilterData = async () => {
        try {
            const [typesRes, catsRes, brandsRes, modelsRes] = await Promise.all([
                getVehicleTypes(),
                getVehicleCategories(),
                getBrands(),
                getModels()
            ]);

            setVehicleTypes([{ id: 'all', name: 'All' }, ...typesRes.data]);
            setVehicleCategories([{ id: 'all', name: 'All' }, ...catsRes.data]);
            setBrands([{ id: 'all', name: 'All' }, ...brandsRes.data]);
            setModels(modelsRes.data);
            setFilteredModels(modelsRes.data);
        } catch (error) {
            console.error('Failed to load filter data:', error);
        }
    };

    const loadMarketInventory = async () => {
        console.log('--- loadMarketInventory called ---');
        setIsLoading(true);
        try {
            const params: any = {};

            if (selectedType !== 'All') {
                const typeObj = vehicleTypes.find(t => t.name === selectedType);
                if (typeObj && typeObj.id !== 'all') params.vehicleTypeId = typeObj.id;
            }

            if (selectedStatus !== 'All') {
                params.status = selectedStatus === 'New Arrival' ? 'new' : selectedStatus === 'Upcoming' ? 'upcoming' : undefined;
            }

            if (activeFilters.brand && activeFilters.brand !== 'All') {
                const brandObj = brands.find(b => b.name === activeFilters.brand);
                if (brandObj && brandObj.id !== 'all') params.brandId = brandObj.id;
            }

            if (activeFilters.bodyType && activeFilters.bodyType !== 'All') {
                const catObj = vehicleCategories.find(c => c.name === activeFilters.bodyType);
                if (catObj && catObj.id !== 'all') params.categoryId = catObj.id;
            }

            if (activeFilters.model && activeFilters.model !== 'All') {
                const modelObj = models.find(m => m.name === activeFilters.model);
                if (modelObj) params.modelId = modelObj.id;
            }

            if (activeFilters.priceRange && activeFilters.priceRange !== 'All') {
                const range = PRICE_RANGES.find(r => r.value === activeFilters.priceRange);
                if (range) {
                    if (range.value === '<20') {
                        params.maxPrice = 2000000;
                    } else if (range.value === '20-50') {
                        params.minPrice = 2000000;
                        params.maxPrice = 5000000;
                    } else if (range.value === '50-100') {
                        params.minPrice = 5000000;
                        params.maxPrice = 10000000;
                    } else if (range.value === '>100') {
                        params.minPrice = 10000000;
                    }
                }
            }

            if (searchQuery) {
                params.search = searchQuery;
            }

            console.log('Fetching inventory with params:', params);
            const response = await getMarketInventory(params);
            const inventory: MarketInventory[] = response.data;

            // Map API data to UI Car interface
            const mappedCars: Car[] = inventory.map(item => {
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
                    colorOptions: item.colors?.map(c => ({
                        name: c.colorName,
                        color: getColorHex(c.colorName, c.hexCode),
                        images: c.images?.map((img: any) => img.imageUrl) || []
                    }))
                };
            });

            setCars(mappedCars);
        } catch (error) {
            console.error('Failed to load market inventory:', error);
            Alert.alert('Error', 'Failed to load market inventory.');
            setCars([]); // Clear data on error instead of showing static data
        } finally {
            setIsLoading(false);
        }
    };

    const statusCategories = ['All', 'New Arrival', 'Upcoming'];
    const [selectedType, setSelectedType] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    // Filter states
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        brand: 'All',
        model: 'All',
        bodyType: 'All',
        priceRange: 'All',
    });
    const [selectedFilterTab, setSelectedFilterTab] = useState('Body Style'); // State for left-side tabs

    const PRICE_RANGES = [
        { label: 'All', value: 'All' },
        { label: 'Under ₹20 Lakh', value: '<20' },
        { label: '₹20 - ₹50 Lakh', value: '20-50' },
        { label: '₹50 Lakh - ₹1 Crore', value: '50-100' },
        { label: 'Over ₹1 Crore', value: '>100' },
    ];

    // Re-fetch when filters change
    useEffect(() => {
        loadMarketInventory();
    }, [activeFilters, selectedType, selectedStatus, searchQuery]);

    // Filter models when brand changes
    useEffect(() => {
        if (activeFilters.brand === 'All') {
            setFilteredModels(models);
        } else {
            const selectedBrandIds = brands
                .filter(b => b.name === activeFilters.brand)
                .map(b => b.id);
            setFilteredModels(models.filter(m => selectedBrandIds.includes(m.brand.id)));
        }
    }, [activeFilters.brand, brands, models]);

    const filteredCars = [...cars].sort((a, b) => {
        const indexA = recentlyViewed.indexOf(a.id);
        const indexB = recentlyViewed.indexOf(b.id);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
    });

    const toggleCarSelection = (carId: string) => {
        if (selectedCars.includes(carId)) {
            setSelectedCars(selectedCars.filter((id) => id !== carId));
        } else {
            if (selectedCars.length >= 3) {
                Alert.alert('Limit Reached', 'You can compare maximum 3 cars at a time');
                return;
            }
            setSelectedCars([...selectedCars, carId]);
        }
    };

    const handleCompare = () => {
        if (selectedCars.length < 2) {
            Alert.alert('Select Cars', 'Please select at least 2 cars to compare');
            return;
        }
        const selectedCarData = cars.filter((car) => selectedCars.includes(car.id));
        navigation.navigate('Comparison', { cars: selectedCarData });
    };

    const renderCarItem = ({ item }: { item: Car }) => (
        <TouchableOpacity
            style={styles.carItem}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('VehicleSpec', { vehicle: item })}
        >
            <TouchableOpacity
                style={[
                    styles.checkbox,
                    selectedCars.includes(item.id) && styles.checkboxSelected,
                ]}
                onPress={() => toggleCarSelection(item.id)}
            >
                {selectedCars.includes(item.id) && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
            </TouchableOpacity>

            {/* <TouchableOpacity
                style={styles.wishlistBtn}
                onPress={() => toggleWishlist(item.id)}
            >
                <Ionicons
                    name={wishlist.includes(item.id) ? "heart" : "heart-outline"}
                    size={20}
                    color={wishlist.includes(item.id) ? "#ef4444" : COLORS.textLight}
                />
            </TouchableOpacity> */}

            <View style={styles.carImage}>
                <Image source={{ uri: item.image }} style={styles.carImageContent} resizeMode="cover" />
                {item.status === 'new' && (
                    <View style={styles.newBadge}>
                        <Ionicons name="sparkles" size={10} color={COLORS.white} />
                        <Text style={styles.newBadgeText}>New Arrival</Text>
                    </View>
                )}
                {item.status === 'upcoming' && (
                    <View style={styles.upcomingBadge}>
                        <Ionicons name="time" size={10} color={COLORS.white} />
                        <Text style={styles.upcomingBadgeText}>Upcoming</Text>
                    </View>
                )}
                {item.status === 'trending' && (
                    <View style={styles.trendingBadge}>
                        <Ionicons name="flash" size={10} color={COLORS.white} />
                        <Text style={styles.trendingBadgeText}>Trending</Text>
                    </View>
                )}
                {(item.brand === 'BMW' || item.brand === 'Porsche' || item.brand === 'Tesla') && !item.status && (
                    <View style={styles.trendingBadge}>
                        <Ionicons name="flash" size={10} color={COLORS.white} />
                        <Text style={styles.trendingBadgeText}>Trending</Text>
                    </View>
                )}
            </View>
            <View style={styles.carInfo}>
                <View style={styles.cardHeader}>
                    <Text style={styles.carBrandText}>{item.brand}</Text>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.type === 'CAR' ? 'Car' : 'Bike'}</Text>
                    </View>
                </View>
                <Text style={styles.carModelText} numberOfLines={2}>{item.model}</Text>
                <View style={styles.viewMoreContainer}>
                    <Text style={styles.viewMoreText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <Header
                title="Market"
                subtitle={isSearchVisible ? undefined : "Explore cars & bikes in the market"}
                rightComponent={
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.headerAction}
                            onPress={() => {
                                setIsSearchVisible(!isSearchVisible);
                                if (isSearchVisible) {
                                    setSearchQuery('');
                                    Keyboard.dismiss();
                                }
                            }}
                        >
                            <Ionicons name={isSearchVisible ? "close" : "search"} size={20} color={COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerAction}
                            onPress={() => setIsFilterVisible(true)}
                        >
                            <Ionicons name="options-outline" size={20} color={COLORS.white} />
                            {(activeFilters.brand !== 'All' || activeFilters.bodyType !== 'All' || activeFilters.priceRange !== 'All') && (
                                <View style={styles.filterDot} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerAction}
                            onPress={() => navigation.navigate('Wishlist')}
                        >
                            <Ionicons name="heart-outline" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                }
            >
                {isSearchVisible && (
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color={COLORS.textLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search car brand or model..."
                            placeholderTextColor={COLORS.textExtraLight}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                            returnKeyType="search"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </Header>
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ marginTop: 20, color: COLORS.textLight }}>Loading Market Inventory...</Text>
                </View>
            ) : (
                <>
                    {/* Single Compact Filter Row */}
                    <View style={styles.filtersContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filtersRow}
                        >
                            {/* Type Filters */}
                            {vehicleTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.filterChip,
                                        selectedType === type.name && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedType(type.name)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedType === type.name && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {type.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Divider */}
                            <View style={styles.filterDivider} />

                            {/* Status Filters */}
                            {statusCategories.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.filterChip,
                                        selectedStatus === status && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedStatus(status)}
                                >
                                    {status === 'New Arrival' && (
                                        <Ionicons
                                            name="sparkles"
                                            size={13}
                                            color={selectedStatus === status ? COLORS.white : COLORS.primary}
                                            style={{ marginRight: 5 }}
                                        />
                                    )}
                                    {status === 'Upcoming' && (
                                        <Ionicons
                                            name="time-outline"
                                            size={13}
                                            color={selectedStatus === status ? COLORS.white : COLORS.primary}
                                            style={{ marginRight: 5 }}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedStatus === status && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Filter Button */}
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    (activeFilters.brand !== 'All' || activeFilters.bodyType !== 'All' || activeFilters.priceRange !== 'All') && styles.filterButtonActive
                                ]}
                                onPress={() => setIsFilterVisible(true)}
                            >
                                <Ionicons
                                    name="options-outline"
                                    size={16}
                                    color={(activeFilters.brand !== 'All' || activeFilters.bodyType !== 'All' || activeFilters.priceRange !== 'All') ? COLORS.white : COLORS.primary}
                                />
                                {(activeFilters.brand !== 'All' || activeFilters.bodyType !== 'All' || activeFilters.priceRange !== 'All') && (
                                    <View style={styles.filterButtonBadge} />
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>


                    {/* Cars Grid */}
                    <FlatList
                        data={filteredCars}
                        renderItem={renderCarItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        contentContainerStyle={styles.carsList}
                        columnWrapperStyle={styles.carsRow}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <View style={styles.emptySearch}>
                                <Ionicons name="search-outline" size={60} color={COLORS.textExtraLight} style={{ marginBottom: 15 }} />
                                <Text style={styles.emptyText}>No results found</Text>
                                <Text style={[styles.emptyText, { fontSize: 14, marginTop: 5 }]}>Try adjusting your filters or search query</Text>
                                <TouchableOpacity
                                    style={styles.resetBtn}
                                    onPress={() => {
                                        setSelectedType('All');
                                        setSelectedStatus('All');
                                        setSearchQuery('');
                                        setActiveFilters({ brand: 'All', model: 'All', bodyType: 'All', priceRange: 'All' });
                                    }}
                                >
                                    <Text style={styles.resetBtnText}>Reset All Filters</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />

                    {/* Floating Compare Button */}
                    {
                        selectedCars.length > 0 && !isSearchVisible && (
                            <TouchableOpacity
                                style={styles.floatingBtn}
                                onPress={handleCompare}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#f093fb', '#f5576c']}
                                    style={styles.floatingGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.floatingText}>Compare</Text>
                                    <View style={styles.floatingBadge}>
                                        <Text style={styles.floatingBadgeText}>{selectedCars.length}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )
                    }

                    {/* Advanced Filter Modal (Bottom Sheet) */}
                    <Modal
                        visible={isFilterVisible}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setIsFilterVisible(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setIsFilterVisible(false)}
                        >
                            <View style={styles.filterSheet}>
                                <View style={styles.sheetHeader}>
                                    <Text style={styles.sheetTitle}>Filters</Text>
                                    <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                                        <Ionicons name="close" size={24} color={COLORS.text} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.sheetSplitBody}>
                                    {/* Left Column Tabs */}
                                    <View style={styles.leftCol}>
                                        {['Body Style', 'Popular Brands', 'Model', 'Price Range'].map((tab) => (
                                            <TouchableOpacity
                                                key={tab}
                                                style={[styles.tabItem, selectedFilterTab === tab && styles.tabItemActive]}
                                                onPress={() => setSelectedFilterTab(tab)}
                                            >
                                                <Text style={[styles.tabText, selectedFilterTab === tab && styles.tabTextActive]}>
                                                    {tab}
                                                </Text>
                                                {selectedFilterTab === tab && <View style={styles.activeTabIndicator} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Right Column Content */}
                                    <ScrollView showsVerticalScrollIndicator={false} style={styles.rightCol} contentContainerStyle={styles.rightColContent}>
                                        {selectedFilterTab === 'Body Style' && (
                                            <View style={styles.filterSection}>
                                                <View style={styles.optionsWrap}>
                                                    {vehicleCategories.map(cat => (
                                                        <TouchableOpacity
                                                            key={cat.id}
                                                            style={[styles.smallOptionChip, activeFilters.bodyType === cat.name && styles.smallOptionChipActive]}
                                                            onPress={() => setActiveFilters({ ...activeFilters, bodyType: cat.name })}
                                                        >
                                                            <Text style={[styles.smallOptionChipText, activeFilters.bodyType === cat.name && styles.smallOptionChipTextActive]}>
                                                                {cat.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {selectedFilterTab === 'Popular Brands' && (
                                            <View style={styles.filterSection}>
                                                <View style={styles.optionsWrap}>
                                                    {brands.map(brand => (
                                                        <TouchableOpacity
                                                            key={brand.id}
                                                            style={[styles.smallOptionChip, activeFilters.brand === brand.name && styles.smallOptionChipActive]}
                                                            onPress={() => setActiveFilters({ ...activeFilters, brand: brand.name, model: 'All' })}
                                                        >
                                                            <Text style={[styles.smallOptionChipText, activeFilters.brand === brand.name && styles.smallOptionChipTextActive]}>
                                                                {brand.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {selectedFilterTab === 'Model' && (
                                            <View style={styles.filterSection}>
                                                {activeFilters.brand === 'All' ? (
                                                    <Text style={{ color: COLORS.textLight, fontStyle: 'italic', margin: 10 }}>
                                                        Select a brand first to see models.
                                                    </Text>
                                                ) : (
                                                    <View style={styles.optionsWrap}>
                                                        <TouchableOpacity
                                                            style={[styles.smallOptionChip, activeFilters.model === 'All' && styles.smallOptionChipActive]}
                                                            onPress={() => setActiveFilters({ ...activeFilters, model: 'All' })}
                                                        >
                                                            <Text style={[styles.smallOptionChipText, activeFilters.model === 'All' && styles.smallOptionChipTextActive]}>
                                                                All
                                                            </Text>
                                                        </TouchableOpacity>
                                                        {filteredModels.map(model => (
                                                            <TouchableOpacity
                                                                key={model.id}
                                                                style={[styles.smallOptionChip, activeFilters.model === model.name && styles.smallOptionChipActive]}
                                                                onPress={() => setActiveFilters({ ...activeFilters, model: model.name })}
                                                            >
                                                                <Text style={[styles.smallOptionChipText, activeFilters.model === model.name && styles.smallOptionChipTextActive]}>
                                                                    {model.name}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {selectedFilterTab === 'Price Range' && (
                                            <View style={styles.filterSection}>
                                                {PRICE_RANGES.map(range => (
                                                    <TouchableOpacity
                                                        key={range.value}
                                                        style={[styles.radioItem, activeFilters.priceRange === range.value && styles.radioItemActive]}
                                                        onPress={() => setActiveFilters({ ...activeFilters, priceRange: range.value })}
                                                    >
                                                        <View style={[styles.radioButton, activeFilters.priceRange === range.value && styles.radioButtonActive]}>
                                                            {activeFilters.priceRange === range.value && <View style={styles.radioButtonInner} />}
                                                        </View>
                                                        <Text style={[styles.radioLabel, activeFilters.priceRange === range.value && styles.radioLabelActive]}>
                                                            {range.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>

                                <View style={styles.sheetFooter}>
                                    <TouchableOpacity
                                        style={styles.clearBtn}
                                        onPress={() => {
                                            setActiveFilters({ brand: 'All', model: 'All', bodyType: 'All', priceRange: 'All' });
                                        }}
                                    >
                                        <Text style={styles.clearBtnText}>Clear All</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.applyBtn, { flex: 1 }]}
                                        onPress={() => setIsFilterVisible(false)}
                                    >
                                        <Text style={styles.applyBtnText}>Apply Filters</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </>
            )}
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    filtersContainer: {
        backgroundColor: COLORS.white,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    filtersRow: {
        paddingHorizontal: SIZES.padding,
        alignItems: 'center',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginRight: 6,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.light,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    filterChipTextActive: {
        color: COLORS.white,
        fontWeight: '700',
    },
    filterDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 2,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginLeft: 4,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    wishlistBtn: {
        position: 'absolute',
        top: 40,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        ...SHADOWS.light,
    },
    filterButtonBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    categories: {
        marginTop: 10,
        marginBottom: 5,
        height: 70, // Explicit height for container
        flexGrow: 0,
    },
    categoriesContent: {
        paddingLeft: SIZES.padding,
        paddingRight: 30,
        alignItems: 'center',
        paddingVertical: 10,
    },
    categoryBtn: {
        backgroundColor: COLORS.white,
        height: 45, // Fixed height for button
        paddingHorizontal: 20,
        borderRadius: 22,
        marginRight: 10,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80, // Ensure words like "All" have space
    },
    categoryBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryText: {
        color: COLORS.textLight,
        fontSize: 14,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: COLORS.white,
        fontWeight: '800', // Strong bold for visibility
    },
    brandSection: {
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    seeAllText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    brandLogosContent: {
        paddingHorizontal: SIZES.padding,
    },
    brandLogoCard: {
        alignItems: 'center',
        marginRight: 15,
        width: 70,
    },
    brandIconWrap: {
        width: 62, // Adjusted for 2px border
        height: 62,
        borderRadius: 31,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#F1F5F9', // Subtle inactive border
        ...SHADOWS.light,
    },
    brandIconWrapActive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary,
        ...SHADOWS.medium,
        elevation: 3,
    },
    brandLogoCardActive: {
        // Removed scale to prevent header alignment issues
    },
    brandIcon: {
        width: 45,
        height: 45,
        resizeMode: 'contain',
        opacity: 0.9,
    },
    brandIconActive: {
        opacity: 1,
    },
    brandSelectionCheck: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        ...SHADOWS.light,
        elevation: 4,
        zIndex: 2,
    },
    brandLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '500',
        textAlign: 'center',
    },
    brandLabelActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    carsList: {
        padding: SIZES.padding,
        paddingTop: 16,
    },
    carsRow: {
        justifyContent: 'space-between',
    },
    carItem: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 0,
        marginBottom: 16,
        width: '48%',
        ...SHADOWS.medium,
        borderWidth: 0,
        overflow: 'hidden',
    },
    checkbox: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        ...SHADOWS.light,
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
    },
    carImage: {
        width: '100%',
        height: 130,
        backgroundColor: '#F8FAFC',
        borderRadius: 0,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
        overflow: 'hidden',
    },
    carIcon: {
        fontSize: 56,
        textAlign: 'center',
    },
    carImageContent: {
        width: '100%',
        height: '100%',
    },
    carBrand: {
        fontSize: SIZES.body2,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 3,
    },
    carPrice: {
        fontSize: SIZES.body3,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 5,
    },
    carEmi: {
        fontSize: SIZES.body4,
        color: COLORS.textExtraLight,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    carBrandText: {
        fontSize: 11,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    typeBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeBadgeText: {
        fontSize: 9,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    carModelText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        lineHeight: 20,
    },
    viewMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    viewMoreText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    trendingBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trendingBadgeText: {
        color: COLORS.white,
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    newBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    newBadgeText: {
        color: COLORS.white,
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    upcomingBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    upcomingBadgeText: {
        color: COLORS.white,
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    carInfo: {
        padding: 12,
        paddingTop: 10,
    },
    floatingBtn: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        borderRadius: 30,
        ...SHADOWS.dark,
    },
    floatingGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        gap: 10,
    },
    floatingText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: SIZES.body1,
    },
    floatingBadge: {
        backgroundColor: COLORS.white,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingBadgeText: {
        color: '#f5576c',
        fontSize: SIZES.body3,
        fontWeight: 'bold',
    },
    headerRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    headerAction: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 15,
        paddingHorizontal: 15,
        marginTop: 15,
        height: 45,
        ...SHADOWS.light,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: COLORS.text,
    },
    emptySearch: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 18,
        fontWeight: '600',
    },
    resetBtn: {
        marginTop: 25,
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 12,
    },
    resetBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    filterDot: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 10,
        height: '85%', // Fixed height to prevent alignment 'crash'
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    resetTextLine: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 15,
    },
    sheetSplitBody: {
        flexDirection: 'row',
        flex: 1, // Use flex 1 to fill space between header and footer
    },
    leftCol: {
        width: 130,
        backgroundColor: '#FBFBFE',
        borderRightWidth: 1,
        borderRightColor: '#F1F5F9',
    },
    tabItem: {
        paddingVertical: 20,
        paddingHorizontal: 15,
        position: 'relative',
        justifyContent: 'center',
    },
    tabItemActive: {
        backgroundColor: COLORS.white,
    },
    tabText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    activeTabIndicator: {
        position: 'absolute',
        left: 0,
        top: '20%',
        bottom: '20%',
        width: 3.5,
        backgroundColor: COLORS.primary,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    rightCol: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    rightColContent: {
        padding: 20,
    },
    filterSection: {
        marginBottom: 20,
    },
    optionsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    smallOptionChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    smallOptionChipActive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary,
        ...SHADOWS.light,
    },
    smallOptionChipText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '600',
    },
    smallOptionChipTextActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 5,
        marginVertical: 4,
        borderRadius: 12,
    },
    radioItemActive: {
        backgroundColor: '#F8F9FF',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioButtonActive: {
        borderColor: COLORS.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    radioLabel: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    radioLabelActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    sheetFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 35 : 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        alignItems: 'center',
        gap: 12,
    },
    clearBtn: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9', // Subtle background
        borderRadius: 15,
    },
    clearBtnText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    applyBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium,
    },
    applyBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
