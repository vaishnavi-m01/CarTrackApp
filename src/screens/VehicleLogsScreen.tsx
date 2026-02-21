import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import apiClient from '../api/apiClient';

interface LogEntry {
    id: string;
    type: 'FUEL' | 'SERVICE' | 'TRIP' | 'EXPENSE' | 'REPAIR';
    title: string;
    subTitle: string;
    amount?: number;
    odometer?: number;
    date: string;
    extraDetails?: any;
}

const CATEGORIES = ['All', 'Fuel', 'Service', 'Trips', 'Expenses'];

export default function VehicleLogsScreen({ navigation, route }: any) {
    const vehicle = route.params?.vehicle;
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = useCallback(async () => {
        if (!vehicle?.id) return;
        try {
            const response = await apiClient.get(`/vehicles/${vehicle.id}/timeline`);
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [vehicle?.id]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLogs();
    };

    const filteredLogs = useMemo(() => {
        if (selectedCategory === 'All') return logs;
        const categoryMap: any = {
            'Fuel': 'FUEL',
            'Service': 'SERVICE',
            'Trips': 'TRIP',
            'Expenses': 'EXPENSE'
        };
        return logs.filter(log => log.type === categoryMap[selectedCategory]);
    }, [selectedCategory, logs]);

    const getLogStyle = (type: string) => {
        switch (type) {
            case 'FUEL': return { icon: 'water', color: '#f43f5e' };
            case 'SERVICE': return { icon: 'build', color: '#6366f1' };
            case 'REPAIR': return { icon: 'construct', color: '#64748b' };
            case 'TRIP': return { icon: 'map', color: '#10b981' };
            default: return { icon: 'receipt', color: COLORS.primary };
        }
    };

    const renderLogItem = (log: LogEntry, index: number) => {
        const style = getLogStyle(log.type);
        const isFiltered = selectedCategory !== 'All';

        return (
            <View key={log.id} style={styles.logContainer}>
                {/* Timeline Line - Hide when filtered */}
                {!isFiltered && (
                    <View style={styles.timelineContainer}>
                        <View style={[styles.timelineIconCircle, { backgroundColor: style.color + '15' }]}>
                            <Ionicons name={style.icon as any} size={15} color={style.color} />
                        </View>
                        {index !== filteredLogs.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                )}

                {/* Content Card */}
                <View style={[
                    styles.logCard,
                    isFiltered && { marginLeft: 0 }
                ]}>
                    <View style={styles.logCardHeader}>
                        <View style={styles.logMainInfo}>
                            <View style={styles.typeRow}>
                                <Text style={[styles.typeBadge, { backgroundColor: style.color + '15', color: style.color }]}>
                                    {log.type.charAt(0) + log.type.slice(1).toLowerCase()}
                                </Text>
                                <Text style={styles.logDate}>{log.date}</Text>
                            </View>
                            <Text style={styles.logTitle}>{log.title}</Text>
                            <Text style={styles.logSubTitle} numberOfLines={1}>{log.subTitle || 'No notes'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            {log.amount && (
                                <Text style={styles.logCost} numberOfLines={1}>₹{log.amount.toLocaleString()}</Text>
                            )}
                            {log.odometer && (
                                <Text style={styles.logOdo} numberOfLines={1}>{log.odometer.toLocaleString()} km</Text>
                            )}
                        </View>
                    </View>

                    {log.extraDetails && (
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsText}>{log.extraDetails.toString()}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Vehicle Logs',
            headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : '',
        } as any);
    }, [navigation, vehicle]);

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
                                styles.categoryPill,
                                selectedCategory === cat && styles.categoryPillActive
                            ]}
                        >
                            <Text style={[
                                styles.categoryPillText,
                                selectedCategory === cat && styles.categoryPillTextActive
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Logs List */}
            <ScrollView
                style={styles.logsList}
                contentContainerStyle={styles.logsListContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {/* Vehicle Quick Info Section */}
                {/* <View style={styles.vehicleQuickInfo}>
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
                </View> */}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Timeline Activity</Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : filteredLogs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No logs found for this car</Text>
                    </View>
                ) : (
                    filteredLogs.map((log, index) => renderLogItem(log, index))
                )}
            </ScrollView>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FCFCFC' },
    vehicleQuickInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    infoIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#e2e8f0' },
    quickBrand: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    quickReg: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
    categoriesContainer: { paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    categoriesScroll: { paddingHorizontal: 16, gap: 8 },
    categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    categoryPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    categoryPillText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
    categoryPillTextActive: { color: COLORS.white },
    logsList: { flex: 1 },
    logsListContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
    logContainer: { flexDirection: 'row' },
    timelineContainer: { alignItems: 'center', width: 32, marginRight: 12 },
    timelineIconCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 2, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E2E8F0' },
    timelineLine: { flex: 1, width: 2, backgroundColor: '#F1F5F9', marginVertical: 2 },
    logCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', ...SHADOWS.light },
    logCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    logMainInfo: { flex: 1, marginRight: 12 },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    typeBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, textTransform: 'uppercase' },
    logDate: { fontSize: 11, color: COLORS.textLight },
    logTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
    logSubTitle: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
    logCost: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    logOdo: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    detailsRow: { marginTop: 12, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 },
    detailsText: { fontSize: 11, color: COLORS.textLight, fontStyle: 'italic' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyText: { marginTop: 10, color: COLORS.textLight, fontSize: 14 },
    fab: { position: 'absolute', bottom: 30, right: 20, borderRadius: 28, ...SHADOWS.medium },
    fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});
