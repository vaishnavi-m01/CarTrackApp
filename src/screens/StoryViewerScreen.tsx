import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Share,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../api/apiClient';
import { StoryGroup } from '../types/Story';

const { width, height } = Dimensions.get('window');

interface ActivityUser {
    id: string | number;
    username: string;
    profilePicUrl?: string;
    name?: string;
    hasLiked?: boolean;
}
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
    const { storyGroup, allGroups, startIndex, storyId, onUpdateStoryLike, onClose } = route.params;
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(!allGroups || !storyGroup);
    const [isEditing, setIsEditing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [editCaption, setEditCaption] = useState('');
    const { user } = useAuth();
    const [localAllGroups, setLocalAllGroups] = useState<StoryGroup[]>(allGroups || []);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(startIndex || 0);
    const scrollX = useRef(new Animated.Value((startIndex || 0) * width)).current;
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const progressAnims = useRef<Animated.Value[]>([]).current;

    const currentGroup = localAllGroups[currentGroupIndex];
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

    // Viewers List states
    const [viewers, setViewers] = useState<ActivityUser[]>([]);
    const [isViewersLoading, setIsViewersLoading] = useState(false);
    const [viewersSheetVisible, setViewersSheetVisible] = useState(false);
    const [storyMenuVisible, setStoryMenuVisible] = useState(false);
    const viewersPanY = useRef(new Animated.Value(height * 0.6)).current;

    const resetViewersSheet = Animated.timing(viewersPanY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
    });

    const closeViewersSheet = Animated.timing(viewersPanY, {
        toValue: height * 0.6,
        duration: 300,
        useNativeDriver: true,
    });

    const viewersPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    viewersPanY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > (height * 0.6) * 0.2) {
                    closeViewersSheet.start(() => {
                        setViewersSheetVisible(false);
                        setIsPaused(false);
                    });
                } else {
                    resetViewersSheet.start();
                }
            },
        })
    ).current;

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const onMomentumScrollEnd = (e: any) => {
        const offset = e.nativeEvent.contentOffset.x;
        const index = Math.round(offset / width);
        if (index !== currentGroupIndex) {
            setCurrentGroupIndex(index);
            setCurrentStoryIndex(0);
        }
    };

    const getTransform = (index: number): any => {
        const offset = index * width;

        const rotateY = scrollX.interpolate({
            inputRange: [offset - width, offset, offset + width],
            outputRange: ['90deg', '0deg', '-90deg'],
            extrapolate: 'clamp',
        });

        const translateX = scrollX.interpolate({
            inputRange: [offset - width, offset, offset + width],
            outputRange: [width / 2, 0, -width / 2],
            extrapolate: 'clamp',
        });

        const reverseTranslateX = scrollX.interpolate({
            inputRange: [offset - width, offset, offset + width],
            outputRange: [-width / 2, 0, width / 2],
            extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
            inputRange: [offset - width, offset - width / 2, offset, offset + width / 2, offset + width],
            outputRange: [0, 0.5, 1, 0.5, 0],
            extrapolate: 'clamp',
        });

        return {
            transform: [
                { perspective: 1000 },
                { translateX },
                { rotateY },
                { translateX: reverseTranslateX },
            ],
            opacity,
        };
    };

    useEffect(() => {
        if (viewersSheetVisible) {
            resetViewersSheet.start();
        } else {
            viewersPanY.setValue(height * 0.6);
        }
    }, [viewersSheetVisible]);

    const isGroupOwner = user && String(currentGroup?.userId) === String(user.id);

    const loadStoryFromId = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/story/active');
            const data = response.data || [];

            // Load local viewed IDs
            const storedJson = await AsyncStorage.getItem('viewed_story_ids');
            const storedIds = storedJson ? JSON.parse(storedJson) : [];
            const viewedSet = new Set<string>(storedIds);

            const mappedStories = data.map((story: any) => ({
                id: story.id.toString(),
                userId: story.userId.toString(),
                userName: story.user?.username || `User ${story.userId}`,
                userAvatar: story.user?.profilePicUrl,
                mediaUri: story.mediaUrl,
                mediaType: story.mediaType?.toLowerCase() || 'image',
                caption: story.caption,
                captionPosition: story.captionMetadata?.captionPosition,
                captionStyle: story.captionMetadata?.captionStyle,
                timestamp: new Date(story.createdAt).getTime(),
                expiresAt: new Date(story.expiresAt).getTime(),
                viewed: story.viewed || viewedSet.has(story.id.toString()),
                viewsCount: story.viewsCount || 0,
                likesCount: story.likesCount || 0,
                isLiked: story.isLiked || false,
            }));

            // Grouping logic (reused from CommunityScreen)
            const grouped = mappedStories.reduce((acc: any, story: any) => {
                const userId = story.userId.toString();
                if (!acc[userId]) {
                    acc[userId] = {
                        userId: story.userId,
                        userName: story.userName,
                        userAvatar: story.userAvatar,
                        stories: [],
                        hasUnviewed: false,
                    };
                }
                acc[userId].stories.push(story);
                if (!story.viewed) acc[userId].hasUnviewed = true;
                return acc;
            }, {});

            const groups: StoryGroup[] = Object.values(grouped);

            // Find which group and story index corresponds to id
            let foundGroupIndex = 0;
            let foundStoryIndex = 0;

            for (let i = 0; i < groups.length; i++) {
                const sIndex = groups[i].stories.findIndex(s => String(s.id) === String(id));
                if (sIndex !== -1) {
                    foundGroupIndex = i;
                    foundStoryIndex = sIndex;
                    break;
                }
            }

            setLocalAllGroups(groups);
            setCurrentGroupIndex(foundGroupIndex);
            setCurrentStoryIndex(foundStoryIndex);
            scrollX.setValue(foundGroupIndex * width);
        } catch (error) {
            console.error('Error loading story from ID:', error);
            Alert.alert('Error', 'Could not open story');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (storyId && !allGroups) { // Only load from ID if allGroups is not provided (deep link scenario)
            loadStoryFromId(storyId);
        } else if (allGroups && storyGroup) {
            // If allGroups and storyGroup are provided, ensure initial state is correct
            const initialGroupIndex = allGroups.findIndex(group => String(group.userId) === String(storyGroup.userId));
            if (initialGroupIndex !== -1) {
                setLocalAllGroups(allGroups);
                setCurrentGroupIndex(initialGroupIndex);
                const initialStoryIndex = storyGroup.stories.findIndex(s => String(s.id) === String(storyId));
                setCurrentStoryIndex(initialStoryIndex !== -1 ? initialStoryIndex : 0);
                scrollX.setValue(initialGroupIndex * width);
            }
            setIsLoading(false);
        }
    }, [storyId, allGroups, storyGroup]);

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar hidden />
                <Text style={{ color: COLORS.white }}>Loading story...</Text>
            </View>
        );
    }

    if (!currentGroup || !currentStory) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar hidden />
                <Text style={{ color: COLORS.white }}>Story not available.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: COLORS.white, textDecorationLine: 'underline' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

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

        // Check if user liked it by calling the Likers API (overrides stale backend boolean)
        if (user && !currentStory.isLikedFetched) {
            checkIfUserLiked(currentStory.id);
        }

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

    const toggleLike = async (storyId: string | number) => {
        if (!user) return;
        const story = currentGroup.stories[currentStoryIndex];
        const newIsLiked = !story.isLiked;
        const newLikesCount = (story.likesCount || 0) + (newIsLiked ? 1 : -1);

        // Optimistic UI update
        setLocalAllGroups(prev => prev.map(group => ({
            ...group,
            stories: group.stories.map(s => s.id === storyId ? {
                ...s,
                isLiked: newIsLiked,
                likesCount: newLikesCount
            } : s)
        })));
        if (onUpdateStoryLike) {
            onUpdateStoryLike(storyId, newIsLiked, newLikesCount);
        }

        try {
            if (newIsLiked) {
                await apiClient.post(`/story/${storyId}/like?userId=${user.id}`);
            } else {
                await apiClient.delete(`/story/${storyId}/like?userId=${user.id}`);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Rollback if failed
            const revertedIsLiked = !newIsLiked;
            const revertedLikesCount = newLikesCount + (!newIsLiked ? 1 : -1);
            setLocalAllGroups(prev => prev.map(group => ({
                ...group,
                stories: group.stories.map(s => s.id === storyId ? {
                    ...s,
                    isLiked: revertedIsLiked,
                    likesCount: revertedLikesCount
                } : s)
            })));
            if (onUpdateStoryLike) {
                onUpdateStoryLike(storyId, revertedIsLiked, revertedLikesCount);
            }
        }
    };

    const checkIfUserLiked = async (storyId: string | number) => {
        try {
            const response = await apiClient.get(`/story/${storyId}/likers`);
            const likersList = response.data || [];
            const hasLiked = likersList.some((liker: any) => String(liker.id) === String(user?.id));

            setLocalAllGroups(prev => prev.map(group => ({
                ...group,
                stories: group.stories.map(s => {
                    if (s.id === storyId) {
                        if (onUpdateStoryLike && s.isLiked !== hasLiked) {
                            onUpdateStoryLike(storyId, hasLiked, s.likesCount || 0);
                        }
                        return {
                            ...s,
                            isLiked: hasLiked,
                            isLikedFetched: true
                        };
                    }
                    return s;
                })
            })));
        } catch (error) {
            console.error('Error checking if user liked story:', error);
            setLocalAllGroups(prev => prev.map(group => ({
                ...group,
                stories: group.stories.map(s => s.id === storyId ? {
                    ...s,
                    isLikedFetched: true
                } : s)
            })));
        }
    };

    const handleSendReply = async () => {
        if (!editCaption.trim() || !user) return;

        try {
            await apiClient.post(`/story/${currentStory.id}/comment?userId=${user.id}`, editCaption.trim(), {
                headers: { 'Content-Type': 'text/plain' }
            });
            const replyText = editCaption.trim();
            setEditCaption('');
            setIsPaused(false);
            Keyboard.dismiss();

            // Navigate to ChatDetail with this user and auto-send message
            navigation.navigate('ChatDetail', {
                userId: currentGroup.userId.toString(),
                userName: currentGroup.userName,
                userImage: currentGroup.userAvatar,
                initialMessage: `${replyText}`
            });

            // Alert.alert('Success', 'Reply sent!');
        } catch (error) {
            console.error('Error sending reply:', error);
            Alert.alert('Error', 'Failed to send reply');
        }
    };

    const StoryVideoPlayer = ({ source, isActive, onPlaybackStatusUpdate }: any) => {
        const player = useVideoPlayer(source, (player) => {
            player.loop = false;
            if (isActive) {
                player.play();
            }
        });

        useEffect(() => {
            if (isActive) {
                player.play();
            } else {
                player.pause();
            }
        }, [isActive, player]);

        useEffect(() => {
            const interval = setInterval(() => {
                onPlaybackStatusUpdate({
                    positionMillis: player.currentTime * 1000,
                    durationMillis: player.duration * 1000,
                    didJustFinish: (player.status as any) === 'finished'
                });
            }, 100);
            return () => clearInterval(interval);
        }, [player]);

        return (
            <VideoView
                player={player}
                style={styles.storyImage}
                contentFit="contain"
            />
        );
    };
    const handleNext = () => {
        // Check if there are more stories in current group
        if (currentStoryIndex < currentGroup.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
        } else if (currentGroupIndex < localAllGroups.length - 1) {
            // Scroll to next group
            scrollViewRef.current?.scrollTo({ x: (currentGroupIndex + 1) * width, animated: true });
            // setCurrentGroupIndex and setCurrentStoryIndex(0) are handled by scroll handlers if not animated: false
            // But we can set them optimistically if we want, or rely on onMomentumScrollEnd
        } else {
            if (onClose) onClose();
            navigation.goBack();
        }
    };

    const handlePrevious = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        } else if (currentGroupIndex > 0) {
            // Scroll to previous group
            scrollViewRef.current?.scrollTo({ x: (currentGroupIndex - 1) * width, animated: true });
        }
    };

    const markStoryAsViewed = async (storyId: string | number) => {
        if (!user) return;
        try {
            await apiClient.post(`/story/${storyId}/view?userId=${user.id}`);

            // Persist locally
            const storedJson = await AsyncStorage.getItem('viewed_story_ids');
            const storedIds = storedJson ? JSON.parse(storedJson) : [];
            if (!storedIds.includes(storyId.toString())) {
                const updatedIds = [...storedIds, storyId.toString()];
                await AsyncStorage.setItem('viewed_story_ids', JSON.stringify(updatedIds));
            }

            setLocalAllGroups(prev => prev.map(group => ({
                ...group,
                stories: group.stories.map(s => s.id === storyId ? { ...s, viewed: true } : s)
            })));
        } catch (error) {
            console.error('Error marking story as viewed:', error);
        }
    };

    const deleteStory = async (storyId: string | number) => {
        try {
            await apiClient.delete(`/story/${storyId}`);
            setLocalAllGroups(prev => prev.map(group => ({
                ...group,
                stories: group.stories.filter(s => s.id !== storyId)
            })).filter(group => group.stories.length > 0));
        } catch (error) {
            console.error('Error deleting story:', error);
        }
    };

    const editStory = async (storyId: string | number, updates: any) => {
        try {
            await apiClient.put(`/story/${storyId}`, updates);
            setLocalAllGroups(prev => prev.map(group => ({
                ...group,
                stories: group.stories.map(s => s.id === storyId ? { ...s, ...updates } : s)
            })));
        } catch (error) {
            console.error('Error editing story:', error);
        }
    };

    const fetchStoryActivity = async (storyId: string | number) => {
        setIsViewersLoading(true);
        setIsPaused(true);
        try {
            const [viewersRes, likersRes] = await Promise.all([
                apiClient.get(`/story/${storyId}/viewers`),
                apiClient.get(`/story/${storyId}/likers`)
            ]);

            const viewersData = viewersRes.data || [];
            const likersData = likersRes.data || [];
            const likerIds = new Set(likersData.map((l: any) => l.id.toString()));

            // Merge: Everyone from viewers + any likers not in viewers
            const combinedMap = new Map<string, ActivityUser>();

            viewersData.forEach((v: any) => {
                const id = v.id.toString();
                combinedMap.set(id, {
                    id: v.id,
                    username: v.username,
                    name: v.bio || v.username, // Using bio as name if name field is missing in API response
                    profilePicUrl: v.profilePicUrl,
                    hasLiked: likerIds.has(id)
                });
            });

            likersData.forEach((l: any) => {
                const id = l.id.toString();
                if (!combinedMap.has(id)) {
                    combinedMap.set(id, {
                        id: l.id,
                        username: l.username,
                        name: l.bio || l.username,
                        profilePicUrl: l.profilePicUrl,
                        hasLiked: true
                    });
                }
            });

            setViewers(Array.from(combinedMap.values()));
            setViewersSheetVisible(true);
        } catch (error) {
            console.error('Error fetching story activity:', error);
            Alert.alert('Error', 'Unable to load activity');
            setIsPaused(false);
        } finally {
            setIsViewersLoading(false);
        }
    };

    const handleHeaderProfilePress = () => {
        if (!currentGroup) return;

        if (user && String(currentGroup.userId) === String(user.id)) {
            navigation.navigate('MainTabs', { screen: 'Profile' });
        } else {
            navigation.navigate('OtherUserProfile', {
                userId: currentGroup.userId.toString(),
                userName: currentStory.userName || 'User'
            });
        }
    };

    const handleShare = async (storyId: string | number) => {
        try {
            const deepLink = Linking.createURL(`story/${storyId}`);
            await Share.share({
                message: `Check out this story on CarTrack! ${deepLink}`,
                url: deepLink,
            });
        } catch (error) {
            console.error('Error sharing story:', error);
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

            <Animated.ScrollView
                ref={scrollViewRef as any}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={width}
                contentOffset={{ x: startIndex * width, y: 0 }}
                style={StyleSheet.absoluteFill}
            >
                {localAllGroups.map((group, index) => {
                    const isActive = index === currentGroupIndex;
                    const displayStory = isActive ? currentStory : group.stories[0];
                    const isGroupOwner = user && String(group.userId) === String(user.id);

                    if (!displayStory) return null;

                    return (
                        <Animated.View key={index} style={[styles.groupContainer, getTransform(index)] as any}>
                            {/* Story Media */}
                            {displayStory.mediaType === 'video' ? (
                                <StoryVideoPlayer
                                    source={displayStory.mediaUri}
                                    isActive={isActive && !isPaused && !isEditing}
                                    onPlaybackStatusUpdate={(status: any) => {
                                        if (isActive && status.didJustFinish) {
                                            handleNext();
                                        }
                                    }}
                                />
                            ) : (
                                <Image source={{ uri: displayStory.mediaUri }} style={styles.storyImage} />
                            )}

                            {/* Gradients */}
                            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bottomGradient} />

                            {/* Progress Bars */}
                            {isActive && (
                                <View style={styles.progressContainer}>
                                    {group.stories.map((_, pIndex) => (
                                        <View key={pIndex} style={styles.progressBarBg}>
                                            <Animated.View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: pIndex < currentStoryIndex
                                                            ? '100%'
                                                            : pIndex === currentStoryIndex
                                                                ? progressAnims[pIndex]?.interpolate({
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
                            )}

                            {/* User Info / Header */}
                            <View style={styles.header}>
                                <TouchableOpacity style={styles.userInfo} onPress={handleHeaderProfilePress} activeOpacity={0.7}>
                                    <Image
                                        source={group.userAvatar ? { uri: group.userAvatar } : COLORS.defaultProfileImage}
                                        style={styles.userAvatar}
                                    />
                                    <View>
                                        <Text style={styles.userName}>{isGroupOwner ? 'You' : group.userName}</Text>
                                        <Text style={styles.timeAgo}>{getTimeAgo(displayStory.timestamp)}</Text>
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.rightControls}>
                                    {isActive && isGroupOwner && (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setStoryMenuVisible(!storyMenuVisible);
                                                    setIsPaused(true);
                                                }}
                                                style={styles.iconBtn}
                                            >
                                                <Ionicons name="ellipsis-vertical" size={24} color={COLORS.white} />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Dropdown Menu for Logged In User */}
                            {isActive && isGroupOwner && storyMenuVisible && (
                                <>
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        onPress={() => {
                                            setStoryMenuVisible(false);
                                            setIsPaused(false);
                                        }}
                                        style={[StyleSheet.absoluteFillObject, { zIndex: 45 }]}
                                    />
                                    <View style={styles.storyMenuDropdown}>
                                        <TouchableOpacity
                                            style={styles.storyMenuItem}
                                            onPress={() => {
                                                setStoryMenuVisible(false);
                                                handleDelete();
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={COLORS.danger || '#FF3B30'} />
                                            <Text style={styles.storyMenuItemText}>Delete Story</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            {/* Tap Areas */}
                            {!isEditing && isActive && (
                                <View style={styles.tapAreas}>
                                    <TouchableOpacity
                                        style={styles.tapArea}
                                        activeOpacity={1}
                                        onPressIn={() => setIsPaused(true)}
                                        onPressOut={() => setIsPaused(false)}
                                        onPress={() => handleTap(0)}
                                    />
                                    <TouchableOpacity
                                        style={styles.tapArea}
                                        activeOpacity={1}
                                        onPressIn={() => setIsPaused(true)}
                                        onPressOut={() => setIsPaused(false)}
                                        onPress={() => handleTap(width)}
                                    />
                                </View>
                            )}

                            {/* Caption */}
                            {displayStory.caption && !isEditing && (
                                displayStory.captionPosition ? (
                                    <View style={styles.captionOverlay} pointerEvents="none">
                                        <View style={{ transform: [{ translateX: displayStory.captionPosition.x }, { translateY: displayStory.captionPosition.y }] }}>
                                            <Text style={[styles.captionText, displayStory.captionStyle && {
                                                fontSize: displayStory.captionStyle.fontSize,
                                                color: displayStory.captionStyle.color
                                            }]}>{displayStory.caption}</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={[styles.captionContainer, { bottom: 120, left: 0, right: 0, alignItems: 'center' }]}>
                                        <Text style={styles.captionText}>{displayStory.caption}</Text>
                                    </View>
                                )
                            )}

                            {/* Interaction Bar */}
                            {!isEditing && isActive && (
                                <KeyboardAvoidingView
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
                                    style={styles.keyboardAvoidingBottom}
                                >
                                    <View style={[styles.bottomInteraction, { paddingBottom: Math.max(insets.bottom + 10, 25) }]}>
                                        {!isGroupOwner ? (
                                            <View style={styles.replyContainer}>
                                                <TextInput
                                                    style={styles.replyInput}
                                                    placeholder="Send Message"
                                                    placeholderTextColor="rgba(255,255,255,0.7)"
                                                    value={editCaption}
                                                    onChangeText={setEditCaption}
                                                    onFocus={() => setIsPaused(true)}
                                                    onBlur={() => setIsPaused(false)}
                                                    returnKeyType="send"
                                                    onSubmitEditing={handleSendReply}
                                                />
                                                {editCaption.trim().length > 0 && (
                                                    <TouchableOpacity onPress={handleSendReply} style={styles.sendBtn}>
                                                        <Ionicons name="send" size={24} color={COLORS.white} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ) : (
                                            <TouchableOpacity style={styles.statItem} onPress={() => fetchStoryActivity(displayStory.id)}>
                                                <View style={styles.statItemContent}>
                                                    <Ionicons name="eye-outline" size={24} color={COLORS.white} />
                                                </View>
                                            </TouchableOpacity>
                                        )}

                                        <View style={styles.actionButtons}>
                                            {!isGroupOwner && (
                                                <TouchableOpacity
                                                    onPress={() => toggleLike(displayStory.id)}
                                                    style={styles.actionBtn}
                                                >
                                                    <Ionicons
                                                        name={displayStory.isLiked ? "heart" : "heart-outline"}
                                                        size={30}
                                                        color={displayStory.isLiked ? COLORS.danger || "#FF3B30" : COLORS.white}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => handleShare(displayStory.id)}
                                            >
                                                <Ionicons name="paper-plane-outline" size={28} color={COLORS.white} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </KeyboardAvoidingView>
                            )}
                        </Animated.View>
                    );
                })}
            </Animated.ScrollView>

            {/* Overlays (Stay static) */}
            {isEditing && (
                <View style={[styles.editOverlay, { backgroundColor: editCaption ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.8)' }]}>
                    <TouchableOpacity style={styles.doneBtn} onPress={saveEdit}>
                        <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={[
                            styles.editInput,
                            {
                                fontSize: fontSize,
                                color: textColor,
                                fontFamily: FONT_FAMILIES.find(f => f.name === fontFamily)?.fontFamily || 'System',
                            }
                        ]}
                        value={editCaption}
                        onChangeText={setEditCaption}
                        placeholder="Type something..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        multiline
                        autoFocus
                    />

                    {/* Draggable preview */}
                    <View style={styles.captionBadge} pointerEvents="box-none">
                        <Animated.View
                            {...panResponder.panHandlers}
                            style={[{ transform: [{ translateX: pan.x }, { translateY: pan.y }], position: 'absolute' }]}
                        >
                            <View style={styles.captionTextDisplay}>
                                <Text style={[
                                    styles.captionText,
                                    {
                                        fontSize: fontSize * 0.8,
                                        color: textColor,
                                        fontFamily: FONT_FAMILIES.find(f => f.name === fontFamily)?.fontFamily || 'System',
                                        textShadowColor: 'rgba(0,0,0,0.8)',
                                        textShadowOffset: { width: 1, height: 1 },
                                        textShadowRadius: 3,
                                    }
                                ]}>{editCaption || 'Add Caption'}</Text>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Trash Zone */}
                    {isDragging && (
                        <Animated.View style={[styles.trashContainer, { transform: [{ scale: trashScale }] }]}>
                            <View style={[styles.trashCircle, showDeleteZone && { backgroundColor: COLORS.danger || '#FF3B30', borderColor: COLORS.white }]}>
                                <Ionicons name="trash" size={30} color={COLORS.white} />
                            </View>
                        </Animated.View>
                    )}

                    {/* Controls */}
                    <View style={styles.editBottomControls}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPickerScroll} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
                            {COLOR_PALETTE.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => setTextColor(color)}
                                    style={[styles.colorCircle, { backgroundColor: color }, textColor === color && { borderColor: COLORS.white, borderWidth: 3 }]}
                                />
                            ))}
                        </ScrollView>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontPickerScroll} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
                            {FONT_FAMILIES.map((font) => (
                                <TouchableOpacity
                                    key={font.name}
                                    onPress={() => setFontFamily(font.name)}
                                    style={[styles.fontTab, fontFamily === font.name && { backgroundColor: COLORS.white }]}
                                >
                                    <Text style={[styles.fontTabText, { fontFamily: font.fontFamily, color: fontFamily === font.name ? COLORS.black : COLORS.white }]}>
                                        {font.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Font Size */}
                    <View style={styles.fontSizeControl}>
                        <TouchableOpacity onPress={() => setFontSize(Math.min(fontSize + 2, 80))} style={styles.sizeBtn}>
                            <Ionicons name="add" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <View style={styles.sizeDivider} />
                        <TouchableOpacity onPress={() => setFontSize(Math.max(fontSize - 2, 10))} style={styles.sizeBtn}>
                            <Ionicons name="remove" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {viewersSheetVisible && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                    <TouchableOpacity style={styles.sheetBackdrop} onPress={() => { closeViewersSheet.start(() => { setViewersSheetVisible(false); setIsPaused(false); }); }} />
                    <Animated.View style={[styles.viewersSheet, { transform: [{ translateY: viewersPanY }] }]}>
                        <View {...viewersPanResponder.panHandlers} style={styles.sheetHeader}>
                            <View style={styles.sheetHandle} />
                            <Text style={styles.sheetTitle}>Story Views</Text>
                        </View>
                        <ScrollView style={styles.viewersList} showsVerticalScrollIndicator={false}>
                            {viewers.length > 0 ? (
                                viewers.map((v, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.viewerItem}
                                        onPress={() => {
                                            setViewersSheetVisible(false);
                                            setIsPaused(false);
                                            navigation.navigate('OtherUserProfile', {
                                                userId: v.id.toString(),
                                                userName: v.username
                                            });
                                        }}
                                    >
                                        <View style={styles.viewerInfo}>
                                            <View>
                                                <Image
                                                    source={v.profilePicUrl ? { uri: v.profilePicUrl } : COLORS.defaultProfileImage}
                                                    style={styles.viewerAvatar}
                                                />
                                                {v.hasLiked && (
                                                    <View style={styles.heartBadge}>
                                                        <Ionicons name="heart" size={12} color={COLORS.danger || "#FF3B30"} />
                                                    </View>
                                                )}
                                            </View>
                                            <View>
                                                <Text style={styles.viewerName}>{v.username}</Text>
                                                <Text style={styles.viewerFullName}>{v.name || v.username}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyViewers}>
                                    <Text style={styles.emptyViewersText}>No views yet</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    groupContainer: {
        width,
        height,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    captionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
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
    storyMenuDropdown: {
        position: 'absolute',
        top: 110,
        right: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 5,
        paddingHorizontal: 4,
        zIndex: 55,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    storyMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
    },
    storyMenuItemText: {
        color: COLORS.danger || '#FF3B30',
        fontSize: 16,
        fontWeight: 'bold',
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
    keyboardAvoidingBottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
    },
    bottomInteraction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    replyContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 44,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    replyInput: {
        flex: 1,
        color: COLORS.white,
        fontSize: 14,
        height: '100%',
    },
    sendBtn: {
        marginLeft: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    actionBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionCount: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: -5,
    },
    viewersBtn: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 60,
    },
    viewersBtnContent: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    viewersCountText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    viewersSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.6,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
    },
    sheetHeader: {
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDDDDD',
        borderRadius: 2,
        marginBottom: 15,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    viewersList: {
        flex: 1,
    },
    viewerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    viewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    viewerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholderSmall: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerAvatarText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewerName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    viewerFullName: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 1,
    },
    emptyViewers: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyViewersText: {
        color: COLORS.textLight,
        fontSize: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        color: COLORS.white,
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    statItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heartBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: COLORS.white,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.white,
    },
});
