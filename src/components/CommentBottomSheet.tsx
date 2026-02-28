import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CommentBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    comments: any[];
    isLoading?: boolean;
    onAddComment: (text: string) => void;
    allowComments?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function CommentBottomSheet({
    visible,
    onClose,
    comments,
    isLoading = false,
    onAddComment,
    allowComments = true,
}: CommentBottomSheetProps) {
    const [commentText, setCommentText] = useState('');
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user: currentUser } = useAuth();
    const insets = useSafeAreaInsets();

    const handleProfilePress = (comment: any) => {
        const userId = comment.user?.id || comment.userId;
        const userName = comment.user?.username || comment.userName;

        if (currentUser && String(userId) === String(currentUser.id)) {
            onClose();
            navigation.navigate('MainTabs', { screen: 'Profile' });
        } else if (userId) {
            onClose();
            navigation.navigate('OtherUserProfile', {
                userId: userId.toString(),
                userName: userName || 'User'
            });
        }
    };

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
        } else {
            panY.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    const handleSubmit = () => {
        if (commentText.trim()) {
            onAddComment(commentText.trim());
            setCommentText('');
        }
    };

    const handleClose = () => {
        closeBottomSheet.start(onClose);
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

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
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    style={styles.kbView}
                    keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
                    enabled={true}
                >
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
                            <Text style={styles.title}>
                                Comments {comments.length > 0 && `(${comments.length})`}
                            </Text>
                            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Comments List */}
                        <ScrollView
                            style={styles.commentsList}
                            contentContainerStyle={styles.commentsListContent}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Loading comments...</Text>
                                </View>
                            ) : comments.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="chatbubble-outline" size={48} color="rgba(0,0,0,0.15)" />
                                    </View>
                                    <Text style={styles.emptyText}>No comments yet</Text>
                                    <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
                                </View>
                            ) : (
                                comments.map((comment) => {
                                    const userName = comment.user?.username || comment.userName || 'Unknown';
                                    const userAvatar = comment.user?.profilePicUrl || comment.userAvatar;
                                    const timestamp = comment.createdAt || comment.timestamp;

                                    return (
                                        <View key={comment.id} style={styles.commentItem}>
                                            <TouchableOpacity
                                                style={styles.commentAvatar}
                                                onPress={() => handleProfilePress(comment)}
                                            >
                                                {userAvatar ? (
                                                    <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
                                                ) : (
                                                    <Text style={styles.commentAvatarText}>
                                                        {userName.charAt(0).toUpperCase()}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                            <View style={styles.commentContent}>
                                                <View style={styles.commentHeader}>
                                                    <TouchableOpacity onPress={() => handleProfilePress(comment)}>
                                                        <Text style={styles.commentUserName}>{userName}</Text>
                                                    </TouchableOpacity>
                                                    <Text style={styles.commentTime}>
                                                        {formatTimestamp(new Date(timestamp))}
                                                    </Text>
                                                </View>
                                                <Text style={styles.commentText}>{comment.content}</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>

                        {/* Add Comment Input */}
                        <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 34) : Math.max(insets.bottom, 12) }]}>
                            {allowComments ? (
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Add a comment..."
                                        placeholderTextColor={COLORS.textLight}
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        multiline
                                        maxLength={500}
                                    />
                                    <TouchableOpacity
                                        style={[
                                            styles.sendButton,
                                            !commentText.trim() && styles.sendButtonDisabled,
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={!commentText.trim()}
                                    >
                                        <Ionicons
                                            name="send"
                                            size={20}
                                            color={commentText.trim() ? COLORS.primary : COLORS.textLight}
                                        />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={[styles.inputWrapper, { backgroundColor: '#FFF1F2', justifyContent: 'center', paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#FDA4AF' }]}>
                                    <Ionicons name="chatbubble-outline" size={18} color="#E11D48" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#E11D48', fontWeight: 'bold', fontSize: 13 }}>
                                        Comments are turned off for this post
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
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
    kbView: {
        flex: 1,
        justifyContent: 'flex-end',
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
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    commentsList: {
        flex: 1,
    },
    commentsListContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 4,
        textAlign: 'center',
    },
    commentItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    commentAvatarText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.textLight,
        fontSize: 14,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentUserName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginRight: 8,
    },
    commentTime: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    commentText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    inputContainer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        backgroundColor: COLORS.white,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        maxHeight: 120, // Increased for better multi-line
        paddingVertical: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
});
