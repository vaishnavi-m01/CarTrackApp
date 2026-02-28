import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
    ToastAndroid,
    TextInput,
    PanResponder,
    Animated,
    Dimensions,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/apiClient';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useApp } from '../context/AppContext';

type AddStoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddStory'>;

interface AddStoryScreenProps {
    navigation: AddStoryScreenNavigationProp;
}

export default function AddStoryScreen({ navigation }: AddStoryScreenProps) {
    const insets = useSafeAreaInsets();
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [caption, setCaption] = useState('');
    const [isAddingCaption, setIsAddingCaption] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const { user } = useAuth();

    const scrollY = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        navigation.setParams({ scrollY } as any);
    }, []);

    // Caption positioning
    // Initial position: Bottom Left (approx -120, 250 from center)
    const pan = useRef(new Animated.ValueXY({ x: -120, y: 250 })).current;
    const [captionPosition, setCaptionPosition] = useState<{ x: number, y: number } | undefined>({ x: -120, y: 250 });
    const [captionSize, setCaptionSize] = useState({ width: 0, height: 0 });
    // Font Customization State
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState('System');
    const [textColor, setTextColor] = useState(COLORS.white);
    const [isDragging, setIsDragging] = useState(false);
    const [showDeleteZone, setShowDeleteZone] = useState(false);
    const trashScale = useRef(new Animated.Value(1)).current;

    const FONT_FAMILIES = [
        { name: 'Classic', fontFamily: 'System', fontWeight: 'bold' },
        { name: 'Serif', fontFamily: 'serif', fontWeight: 'normal' },
        { name: 'Mono', fontFamily: 'monospace', fontWeight: 'normal' },
        { name: 'Strong', fontFamily: 'System', fontWeight: '900' },
        { name: 'Light', fontFamily: 'System', fontWeight: '300' },
        { name: 'Marker', fontFamily: 'serif', fontWeight: 'bold' },
        { name: 'Italic', fontFamily: 'serif', fontStyle: 'italic' },
        { name: 'Modern', fontFamily: 'sans-serif-thin', fontWeight: 'bold' },
        { name: 'Elegant', fontFamily: 'sans-serif-light', fontStyle: 'italic' },
        { name: 'Outline', fontFamily: 'System', fontWeight: '700' },
    ];

    const COLOR_PALETTE = [
        '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55',
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
        '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'
    ];
    const screenDimensions = Dimensions.get('window');

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false, // Let child handle clicks first
            onMoveShouldSetPanResponder: (e, gestureState) => {
                // Only capture if moved significantly (drag)
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                setIsDragging(true);
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (e, gestureState) => {
                let dx = gestureState.dx;
                let dy = gestureState.dy;

                const currentOffsetX = (pan.x as any)._offset;
                const currentOffsetY = (pan.y as any)._offset;
                const targetX = currentOffsetX + dx;
                const targetY = currentOffsetY + dy;

                // Check for delete zone (bottom center)
                const deleteZoneY = screenDimensions.height / 2 - 100;
                const isInDeleteZone = Math.abs(targetX) < 64 && targetY > deleteZoneY - 64;

                if (isInDeleteZone !== showDeleteZone) {
                    setShowDeleteZone(isInDeleteZone);
                    Animated.spring(trashScale, {
                        toValue: isInDeleteZone ? 1.5 : 1,
                        useNativeDriver: true,
                    }).start();
                }

                const safeH = screenDimensions.height / 2 - 120;
                const safeW = screenDimensions.width / 2 - 20;

                if (targetX > safeW) dx = safeW - currentOffsetX;
                if (targetX < -safeW) dx = -safeW - currentOffsetX;
                if (targetY < -safeH) dy = -safeH - currentOffsetY;

                // Allow dragging past bottom if moving towards delete zone
                if (targetY > safeH && !isInDeleteZone && targetY < deleteZoneY - 100) dy = safeH - currentOffsetY;

                pan.setValue({ x: dx, y: dy });
            },
            onPanResponderRelease: (e, gestureState) => {
                setIsDragging(false);
                const currentOffsetX = (pan.x as any)._offset;
                const currentOffsetY = (pan.y as any)._offset;
                const targetX = currentOffsetX + gestureState.dx;
                const targetY = currentOffsetY + gestureState.dy;

                const deleteZoneY = screenDimensions.height / 2 - 100;
                const isInDeleteZone = Math.abs(targetX) < 64 && targetY > deleteZoneY - 64;

                if (isInDeleteZone) {
                    setCaption('');
                    pan.setValue({ x: 0, y: 0 });
                    setCaptionPosition(undefined);
                } else {
                    pan.flattenOffset();
                    setCaptionPosition({ x: (pan.x as any)._value, y: (pan.y as any)._value });
                }
                setShowDeleteZone(false);
                trashScale.setValue(1);
            },
        })
    ).current;

    const pickMedia = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant access to your photo library');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false, // No forced crop
            quality: 0.9,
            videoMaxDuration: 60,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            setSelectedMedia(result.assets[0].uri);
            setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
        }
    };

    const handleShareStory = async () => {
        if (!selectedMedia || !user) {
            Alert.alert('Error', 'No media selected or user not logged in');
            return;
        }

        setIsPosting(true);

        try {
            const formData = new FormData();
            const storyData = JSON.stringify({
                userId: user.id,
                mediaType: mediaType.toUpperCase(),
                caption: caption.trim(),
                captionMetadata: {
                    captionPosition: captionPosition,
                    captionStyle: {
                        fontSize,
                        fontFamily,
                        color: textColor,
                    }
                }
            });

            formData.append('data', storyData);

            const name = selectedMedia.split('/').pop() || 'story.jpg';
            const type = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            formData.append('file', {
                uri: selectedMedia,
                name,
                type,
            } as any);

            await apiClient.post('/story', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (Platform.OS === 'android') {
                ToastAndroid.show('Story shared successfully!', ToastAndroid.SHORT);
            } else {
                Alert.alert('Success', 'Story shared successfully!');
            }

            navigation.goBack();
        } catch (error) {
            console.error('Error adding story in screen:', error);
            Alert.alert('Failed to post story', 'Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <View style={styles.container}>
            {selectedMedia ? (
                <View style={styles.previewContainer}>
                    {/* Blurred background — full screen, cover, same image */}
                    <Image
                        source={{ uri: selectedMedia }}
                        style={styles.blurredBackground}
                        resizeMode="cover"
                        blurRadius={25}
                    />
                    {/* Dark overlay on top of blur for contrast */}
                    <View style={styles.blurOverlay} />

                    {/* Main image — centered, no crop, no distortion */}
                    <Image
                        source={{ uri: selectedMedia }}
                        style={styles.mainImage}
                        resizeMode="contain"
                    />

                    {/* Top Gradient for visibility */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                        style={styles.topGradient}
                        pointerEvents="none"
                    />

                    {/* Top Controls */}
                    <View style={styles.topControls}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="close" size={28} color={COLORS.white} />
                        </TouchableOpacity>

                        <View style={styles.topRightControls}>
                            <TouchableOpacity style={styles.toolBtn} onPress={() => setIsAddingCaption(true)}>
                                <Ionicons name="text" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolBtn} onPress={pickMedia}>
                                <Ionicons name="images" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>


                    {/* Caption Display (Draggable) */}
                    {!isAddingCaption && (
                        <View style={styles.captionBadge} pointerEvents="box-none">
                            <Animated.View
                                {...panResponder.panHandlers}
                                style={[
                                    {
                                        transform: [{ translateX: pan.x }, { translateY: pan.y }],
                                        position: 'absolute',
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.captionTextDisplay,
                                        !caption && { paddingHorizontal: 20 }
                                    ]}
                                    onPress={() => setIsAddingCaption(true)}
                                    activeOpacity={0.8}
                                    onLayout={(e) => {
                                        const { width, height } = e.nativeEvent.layout;
                                        setCaptionSize({ width, height });
                                    }}
                                >
                                    {caption ? (
                                        <View style={[
                                            styles.captionTextDisplay,
                                            { backgroundColor: 'transparent' }
                                        ]}>
                                            <Text style={[
                                                styles.captionText,
                                                {
                                                    fontSize: fontSize,
                                                    color: textColor,
                                                    fontFamily: FONT_FAMILIES.find(f => f.name === fontFamily)?.fontFamily || 'System',
                                                    fontWeight: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontWeight as any) || 'normal',
                                                    fontStyle: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontStyle as any) || 'normal',
                                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                                    textShadowOffset: { width: 1, height: 1 },
                                                    textShadowRadius: 3,
                                                }
                                            ]}>{caption}</Text>
                                        </View>
                                    ) : (
                                        <View style={[styles.captionTextDisplay, { backgroundColor: 'transparent', paddingHorizontal: 20 }]}>
                                            <Text style={[styles.captionText, { fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }]}>Add Caption</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}

                    {/* Trash Icon for Drag to Delete */}
                    {isDragging && (
                        <Animated.View style={[
                            styles.trashContainer,
                            { transform: [{ scale: trashScale }] }
                        ]}>
                            <View style={[
                                styles.trashCircle,
                                showDeleteZone && { backgroundColor: COLORS.danger || '#FF3B30', borderColor: COLORS.white }
                            ]}>
                                <Ionicons name="trash" size={30} color={COLORS.white} />
                            </View>
                        </Animated.View>
                    )}

                    {/* Bottom Gradient for visibility */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.bottomGradient}
                        pointerEvents="none"
                    />

                    {/* Bottom Controls - Share Button Right */}
                    <View style={[
                        styles.bottomControls,
                        { bottom: Math.max(insets.bottom, 20) }
                    ]}>
                        <View />
                        <TouchableOpacity
                            style={styles.shareToStoryBtn}
                            onPress={handleShareStory}
                            disabled={isPosting}
                        >
                            <Text style={styles.shareBtnText}>
                                {isPosting ? 'Sharing...' : 'Share Story'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>

                    {/* Full Screen Caption Input Overlay */}
                    {isAddingCaption && (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.captionOverlay}
                        >
                            <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                {/* Done Button Top Right */}
                                <TouchableOpacity
                                    style={{ position: 'absolute', right: 20, top: 40, zIndex: 60 }}
                                    onPress={() => setIsAddingCaption(false)}
                                >
                                    <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 18 }}>Done</Text>
                                </TouchableOpacity>
                                {/* Caption Input */}
                                <TextInput
                                    style={[
                                        styles.captionInput,
                                        {
                                            fontSize: fontSize,
                                            color: textColor,
                                            fontFamily: FONT_FAMILIES.find(f => f.name === fontFamily)?.fontFamily || 'System',
                                            fontWeight: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontWeight as any) || 'normal',
                                            fontStyle: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontStyle as any) || 'normal',
                                        }
                                    ]}
                                    placeholder="Type something..."
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={caption}
                                    onChangeText={setCaption}
                                    multiline
                                    autoFocus
                                    blurOnSubmit={false}
                                />

                                {/* Bottom Customization Controls */}
                                <View style={styles.editBottomControls}>
                                    {/* Color Picker */}
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.colorPickerScroll}
                                        contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
                                    >
                                        {COLOR_PALETTE.map((color) => (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => setTextColor(color)}
                                                style={[
                                                    styles.colorCircle,
                                                    { backgroundColor: color },
                                                    textColor === color && { borderColor: COLORS.white, borderWidth: 3 }
                                                ]}
                                            />
                                        ))}
                                    </ScrollView>

                                    {/* Font Family Picker */}
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.fontPickerScroll}
                                        contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}
                                    >
                                        {FONT_FAMILIES.map((font) => (
                                            <TouchableOpacity
                                                key={font.name}
                                                onPress={() => setFontFamily(font.name)}
                                                style={[
                                                    styles.fontTab,
                                                    fontFamily === font.name && { backgroundColor: COLORS.white }
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.fontTabText,
                                                    {
                                                        fontFamily: font.fontFamily,
                                                        fontWeight: font.fontWeight as any,
                                                        fontStyle: font.fontStyle as any,
                                                        color: fontFamily === font.name ? COLORS.black : COLORS.white
                                                    }
                                                ]}>
                                                    {font.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Font Size Slider / Control */}
                                <View style={styles.fontSizeControl}>
                                    <TouchableOpacity
                                        onPress={() => setFontSize(Math.min(fontSize + 2, 80))}
                                        style={styles.sizeBtn}
                                    >
                                        <Ionicons name="add" size={24} color={COLORS.white} />
                                    </TouchableOpacity>
                                    <View style={styles.sizeDivider} />
                                    <TouchableOpacity
                                        onPress={() => setFontSize(Math.max(fontSize - 2, 10))}
                                        style={styles.sizeBtn}
                                    >
                                        <Ionicons name="remove" size={24} color={COLORS.white} />
                                    </TouchableOpacity>
                                    <Text style={styles.sizeLabel}>Size</Text>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    )}
                </View>
            ) : (
                <TouchableOpacity style={styles.selectImageContainer} onPress={pickMedia}>
                    <Ionicons name="images-outline" size={80} color={COLORS.primary} />
                    <Text style={styles.selectImageText}>Tap to select image or video</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.black,
    },
    selectImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    selectImageText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    blurredBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    mainImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    // Top Controls
    topControls: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 50,
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    topRightControls: {
        flexDirection: 'row',
        gap: 15,
    },
    toolBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },

    // Bottom Controls
    bottomControls: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between', // Share left, maybe something right?
        alignItems: 'flex-end',
        zIndex: 20,
    },
    shareToStoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        gap: 8,
        // Shadow for better visibility on white backgrounds
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    shareBtnText: {
        color: COLORS.black,
        fontSize: 14,
        fontWeight: 'bold',
    },
    userAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
    },

    // Caption Input
    captionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    captionInput: {
        color: COLORS.white,
        fontSize: 24,
        padding: 20,
        textAlign: 'center',
        width: '100%',
        fontWeight: '600',
    },
    captionBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 45, // Above gradients (40, 15) but below top controls (50)
        justifyContent: 'center',
        alignItems: 'center',
    },
    captionTextDisplay: {
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        maxWidth: Dimensions.get('window').width * 0.8,
    },
    captionText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: 'center',
    },
    // New Styles
    trashContainer: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        zIndex: 100,
    },
    trashCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    editBottomControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        gap: 20,
    },
    colorPickerScroll: {
        flexGrow: 0,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    fontPickerScroll: {
        flexGrow: 0,
    },
    fontTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    fontTabText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    fontSizeControl: {
        position: 'absolute',
        left: 20,
        top: '30%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
        padding: 5,
        alignItems: 'center',
        gap: 10,
    },
    sizeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sizeDivider: {
        width: 20,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    sizeLabel: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
        zIndex: 40,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        zIndex: 15,
    },
});
