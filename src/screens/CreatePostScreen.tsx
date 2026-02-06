import React, { useState, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    Alert,
    Platform,
    ToastAndroid,
    Modal,
    Dimensions,
    FlatList,
    Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES } from '../constants/theme';
import { MediaItem } from '../types/Community';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useApp } from '../context/AppContext';

type CreatePostScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePost'>;

interface CreatePostScreenProps {
    navigation: CreatePostScreenNavigationProp;
}

import { useAuth } from '../context/AuthContext';

export default function CreatePostScreen({ navigation }: CreatePostScreenProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const [location, setLocation] = useState('');
    const [feeling, setFeeling] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showFeelingModal, setShowFeelingModal] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [tags, setTags] = useState<string[]>([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
    const { addCommunityPost, vehicles } = useApp();
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

    // New states for the redesigned screen
    const [isPublic, setIsPublic] = useState(true);
    const [allowComments, setAllowComments] = useState(true);
    const [selectedGarageVehicle, setSelectedGarageVehicle] = useState<string | null>(null);

    // Refinement states
    const [refiningImage, setRefiningImage] = useState<string | null>(null);
    const [originalRatio, setOriginalRatio] = useState<number>(1);
    const [selectedRatio, setSelectedRatio] = useState<number>(1);

    // ... feelings array ...
    const feelings = [
        { emoji: '😊', label: 'Happy' },
        { emoji: '😍', label: 'Loved' },
        { emoji: '😎', label: 'Cool' },
        { emoji: '🤩', label: 'Excited' },
        { emoji: '😌', label: 'Blessed' },
        { emoji: '🥳', label: 'Celebrating' },
        { emoji: '💪', label: 'Motivated' },
        { emoji: '🔥', label: 'Fired Up' },
        { emoji: '✨', label: 'Grateful' },
        { emoji: '🚗', label: 'Driving' },
        { emoji: '🏁', label: 'Racing' },
        { emoji: '🛣️', label: 'Road Trip' },
    ];

    useLayoutEffect(() => {
        const isPostDisabled = isPosting || (!content.trim() && mediaItems.length === 0);

        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[
                        styles.headerPostButton,
                        isPostDisabled && styles.headerPostButtonDisabled
                    ]}
                    onPress={handlePost}
                    disabled={isPostDisabled}
                >
                    <Text style={[
                        styles.headerPostButtonText,
                        isPostDisabled && styles.headerPostButtonTextDisabled
                    ]}>
                        {isPosting ? 'Posting...' : 'Post'}
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, content, mediaItems, isPosting, location, feeling, tags]);

    const pickMedia = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant access to your photo library');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const asset = result.assets[0];
            if (asset.type === 'video') {
                setMediaItems([...mediaItems, {
                    id: `media_${Date.now()}`,
                    type: 'video',
                    uri: asset.uri,
                    aspectRatio: 0,
                }]);
            } else {
                const ratio = asset.width / asset.height;
                setOriginalRatio(ratio);
                setRefiningImage(asset.uri);
                setSelectedRatio(1); // Start with Square
            }
        }
    };

    const toggleRatio = () => {
        if (selectedRatio === 1) {
            // Switch to Original (capped for professional feed)
            let targetRatio = originalRatio;
            if (targetRatio < 0.8) targetRatio = 0.8; // Portrait cap (4:5)
            if (targetRatio > 1.91) targetRatio = 1.91; // Landscape cap
            setSelectedRatio(targetRatio);
        } else {
            // Switch back to Square
            setSelectedRatio(1);
        }
        Haptics.selectionAsync();
    };

    const handleAddRefinedImage = () => {
        if (refiningImage) {
            setMediaItems([...mediaItems, {
                id: `media_${Date.now()}`,
                type: 'image',
                uri: refiningImage,
                aspectRatio: selectedRatio,
            }]);
            setRefiningImage(null);
        }
    };

    const removeMedia = (id: string) => {
        setMediaItems(prev => prev.filter(item => item.id !== id));
    };

    // Mock location suggestions (replace with real API if needed)
    const allLocations = [
        'Chennai, India',
        'Bangalore, India',
        'Coimbatore, India',
        'Hyderabad, India',
        'Mumbai, India',
        'Delhi, India',
        'Pune, India',
        'Madurai, India',
        'Trichy, India',
        'Salem, India',
        'Tirunelveli, India',
        'Kochi, India',
        'Vellore, India',
        'Tiruppur, India',
        'Erode, India',
    ];

    const handleAddLocation = (loc?: string) => {
        const value = loc || locationInput.trim();
        if (value) {
            setLocation(value);
            if (loc) setLocationInput(loc);

            // Short delay to give visual feedback that the suggestion was selected
            setTimeout(() => {
                setLocationInput('');
                setShowLocationModal(false);
            }, 150);
        }
    };

    // Update location suggestions as user types
    React.useEffect(() => {
        if (showLocationModal && locationInput.trim()) {
            setLocationSuggestions(
                allLocations.filter(l => l.toLowerCase().includes(locationInput.trim().toLowerCase()))
            );
        } else {
            setLocationSuggestions([]);
        }
    }, [locationInput, showLocationModal]);

    const handleSelectFeeling = (selectedFeeling: string) => {
        setFeeling(selectedFeeling);
        setShowFeelingModal(false);
    };

    const handleRemoveFeeling = () => setFeeling('');
    const handleRemoveLocation = () => setLocation('');
    const handleAddTag = (input?: string, keepOpen = false) => {
        const value = input !== undefined ? input : tagInput;
        // Split by comma and whitespace, then clean each tag
        const newTags = value
            .split(/[,\s]+/)
            .map(tag => tag.trim().replace(/^#+/, ''))
            .filter(tag => tag !== '' && !tags.includes(tag));

        if (newTags.length > 0) {
            setTags([...tags, ...newTags]);
            setTagInput('');
            if (!keepOpen) setShowTagModal(false);
        } else if (value.trim() === '' && !keepOpen) {
            // If just empty and not a comma-trigger, close
            setShowTagModal(false);
        }
    };
    const handleRemoveTag = (tag: string) => setTags(tags.filter(t => t !== tag));


    const handlePost = async () => {
        if (!content.trim() && mediaItems.length === 0) {
            Alert.alert('Empty post', 'Please add some content or media to your post');
            return;
        }

        setIsPosting(true);

        // Build post content
        let postContent = content.trim();

        // Add post to context
        if (user) {
            addCommunityPost({
                userId: user.id,
                userName: user.name,
                userAvatar: undefined,
                content: postContent,
                media: mediaItems,
                comments: [],
                category: 'feed',
                location: location.trim(),
                tags: tags,
                // Add new fields if supported by context otherwise they are just visual for now
            });
        }

        setIsPosting(false);

        if (Platform.OS === 'android') {
            ToastAndroid.show('Post created successfully!', ToastAndroid.SHORT);
        } else {
            Alert.alert('Success', 'Post created successfully!');
        }

        navigation.goBack();
    };

    const renderMediaUploader = () => (
        <View style={styles.uploaderContainer}>
            <TouchableOpacity
                activeOpacity={0.7}
                style={styles.uploaderBox}
                onPress={pickMedia}
            >
                <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                <Text style={styles.uploaderTitle}>Add Photos or Video</Text>
                <Text style={styles.uploaderSub}>Share your latest ride or mod with the community</Text>

                <View style={styles.selectMediaBtn}>
                    <Text style={styles.selectMediaBtnText}>Select Media</Text>
                </View>
            </TouchableOpacity>

            {mediaItems.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                    {mediaItems.map((item) => (
                        <View key={item.id} style={styles.mediaThumbContainer}>
                            <Image source={{ uri: item.uri }} style={styles.mediaThumb} />
                            <TouchableOpacity
                                style={styles.removeMediaIcon}
                                onPress={() => removeMedia(item.id)}
                            >
                                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

        </View>
    );


    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Media Section */}
                {renderMediaUploader()}

                {/* Input Area */}
                <View style={styles.inputSection}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.mainInput}
                            placeholder="What's happening in the garage?"
                            placeholderTextColor="#94A3B8"
                            value={content}
                            onChangeText={setContent}
                            multiline
                        />

                        {/* Selected Meta Chips */}
                        {(location || feeling || tags.length > 0) && (
                            <View style={styles.metaChipsContainer}>
                                {location ? (
                                    <View style={styles.metaChip}>
                                        <Ionicons name="location" size={12} color={COLORS.primary} />
                                        <Text style={styles.metaChipText}>{location}</Text>
                                        <TouchableOpacity onPress={handleRemoveLocation}>
                                            <Ionicons name="close-circle" size={14} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                                {feeling ? (
                                    <View style={styles.metaChip}>
                                        <Text style={styles.metaChipEmoji}>{feelings.find(f => f.label === feeling)?.emoji}</Text>
                                        <Text style={styles.metaChipText}>feeling {feeling}</Text>
                                        <TouchableOpacity onPress={handleRemoveFeeling}>
                                            <Ionicons name="close-circle" size={14} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                                {tags.map((tag) => (
                                    <View key={tag} style={styles.metaChip}>
                                        <Text style={styles.metaChipText}>#{tag}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                                            <Ionicons name="close-circle" size={14} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.inputActions}>
                            <TouchableOpacity onPress={() => setShowTagModal(true)}>
                                <Ionicons name="car-outline" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowFeelingModal(true)}>
                                <Ionicons name="happy-outline" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowLocationModal(true)}>
                                <Ionicons name="location-outline" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Ionicons name="people-outline" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.charCount}>{content.length}/2200</Text>
                    </View>
                </View>

                {/* Tag Vehicle Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Tag Vehicle from Garage</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.garageScroll}>
                        {vehicles.map((v: any) => (
                            <TouchableOpacity
                                key={v.id}
                                style={[
                                    styles.vehicleChip,
                                    selectedGarageVehicle === v.id && styles.vehicleChipActive
                                ]}
                                onPress={() => setSelectedGarageVehicle(selectedGarageVehicle === v.id ? null : v.id)}
                            >
                                <Ionicons
                                    name={v.type === 'CAR' ? 'car' : 'bicycle'}
                                    size={16}
                                    color={selectedGarageVehicle === v.id ? COLORS.white : COLORS.primary}
                                />
                                <Text style={[
                                    styles.vehicleChipText,
                                    selectedGarageVehicle === v.id && styles.vehicleChipTextActive
                                ]}>
                                    {v.year} {v.brand} {v.model}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Post Settings */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Post Settings</Text>
                    <View style={styles.settingsBox}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => setIsPublic(true)}
                        >
                            <View style={styles.settingIconBox}>
                                <Ionicons name="globe-outline" size={20} color={isPublic ? COLORS.primary : COLORS.text} />
                            </View>
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingLabel, isPublic && { color: COLORS.primary }]}>Public</Text>
                                <Text style={styles.settingSub}>Visible to everyone on the platform</Text>
                            </View>
                            <Ionicons
                                name={isPublic ? "radio-button-on" : "radio-button-off"}
                                size={22}
                                color={isPublic ? COLORS.primary : "#CBD5E1"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => setIsPublic(false)}
                        >
                            <View style={styles.settingIconBox}>
                                <Ionicons name="people-outline" size={20} color={!isPublic ? COLORS.primary : COLORS.text} />
                            </View>
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingLabel, !isPublic && { color: COLORS.primary }]}>Followers Only</Text>
                                <Text style={styles.settingSub}>Only your followers can see</Text>
                            </View>
                            <Ionicons
                                name={!isPublic ? "radio-button-on" : "radio-button-off"}
                                size={22}
                                color={!isPublic ? COLORS.primary : "#CBD5E1"}
                            />
                        </TouchableOpacity>

                        <View style={styles.settingRow}>
                            <View style={styles.settingIconBox}>
                                <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
                            </View>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Allow Comments</Text>
                            </View>
                            <Switch
                                value={allowComments}
                                onValueChange={setAllowComments}
                                trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.postNowBtn, (!content.trim() && mediaItems.length === 0) && styles.postNowBtnDisabled]}
                    onPress={handlePost}
                    disabled={isPosting || (!content.trim() && mediaItems.length === 0)}
                >
                    <Text style={styles.postNowBtnText}>{isPosting ? 'POSTING...' : 'POST NOW'}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Existing Modals for Location, Feeling, Tag */}
            {/* Location Modal */}
            <Modal
                visible={showLocationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Location</Text>
                            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Search for a place..."
                            placeholderTextColor={COLORS.textLight}
                            value={locationInput}
                            onChangeText={setLocationInput}
                            autoFocus
                        />
                        {locationSuggestions.length > 0 && (
                            <ScrollView style={{ maxHeight: 180, marginBottom: 10 }}>
                                {locationSuggestions.map((loc) => (
                                    <TouchableOpacity key={loc} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }} onPress={() => handleAddLocation(loc)}>
                                        <Text style={{ color: COLORS.text }}>{loc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity
                            style={[styles.modalButton, !locationInput.trim() && styles.modalButtonDisabled]}
                            onPress={() => handleAddLocation()}
                            disabled={!locationInput.trim()}
                        >
                            <Text style={styles.modalButtonText}>Add Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Tag Modal (General Tags) */}
            <Modal
                visible={showTagModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTagModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Tag</Text>
                            <TouchableOpacity onPress={() => setShowTagModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter tags (e.g., car, travel)"
                            placeholderTextColor={COLORS.textLight}
                            value={tagInput}
                            onChangeText={(text) => {
                                if (text.endsWith(',')) {
                                    handleAddTag(text.slice(0, -1), true);
                                } else {
                                    setTagInput(text);
                                }
                            }}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[styles.modalButton, !tagInput.trim() && styles.modalButtonDisabled]}
                            onPress={() => handleAddTag()}
                            disabled={!tagInput.trim()}
                        >
                            <Text style={styles.modalButtonText}>Add Tag</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Feeling Modal */}
            <Modal
                visible={showFeelingModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFeelingModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>How are you feeling?</Text>
                            <TouchableOpacity onPress={() => setShowFeelingModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.feelingsGrid}>
                            {feelings.map((item) => (
                                <TouchableOpacity
                                    key={item.label}
                                    style={styles.feelingItem}
                                    onPress={() => handleSelectFeeling(`${item.emoji} ${item.label}`)}
                                >
                                    <Text style={styles.feelingEmoji}>{item.emoji}</Text>
                                    <Text style={styles.feelingLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Instagram-style Refinement Modal */}
            <Modal
                visible={!!refiningImage}
                transparent
                animationType="fade"
                onRequestClose={() => setRefiningImage(null)}
            >
                <View style={styles.refinementOverlay}>
                    <View style={styles.refinementContainer}>
                        <View style={styles.refinementHeader}>
                            <TouchableOpacity onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setRefiningImage(null);
                            }}>
                                <Text style={styles.refinementCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.refinementTitle}>Edit Photo</Text>
                            <TouchableOpacity onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                handleAddRefinedImage();
                            }}>
                                <Text style={styles.refinementAdd}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.previewWrapper}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={toggleRatio}
                                style={[
                                    styles.ratioPreview,
                                    {
                                        aspectRatio: selectedRatio,
                                        width: SCREEN_WIDTH,
                                    }
                                ]}
                            >
                                <Image
                                    source={{ uri: refiningImage || undefined }}
                                    style={styles.fullImage}
                                    resizeMode="cover"
                                />

                                <View style={styles.gridContainer} pointerEvents="none">
                                    <View style={styles.gridLineV} />
                                    <View style={styles.gridLineV} />
                                    <View style={styles.gridLineH} />
                                    <View style={styles.gridLineH} />
                                </View>

                                <View style={styles.fitToggleBtn} pointerEvents="none">
                                    <Ionicons
                                        name={selectedRatio === 1 ? "resize-outline" : "contract-outline"}
                                        size={22}
                                        color={COLORS.white}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
    },
    uploaderContainer: {
        backgroundColor: COLORS.white,
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    uploaderBox: {
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
    },
    uploaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 15,
        marginBottom: 8,
    },
    uploaderSub: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    selectMediaBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 12,
    },
    selectMediaBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    mediaScroll: {
        marginTop: 20,
    },
    mediaThumbContainer: {
        marginRight: 12,
        position: 'relative',
    },
    mediaThumb: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    removeMediaIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        zIndex: 10,
    },
    inputSection: {
        padding: 20,
    },
    inputWrapper: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    mainInput: {
        fontSize: 16,
        color: COLORS.text,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    metaChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 12,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    metaChipText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },
    metaChipEmoji: {
        fontSize: 14,
    },
    inputActions: {
        flexDirection: 'row',
        gap: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    charCount: {
        position: 'absolute',
        bottom: 12,
        right: 16,
        fontSize: 11,
        color: '#94A3B8',
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
    },
    garageScroll: {
        flexDirection: 'row',
    },
    vehicleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    vehicleChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    vehicleChipText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500',
    },
    vehicleChipTextActive: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    settingsBox: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    settingIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    settingSub: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    postNowBtn: {
        backgroundColor: COLORS.primary,
        marginHorizontal: 20,
        marginTop: 10,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
    },
    postNowBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    postNowBtnText: {
        color: COLORS.white,
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 15,
        padding: 16,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
    },
    modalButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    modalButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    feelingsGrid: {
        maxHeight: Dimensions.get('window').height * 0.5,
    },
    feelingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    feelingEmoji: {
        fontSize: 24,
    },
    feelingLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    navText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    headerPostButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 10,
    },
    headerPostButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    headerPostButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerPostButtonTextDisabled: {
        color: '#9CA3AF',
    },
    fullscreenOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    fullscreenHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 20,
    },
    headerLeftContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    headerBtn: {
        padding: 5,
    },
    fullscreenContent: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    fullscreenMedia: {
        width: '100%',
        height: '100%',
    },
    fullscreenNavOverlay: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refinementOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.98)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refinementContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-start',
    },
    refinementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#000',
    },
    refinementCancel: {
        color: COLORS.white,
        fontSize: 16,
    },
    refinementTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    refinementAdd: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    ratioPreview: {
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    gridContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    gridLineV: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    gridLineH: {
        position: 'absolute',
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        top: '33.33%',
    },
    fitToggleBtn: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// VideoPlayer component for video preview
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
function VideoPlayer({ uri }: { uri: string }) {
    return (
        <Video
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
        />
    );
}
