import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
    Image,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

interface LikersBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    postId: string | number | null;
    onUserPress?: (userId: string, userName: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

export default function LikersBottomSheet({
    visible,
    onClose,
    postId,
    onUserPress,
}: LikersBottomSheetProps) {
    const { user: currentUser, followUser } = useAuth();
    const navigation = useNavigation<any>();
    const [likers, setLikers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const resetBottomSheet = Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
    });

    const closeBottomSheet = Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > SCREEN_HEIGHT * 0.2) {
                    closeBottomSheet.start(onClose);
                } else {
                    resetBottomSheet.start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            resetBottomSheet.start();
            if (postId) {
                fetchLikers();
            }
        } else {
            panY.setValue(SCREEN_HEIGHT);
        }
    }, [visible, postId]);

    const fetchLikers = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get<any[]>(`/post/${postId}/likers`);
            // The backend returns response.data
            setLikers(response.data || []);
        } catch (error) {
            console.error('Error fetching likers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        closeBottomSheet.start(onClose);
    };

    const handleFollowPress = async (userId: string | number) => {
        try {
            await followUser(userId.toString());
            // Optionally refresh likers or just rely on global auth state
        } catch (error) {
            console.error('Error following in likers sheet:', error);
        }
    };

    const handleMessagePress = (userId: string, userName: string) => {
        handleClose();
        navigation.navigate('ChatDetail', { userId, userName });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none" // Custom animation with Animated.View
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <Animated.View
                    style={[
                        styles.sheetContainer,
                        { transform: [{ translateY: panY }] }
                    ]}
                >
                    {/* Draggable Handle */}
                    <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                        <View style={styles.handleBar} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Likes</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={likers}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No likes yet</Text>
                                </View>
                            )}
                            renderItem={({ item: liker }) => {
                                const isCurrentUser = currentUser?.id?.toString() === liker.id?.toString();
                                const isFollowing = currentUser?.following?.includes(liker.id?.toString());

                                return (
                                    <View style={styles.userItem}>
                                        <TouchableOpacity
                                            style={styles.userInfo}
                                            onPress={() => {
                                                handleClose();
                                                onUserPress?.(liker.id.toString(), liker.username);
                                            }}
                                        >
                                            <View style={styles.avatarContainer}>
                                                {liker.profilePicUrl ? (
                                                    <Image source={{ uri: liker.profilePicUrl }} style={styles.avatar} />
                                                ) : (
                                                    <Text style={styles.avatarText}>
                                                        {liker.username?.charAt(0).toUpperCase() || '?'}
                                                    </Text>
                                                )}
                                            </View>
                                            <View>
                                                <Text style={styles.username}>{liker.username}</Text>
                                                <Text style={styles.emailText}>{liker.email}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        {!isCurrentUser && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionBtn,
                                                    isFollowing && styles.messageBtn
                                                ]}
                                                onPress={() => isFollowing
                                                    ? handleMessagePress(liker.id.toString(), liker.username)
                                                    : handleFollowPress(liker.id)
                                                }
                                            >
                                                <Text style={[
                                                    styles.actionBtnText,
                                                    isFollowing && styles.messageBtnText
                                                ]}>
                                                    {isFollowing ? 'Message' : 'Follow'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            }}
                        />
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayTouchable: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheetContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: SHEET_HEIGHT,
        overflow: 'hidden',
    },
    dragHandleContainer: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    handleBar: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    likersList: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    emailText: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 1,
    },
    actionBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 85,
        alignItems: 'center',
    },
    messageBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    actionBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: 'bold',
    },
    messageBtnText: {
        color: COLORS.primary,
    },
    loadingContainer: {
        paddingVertical: 40,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textLight,
    },
});
