import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import apiClient from '../api/apiClient';
import Feather from '@expo/vector-icons/Feather';


export default function TripsScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles } = useApp();
    const vehicleId = route.params?.vehicleId;

    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTrips = useCallback(async () => {
        if (!vehicleId) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/trips?vehicleId=${vehicleId}`);
            if (response.data) {
                // The API returns trips for the vehicle
                setTrips(response.data);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
            Alert.alert('Error', 'Failed to load trips');
        } finally {
            setIsLoading(false);
        }
    }, [vehicleId]);

    useFocusEffect(
        useCallback(() => {
            fetchTrips();
        }, [fetchTrips])
    );

    const handleDeleteTrip = async (id: number) => {
        Alert.alert(
            'Delete Trip',
            'Are you sure you want to delete this trip record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/trips/${id}`);
                            fetchTrips(); // Refresh
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete trip');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Start New Trip Button */}
                <TouchableOpacity
                    style={styles.startTripBtnSmall}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('AddTrip', { vehicleId })}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.startTripGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.playIconCircle}>
                            <Ionicons name="play" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.startTripTextSmall}>Start new trip</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Recent Trips</Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : trips.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="map-outline" size={60} color={COLORS.gray} />
                        <Text style={styles.emptyText}>No trips recorded yet</Text>
                    </View>
                ) : (
                    <View style={styles.timelineContainer}>
                        {trips.map((trip, index) => {
                            const vehicle = vehicles.find(v => v.id === trip.vehicleId.toString());
                            const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehicle ${trip.vehicleId}`;

                            return (
                                <View key={trip.id} style={styles.tripItem}>
                                    {/* Timeline line */}
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.timelineDot,
                                            { backgroundColor: index === 0 ? COLORS.primary : COLORS.gray }
                                        ]}>
                                            <Ionicons
                                                name={index === 0 ? "location" : "ellipse"}
                                                size={index === 0 ? 14 : 6}
                                                color={COLORS.white}
                                            />
                                        </View>
                                        {index < trips.length - 1 && <View style={styles.timelineLine} />}
                                    </View>

                                    {/* Trip Content */}
                                    <View style={styles.tripCard}>
                                        <View style={styles.tripCardHeader}>
                                            <View style={styles.tripInfo}>
                                                <View style={styles.tripHeaderMain}>
                                                    <Text style={styles.tripTitle}>{trip.title}</Text>
                                                    <View style={styles.actions}>
                                                        <TouchableOpacity
                                                            onPress={() => navigation.navigate('AddTrip', { trip })}
                                                            style={styles.actionBtn}
                                                        >
                                                            {/* <Ionicons name="pencil" size={16} color={COLORS.textLight} /> */}
                                                            <Feather name="edit" size={18} color={COLORS.textLight} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleDeleteTrip(trip.id)}
                                                            style={styles.actionBtn}
                                                        >
                                                            <Ionicons name="trash" size={16} color={COLORS.danger} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <View style={styles.vehicleBadge}>
                                                    <Text style={styles.vehicleBadgeText}>{vehicleName}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.tripStats}>
                                            <View style={styles.statItem}>
                                                <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
                                                <Text style={styles.statText}>{formatDate(trip.date)}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Ionicons name="navigate-outline" size={14} color={COLORS.textLight} />
                                                <Text style={styles.statText}>{trip.distanceKm} km</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
                                                <Text style={styles.statText}>{trip.duration}</Text>
                                            </View>
                                        </View>
                                        {trip.note && (
                                            <Text style={styles.tripNote} numberOfLines={1}>
                                                "{trip.note}"
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SIZES.padding,
        paddingBottom: 40,
    },
    startTripBtnSmall: {
        marginBottom: 30,
        ...SHADOWS.medium,
    },
    startTripGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 15,
        gap: 12,
    },
    playIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startTripTextSmall: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
        gap: 10,
    },
    emptyText: {
        color: COLORS.textLight,
        fontSize: 16,
    },
    timelineContainer: {
        paddingLeft: 10,
    },
    tripItem: {
        flexDirection: 'row',
        marginBottom: 25,
    },
    timelineLeft: {
        width: 24,
        alignItems: 'center',
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E2E8F0',
        marginTop: 0,
        marginBottom: -25,
    },
    loadingContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    tripCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        padding: 15,
        marginLeft: 15,
        ...SHADOWS.light,
    },
    tripCardHeader: {
        marginBottom: 10,
    },
    tripInfo: {
        gap: 4,
    },
    tripHeaderMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    actionBtn: {
        padding: 2,
    },
    tripTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
    },
    vehicleBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 10,
    },
    vehicleBadgeText: {
        fontSize: 10,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    tripStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statText: {
        fontSize: 13,
        color: COLORS.textLight,
    },
    tripNote: {
        marginTop: 10,
        fontSize: 12,
        color: COLORS.textLight,
        fontStyle: 'italic',
        backgroundColor: '#F8FAFC',
        padding: 8,
        borderRadius: 8,
    },
});
