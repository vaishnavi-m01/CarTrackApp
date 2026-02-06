import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

interface LogEntry {
    id: string;
    type: 'Fuel' | 'Service' | 'Repair';
    title: string;
    subTitle: string;
    details?: string;
    date: string;
    cost: string;
    odometer: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
}

const MOCK_LOGS: LogEntry[] = [
    {
        id: '1',
        type: 'Service',
        title: 'General Service',
        subTitle: 'Hyundai Service Center, OMR',
        details: 'Oil Change • Filter Replacement',
        date: '12 Jan 2024',
        cost: '₹8,450',
        odometer: '35,000 km',
        icon: 'build',
        iconColor: '#6366f1',
    },
    {
        id: '2',
        type: 'Fuel',
        title: 'Fuel Refill',
        subTitle: 'Shell Station, Adyar',
        details: '₹102.5/L • 18.5 L • 16.2 km/l',
        date: '05 Jan 2024',
        cost: '₹8,450',
        odometer: '34,850 km',
        icon: 'water',
        iconColor: '#f43f5e',
    },
    {
        id: '3',
        type: 'Repair',
        title: 'Wiper Blades Changed',
        subTitle: 'Bosch Service',
        date: '05 Jan 2024',
        cost: '₹850',
        odometer: '34,850 km',
        icon: 'construct',
        iconColor: '#64748b',
    },
];

const CATEGORIES = ['All', 'Fuel', 'Service', 'Repairs'];

export default function VehicleLogsScreen({ navigation, route }: any) {
    const vehicle = route.params?.vehicle || { brand: 'Hyundai', model: 'i20', registration: 'TN 01 AB 1234' };
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredLogs = useMemo(() => {
        if (selectedCategory === 'All') return MOCK_LOGS;
        const categoryMap: any = { 'Fuel': 'Fuel', 'Service': 'Service', 'Repairs': 'Repair' };
        return MOCK_LOGS.filter(log => log.type === categoryMap[selectedCategory]);
    }, [selectedCategory]);

    const renderLogItem = (log: LogEntry, index: number) => {
        const isFiltered = selectedCategory !== 'All';

        return (
            <View key={log.id} style={styles.logContainer}>
                {/* Timeline Line - Hide when filtered */}
                {!isFiltered && (
                    <View style={styles.timelineContainer}>
                        <View style={[styles.timelineIconCircle, { backgroundColor: log.iconColor + '15' }]}>
                            <Ionicons name={log.icon as any} size={16} color={log.iconColor} />
                        </View>
                        {index !== filteredLogs.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                )}

                {/* Content Card - Simplified Border Only */}
                <View style={[
                    styles.logCard,
                    isFiltered && { marginLeft: 0 } // Remove gap when timeline is gone
                ]}>
                    <View style={styles.logCardHeader}>
                        <View style={styles.logMainInfo}>
                            <Text style={styles.logTitle}>{log.title}</Text>
                            <Text style={styles.logSubTitle}>{log.subTitle}</Text>
                        </View>
                        <Text style={styles.logCost}>{log.cost}</Text>
                    </View>

                    {log.details && (
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsText}>{log.details}</Text>
                        </View>
                    )}

                    <View style={styles.logFooter}>
                        <Text style={styles.footerText}>{log.date}</Text>
                        <Text style={styles.footerText}>{log.odometer}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            activeOpacity={0.7}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && styles.categoryChipActive
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && styles.categoryTextActive
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Logs List */}
            <ScrollView style={styles.logsList} contentContainerStyle={styles.logsListContent} showsVerticalScrollIndicator={false}>
                {/* Vehicle Quick Info Section */}
                <View style={styles.vehicleQuickInfo}>
                    <View style={styles.infoIconBox}>
                        <Ionicons
                            name={vehicle.vehicleType === 'bike' ? 'bicycle' : 'car'}
                            size={24}
                            color={COLORS.primary}
                        />
                    </View>
                    <View>
                        <Text style={styles.quickBrand}>{vehicle.brand} {vehicle.model}</Text>
                        <Text style={styles.quickReg}>{vehicle.registration}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Recent Activities</Text>
                {filteredLogs.map((log, index) => renderLogItem(log, index))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFCFC',
    },
    vehicleQuickInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    quickBrand: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    quickReg: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 1,
    },
    categoriesContainer: {
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    categoriesScroll: {
        paddingHorizontal: 16,
    },
    categoryChip: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    categoryTextActive: {
        color: '#fff',
    },
    logsList: {
        flex: 1,
    },
    logsListContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    logContainer: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timelineContainer: {
        alignItems: 'center',
        width: 32,
        marginRight: 12,
    },
    timelineIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timelineLine: {
        flex: 1,
        width: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 2,
    },
    logCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    logCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    logMainInfo: {
        flex: 1,
        marginRight: 12,
    },
    logTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    logSubTitle: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    logCost: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    detailsRow: {
        marginTop: 10,
        backgroundColor: '#F8FAFC',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    detailsText: {
        fontSize: 10,
        color: COLORS.textLight,
    },
    logFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    footerText: {
        fontSize: 11,
        color: COLORS.textExtraLight,
    },
});
