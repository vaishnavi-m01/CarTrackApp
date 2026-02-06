import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function InsuranceScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles, addDocument } = useApp();
    const insets = useSafeAreaInsets();
    const vehicleId = route.params?.vehicleId;
    const vehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0];

    const [isDownloading, setIsDownloading] = useState(false);

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

        setIsDownloading(true);

        // Simulate download time
        setTimeout(() => {
            setIsDownloading(false);

            // Logically save to AppContext documents
            addDocument({
                title: `Insurance Policy - ${vehicle?.brand} ${vehicle?.model}`,
                type: 'Insurance',
                addedDate: new Date().toLocaleDateString('en-IN'),
                vehicleId: vehicle?.id,
                files: [
                    {
                        uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                        name: `Policy_${vehicle?.policyNumber || 'POL-8829'}.pdf`,
                        type: 'pdf'
                    }
                ]
            });

            Alert.alert(
                "Download Complete",
                "Your insurance policy has been downloaded and saved to your 'Documents' section for easy access.",
                [
                    { text: "View Documents", onPress: () => navigation.navigate('VehicleDocuments', { vehicleId: vehicle?.id }) },
                    { text: "Dismiss", style: "cancel" }
                ]
            );
        }, 2000);
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

                {/* Main Policy Card with Gradient & Pattern */}
                <LinearGradient
                    colors={['#10b981', '#059669']}
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
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Active Policy</Text>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View>
                            <Text style={styles.label}>Policy Number</Text>
                            <Text style={styles.value}>{vehicle?.policyNumber || 'POL-8829-331-X'}</Text>
                        </View>

                        <View style={styles.cardFooter}>
                            <View>
                                <Text style={styles.label}>Provider</Text>
                                <Text style={styles.valueSmall}>{vehicle?.insuranceProvider || 'HDFC ERGO'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.label}>Expires on</Text>
                                <Text style={styles.valueSmall}>{formatDate(vehicle?.insuranceExpiry)}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

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
                        <Text style={styles.actionLabel}>Download Policy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        activeOpacity={0.7}
                        onPress={handleCallSupport}
                    >
                        <View style={styles.actionIconBg}>
                            <Ionicons name="call" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Call Support</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Sticky Footer Button */}
            <View style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 20) }
            ]}>
                <TouchableOpacity
                    style={styles.renewBtn}
                    onPress={() => navigation.navigate('RenewInsurance', { vehicleId: vehicle?.id })}
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
        gap: 16,
    },
    actionCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
        ...SHADOWS.medium,
    },
    actionIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14,
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
