import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    Platform,
    Linking,
    Modal,
    Share,
    SafeAreaView,
} from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp, DocumentFile } from '../context/AppContext';

interface QuickAction {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
}

const formatDateHeader = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export default function VehicleDetailsScreen({ navigation, route }: { navigation: any; route: any }) {
    const { documents, vehicles, expenses, fuelLogs, trips } = useApp();
    const routeVehicle = route?.params?.vehicle;
    const routeVehicleId = route?.params?.id;

    // Resolve vehicle from either full object or ID (for deep links)
    const vehicle = routeVehicle || vehicles.find(v => v.id === routeVehicleId) || {
        brand: 'Hyundai',
        model: 'i20',
        registration: 'TN 01 AB 1234',
        mileage: '42,180',
        fuelAvg: '16.8',
        fuelType: 'Petrol',
        image: null,
    };

    const [isOptionsVisible, setOptionsVisible] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [currentImageUri, setCurrentImageUri] = useState<string | null>(null);

    const handleViewFile = async (file: DocumentFile) => {
        try {
            // 1. Handle Images Internally
            if (file.type === 'image' || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                setCurrentImageUri(file.uri);
                setImageViewerVisible(true);
                return;
            }

            // 2. Handle Documents (PDF etc)
            let mimeType = 'application/octet-stream';
            if (file.type === 'pdf' || file.name.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';

            if (Platform.OS === 'android') {
                // Android: robust content URI generation
                let contentUri = file.uri;

                // If it's already content://, use it. If file://, convert it.
                if (contentUri.startsWith('file://')) {
                    try {
                        contentUri = await FileSystem.getContentUriAsync(file.uri);
                    } catch (e) {
                        console.log('Error getting content URI directly, trying copy:', e);
                        // Fallback: Copy to cache to ensure it's accessible and then get URI
                        // @ts-ignore: Accessing native module properties
                        const cacheDir = (FileSystem as any).default?.cacheDirectory || (FileSystem as any).default?.documentDirectory;
                        const dest = cacheDir + file.name;
                        await FileSystem.copyAsync({ from: file.uri, to: dest });
                        contentUri = await FileSystem.getContentUriAsync(dest);
                    }
                }

                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1,
                    type: mimeType,
                });
            } else {
                // iOS: Try Linking first for direct open
                const canOpen = await Linking.canOpenURL(file.uri);
                if (canOpen) {
                    await Linking.openURL(file.uri);
                } else {
                    // Fallback to sharing 
                    await Sharing.shareAsync(file.uri, {
                        mimeType,
                        UTI: file.type === 'pdf' ? 'com.adobe.pdf' : undefined
                    });
                }
            }
        } catch (err) {
            console.error('Direct view failed, trying share fallback:', err);
            // Only fallback to share if it's NOT an image (images rely on our internal viewer)
            if (file.type !== 'image') {
                try {
                    await Sharing.shareAsync(file.uri);
                } catch (shareErr) {
                    Alert.alert('Error', 'Could not open file.');
                }
            } else {
                Alert.alert('Error', 'Could not open image.');
            }
        }
    };

    // Find the insurance document for this vehicle
    const insuranceDoc = documents.find(
        doc => doc.vehicleId === vehicle.id && doc.type === 'Insurance'
    );

    const handleShare = async () => {
        setOptionsVisible(false);
        try {
            const appUrl = ExpoLinking.createURL(`vehicle/${vehicle.id}`);
            const shareMessage = `Check out my vehicle details on CarTrack Pro!\n\n` +
                `🚗 Vehicle: ${vehicle.brand} ${vehicle.model}\n` +
                `🔢 Registration: ${vehicle.registration}\n` +
                `🛣️ Odometer: ${vehicle.mileage} km\n` +
                `⛽ Fuel Type: ${vehicle.fuelType}\n` +
                `📊 Avg Fuel: ${vehicle.fuelAvg} km/l\n\n` +
                `Open in App: ${appUrl}`;

            await Share.share({
                title: `${vehicle.brand} ${vehicle.model} Details`,
                message: shareMessage,
                url: appUrl, // iOS support
            });
        } catch (error) {
            Alert.alert('Error', 'Could not share details.');
        }
    };

    const handleDelete = () => {
        setOptionsVisible(false);
        Alert.alert(
            'Delete Vehicle',
            'Are you sure you want to delete this vehicle? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() }
            ]
        );
    };

    // --- Ownership Economics Logic ---
    const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicle.id);
    const vehicleFuelLogs = fuelLogs.filter(f => f.vehicleId === vehicle.id);

    const fuelSpent = vehicleFuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
    const maintenanceCost = vehicleExpenses
        .filter(e => e.type === 'Service' || e.type === 'Repair' || e.type === 'Parts')
        .reduce((sum, e) => sum + e.amount, 0);

    // If no logs, use purchase price as baseline if available
    const purchasePrice = parseFloat(vehicle.purchasePrice?.toString().replace(/[^0-9.]/g, '') || '0');
    const totalOwnershipCost = purchasePrice + maintenanceCost + fuelSpent;

    const currentMileage = parseInt(vehicle.mileage?.toString().replace(/[^0-9]/g, '') || '0');
    const costPerKm = (currentMileage > 100 && totalOwnershipCost > 0)
        ? (totalOwnershipCost / currentMileage).toFixed(2)
        : '0.00';

    // Daily Cost Logic: (Operational Costs) / Days Owned
    const pDate = vehicle.purchaseDate ? new Date(vehicle.purchaseDate) : new Date();
    const daysSincePurchase = Math.max(1, Math.ceil((new Date().getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyCost = ((fuelSpent + maintenanceCost) / daysSincePurchase).toFixed(0);

    const insets = useSafeAreaInsets();
    const HEADER_HEIGHT = 280 + insets.top;

    // --- Dynamic Vehicle Health Logic ---
    const getHealthItems = () => {
        const mileage = currentMileage;
        const items = [
            {
                label: 'Odometer',
                status: mileage < 5000 ? 'Excellent' : mileage < 20000 ? 'Good' : mileage < 50000 ? 'Fair' : 'Monitor',
                color: mileage < 20000 ? '#4ade80' : mileage < 50000 ? '#fbbf24' : '#f87171',
                icon: 'speedometer-outline'
            }
        ];

        // Insurance Status
        if (vehicle.insuranceExpiry) {
            const expiry = new Date(vehicle.insuranceExpiry);
            const today = new Date();
            const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            let insuranceStatus = 'Good';
            let insuranceColor = '#4ade80';

            if (diffDays < 0) {
                insuranceStatus = 'Expired';
                insuranceColor = '#f87171';
            } else if (diffDays < 30) {
                insuranceStatus = 'Renew Soon';
                insuranceColor = '#fbbf24';
            }

            items.push({
                label: 'Insurance',
                status: insuranceStatus,
                color: insuranceColor,
                icon: 'shield-checkmark-outline'
            });
        }

        // Other generic health items based on mileage
        items.push({
            label: 'Engine',
            status: mileage < 30000 ? 'Good' : 'Service Due',
            color: mileage < 30000 ? '#4ade80' : '#fbbf24',
            icon: 'cog-outline'
        });

        items.push({
            label: 'Fluids',
            status: mileage < 30000 ? 'Excellent' : 'Check',
            color: mileage < 30000 ? '#4ade80' : '#fbbf24',
            icon: 'water-outline'
        });

        return items;
    };

    const healthItems = getHealthItems();
    const overallHealthStatus = healthItems.every(i => i.status === 'Good' || i.status === 'Excellent') ? 'Overall Good' : 'Check Required';
    const overallHealthColor = overallHealthStatus === 'Overall Good' ? '#10b981' : '#fbbf24';

    // --- Dynamic Reminders Logic ---
    const lastService = vehicleExpenses
        .filter(e => e.type === 'Service')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    // Simple logic: Service every 10,000 km.
    // If no service, first service at 5,000 km.
    const lastServiceMileage = lastService ? currentMileage : 0; // In a real app, service expense would store mileage
    const nextServiceKm = lastService ? (lastServiceMileage + 10000) : 5000;
    const kmRemaining = nextServiceKm - currentMileage;

    const insuranceDateStr = formatDateHeader(vehicle.insuranceExpiry);

    // --- Ownership Summary Logic ---
    const totalTripsCount = vehicle.totalTrips || 0;
    const totalRefuelsCount = vehicle.totalRefuels || 0;

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <View style={{ position: 'absolute', top: Math.max(insets.top, 10), left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 100 }}>
                <TouchableOpacity
                    style={styles.headerBtnCircle}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

              <TouchableOpacity
    style={styles.headerBtnCircle}
    onPress={() => navigation.navigate('AddVehicle', { vehicle })}
    activeOpacity={0.7}
>
    <MaterialIcons name="edit" size={24} color={COLORS.text} />
</TouchableOpacity>


            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
            >
                {/* Image Header */}
                <View style={[styles.imageHeader, { height: HEADER_HEIGHT }]}>
                    {vehicle.image ? (
                        <Image source={{ uri: vehicle.image }} style={styles.headerImage} />
                    ) : (
                        <View style={styles.placeholderHeader}>
                            <Ionicons name="car" size={100} color={COLORS.border} />
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.titleSection}>
                        <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
                        <Text style={styles.vehicleSub}>{vehicle.fuelType || 'Petrol'} • {vehicle.registration}</Text>
                    </View>

                    {/* Stats Summary */}
                    <View style={styles.statsSummaryCard}>
                        <View style={styles.statsItem}>
                            <View style={[styles.statsIconBox, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="speedometer-outline" size={18} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.statsLabel}>Odometer</Text>
                                <Text style={styles.statsValue}>{vehicle.mileage || '0'} <Text style={styles.statsUnit}>km</Text></Text>
                            </View>
                        </View>
                        <View style={styles.statsDivider} />
                        <View style={styles.statsItem}>
                            <View style={[styles.statsIconBox, { backgroundColor: '#fff7ed' }]}>
                                <Ionicons name="water-outline" size={18} color="#f97316" />
                            </View>
                            <View>
                                <Text style={styles.statsLabel}>Avg Fuel</Text>
                                <Text style={styles.statsValue}>{vehicle.fuelAvg || '0'} <Text style={styles.statsUnit}>km/l</Text></Text>
                            </View>
                        </View>
                    </View>

                    {/* Ownership Economics */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ownership Economics</Text>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.economicsCard}
                        >
                            <View style={styles.econHeader}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.econLabel}>Total Investment</Text>
                                    <Text style={styles.econValue} numberOfLines={1} adjustsFontSizeToFit>₹{totalOwnershipCost.toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={styles.econBadge}>
                                    <Text style={styles.econBadgeText}>₹{costPerKm}/km</Text>
                                </View>
                            </View>
                            <View style={styles.econGrid}>
                                <View style={styles.econItem}>
                                    <Text style={styles.econSubLabel} numberOfLines={1}>Fuel Spent</Text>
                                    <Text style={styles.econSubValue} numberOfLines={1}>₹{fuelSpent.toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={[styles.econItem, { marginHorizontal: 10 }]}>
                                    <Text style={styles.econSubLabel} numberOfLines={1}>Maintenance</Text>
                                    <Text style={styles.econSubValue} numberOfLines={1}>₹{maintenanceCost.toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={styles.econItem}>
                                    <Text style={styles.econSubLabel} numberOfLines={1}>Daily Cost</Text>
                                    <Text style={styles.econSubValue} numberOfLines={1}>₹{dailyCost}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Vehicle Health */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Vehicle Health</Text>
                            <View style={[styles.healthStatusBadge, { backgroundColor: `${overallHealthColor}15` }]}>
                                <View style={[styles.statusDot, { backgroundColor: overallHealthColor }]} />
                                <Text style={[styles.healthTotalStatus, { color: overallHealthColor }]}>{overallHealthStatus}</Text>
                            </View>
                        </View>
                        <View style={styles.healthGrid}>
                            {healthItems.map((item, index) => (
                                <View key={index} style={[styles.healthCardColored, { backgroundColor: `${item.color}40` }]}>
                                    <View style={styles.healthCardTop}>
                                        <View style={[styles.healthIconCircle, { backgroundColor: COLORS.white }]}>
                                            <Ionicons name={item.icon as any} size={18} color={item.color} />
                                        </View>
                                        <View style={[styles.statusBadgeSmall, { backgroundColor: COLORS.white }]}>
                                            <Text style={[styles.healthStatusSmall, { color: item.color }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.healthLabelSentence}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Technical Specifications */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Technical Specifications</Text>
                        <View style={styles.specsCard}>
                            <View style={styles.specItem}>
                                <View style={styles.specIcon}>
                                    <Ionicons name="cog-outline" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.specText}>
                                    <Text style={styles.specLabel}>Engine</Text>
                                    <Text style={styles.specValue}>{vehicle.engine || 'N/A'}</Text>
                                </View>
                            </View>
                            <View style={styles.specItem}>
                                <View style={styles.specIcon}>
                                    <Ionicons name="git-network-outline" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.specText}>
                                    <Text style={styles.specLabel}>Transmission</Text>
                                    <Text style={styles.specValue}>{vehicle.transmission?.toLowerCase() === 'automatic' ? 'Automatic' : 'Manual'}</Text>
                                </View>
                            </View>
                            <View style={styles.specItem}>
                                <View style={styles.specIcon}>
                                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.specText}>
                                    <Text style={styles.specLabel}>Purchase Date</Text>
                                    <Text style={styles.specValue}>{formatDateHeader(vehicle.purchaseDate)}</Text>
                                </View>
                            </View>
                            <View style={styles.specItem}>
                                <View style={styles.specIcon}>
                                    <Ionicons name="color-palette-outline" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.specText}>
                                    <Text style={styles.specLabel}>Exterior Color</Text>
                                    <Text style={styles.specValue}>{vehicle.color || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Reminders */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>

                        <View style={styles.premiumReminderCard}>
                            <View style={[styles.reminderIconBox, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="build-outline" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.reminderInfo}>
                                <Text style={styles.reminderTitle}>General Service</Text>
                                <Text style={styles.reminderSub}>
                                    {kmRemaining > 0 ? `Due in ${kmRemaining.toLocaleString()} km` : `Overdue by ${Math.abs(kmRemaining).toLocaleString()} km`}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.bookBtn}
                                onPress={() => navigation.navigate('AddService', { vehicleId: vehicle.id })}
                            >
                                <Text style={styles.bookBtnText}>Book Now</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.premiumReminderCard, { marginBottom: 0 }]}>
                            <View style={[styles.reminderIconBox, { backgroundColor: '#f0fdf4' }]}>
                                <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
                            </View>
                            <View style={styles.reminderInfo}>
                                <Text style={styles.reminderTitle}>Insurance Renewal</Text>
                                <Text style={styles.reminderSub}>Expires {insuranceDateStr}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.viewDocBtn}
                                onPress={() => {
                                    if (insuranceDoc && insuranceDoc.files && insuranceDoc.files.length > 0) {
                                        handleViewFile(insuranceDoc.files[0]);
                                    } else {
                                        Alert.alert('No Document', 'No insurance document found. Please upload one from Documents section.');
                                    }
                                }}
                            >
                                <Ionicons name="eye-outline" size={16} color={COLORS.text} />
                                <Text style={styles.viewDocText}>View</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Ownership Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ownership Summary</Text>
                        <View style={styles.ownershipGrid}>
                            <View style={styles.ownershipCard}>
                                <Text style={styles.ownershipLabel}>Total Trips</Text>
                                <Text style={styles.ownershipValue}>{totalTripsCount}</Text>
                            </View>
                            <View style={styles.ownershipCard}>
                                <Text style={styles.ownershipLabel}>Refuels</Text>
                                <Text style={styles.ownershipValue}>{totalRefuelsCount}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Links */}
                    <View style={styles.footerActions}>
                        <TouchableOpacity
                            style={styles.footerBtn}
                            onPress={() => navigation.navigate('VehicleLogs', { vehicle })}
                        >
                            <Text style={styles.footerBtnText}>View Logs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.footerBtn}
                            onPress={() => navigation.navigate('VehicleDocuments', { vehicleId: vehicle.id })}
                        >
                            <Text style={styles.footerBtnText}>Documents</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Options Bottom Sheet */}
            <Modal
                visible={isOptionsVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setOptionsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOptionsVisible(false)}
                >
                    <View style={styles.optionsContent}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.optionsTitle}>Vehicle Options</Text>

                        <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsVisible(false); navigation.navigate('AddVehicle', { vehicle }); }}>
                            <View style={[styles.optionIcon, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.optionText}>Edit Vehicle</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
                            <View style={[styles.optionIcon, { backgroundColor: '#f0fdf4' }]}>
                                <Ionicons name="share-outline" size={20} color="#10b981" />
                            </View>
                            <Text style={styles.optionText}>Share Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                            <View style={[styles.optionIcon, { backgroundColor: '#fef2f2' }]}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </View>
                            <Text style={[styles.optionText, { color: '#ef4444' }]}>Delete Vehicle</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setOptionsVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Full Screen Image Viewer Modal */}
            <Modal
                visible={imageViewerVisible}
                transparent={true}
                onRequestClose={() => setImageViewerVisible(false)}
                animationType="fade"
            >
                <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                        <TouchableOpacity
                            onPress={() => setImageViewerVisible(false)}
                            style={{ padding: 20, alignSelf: 'flex-end', marginTop: insets.top }}
                        >
                            <Ionicons name="close-circle" size={36} color="white" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {currentImageUri && (
                        <Image
                            source={{ uri: currentImageUri }}
                            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    imageHeader: {
        width: '100%',
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderHeader: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.extraLightGray,
    },
    headerBtnCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    backBtn: {
        position: 'absolute',
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    moreBtn: {
        position: 'absolute',
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    content: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.background,
        marginTop: -30,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
    },
    economicsCard: {
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.medium,
    },
    econHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    econLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    econValue: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: '900',
        marginTop: 4,
    },
    econBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    econBadgeText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
    econGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    econItem: {
        flex: 1,
    },
    econSubLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        marginBottom: 4,
    },
    econSubValue: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
    specsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    specIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    specText: {
        flex: 1,
    },
    specLabel: {
        fontSize: 11,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    specValue: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 2,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    vehicleName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    vehicleSub: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 4,
    },
    statsSummaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 16, // Slightly tighter padding
        marginBottom: 30,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statsItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statsIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsLabel: {
        fontSize: 11,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statsValue: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statsUnit: {
        fontSize: 11,
        fontWeight: 'normal',
        color: COLORS.textExtraLight,
    },
    statsDivider: {
        width: 1,
        height: 35,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 15,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    healthStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    healthTotalStatus: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: 'bold',
    },
    healthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    healthCardColored: {
        width: '47.5%', // Slightly smaller to accommodate gap correctly
        padding: 16,
        borderRadius: 20,
        justifyContent: 'space-between',
        minHeight: 110,
    },
    healthCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    healthIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    healthStatusSmall: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusBadgeSmall: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        ...SHADOWS.light,
    },
    healthLabelSentence: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: 'bold',
        letterSpacing: -0.2,
    },
    premiumReminderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 18,
        borderRadius: 22,
        marginBottom: 15,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    reminderIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    reminderInfo: {
        flex: 1,
    },
    reminderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    reminderSub: {
        fontSize: 12,
        color: COLORS.textExtraLight,
        marginTop: 4,
    },
    bookBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        ...SHADOWS.light,
    },
    bookBtnText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    viewDocBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f1f5f9',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    viewDocText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    ownershipGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    ownershipCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        ...SHADOWS.light,
    },
    ownershipLabel: {
        fontSize: 12,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        marginBottom: 8,
    },
    ownershipValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    footerActions: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    },
    footerBtn: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.light,
    },
    footerBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionsContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 24,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    cancelBtn: {
        marginTop: 20,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 15,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.textLight,
    },
});
