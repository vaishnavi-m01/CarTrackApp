import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Image,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

interface EditProfileScreenProps {
    navigation: EditProfileScreenNavigationProp;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || 'Automotive Enthusiast | Track Day Junkie | Miami, FL');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to select an image!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatarImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setIsSaving(true);
        // Simulate save delay
        setTimeout(() => {
            setIsSaving(false);
            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        }, 1000);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={pickImage}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{
                                uri: avatarImage || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200',
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.cameraOverlay}>
                            <Ionicons name="camera" size={20} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarLabel}>Tap to change photo</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    {/* Name */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    {/* Phone */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your phone number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor={COLORS.textExtraLight}
                        />
                    </View>

                    {/* Bio */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="Tell us about yourself"
                            value={bio}
                            onChangeText={setBio}
                            placeholderTextColor={COLORS.textExtraLight}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: COLORS.white,
        marginBottom: 12,
        position: 'relative',
        ...SHADOWS.medium,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
        ...SHADOWS.medium,
    },
    avatarLabel: {
        fontSize: 13,
        color: COLORS.textLight,
        fontWeight: '500',
    },
    formSection: {
        marginBottom: 28,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: '#E8EEF7',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
        ...SHADOWS.light,
    },
    bioInput: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.white,
    },
});
