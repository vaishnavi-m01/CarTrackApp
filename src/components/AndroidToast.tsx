import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error';
    onHide: () => void;
}

const { width } = Dimensions.get('window');

export default function AndroidToast({ visible, message, type = 'success', onHide }: ToastProps) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show toast
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 100,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after 2.5s
            const timer = setTimeout(() => {
                hideToast();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    if (!visible && (opacity as any)._value === 0) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                    backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
                },
            ]}
        >
            <View style={styles.content}>
                <Ionicons
                    name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                    size={24}
                    color={COLORS.white}
                />
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: 12,
        padding: 16,
        ...SHADOWS.dark,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    message: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
});
