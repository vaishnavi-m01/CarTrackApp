import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    Image,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import apiClient from '../api/apiClient';

interface UsersBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    userId: string | number | null;
    type: 'followers' | 'following';
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

export default function UsersBottomSheet({
    visible,
    onClose,
    userId,
    type,
}: UsersBottomSheetProps) {
    const [users, setUsers] = useState<any[]>([]);
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
            if (userId) {
                fetchUsers();
            }
        } else {
            panY.setValue(SCREEN_HEIGHT);
            setUsers([]);
        }
    }, [visible, userId, type]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const endpoint = `/users/${userId}/${type}`;
            const response = await apiClient.get<any[]>(endpoint);
            setUsers(response.data || []);
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        closeBottomSheet.start(onClose);
    };

    const title = type === 'followers' ? 'Followers' : 'Following';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
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
                    <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                        <View style={styles.handleBar} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.usersList}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        ) : users.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>
                                    No {type} yet
                                </Text>
                            </View>
                        ) : (
                            users.map((user) => (
                                <View key={user.id} style={styles.userItem}>
                                    <View style={styles.userInfo}>
                                        <View style={styles.avatarContainer}>
                                            {user.profilePicUrl ? (
                                                <Image source={{ uri: user.profilePicUrl }} style={styles.avatar} />
                                            ) : (
                                                <Text style={styles.avatarText}>
                                                    {user.username?.charAt(0).toUpperCase() || '?'}
                                                </Text>
                                            )}
                                        </View>
                                        <View>
                                            <Text style={styles.username}>{user.username}</Text>
                                            <Text style={styles.fullName}>{user.fullName || user.email}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
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
        textTransform: 'capitalize',
    },
    usersList: {
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
    fullName: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 1,
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
