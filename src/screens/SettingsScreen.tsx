import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Platform,
    Alert,
    SafeAreaView,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useNotificationActions } from '../components/NotificationHandler';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
    navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
    // Toggles state
    const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
    const [insuranceExpiry, setInsuranceExpiry] = useState(true);
    const [privacyGarage, setPrivacyGarage] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [fuelUnit, setFuelUnit] = useState<'Liters' | 'Gallons'>('Liters');
    const { logout, user } = useAuth();
    const { unregisterToken } = useNotificationActions();

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({ scrollY });
    }, []);
    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    if (user?.id) {
                        try {
                            await unregisterToken(user.id);
                        } catch (err) {
                            console.error("Failed to unregister notification token:", err);
                        }
                    }
                    await logout();
                },
            },
        ]);
    };

    const SettingRow = ({
        icon,
        label,
        value,
        onPress,
        showArrow = true,
        isToggle = false,
        toggleValue = false,
        onToggle = () => { },
    }: any) => (
        <TouchableOpacity
            style={styles.settingRow}
            onPress={onPress}
            disabled={isToggle}
            activeOpacity={0.7}
        >
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            <View style={styles.settingRight}>
                {isToggle ? (
                    <Switch
                        value={toggleValue}
                        onValueChange={onToggle}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : toggleValue ? COLORS.white : '#f4f3f4'}
                    />
                ) : (
                    <>
                        {value && <Text style={styles.settingValue}>{value}</Text>}
                        {showArrow && <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />}
                    </>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                scrollEnabled={true}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >

                {/* Account Section */}
                <Text style={styles.sectionTitle}>ACCOUNT</Text>
                <View style={styles.settingsGroup}>
                    <SettingRow
                        icon="person-outline"
                        label="Edit Profile"
                        showArrow={true}
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <View style={styles.divider} />
                    <SettingRow icon="shield-checkmark-outline" label="Security" onPress={() => { }} />
                    <View style={styles.divider} />
                    <SettingRow icon="lock-closed-outline" label="Privacy" onPress={() => { }} />
                </View>

                {/* Notifications Section */}
                <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
                <View style={styles.settingsGroup}>
                    <SettingRow
                        icon="notifications-outline"
                        label="Maintenance Alerts"
                        isToggle
                        toggleValue={maintenanceAlerts}
                        onToggle={setMaintenanceAlerts}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="shield-outline"
                        label="Insurance Expiry"
                        isToggle
                        toggleValue={insuranceExpiry}
                        onToggle={setInsuranceExpiry}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="notifications"
                        label="Push Notifications"
                        isToggle
                        toggleValue={pushNotifications}
                        onToggle={setPushNotifications}
                    />
                </View>

                {/* Vehicle Preferences Section */}
                <Text style={styles.sectionTitle}>VEHICLE PREFERENCES</Text>
                <View style={styles.settingsGroup}>
                    <View style={styles.unitRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.settingLabel}>Fuel Units</Text>
                        </View>
                        <View style={styles.unitSelector}>
                            <TouchableOpacity
                                style={[styles.unitBtn, fuelUnit === 'Liters' && styles.unitBtnActive]}
                                onPress={() => setFuelUnit('Liters')}
                            >
                                <Text style={[styles.unitBtnText, fuelUnit === 'Liters' && styles.unitBtnTextActive]}>Liters</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.unitBtn, fuelUnit === 'Gallons' && styles.unitBtnActive]}
                                onPress={() => setFuelUnit('Gallons')}
                            >
                                <Text style={[styles.unitBtnText, fuelUnit === 'Gallons' && styles.unitBtnTextActive]}>Gallons</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <SettingRow
                        icon="eye-off-outline"
                        label="Garage Privacy"
                        isToggle
                        toggleValue={privacyGarage}
                        onToggle={setPrivacyGarage}
                    />
                </View>

                {/* Display Section */}
                <Text style={styles.sectionTitle}>DISPLAY</Text>
                <View style={styles.settingsGroup}>
                    <SettingRow
                        icon="moon-outline"
                        label="Dark Mode"
                        isToggle
                        toggleValue={darkMode}
                        onToggle={setDarkMode}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="help-circle-outline"
                        label="About"
                        onPress={() => { }}
                    />
                </View>

                {/* Premium Section */}
                <Text style={styles.sectionTitle}>PREMIUM</Text>
                <View style={styles.premiumCard}>
                    <View style={styles.premiumContent}>
                        <View style={styles.premiumIconContainer}>
                            <Ionicons name="diamond" size={28} color={COLORS.white} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={styles.premiumLabel}>UNLOCK PREMIUM</Text>
                            <Text style={styles.premiumTitle}>Advanced Features</Text>
                            <Text style={styles.premiumSub}>Real-time tracking & diagnostics</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.upgradeBtn}>
                        <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                {/* Danger Zone Section */}
                <Text style={styles.sectionTitle}>DANGER ZONE</Text>
                <View style={styles.settingsGroup}>
                    <TouchableOpacity
                        style={styles.settingRow}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 71, 87, 0.1)' }]}>
                                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                            </View>
                            <Text style={[styles.settingLabel, { color: COLORS.danger }]}>Logout</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.versionText}>Version 2.4.0</Text>
                    <Text style={styles.copyrightText}>© 2026 CarTrack</Text>
                </View>

                <View style={{ height: 20 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textExtraLight,
        marginBottom: 12,
        letterSpacing: 0.8,
    },
    settingsGroup: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E8EEF7',
        marginBottom: 24,
        overflow: 'hidden',
        ...SHADOWS.light,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 13,
        color: COLORS.textLight,
        marginRight: 12,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    unitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    unitSelector: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 10,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 4,
    },
    unitBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    unitBtnActive: {
        backgroundColor: COLORS.primary,
    },
    unitBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textLight,
    },
    unitBtnTextActive: {
        color: COLORS.white,
    },
    premiumCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E8EEF7',
        padding: 16,
        marginBottom: 24,
        ...SHADOWS.light,
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    premiumIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    premiumTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 2,
    },
    premiumSub: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    upgradeBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    upgradeBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    versionText: {
        fontSize: 12,
        color: COLORS.textExtraLight,
        fontWeight: '600',
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 11,
        color: COLORS.textExtraLight,
        fontWeight: '500',
    },
});
