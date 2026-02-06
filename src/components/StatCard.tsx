import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    subtext?: string;
}

export default function StatCard({ icon, label, value, subtext }: StatCardProps) {
    return (
        <View style={styles.card}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
            {subtext && <Text style={styles.subtext}>{subtext}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    icon: {
        fontSize: 32,
        marginBottom: 10,
    },
    label: {
        fontSize: SIZES.body3,
        color: COLORS.textLight,
        marginBottom: 5,
    },
    value: {
        fontSize: SIZES.h4,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtext: {
        fontSize: SIZES.body4,
        color: COLORS.textExtraLight,
        marginTop: 5,
    },
});
