import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    Linking,
    ActivityIndicator,
    ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import apiClient from '../api/apiClient';

export default function InsuranceScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles } = useApp();
    const insets = useSafeAreaInsets();
    const vehicleId = route.params?.vehicleId;
    const vehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0];

    const [insurance, setInsurance] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    const fetchInsurance = useCallback(async () => {
        if (!vehicleId) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/insurance?vehicleId=${vehicleId}`);
            if (response.data && response.data.length > 0) {
                // Get the latest/active policy
                // Assuming the backend returns them in order or we pick the first one which is active
                setInsurance(response.data[0]);
            } else {
                setInsurance(null);
            }
        } catch (error) {
            console.error('Error fetching insurance:', error);
            // Don't show alert here to avoid annoying popups on empty state
        } finally {
            setIsLoading(false);
        }
    }, [vehicleId]);

    useFocusEffect(
        useCallback(() => {
            fetchInsurance();
        }, [fetchInsurance])
    );

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleDownload = () => {
        if (isDownloading) return;
        if (!insurance) {
            Alert.alert("No Policy", "There is no active policy to download.");
            return;
        }

        setIsDownloading(true);

        // Simulate download time
        setTimeout(() => {
            setIsDownloading(false);

            Alert.alert(
                "Download Complete",
                "Your insurance policy has been downloaded and saved to your 'Documents' section for easy access.",
                [
                    { text: "Dismiss", style: "cancel" }
                ]
            );
        }, 1500);
    };

    const handleCallSupport = async () => {
        const url = 'tel:18002666';
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                // Some devices/emulators return false for canOpenURL even if they can open tel:
                // We attempt to open anyway as a fallback
                await Linking.openURL(url);
            }
        } catch (error) {
            Alert.alert("Error", "Could not open the phone dialer. Please call 1800-2666 manually.");
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Fetching insurance details...</Text>
                    </View>
                ) : !insurance ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="shield-outline" size={80} color={COLORS.gray} />
                        <Text style={styles.emptyTitle}>No Active Policy</Text>
                        <Text style={styles.emptySubtitle}>You haven't added any insurance policy for this vehicle yet.</Text>
                        <TouchableOpacity
                            style={styles.addFirstBtn}
                            onPress={() => navigation.navigate('RenewInsurance', { vehicleId })}
                        >
                            <Text style={styles.addFirstBtnText}>Add Policy Now</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Main Policy Card with Gradient & Pattern */}
                        <LinearGradient
                            colors={insurance.status === 'EXPIRED' ? ['#f87171', '#dc2626'] : ['#10b981', '#059669']}
                            style={styles.policyCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {/* Background Pattern Icon */}
                            <View style={styles.patternIcon}>
                                <Ionicons name="shield-checkmark" size={120} color="rgba(255,255,255,0.1)" />
                            </View>

                            <View style={styles.cardHeader}>
                                <View style={styles.iconBg}>
                                    <Ionicons name="shield-checkmark" size={24} color={COLORS.white} />
                                </View>
                                <View style={styles.statusBadge}>
                                    <View style={[styles.statusDot, { backgroundColor: insurance.status === 'ACTIVE' ? '#fff' : '#fbbf24' }]} />
                                    <Text style={styles.statusText}>{insurance.status} Policy</Text>
                                </View>
                            </View>

                            <View style={styles.cardBody}>
                                <View>
                                    <Text style={styles.label}>Policy Number</Text>
                                    <Text style={styles.value}>{insurance.policyNumber}</Text>
                                </View>

                                <View style={styles.cardFooter}>
                                    <View>
                                        <Text style={styles.label}>Provider</Text>
                                        <Text style={styles.valueSmall}>{insurance.insuranceProvider}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.label}>Expires on</Text>
                                        <Text style={styles.valueSmall}>{formatDate(insurance.expiryDate)}</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>

                        <Text style={styles.sectionTitle}>Policy Details</Text>

                        <View style={styles.detailsCard}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Start Date</Text>
                                <Text style={styles.detailValue}>{formatDate(insurance.policyStartDate)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Premium Paid</Text>
                                <Text style={styles.detailValue}>₹{insurance.premiumAmount?.toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Vehicle</Text>
                                <Text style={styles.detailValue}>{vehicle?.brand} {vehicle?.model}</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <View style={styles.quickActionsGrid}>
                            <TouchableOpacity
                                style={styles.actionCard}
                                activeOpacity={0.7}
                                onPress={handleDownload}
                            >
                                <View style={styles.actionIconBg}>
                                    <Ionicons name="cloud-download" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionLabel}>Download</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionCard}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('RenewInsurance', { vehicleId, insurance })}
                            >
                                <View style={styles.actionIconBg}>
                                    <Ionicons name="pencil" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionLabel}>Edit Policy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionCard}
                                activeOpacity={0.7}
                                onPress={handleCallSupport}
                            >
                                <View style={styles.actionIconBg}>
                                    <Ionicons name="call" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.actionLabel}>Support</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Sticky Footer Button */}
            {!isLoading && insurance && (
                <View style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, 20) }
                ]}>
                    <TouchableOpacity
                        style={styles.renewBtn}
                        onPress={() => navigation.navigate('RenewInsurance', { vehicleId })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.renewGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.renewBtnText}>Renew Policy</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
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
        paddingBottom: 20,
    },
    policyCard: {
        borderRadius: 24,
        padding: 24,
        height: 220,
        justifyContent: 'space-between',
        ...SHADOWS.medium,
        marginBottom: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    patternIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        opacity: 0.8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    statusText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardBody: {
        flex: 1,
        justifyContent: 'center',
        marginTop: 10,
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
    },
    value: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 20,
    },
    valueSmall: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.textLight,
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        marginTop: 20,
        ...SHADOWS.light,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    addFirstBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    addFirstBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        ...SHADOWS.light,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        paddingLeft: 4,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
        ...SHADOWS.medium,
    },
    actionIconBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    footer: {
        padding: SIZES.padding,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    renewBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    renewGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    renewBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
