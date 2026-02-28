import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    Platform,
    ToastAndroid,
    Modal,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Switch,
    PanResponder,
    Animated,
    Keyboard,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
let Compressor: any = null;
try {
    Compressor = require('react-native-compressor').Video;
} catch (e) {
    console.log('react-native-compressor not available (Standard Expo Go)');
}
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES } from '../constants/theme';
import apiClient from '../api/apiClient';
import { CreatePostInput, MediaItem, CommunityPost } from '../types/Community';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

type CreatePostScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePost'>;

interface CreatePostScreenProps {
    navigation: CreatePostScreenNavigationProp;
}

export default function CreatePostScreen({ navigation }: CreatePostScreenProps) {
    const { user } = useAuth();

    const scrollY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({ scrollY } as any);
    }, []);
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
    const [keyboardHeight, setKeyboardHeight] = useState(new Animated.Value(0));

    // Listen to keyboard events to adjust modal padding manually on Android
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                Animated.timing(keyboardHeight, {
                    toValue: e.endCoordinates.height,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
            }
        );
        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                Animated.timing(keyboardHeight, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);
    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
    const { vehicles } = useApp();
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

    // New states for the redesigned screen
    const [isPublic, setIsPublic] = useState(true);
    const [allowComments, setAllowComments] = useState(true);
    const [selectedGarageVehicle, setSelectedGarageVehicle] = useState<string | null>(null);

    // Refinement states
    const [pendingMediaItems, setPendingMediaItems] = useState<any[]>([]);
    const [currentRefiningIndex, setCurrentRefiningIndex] = useState(0);
    const [refiningMedia, setRefiningMedia] = useState<any | null>(null);
    const [originalRatio, setOriginalRatio] = useState<number>(1);
    const [selectedRatio, setSelectedRatio] = useState<number>(1);

    // Trimming states
    const [trimStart, setTrimStart] = useState<number>(0);
    const [trimEnd, setTrimEnd] = useState<number>(0);
    const [videoDuration, setVideoDuration] = useState<number>(0);

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
            if (Platform.OS === 'android') {
                ToastAndroid.show('Permission needed: Please grant access to your photo library', ToastAndroid.SHORT);
            }
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            selectionLimit: 10 - mediaItems.length,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const validAssets = [];
            for (const asset of result.assets) {
                // Validation: Size limit (500MB for long videos)
                try {
                    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                    if (fileInfo.exists && fileInfo.size && fileInfo.size > 500 * 1024 * 1024) {
                        ToastAndroid.show(`File too large: ${asset.fileName || 'Media'} exceeds 500MB`, ToastAndroid.SHORT);
                        continue;
                    }
                } catch (e) {
                    console.log('Error checking file size:', e);
                }

                // Video Duration Validation (30 minutes)
                if (asset.type === 'video' && asset.duration && asset.duration > 30 * 60 * 1000) {
                    // Automatically trim video to 30 minutes
                    (asset as any).trimStart = 0;
                    (asset as any).trimEnd = 30 * 60 * 1000;
                    asset.duration = 30 * 60 * 1000;
                    ToastAndroid.show('Video is longer than 30 minutes. It will be trimmed to 30 minutes.', ToastAndroid.SHORT);
                }
                validAssets.push(asset);
            }

            if (validAssets.length > 0) {
                setPendingMediaItems(validAssets);
                setCurrentRefiningIndex(0);
                prepareForRefinement(validAssets[0]);
            }
        }
    };

    const prepareForRefinement = (asset: any) => {
        if (!asset) return;

        // Safety check for dimensions
        const width = asset.width || 1080;
        const height = asset.height || 1080;
        const ratio = width / height;

        setOriginalRatio(ratio);
        setRefiningMedia(asset);

        // Initialize trimming for videos
        if (asset.type === 'video') {
            const duration = asset.duration || 0;
            setVideoDuration(duration);
            setTrimStart(0);
            setTrimEnd(duration);
        }

        // Default ratios based on type
        if (asset.type === 'video') {
            // Use 16:9 for landscape, 4:5 for portrait/square
            setSelectedRatio(ratio > 1.25 ? 1.77 : 0.8);
        } else {
            setSelectedRatio(1); // Default to Square for image
        }
    };

    const toggleRatio = () => {
        const ratios = refiningMedia?.type === 'video'
            ? [0.8, 1, 1.77] // 4:5, 1:1, 16:9
            : [0.8, 1, originalRatio]; // 4:5, 1:1, Original

        const currentIndex = ratios.indexOf(selectedRatio);
        const nextIndex = (currentIndex + 1) % ratios.length;
        setSelectedRatio(ratios[nextIndex]);
        Haptics.selectionAsync();
    };

    const handleAddRefinedMedia = () => {
        if (refiningMedia) {
            const newItem: MediaItem = {
                id: `media_${Date.now()}_${currentRefiningIndex}`,
                type: refiningMedia.type === 'video' ? 'video' : 'image',
                uri: refiningMedia.uri,
                aspectRatio: selectedRatio || 1,
                // @ts-ignore - Adding custom fields for trimming
                trimStart: refiningMedia.type === 'video' ? trimStart : undefined,
                trimEnd: refiningMedia.type === 'video' ? trimEnd : undefined,
            };

            if (currentMediaEditingId) {
                // Edit existing
                setMediaItems(prev => prev.map(item =>
                    item.id === currentMediaEditingId ? newItem : item
                ));
            } else {
                // Add new
                setMediaItems(prev => [...prev, newItem]);
            }

            if (currentRefiningIndex < pendingMediaItems.length - 1) {
                const nextIndex = currentRefiningIndex + 1;
                setCurrentRefiningIndex(nextIndex);
                prepareForRefinement(pendingMediaItems[nextIndex]);
            } else {
                setRefiningMedia(null);
                setPendingMediaItems([]);
                setCurrentMediaEditingId(null);
            }
        }
    };

    const [currentMediaEditingId, setCurrentMediaEditingId] = useState<string | number | null>(null);

    const handleEditSelectedMedia = (item: MediaItem) => {
        // Prepare refinement for an already selected item
        const asset = {
            uri: item.uri,
            type: item.type,
            width: item.aspectRatio > 1 ? 1920 : 1080,
            height: item.aspectRatio > 1 ? 1080 : 1350,
            duration: (item as any).duration || 0, // Fallback if duration lost
        };

        setCurrentMediaEditingId(item.id);
        prepareForRefinement(asset);
        // Find if it was a video, preserve original duration if possible
        if (item.type === 'video') {
            setTrimStart((item as any).trimStart || 0);
            setTrimEnd((item as any).trimEnd || (item as any).duration || 0);
        }
        setSelectedRatio(item.aspectRatio);
    };

    const handleAddAllRemaining = () => {
        const remaining = pendingMediaItems.slice(currentRefiningIndex);
        const newItems = remaining.map((asset, index) => {
            const width = asset.width || 1080;
            const height = asset.height || 1080;
            const ratio = asset.type === 'video'
                ? (width / height > 1.25 ? 1.77 : 0.8)
                : 1;

            return {
                id: `media_${Date.now()}_${currentRefiningIndex + index}`,
                type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
                uri: asset.uri,
                aspectRatio: ratio,
            } as MediaItem;
        });

        setMediaItems(prev => [...prev, ...newItems]);
        setRefiningMedia(null);
        setPendingMediaItems([]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // videoRef is now handled by the players directly

    const trimStartRef = React.useRef(trimStart);
    const trimEndRef = React.useRef(trimEnd);
    const videoDurationRef = React.useRef(videoDuration);

    // Keep refs in sync with state so PanResponders read latest values
    React.useEffect(() => { trimStartRef.current = trimStart; }, [trimStart]);
    React.useEffect(() => { trimEndRef.current = trimEnd; }, [trimEnd]);
    React.useEffect(() => { videoDurationRef.current = videoDuration; }, [videoDuration]);

    const containerWidthRef = React.useRef(SCREEN_WIDTH - 40);

    const panResponderStart = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const cw = containerWidthRef.current;
                const dur = videoDurationRef.current;
                const newPos = Math.max(0, Math.min(trimEndRef.current - 1000, ((gestureState.moveX - 20) / cw) * dur));
                setTrimStart(newPos);
                // Trimming positioning will be handled via the Player inside the Refinement modal
            },
        })
    ).current;

    const panResponderEnd = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const cw = containerWidthRef.current;
                const dur = videoDurationRef.current;
                const newPos = Math.max(trimStartRef.current + 1000, Math.min(dur, ((gestureState.moveX - 20) / cw) * dur));
                setTrimEnd(newPos);
                // Trimming positioning will be handled via the Player inside the Refinement modal
            },
        })
    ).current;

    const renderVideoTrimmer = () => {
        if (!refiningMedia || refiningMedia.type !== 'video' || videoDuration === 0) return null;

        const containerWidth = SCREEN_WIDTH - 40;
        containerWidthRef.current = containerWidth;
        const leftPos = (trimStart / videoDuration) * containerWidth;
        const rightPos = (trimEnd / videoDuration) * containerWidth;

        return (
            <View style={styles.trimmerContainer}>
                <View style={[styles.trimmerTrack, { width: containerWidth }]}>
                    <View style={[styles.trimmerHighlight, { left: leftPos, width: rightPos - leftPos }]} />
                    <View
                        {...panResponderStart.panHandlers}
                        style={[styles.trimmerHandle, { left: leftPos - 10 }]}
                    >
                        <View style={styles.handleBar} />
                    </View>
                    <View
                        {...panResponderEnd.panHandlers}
                        style={[styles.trimmerHandle, { left: rightPos - 10 }]}
                    >
                        <View style={styles.handleBar} />
                    </View>
                </View>
                <View style={styles.trimmerLabels}>
                    <Text style={styles.trimmerTimeText}>{formatTime(trimStart)}</Text>
                    <Text style={styles.trimmerTimeText}>Selected: {formatTime(trimEnd - trimStart)}</Text>
                    <Text style={styles.trimmerTimeText}>{formatTime(trimEnd)}</Text>
                </View>
            </View>
        );
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const removeMedia = (id: string | number) => {
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
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please add some content or media to your post', ToastAndroid.SHORT);
            }
            return;
        }

        if (!user) return;
        setIsPosting(true);

        try {
            const payload: CreatePostInput = {
                userId: Number(user.id),
                content: content.trim(),
                location: location.trim() || undefined,
                feeling: feeling.trim() || undefined,
                allowComments: allowComments,
                isPublic: isPublic,
                vehicleId: selectedGarageVehicle ? Number(selectedGarageVehicle) : undefined,
                tags: tags.join(','),
            };

            // Step 1: Create the post
            const postResponse = await apiClient.post('/post', {
                ...payload,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            const createdPost = postResponse.data;
            console.log('Post created successfully:', createdPost);

            // Step 2: Upload media if any
            if (mediaItems && mediaItems.length > 0) {
                for (const media of mediaItems) {
                    const formData = new FormData();
                    let finalUri = media.uri;

                    // Compression and Trimming Step for Videos
                    if (media.type === 'video') {
                        try {
                            console.log(`Processing video: ${media.uri}`);

                            // Perform compression and trimming
                            const compressedUri = await Compressor.compress(
                                media.uri as string,
                                {
                                    compressionMethod: 'auto',
                                    // @ts-ignore - Some versions support these in options
                                    startTime: media.trimStart ? media.trimStart / 1000 : 0,
                                    // @ts-ignore - Some versions support these in options
                                    endTime: media.trimEnd ? media.trimEnd / 1000 : undefined,
                                }
                            );

                            finalUri = compressedUri;
                            console.log(`Video processed. New URI: ${finalUri}`);
                        } catch (err) {
                            console.log('Video compression failed, using original:', err);
                            finalUri = media.uri;
                        }
                    }

                    const mediaData = JSON.stringify({
                        postId: createdPost.id,
                        type: media.type.toUpperCase(),
                        aspectRatio: media.aspectRatio || 1
                    });

                    const uri = finalUri || media.uri || '';
                    if (!uri) {
                        console.log('Skipping media item with no URI');
                        continue;
                    }

                    const name = uri.split('/').pop() || (media.type === 'video' ? 'video.mp4' : 'image.jpg');
                    const fileType = media.type === 'video' ? 'video/mp4' : 'image/jpeg';

                    console.log('Uploading media payload:', mediaData);
                    console.log('Media file details:', {
                        uri: media.uri,
                        name,
                        type: fileType
                    });

                    formData.append('data', mediaData);

                    formData.append('file', {
                        uri,
                        name,
                        type: fileType,
                    } as any);

                    await apiClient.post('/post-media', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            }

            // Show success toast
            if (Platform.OS === 'android') {
                ToastAndroid.show('Post shared successfully!', ToastAndroid.SHORT);
            }

            // Fetch the final post with media is no longer strictly needed if we navigate away, 
            // but it's good for ensuring completeness.
            const finalPostResponse = await apiClient.get(`/post/${createdPost.id}`);

            // Navigate back to community feed instead of detail screen
            navigation.navigate('MainTabs', { screen: 'Community' });
        } catch (error) {
            console.error('Error creating post in screen:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to create post. Please try again.', ToastAndroid.SHORT);
            }
        } finally {
            setIsPosting(false);
        }
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
                        <View key={item.id.toString()} style={styles.mediaThumbContainer}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleEditSelectedMedia(item)}
                            >
                                <Image source={{ uri: item.uri }} style={styles.mediaThumb} />
                                {item.type === 'video' && (
                                    <View style={styles.videoIconOverlay}>
                                        <Ionicons name="play" size={14} color={COLORS.white} />
                                    </View>
                                )}
                            </TouchableOpacity>
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
        <View style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 80}
            >
                <View style={styles.container}>
                    <Animated.ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                    >
                        {/* Media Section */}
                        {renderMediaUploader()}

                        {/* Input Area */}
                        <View style={styles.inputSection}>
                            <View style={styles.requiredLabelRow}>
                                <Text style={styles.requiredLabel}>Caption</Text>
                                <Text style={styles.requiredStar}> * </Text>
                            </View>
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
                    </Animated.ScrollView>
                </View>
            </KeyboardAvoidingView>

            {/* Existing Modals for Location, Feeling, Tag */}
            {/* Location Modal */}
            <Modal
                visible={showLocationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                    <Animated.View style={[styles.modalContainer, { marginBottom: keyboardHeight }]}>
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
                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            {/* Tag Modal (General Tags) */}
            <Modal
                visible={showTagModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTagModal(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                    <Animated.View style={[styles.modalContainer, { marginBottom: keyboardHeight }]}>
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
                    </Animated.View>
                </TouchableOpacity>
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
                visible={!!refiningMedia}
                transparent
                animationType="fade"
                onRequestClose={() => setRefiningMedia(null)}
            >
                <View style={styles.refinementOverlay}>
                    <View style={styles.refinementContainer}>
                        <View style={styles.refinementHeader}>
                            <TouchableOpacity onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setRefiningMedia(null);
                                setPendingMediaItems([]);
                            }}>
                                <Text style={styles.refinementCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.refinementTitle}>
                                Edit {pendingMediaItems.length > 1 ? `(${currentRefiningIndex + 1}/${pendingMediaItems.length})` : 'Media'}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                {pendingMediaItems.length > 1 && (
                                    <TouchableOpacity onPress={handleAddAllRemaining}>
                                        <Text style={styles.refinementCancel}>Done</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    handleAddRefinedMedia();
                                }}>
                                    <Text style={styles.refinementAdd}>
                                        {currentRefiningIndex < pendingMediaItems.length - 1 ? 'Next' : 'Add'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ flex: 1, justifyContent: 'center', width: '100%', marginBottom: 60 }}>
                            {renderVideoTrimmer()}

                            <View style={styles.previewWrapper}>
                                {refiningMedia?.type === 'video' ? (
                                    <RefiningVideoPlayer
                                        uri={refiningMedia.uri}
                                        selectedRatio={selectedRatio}
                                        trimStart={trimStart}
                                        trimEnd={trimEnd}
                                    />
                                ) : (
                                    <View
                                        style={[
                                            styles.ratioPreview,
                                            {
                                                aspectRatio: selectedRatio || 1,
                                                width: SCREEN_WIDTH,
                                                backgroundColor: '#000'
                                            }
                                        ]}
                                    >
                                        <Image
                                            source={{ uri: refiningMedia?.uri }}
                                            style={styles.fullImage}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.gridContainer} pointerEvents="none">
                                            <View style={styles.gridLineV} />
                                            <View style={styles.gridLineV} />
                                            <View style={styles.gridLineH} />
                                            <View style={[styles.gridLineH, { top: '66.66%' }]} />
                                        </View>
                                    </View>
                                )}

                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={toggleRatio}
                                    style={styles.fitToggleOverlay}
                                >
                                    <View style={styles.ratioLabelContainer}>
                                        <Text style={styles.ratioLabelText}>
                                            {selectedRatio === 1 ? '1:1' : selectedRatio === 0.8 ? '4:5' : selectedRatio > 1.7 ? '16:9' : 'Original'}
                                        </Text>
                                    </View>

                                    <View style={styles.fitToggleBtn} pointerEvents="none">
                                        <Ionicons
                                            name="resize-outline"
                                            size={22}
                                            color={COLORS.white}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>
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
        width: 100,
        height: 100,
        marginRight: 12,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
    },
    mediaThumb: {
        width: 100,
        height: 100,
    },
    videoIconOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
    inputWrapperRequired: {
        borderColor: '#EF4444',
        borderWidth: 2,
    },
    requiredLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        marginLeft: 4,
    },
    requiredLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    requiredStar: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
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
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width, // Default to square container
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
    },
    fitToggleOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
    ratioLabelContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ratioLabelText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    trimmerContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#000',
    },
    trimmerTrack: {
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    trimmerHighlight: {
        position: 'absolute',
        height: '100%',
        backgroundColor: COLORS.primary + '40',
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: COLORS.primary,
    },
    trimmerHandle: {
        position: 'absolute',
        width: 20,
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    handleBar: {
        width: 2,
        height: 15,
        backgroundColor: '#fff',
        borderRadius: 1,
    },
    trimmerLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    trimmerTimeText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
    },
});

// VideoPlayer component for video preview (Internal helper)
function VideoPlayer({ uri }: { uri: string }) {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.play();
    });
    return (
        <VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            nativeControls
        />
    );
}

function RefiningVideoPlayer({ uri, selectedRatio, trimStart, trimEnd }: { uri: string, selectedRatio: number, trimStart: number, trimEnd: number }) {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (player.currentTime * 1000 >= trimEnd) {
                player.currentTime = trimStart / 1000;
            }
        }, 100);
        return () => clearInterval(interval);
    }, [player, trimStart, trimEnd]);

    return (
        <View
            style={[
                styles.ratioPreview,
                {
                    aspectRatio: selectedRatio || 1,
                    width: Dimensions.get('window').width,
                    backgroundColor: '#000'
                }
            ]}
        >
            <VideoView
                player={player}
                style={styles.fullImage}
                contentFit="cover"
            />
            <View style={styles.gridContainer} pointerEvents="none">
                <View style={styles.gridLineV} />
                <View style={styles.gridLineV} />
                <View style={styles.gridLineH} />
                <View style={[styles.gridLineH, { top: '66.66%' }]} />
            </View>
        </View>
    );
}
