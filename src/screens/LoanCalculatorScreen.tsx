import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';

const { width } = Dimensions.get('window');

export default function LoanCalculatorScreen({ navigation, route }: { navigation: any; route: any }) {
    const insets = useSafeAreaInsets();
    const passedAmount = route.params?.amount;
    const [loanAmount, setLoanAmount] = useState(passedAmount || '1000000');
    const [interestRate, setInterestRate] = useState('8.5');
    const [tenure, setTenure] = useState('5'); // in years

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({ scrollY } as any);
    }, []);

    // Robust Calculation Logic
    const calculation = useMemo(() => {
        const P = parseFloat(loanAmount.replace(/,/g, '')) || 0;
        const annualRate = parseFloat(interestRate.replace(/,/g, '')) || 0;
        const years = parseFloat(tenure.replace(/,/g, '')) || 0;
        const n = years * 12;

        if (P === 0 || n === 0) {
            return {
                emi: 0,
                totalPayable: 0,
                totalInterest: 0,
                principal: P
            };
        }

        if (annualRate === 0) {
            const emi = P / n;
            return {
                emi: Math.round(emi),
                totalPayable: P,
                totalInterest: 0,
                principal: P
            };
        }

        const r = annualRate / 12 / 100;
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emi * n;
        const totalInterest = totalPayable - P;

        return {
            emi: Math.round(emi),
            totalPayable: Math.round(totalPayable),
            totalInterest: Math.round(totalInterest),
            principal: P
        };
    }, [loanAmount, interestRate, tenure]);

    const formatCurrency = (val: number) => {
        try {
            return new Intl.NumberFormat('en-IN', {
                maximumFractionDigits: 0,
            }).format(val);
        } catch (e) {
            return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    };

    const interestPercentage = calculation.totalPayable > 0
        ? (calculation.totalInterest / calculation.totalPayable) * 100
        : 0;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <Animated.ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Modern Result Card */}
                <View style={styles.resultContainer}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.resultCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.emiHeader}>
                            <Text style={styles.resultLabel}>Monthly EMI</Text>
                            <Text style={styles.emiValue}>₹{formatCurrency(calculation.emi)}</Text>
                        </View>

                        <View style={styles.visualIndicatorContainer}>
                            <View style={styles.visualBar}>
                                <View style={[styles.principalPart, { flex: 100 - interestPercentage }]} />
                                <View style={[styles.interestPart, { flex: interestPercentage }]} />
                            </View>
                            <View style={styles.indicatorLabels}>
                                <View style={styles.indicatorItem}>
                                    <View style={[styles.dot, { backgroundColor: COLORS.white }]} />
                                    <Text style={styles.indicatorText}>Principal</Text>
                                </View>
                                <View style={styles.indicatorItem}>
                                    <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
                                    <Text style={styles.indicatorText}>Interest</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.resultDetails}>
                            <View style={styles.resultItem}>
                                <Text style={styles.subLabel}>Principal</Text>
                                <Text style={styles.subValue}>₹{formatCurrency(calculation.principal)}</Text>
                            </View>
                            <View style={[styles.resultItem, styles.borderLeft]}>
                                <Text style={styles.subLabel}>Total Interest</Text>
                                <Text style={styles.subValue}>₹{formatCurrency(calculation.totalInterest)}</Text>
                            </View>
                        </View>

                        <View style={styles.totalPayableContainer}>
                            <Text style={styles.totalPayableLabel}>Total Amount Payable</Text>
                            <Text style={styles.totalPayableValue}>₹{formatCurrency(calculation.totalPayable)}</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Simplified Input Section */}
                <View style={styles.inputSection}>
                    <View style={styles.inputGroup}>
                        <View style={styles.inputHeader}>
                            <Text style={styles.fieldLabel}>Loan Amount</Text>
                            <Text style={styles.fieldUnit}>₹</Text>
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                value={loanAmount}
                                onChangeText={setLoanAmount}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={COLORS.textExtraLight}
                            />
                            {loanAmount !== '' && (
                                <TouchableOpacity onPress={() => setLoanAmount('')}>
                                    <Ionicons name="close-circle" size={20} color={COLORS.textExtraLight} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.rowInputs}>
                        <View style={[styles.inputGroup, { flex: 1.2, marginRight: 15 }]}>
                            <View style={styles.inputHeader}>
                                <Text style={styles.fieldLabel}>Interest Rate</Text>
                                <Text style={styles.fieldUnit}>% p.a.</Text>
                            </View>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.textInput}
                                    value={interestRate}
                                    onChangeText={setInterestRate}
                                    keyboardType="numeric"
                                    placeholder="0.0"
                                    placeholderTextColor={COLORS.textExtraLight}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <View style={styles.inputHeader}>
                                <Text style={styles.fieldLabel}>Loan Tenure</Text>
                                <Text style={styles.fieldUnit}>Years</Text>
                            </View>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.textInput}
                                    value={tenure}
                                    onChangeText={setTenure}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={COLORS.textExtraLight}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Logical Summary (Amortization Hint) */}
                <View style={styles.summaryBox}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.summaryText}>
                        Calculations are based on monthly reducing balance method. Monthly interest is {interestRate}% / 12 months.
                    </Text>
                </View>

                {/* Bank Offers Integration */}
                <View style={styles.offersSection}>
                    <Text style={styles.offersTitle}>Current Market Rates</Text>
                    <View style={styles.bankOfferList}>
                        {[
                            { name: 'HDFC Bank', rate: '8.5%', id: '1' },
                            { name: 'SBI', rate: '8.75%', id: '2' },
                            { name: 'ICICI Bank', rate: '8.9%', id: '3' }
                        ].map((bank) => (
                            <TouchableOpacity key={bank.id} style={styles.bankCard} activeOpacity={0.7}>
                                <View style={styles.bankMain}>
                                    <View style={styles.bankIcon}>
                                        <Ionicons name="business" size={20} color={COLORS.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.bankName}>{bank.name}</Text>
                                        <Text style={styles.bankRate}>Starting from {bank.rate}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.applyBtn}
                                    onPress={() => setInterestRate(bank.rate.replace('%', ''))}
                                >
                                    <Text style={styles.applyText}>Apply</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Animated.ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    content: {
        padding: 20,
        paddingBottom: 40
    },
    resultContainer: {
        marginBottom: 25,
        ...SHADOWS.medium,
    },
    resultCard: {
        padding: 24,
        borderRadius: 24,
    },
    emiHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    resultLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    emiValue: {
        fontSize: 42,
        fontWeight: '900',
        color: COLORS.white,
        marginTop: 5
    },
    visualIndicatorContainer: {
        marginBottom: 25,
    },
    visualBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    principalPart: {
        backgroundColor: COLORS.white,
    },
    interestPart: {
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    indicatorLabels: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 15,
    },
    indicatorItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 5,
    },
    indicatorText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    resultDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        marginBottom: 15,
    },
    resultItem: {
        flex: 1,
        paddingHorizontal: 10,
    },
    borderLeft: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.2)',
    },
    subLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4
    },
    subValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white
    },
    totalPayableContainer: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 15,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalPayableLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    totalPayableValue: {
        fontSize: 16,
        color: COLORS.white,
        fontWeight: '800',
    },
    inputSection: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: 24,
        ...SHADOWS.light,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    fieldUnit: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textInput: {
        flex: 1,
        height: 50,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    rowInputs: {
        flexDirection: 'row',
    },
    summaryBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 30,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.1)',
    },
    summaryText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textLight,
        lineHeight: 18,
    },
    offersSection: {
        marginBottom: 20,
    },
    offersTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
        marginLeft: 5,
    },
    bankOfferList: {
        gap: 12,
    },
    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 16,
        ...SHADOWS.light,
    },
    bankMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bankIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bankName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text
    },
    bankRate: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    applyBtn: {
        backgroundColor: COLORS.background,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    applyText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '700',
    },
});
