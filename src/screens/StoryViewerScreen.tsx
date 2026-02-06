import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    TextInput,
    PanResponder,
    Animated,
    StatusBar,
    Alert,
    ScrollView
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { StoryGroup } from '../types/Story';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

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

type StoryViewerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'StoryViewer'>;
type StoryViewerScreenRouteProp = RouteProp<RootStackParamList, 'StoryViewer'>;

interface StoryViewerScreenProps {
    navigation: StoryViewerScreenNavigationProp;
    route: StoryViewerScreenRouteProp;
}

export default function StoryViewerScreen({ navigation, route }: StoryViewerScreenProps) {
    const { storyGroup, allGroups, startIndex } = route.params;
    const [isEditing, setIsEditing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [editCaption, setEditCaption] = useState('');
    const { markStoryAsViewed, deleteStory, editStory, getStoryGroups } = useApp();
    const { user } = useAuth();
    const [currentGroupIndex, setCurrentGroupIndex] = useState(startIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const progressAnims = useRef<Animated.Value[]>([]).current;

    const liveGroups = getStoryGroups();
    const currentGroup = liveGroups[currentGroupIndex] || allGroups[currentGroupIndex];
    const currentStory = currentGroup?.stories[currentStoryIndex];

    // Caption editing states (rich)
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState('Classic');
    const [textColor, setTextColor] = useState(COLORS.white);
    const pan = useRef(new Animated.ValueXY({ x: -120, y: 250 })).current;
    const [captionPosition, setCaptionPosition] = useState<{ x: number, y: number } | undefined>({ x: -120, y: 250 });
    const [isDragging, setIsDragging] = useState(false);
    const [showDeleteZone, setShowDeleteZone] = useState(false);
    const trashScale = useRef(new Animated.Value(1)).current;

    // Initialize progress animations
    useEffect(() => {
        if (!currentGroup) return;
        progressAnims.length = 0;
        currentGroup.stories.forEach(() => {
            progressAnims.push(new Animated.Value(0));
        });
    }, [currentGroupIndex]);

    // Auto-advance story
    useEffect(() => {
        if (isEditing || isPaused) return;

        // Mark as viewed
        markStoryAsViewed(currentStory.id);

        // Animate progress bar
        const animation = Animated.timing(progressAnims[currentStoryIndex], {
            toValue: 1,
            duration: STORY_DURATION * (1 - (progressAnims[currentStoryIndex] as any)._value),
            useNativeDriver: false,
        });

        animation.start(({ finished }) => {
            if (finished) {
                handleNext();
            }
        });

        return () => {
            animation.stop();
        };
    }, [currentStoryIndex, currentGroupIndex, isEditing, isPaused]);

    const handleNext = () => {
        // Check if there are more stories in current group
        if (currentStoryIndex < currentGroup.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
        } else if (currentGroupIndex < allGroups.length - 1) {
            // Move to next group
            setCurrentGroupIndex(currentGroupIndex + 1);
            setCurrentStoryIndex(0);
        } else {
            // No more stories, close viewer
            navigation.goBack();
        }
    };

    const handlePrevious = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        } else if (currentGroupIndex > 0) {
            // Move to previous group
            setCurrentGroupIndex(currentGroupIndex - 1);
            const prevGroup = allGroups[currentGroupIndex - 1];
            setCurrentStoryIndex(prevGroup.stories.length - 1);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (e, gestureState) => {
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
                const deleteZoneY = height / 2 - 100;
                const isInDeleteZone = Math.abs(targetX) < 64 && targetY > deleteZoneY - 64;

                if (isInDeleteZone !== showDeleteZone) {
                    setShowDeleteZone(isInDeleteZone);
                    Animated.spring(trashScale, {
                        toValue: isInDeleteZone ? 1.5 : 1,
                        useNativeDriver: true,
                    }).start();
                }

                const safeH = height / 2 - 120;
                const safeW = width / 2 - 20;

                if (targetX > safeW) dx = safeW - currentOffsetX;
                if (targetX < -safeW) dx = -safeW - currentOffsetX;
                if (targetY < -safeH) dy = -safeH - currentOffsetY;

                if (targetY > safeH && !isInDeleteZone && targetY < deleteZoneY - 100) dy = safeH - currentOffsetY;

                pan.setValue({ x: dx, y: dy });
            },
            onPanResponderRelease: (e, gestureState) => {
                setIsDragging(false);
                const currentOffsetX = (pan.x as any)._offset;
                const currentOffsetY = (pan.y as any)._offset;
                const targetX = currentOffsetX + gestureState.dx;
                const targetY = currentOffsetY + gestureState.dy;

                const deleteZoneY = height / 2 - 100;
                const isInDeleteZone = Math.abs(targetX) < 64 && targetY > deleteZoneY - 64;

                if (isInDeleteZone) {
                    setEditCaption('');
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

    const handleEdit = () => {
        setIsEditing(true);
        setIsPaused(true);
        setEditCaption(currentStory.caption || '');
        setFontSize(currentStory.captionStyle?.fontSize || 24);
        setFontFamily(currentStory.captionStyle?.fontFamily || 'Classic');
        setTextColor(currentStory.captionStyle?.color || COLORS.white);

        const initialPos = currentStory.captionPosition || { x: -120, y: 250 };
        pan.setValue(initialPos);
        setCaptionPosition(initialPos);
    };

    const saveEdit = () => {
        editStory(currentStory.id, {
            caption: editCaption.trim(),
            captionPosition: captionPosition,
            captionStyle: {
                fontSize,
                fontFamily,
                color: textColor,
            }
        });
        setIsEditing(false);
        setIsPaused(false);
    };

    const handleDelete = () => {
        setIsPaused(true);
        Alert.alert(
            'Delete Story',
            'Are you sure you want to delete this story?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => setIsPaused(false)
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteStory(currentStory.id);
                        navigation.goBack();
                    },
                },
            ]
        );
    };


    const handleTap = (x: number) => {
        if (x < width / 2) {
            handlePrevious();
        } else {
            handleNext();
        }
    };

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Story Media (Image or Video) */}
            {currentStory.mediaType === 'video' ? (
                <Video
                    source={{ uri: currentStory.mediaUri }}
                    style={styles.storyImage}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={true}
                    isLooping={true}
                    isMuted={false}
                />
            ) : (
                <Image
                    source={{ uri: currentStory.mediaUri }}
                    style={styles.storyImage}
                />
            )}

            {/* Gradients for visibility on bright backgrounds */}
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                style={styles.topGradient}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.bottomGradient}
            />

            {/* Progress Bars */}
            <View style={styles.progressContainer}>
                {currentGroup.stories.map((_, index) => (
                    <View key={index} style={styles.progressBarBg}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: index < currentStoryIndex
                                        ? '100%'
                                        : index === currentStoryIndex
                                            ? progressAnims[index]?.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            }) || '0%'
                                            : '0%',
                                    backgroundColor: COLORS.white,
                                },
                            ]}
                        />
                    </View>
                ))}
            </View>


            {/* User Info */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    {currentGroup.userAvatar ? (
                        <Image source={{ uri: currentGroup.userAvatar }} style={styles.userAvatar} />
                    ) : (
                        <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {currentGroup.userName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.userName}>{currentGroup.userName}</Text>
                        <Text style={styles.timeAgo}>{getTimeAgo(currentStory.timestamp)}</Text>
                    </View>
                </View>
                <View style={styles.rightControls}>
                    {user && currentGroup.userId === user.id && (
                        <>
                            <TouchableOpacity onPress={handleEdit} style={styles.iconBtn}>
                                <Ionicons name="create-outline" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                                <Ionicons name="trash-outline" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="close" size={28} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Edit Overlay */}
            {isEditing && (
                <View style={[styles.editOverlay, { backgroundColor: editCaption ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.8)' }]}>
                    {/* Top Right Done Button */}
                    <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={saveEdit}
                    >
                        <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>

                    {/* Draggable Preview when not focus-typing or just as the main interaction point? 
                        To keep it consistent with AddStory, we use a multiline TextInput for typing,
                        and maybe a draggable view for positioning?
                        AddStory allows dragging ONLY when NOT in the overlay.
                        Wait, in AddStory, isAddingCaption is the full-screen input.
                    */}

                    <TextInput
                        style={[
                            styles.editInput,
                            {
                                fontSize: fontSize,
                                color: textColor,
                                fontFamily: FONT_FAMILIES.find(f => f.name === fontFamily)?.fontFamily || 'System',
                                fontWeight: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontWeight as any) || 'normal',
                                fontStyle: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontStyle as any) || 'normal',
                            }
                        ]}
                        value={editCaption}
                        onChangeText={setEditCaption}
                        placeholder="Type something..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        multiline
                        autoFocus
                    />

                    {/* Draggable positioning view (just like AddStory) */}
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
                            <View style={[
                                styles.captionTextDisplay,
                                { backgroundColor: 'transparent' }
                            ]}>
                                <Text style={[
                                    styles.captionText,
                                    {
                                        fontSize: fontSize * 0.8, // Slightly smaller for preview? or same?
                                        color: textColor,
                                        fontFamily: FONT_FAMILIES.find(f => f.name === fontFamily)?.fontFamily || 'System',
                                        fontWeight: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontWeight as any) || 'normal',
                                        fontStyle: (FONT_FAMILIES.find(f => f.name === fontFamily)?.fontStyle as any) || 'normal',
                                        textShadowColor: 'rgba(0,0,0,0.8)',
                                        textShadowOffset: { width: 1, height: 1 },
                                        textShadowRadius: 3,
                                    }
                                ]}>{editCaption || 'Add Caption'}</Text>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Trash Icon */}
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

                    {/* Bottom Customization Controls (Sync with AddStory) */}
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

                    {/* Font Size Slider */}
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
            )}

            {/* Tap Areas */}
            {!isEditing && (
                <View style={styles.tapAreas}>
                    <TouchableOpacity
                        style={styles.tapArea}
                        activeOpacity={1}
                        onPress={() => handleTap(0)}
                        onPressIn={() => setIsPaused(true)}
                        onPressOut={() => setIsPaused(false)}
                        delayLongPress={100}
                    />
                    <TouchableOpacity
                        style={styles.tapArea}
                        activeOpacity={1}
                        onPress={() => handleTap(width)}
                        onPressIn={() => setIsPaused(true)}
                        onPressOut={() => setIsPaused(false)}
                        delayLongPress={100}
                    />
                </View>
            )}

            {/* Caption (Rendered last for top z-index) */}
            {currentStory?.caption && !isEditing ? (
                currentStory.captionPosition ? (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 100 }} pointerEvents="box-none">
                        <View style={[
                            { transform: [{ translateX: currentStory.captionPosition.x }, { translateY: currentStory.captionPosition.y }] }
                        ]}>
                            <Text style={[
                                { color: COLORS.white, textAlign: 'center' },
                                {
                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 3,
                                },
                                currentStory.captionStyle && {
                                    fontSize: currentStory.captionStyle.fontSize,
                                    color: currentStory.captionStyle.color || COLORS.white,
                                    fontFamily: currentStory.captionStyle.fontFamily === 'Serif' ? 'serif' :
                                        currentStory.captionStyle.fontFamily === 'Monospace' ? 'monospace' :
                                            currentStory.captionStyle.fontFamily === 'Classic' ? 'System' :
                                                currentStory.captionStyle.fontFamily === 'Strong' ? 'System' :
                                                    currentStory.captionStyle.fontFamily === 'Light' ? 'System' :
                                                        currentStory.captionStyle.fontFamily === 'Marker' ? 'serif' :
                                                            currentStory.captionStyle.fontFamily === 'Modern' ? 'sans-serif-thin' :
                                                                currentStory.captionStyle.fontFamily === 'Elegant' ? 'sans-serif-light' :
                                                                    undefined,
                                    fontWeight: currentStory.captionStyle.fontFamily === 'Strong' ? '900' :
                                        currentStory.captionStyle.fontFamily === 'Light' ? '300' :
                                            currentStory.captionStyle.fontFamily === 'Classic' ? 'bold' :
                                                currentStory.captionStyle.fontFamily === 'Marker' ? 'bold' :
                                                    currentStory.captionStyle.fontFamily === 'Modern' ? 'bold' :
                                                        'normal' as any,
                                    fontStyle: currentStory.captionStyle.fontFamily === 'Italic' || currentStory.captionStyle.fontFamily === 'Elegant' ? 'italic' : 'normal' as any,
                                    backgroundColor: currentStory.captionStyle.backgroundColor || 'transparent',
                                    paddingHorizontal: currentStory.captionStyle.backgroundColor ? 15 : 0,
                                    paddingVertical: currentStory.captionStyle.backgroundColor ? 8 : 0,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                }
                            ]}>{currentStory.caption}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.captionContainer, { bottom: 100, left: 0, right: 0, alignItems: 'center' }]}>
                        <Text style={[
                            styles.captionText,
                            currentStory.captionStyle && {
                                fontSize: currentStory.captionStyle.fontSize,
                                color: currentStory.captionStyle.color || COLORS.white,
                                fontFamily: currentStory.captionStyle.fontFamily === 'Serif' ? 'serif' : currentStory.captionStyle.fontFamily === 'Monospace' ? 'monospace' : undefined,
                                fontWeight: currentStory.captionStyle.fontFamily === 'System' ? '600' : 'normal'
                            }
                        ]}>{currentStory.caption}</Text>
                    </View>
                )
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    storyImage: {
        width,
        height,
        resizeMode: 'contain',
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    progressContainer: {
        position: 'absolute',
        top: 50,
        left: 8,
        right: 8,
        flexDirection: 'row',
        gap: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    header: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50, // Above tap areas
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    userName: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    timeAgo: {
        color: COLORS.white,
        fontSize: 12,
        opacity: 0.8,
    },
    rightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    captionContainer: {
        position: 'absolute',
        // Default styles for when no position is set, can be overridden
        zIndex: 10,
    },
    captionText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    tapAreas: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
    },
    tapArea: {
        flex: 1,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180,
        zIndex: 5,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        zIndex: 5,
    },
    captionBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 110, // Above edit overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    captionTextDisplay: {
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        maxWidth: width * 0.8,
    },
    trashContainer: {
        position: 'absolute',
        bottom: 150, // Higher than bottom controls
        left: width / 2 - 40,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 120,
    },
    trashCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,59,48,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    editBottomControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        zIndex: 130,
    },
    colorPickerScroll: {
        marginBottom: 20,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    fontPickerScroll: {
        paddingVertical: 10,
    },
    fontTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    fontTabText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    fontSizeControl: {
        position: 'absolute',
        left: 20,
        top: height / 2 - 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 30,
        padding: 10,
        alignItems: 'center',
        zIndex: 130,
    },
    sizeBtn: {
        padding: 5,
    },
    sizeDivider: {
        width: 20,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginVertical: 10,
    },
    sizeLabel: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 5,
        textTransform: 'uppercase',
    },
    editOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    editInput: {
        color: COLORS.white,
        fontSize: 32,
        textAlign: 'center',
        width: '90%',
        padding: 20,
        marginTop: -100,
    },
    doneBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        padding: 10,
        zIndex: 140,
    },
    doneBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
