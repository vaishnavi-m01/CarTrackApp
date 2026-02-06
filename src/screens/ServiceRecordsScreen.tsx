import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, Expense } from '../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

type TimeFilter = 'All' | 'Week' | 'Month' | 'Year';

export default function ServiceRecordsScreen({ navigation, route }: { navigation: any, route: any }) {
    const { vehicles, expenses } = useApp();
    const vehicleId = route.params?.vehicleId;
    const vehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0];

    const [activeFilter, setActiveFilter] = useState<TimeFilter>('All');
    const [selectedRecord, setSelectedRecord] = useState<Expense | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);

    const filterRecords = (records: Expense[], filter: TimeFilter) => {
        if (filter === 'All') return records;

        const now = new Date();
        const startOfPeriod = new Date();

        if (filter === 'Week') {
            startOfPeriod.setDate(now.getDate() - 7);
        } else if (filter === 'Month') {
            startOfPeriod.setMonth(now.getMonth() - 1);
        } else if (filter === 'Year') {
            startOfPeriod.setFullYear(now.getFullYear() - 1);
        }

        return records.filter(r => new Date(r.date) >= startOfPeriod);
    };

    // Filter service expenses for this vehicle
    const allServiceRecords = useMemo(() => {
        return expenses
            .filter(e => e.vehicleId === vehicle?.id && (e.type === 'Service' || e.type === 'Repair' || e.type === 'Parts'))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, vehicle?.id]);

    const filteredRecords = useMemo(() => {
        return filterRecords(allServiceRecords, activeFilter);
    }, [allServiceRecords, activeFilter]);

    const totalServiceCost = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleRecordPress = (record: Expense) => {
        setSelectedRecord(record);
        setModalVisible(true);
    };

    const filters: TimeFilter[] = ['All', 'Week', 'Month', 'Year'];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Summary Header Card */}
                <LinearGradient
                    colors={[COLORS.primary, '#4f46e5']}
                    style={styles.headerCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View>
                        <Text style={styles.headerLabel}>{activeFilter === 'All' ? 'Total' : `This ${activeFilter}`} Maintenance</Text>
                        <Text style={styles.headerValue}>₹{totalServiceCost.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.headerIconBg}>
                        <Ionicons name="build" size={32} color={COLORS.white} />
                    </View>
                </LinearGradient>

                <View style={styles.vehicleInfo}>
                    <Ionicons name="car-outline" size={20} color={COLORS.textLight} />
                    <Text style={styles.vehicleText}>{vehicle?.brand} {vehicle?.model} • {vehicle?.registration}</Text>
                </View>

                {/* Filter Bar */}
                <View style={styles.filterWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {filters.map(f => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                                onPress={() => setActiveFilter(f)}
                            >
                                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                                    {f === 'All' ? 'All Records' : `This ${f}`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>History Log</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{filteredRecords.length} Records</Text>
                    </View>
                </View>

                {filteredRecords.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="clipboard-outline" size={60} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>No Records Found</Text>
                        <Text style={styles.emptySubtitle}>No maintenance records available for your selected time period.</Text>
                    </View>
                ) : (
                    filteredRecords.map((record) => (
                        <TouchableOpacity
                            key={record.id}
                            style={styles.recordCard}
                            activeOpacity={0.7}
                            onPress={() => handleRecordPress(record)}
                        >
                            <View style={styles.smallTickBg}>
                                <View style={styles.tickCircle}>
                                    <Ionicons name="checkmark" size={12} color="#10b981" />
                                </View>
                            </View>

                            <View style={styles.recordMain}>
                                <View style={styles.recordHeader}>
                                    <Text style={styles.recordTitle} numberOfLines={1}>{record.note?.split(' @ ')[0] || `Maintenance Activity`}</Text>
                                    <Text style={styles.recordAmount}>₹{record.amount.toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={styles.recordFooter}>
                                    <View style={styles.typeBadge}>
                                        <Text style={styles.typeText}>{record.type}</Text>
                                    </View>
                                    <View style={styles.dot} />
                                    <Text style={styles.recordFooterText}>{formatDate(record.date)}</Text>
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Record Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.dragHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Service Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedRecord && (
                            <View style={styles.detailsList}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Work Description</Text>
                                    <Text style={styles.detailValueBold}>{selectedRecord.note || 'Regular Maintenance'}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <View style={styles.detailItemHalf}>
                                        <Text style={styles.detailLabel}>Amount Paid</Text>
                                        <Text style={[styles.detailValueBold, { color: COLORS.primary }]}>₹{selectedRecord.amount.toLocaleString('en-IN')}</Text>
                                    </View>
                                    <View style={styles.detailItemHalf}>
                                        <Text style={styles.detailLabel}>Date</Text>
                                        <Text style={styles.detailValue}>{formatDate(selectedRecord.date)}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Service Type</Text>
                                    <View style={[styles.typeBadge, { alignSelf: 'flex-start', marginTop: 4 }]}>
                                        <Text style={styles.typeText}>{selectedRecord.type}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalBtnText}>Close Window</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddService', { vehicleId: vehicle?.id })}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={32} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>
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
    },
    headerCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        ...SHADOWS.medium,
    },
    headerLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    headerValue: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    vehicleText: {
        color: COLORS.textLight,
        fontSize: 13,
        fontWeight: '500',
    },
    filterWrapper: {
        marginBottom: 24,
    },
    filterScroll: {
        paddingHorizontal: 4,
        gap: 12,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.light,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    filterTextActive: {
        color: COLORS.white,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    recordCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    smallTickBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tickCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10b981',
    },
    recordMain: {
        flex: 1,
        marginRight: 8,
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    recordTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    recordAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    recordFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    typeBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.border,
    },
    recordFooterText: {
        fontSize: 12,
        color: COLORS.textExtraLight,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 13,
        color: COLORS.textExtraLight,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    closeBtn: {
        padding: 4,
    },
    detailsList: {
        gap: 20,
        marginBottom: 30,
    },
    detailItem: {
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        gap: 20,
    },
    detailItemHalf: {
        flex: 1,
        gap: 4,
    },
    detailLabel: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    detailValueBold: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    modalBtn: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        ...SHADOWS.medium,
        overflow: 'hidden',
    },
    fabGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
