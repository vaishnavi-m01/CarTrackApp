import React, { useState, useEffect } from 'react';
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
    Switch,
    ActivityIndicator,
    ToastAndroid,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/apiClient';
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
    const { user, updateUser } = useAuth();
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [serverProfilePicUrl, setServerProfilePicUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const scrollY = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        navigation.setParams({ scrollY });
    }, []);

    // Fetch fresh data from server on mount so the latest profilePicUrl is shown
    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) return;
            try {
                const response = await apiClient.get(`/users/${user.id}`);
                const data = response.data;
                setName(data.username || data.name || '');
                setEmail(data.email || '');
                setBio(data.bio || '');
                setIsPrivate(data.isPrivate ?? false);
                setServerProfilePicUrl(data.profilePicUrl || null);
            } catch (error) {
                console.error('Failed to load profile:', error);
                // Fallback to context
                setName(user?.name || user?.username || '');
                setEmail(user?.email || '');
                setBio((user as any)?.bio || '');
                setIsPrivate((user as any)?.isPrivate ?? false);
                setServerProfilePicUrl(user?.profilePicUrl || null);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        loadProfile();
    }, [user?.id]);

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

        if (!user?.id) return;

        setIsSaving(true);
        try {
            // 1. Update Profile Text Data
            // Note: We do NOT include `password` in the payload.
            // Sending an empty password would overwrite the existing one.
            // A separate "Change Password" flow should be used for that.
            const updatePayload: Record<string, any> = {
                id: user.id,
                username: name.trim(),
                email: email.trim(),
                activeStatus: true,
                roleId: (user as any).roleId || 0,
                bio: bio.trim(),
                isPrivate: isPrivate
            };

            await apiClient.put(`/users/${user.id}`, updatePayload);

            // 2. Upload Profile Picture if changed
            let finalProfilePicUrl = serverProfilePicUrl || user?.profilePicUrl;
            if (avatarImage && !avatarImage.startsWith('http')) {
                const formData = new FormData();
                const filename = avatarImage.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('file', {
                    uri: avatarImage,
                    name: filename,
                    type,
                } as any);

                const uploadResponse = await apiClient.post(`/users/${user.id}/upload-profile-pic`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (uploadResponse.data && uploadResponse.data.profilePicUrl) {
                    finalProfilePicUrl = uploadResponse.data.profilePicUrl;
                }
            }

            // 3. Update Global State
            await updateUser({
                name: name.trim(),
                username: name.trim(),
                email: email.trim(),
                bio: bio.trim(),
                isPrivate: isPrivate,
                profilePicUrl: finalProfilePicUrl
            });

            if (Platform.OS === 'android') {
                ToastAndroid.show('Profile updated successfully!', ToastAndroid.SHORT);
            } else {
                Alert.alert('Success', 'Profile updated successfully!');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingProfile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 12, color: COLORS.textLight, fontWeight: '600' }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={pickImage}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={avatarImage
                                ? { uri: avatarImage }
                                : serverProfilePicUrl
                                    ? { uri: serverProfilePicUrl }
                                    : COLORS.defaultProfileImage
                            }
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

                    {/* Private Account Switch */}
                    <View style={styles.switchContainer}>
                        <View style={styles.switchTextContainer}>
                            <Text style={styles.switchLabel}>Private Account</Text>
                            <Text style={styles.switchSubLabel}>Only approved followers can see your posts</Text>
                        </View>
                        <Switch
                            trackColor={{ false: 'rgba(0,0,0,0.1)', true: COLORS.primary }}
                            thumbColor={isPrivate ? COLORS.white : '#f4f3f4'}
                            onValueChange={setIsPrivate}
                            value={isPrivate}
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
            </Animated.ScrollView>
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
        resizeMode: 'contain',
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
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: '#E8EEF7',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginTop: 10,
    },
    switchTextContainer: {
        flex: 1,
        paddingRight: 15,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    switchSubLabel: {
        fontSize: 12,
        color: COLORS.textExtraLight,
        fontWeight: '500',
    },
});
