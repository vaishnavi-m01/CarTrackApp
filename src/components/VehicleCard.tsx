import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: string;
    registration: string;
    fuelType: string;
    vehicleType: string;
    mileage?: string | number;
    fuelAvg?: string | number;
    image?: string;
    status?: string;
    statusColor?: string;
}

interface VehicleCardProps {
    vehicle: Vehicle;
    onPress?: (event: GestureResponderEvent) => void;
    onDelete?: () => void;
    onService?: () => void;
    isActive?: boolean;
}

const getFuelIcon = (type: string) => {
    switch (type) {
        case 'Electric': return 'flash';
        case 'Hybrid': return 'leaf';
        case 'CNG': return 'funnel';
        case 'Petrol': return 'color-fill';
        case 'Diesel': return 'water';
        default: return 'water';
    }
};

const getFuelColor = (type: string) => {
    switch (type) {
        case 'Electric': return '#10B981';
        case 'Hybrid': return '#059669';
        case 'CNG': return '#3B82F6';
        case 'Diesel': return '#4B5563';
        default: return COLORS.primary;
    }
};

export default function VehicleCard({ vehicle, onPress, onDelete, onService, isActive }: VehicleCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cardWrapper}
            onPress={onPress}
        >
            <View style={styles.premiumCard}>
                <View style={styles.cardImageSection}>
                    {vehicle.image ? (
                        <Image source={{ uri: vehicle.image }} style={styles.carImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons
                                name={vehicle.vehicleType === 'bike' ? 'bicycle-outline' : 'car-outline'}
                                size={50}
                                color={COLORS.border}
                            />
                        </View>
                    )}

                    <View style={styles.overlayContainer}>
                        <View style={[styles.fuelChip, { backgroundColor: getFuelColor(vehicle.fuelType) }]}>
                            <Ionicons name={getFuelIcon(vehicle.fuelType) as any} size={12} color={COLORS.white} />
                            <Text style={styles.fuelChipText}>{vehicle.fuelType}</Text>
                        </View>

                        <View style={[styles.statusBadgeOverlay, { backgroundColor: (vehicle.statusColor || COLORS.success) }]}>
                            <Text style={styles.statusBadgeText}>{vehicle.status || 'Active'}</Text>
                        </View>
                    </View>

                    {isActive && (
                        <View style={styles.activeLabelOverlay}>
                            <Ionicons name="checkmark-circle" size={12} color={COLORS.white} />
                            <Text style={styles.activeLabelText}>IN USE</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardInfoSection}>
                    <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.brandText} numberOfLines={1}>{vehicle.brand}</Text>
                            <Text style={styles.modelText} numberOfLines={1}>{vehicle.model}</Text>
                        </View>
                        <View style={styles.regBadge}>
                            <Text style={styles.regText}>{vehicle.registration}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                        <View style={styles.statFlexItem}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#f0fdf4' }]}>
                                <Ionicons name="speedometer-outline" size={14} color="#10b981" />
                            </View>
                            <View>
                                <Text style={styles.statValueText}>{vehicle.mileage || '0'} km</Text>
                                <Text style={styles.statSubtitle}>Odometer</Text>
                            </View>
                        </View>

                        <View style={styles.statFlexItem}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="water-outline" size={14} color="#3b82f6" />
                            </View>
                            <View>
                                <Text style={styles.statValueText}>{vehicle.fuelAvg || '--'} {vehicle.fuelType === 'Electric' ? 'Wh/km' : 'km/l'}</Text>
                                <Text style={styles.statSubtitle}>Avg Fuel</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardFooterActions}>
                        <TouchableOpacity
                            style={styles.detailsBtn}
                            onPress={onPress}
                        >
                            <Text style={styles.detailsBtnText}>View Details</Text>
                            <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
                        </TouchableOpacity>

                        <View style={styles.actionButtons}>
                            {onService && (
                                <TouchableOpacity style={styles.actionIconButton} onPress={onService}>
                                    <View style={styles.secondaryDot} />
                                    <Ionicons name="build-outline" size={18} color={COLORS.textLight} />
                                </TouchableOpacity>
                            )}

                            {onDelete && (
                                <TouchableOpacity style={[styles.actionIconButton, { borderColor: '#fee2e2' }]} onPress={onDelete}>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 20,
        marginHorizontal: 4,
    },
    premiumCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardImageSection: {
        height: 180,
        width: '100%',
        backgroundColor: '#F8FAFC',
        position: 'relative',
    },
    carImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
    },
    fuelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        gap: 4,
    },
    fuelChipText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statusBadgeOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    statusBadgeText: {
        color: COLORS.white,
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    activeLabelOverlay: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        gap: 4,
    },
    activeLabelText: {
        color: COLORS.white,
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    cardInfoSection: {
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    brandText: {
        fontSize: 11,
        color: COLORS.textLight,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modelText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 2,
    },
    regBadge: {
        backgroundColor: '#f8fafc',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    regText: {
        fontSize: 11,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    statFlexItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValueText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    statSubtitle: {
        fontSize: 10,
        color: COLORS.textLight,
        marginTop: 1,
    },
    cardFooterActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        gap: 12,
    },
    detailsBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        paddingVertical: 8,
        borderRadius: 10,
        gap: 4,
    },
    detailsBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionIconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    secondaryDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    }
});
