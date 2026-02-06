import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Comment } from '../types/Community';

interface CommentBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    comments: Comment[];
    onAddComment: (text: string) => void;
}

export default function CommentBottomSheet({
    visible,
    onClose,
    comments,
    onAddComment,
}: CommentBottomSheetProps) {
    const [commentText, setCommentText] = useState('');

    const handleSubmit = () => {
        if (commentText.trim()) {
            onAddComment(commentText.trim());
            setCommentText('');
        }
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
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.sheetContainer}>
                        {/* Handle Bar */}
                        <View style={styles.handleBar} />

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                Comments {comments.length > 0 && `(${comments.length})`}
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Comments List */}
                        <ScrollView
                            style={styles.commentsList}
                            contentContainerStyle={styles.commentsListContent}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled
                        >
                            {comments.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="chatbubble-outline" size={48} color={COLORS.textExtraLight} />
                                    <Text style={styles.emptyText}>No comments yet</Text>
                                    <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                                </View>
                            ) : (
                                comments.map((comment) => (
                                    <View key={comment.id} style={styles.commentItem}>
                                        <View style={styles.commentAvatar}>
                                            <Text style={styles.commentAvatarText}>
                                                {comment.userName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.commentContent}>
                                            <View style={styles.commentHeader}>
                                                <Text style={styles.commentUserName}>{comment.userName}</Text>
                                                <Text style={styles.commentTime}>
                                                    {formatTimestamp(comment.timestamp)}
                                                </Text>
                                            </View>
                                            <Text style={styles.commentText}>{comment.content}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        {/* Add Comment Input */}
                        <View style={styles.inputContainer}>
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
                        </View>
                    </View>
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
    container: {
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    commentsList: {
        flexGrow: 0,
        flexShrink: 1,
    },
    commentsListContent: {
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textLight,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textExtraLight,
        marginTop: 4,
    },
    commentItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    commentAvatarText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
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
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        maxHeight: 80,
        paddingVertical: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#F3F4F6',
    },
});
