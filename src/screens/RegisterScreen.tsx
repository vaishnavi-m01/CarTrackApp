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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';

type RegisterScreenProps = {
    navigation: StackNavigationProp<any>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const validate = () => {
        let valid = true;
        const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Full Name is required';
            valid = false;
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
            valid = false;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            valid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            valid = false;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Confirm Password is required';
            valid = false;
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleRegister = async () => {
        if (!validate()) {
            return;
        }

        setIsLoading(true);
        const success = await register(name.trim(), email.trim(), password);
        setIsLoading(false);

        if (!success) {
            Alert.alert('Registration Failed', 'Email already exists. Please use a different email.');
        } else {
            // If success, user will be auto-logged in by AuthContext, so navigate to MainTabs
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
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
                        <Text style={styles.appName}>Join CarTrack</Text>
                        <Text style={styles.tagline}>Create your account to get started</Text>
                    </View>

                    {/* Register Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>Create Account</Text>
                        <Text style={styles.subtitle}>Fill in your details below</Text>

                        {/* Name Input */}
                        <View style={{ marginBottom: 16 }}>
                            <View style={[styles.inputContainer, errors.name ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={name}
                                    onChangeText={(text) => { setName(text); setErrors({ ...errors, name: '' }); }}
                                    autoCapitalize="words"
                                    selectionColor={COLORS.white}
                                />
                                {name.length > 0 && (
                                    <TouchableOpacity onPress={() => setName('')}>
                                        <Ionicons name="close-circle-outline" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                        </View>

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
                                    placeholder="Password (min 6 characters)"
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

                        {/* Confirm Password Input */}
                        <View style={{ marginBottom: 16 }}>
                            <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={confirmPassword}
                                    onChangeText={(text) => { setConfirmPassword(text); setErrors({ ...errors, confirmPassword: '' }); }}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    selectionColor={COLORS.white}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color={COLORS.white}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45a049']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.registerButtonText}>
                                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text style={styles.loginLink}>Sign In</Text>
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
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
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
        marginBottom: 24,
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
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.white,
    },
    eyeIcon: {
        padding: 8,
    },
    registerButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    registerButtonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    registerButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
    },
    loginLink: {
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
