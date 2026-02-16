import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ToastAndroid,
} from 'react-native';  
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type LoginScreenProps = {
    navigation: StackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const validate = () => {
        let valid = true;
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
            valid = false;
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleLogin = async () => {
        if (!validate()) {
            return;
        }

        setIsLoading(true);
        const success = await login(email.trim(), password);
        setIsLoading(false);

        if (success) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Login successful', ToastAndroid.LONG);
            }
            // Navigation handled by AuthContext state update in MainNavigator
        } else {
            Alert.alert('Login Failed', 'Invalid email or password');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark, '#1a1a2e']}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo/Icon */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="car-sport" size={40} color={COLORS.white} />
                        </View>
                        <Text style={styles.appName}>CarTrack</Text>
                        <Text style={styles.tagline}>Track your journey, manage your ride</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>Sign in to continue</Text>

                        {/* Email Input */}
                        <View style={{ marginBottom: 16 }}>
                            <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={email}
                                    onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: '' }); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    selectionColor={COLORS.white}
                                />
                                {email.length > 0 && (
                                    <TouchableOpacity onPress={() => setEmail('')}>
                                        <Ionicons name="close-circle-outline" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                        </View>

                        {/* Password Input */}
                        <View style={{ marginBottom: 16 }}>
                            <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={password}
                                    onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: '' }); }}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    selectionColor={COLORS.white}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color={COLORS.white}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45a049']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 24,
        // Removed invalid backdropFilter for React Native
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        marginBottom: 0,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },

    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: COLORS.white,
    },
    eyeIcon: {
        padding: 8,
    },
    loginButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    registerText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
    },
    registerLink: {
        color: '#4CAF50',
        fontSize: 15,
        fontWeight: 'bold',
    },
    inputError: {
        borderColor: '#FF5252',
        borderWidth: 1.5,
    },
    errorText: {
        color: '#FF5252',
        fontSize: 12,
        marginLeft: 4,
        marginTop: 4,
    },
});
