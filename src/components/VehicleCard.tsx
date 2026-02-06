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
                        <LinearGradient
                            colors={['#E5E7EB', '#F3F4F6']}
                            style={styles.imagePlaceholder}
                        >
                            <Ionicons
                                name={vehicle.vehicleType === 'bike' ? 'bicycle-outline' : 'car-outline'}
                                size={60}
                                color={COLORS.gray}
                            />
                        </LinearGradient>
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
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.activeBadgeOverlay}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </LinearGradient>
                    )}
                </View>

                <View style={styles.cardInfoSection}>
                    <View style={styles.cardHeaderRow}>
                        <View>
                            <Text style={styles.brandText}>{vehicle.brand}</Text>
                            <Text style={styles.modelText}>{vehicle.model}</Text>
                        </View>
                        <Text style={styles.regText}>{vehicle.registration}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statFlexItem}>
                            <Ionicons name="speedometer-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.statLabelText} numberOfLines={1}>
                                {vehicle.mileage || '0'} km
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statFlexItem}>
                            <Ionicons name="water-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.statLabelText} numberOfLines={1}>
                                {vehicle.fuelAvg || '--'} {vehicle.fuelType === 'Electric' ? 'Wh/km' : 'km/l'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardFooterActions}>
                        <TouchableOpacity
                            style={styles.detailsBtn}
                            onPress={onPress}
                        >
                            <Text style={styles.detailsBtnText}>View Details</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                        </TouchableOpacity>

                        <View style={styles.actionButtons}>
                            {onService && (
                                <TouchableOpacity style={styles.actionIconButton} onPress={onService}>
                                    <Ionicons name="build-outline" size={18} color={COLORS.primary} />
                                </TouchableOpacity>
                            )}

                            {onDelete && (
                                <TouchableOpacity style={styles.actionIconButton} onPress={onDelete}>
                                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
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
        ...SHADOWS.medium,
    },
    premiumCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        overflow: 'hidden',
        flexDirection: 'column',
    },
    cardImageSection: {
        height: 160,
        width: '100%',
        backgroundColor: '#F1F5F9',
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
    },
    fuelChip: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        gap: 4,
    },
    fuelChipText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusBadgeOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        ...SHADOWS.light,
    },
    statusBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardInfoSection: {
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    brandText: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    modelText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 2,
    },
    regText: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
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
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
        gap: 12,
    },
    statFlexItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabelText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '600',
        flexShrink: 1,
    },
    statDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 4,
    },
    cardFooterActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 12,
    },
    detailsBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        paddingVertical: 12,
        borderRadius: 14,
        gap: 6,
    },
    detailsBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    actionIconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    activeBadgeOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
        ...SHADOWS.medium,
    },
    activeBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
