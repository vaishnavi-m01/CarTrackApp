import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
    Alert,
    Keyboard,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/MainNavigator';
import { useChat } from '../hooks/useChat';

type ChatDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatDetail'>;
type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen() {
    const navigation = useNavigation<ChatDetailScreenNavigationProp>();
    const route = useRoute<ChatDetailScreenRouteProp>();
    const { userId: otherUserId, userName, userImage, initialMessage } = route.params;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // Initialize Real Chat Hook
    const { messages, isConnected, isOtherTyping, isOtherOnline, sendMessage, sendTypingStatus } = useChat(
        Number(user?.id),
        Number(otherUserId)
    );

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialSentRef = useRef(false);

    const [keyboardHeight, setKeyboardHeight] = useState(new Animated.Value(0));

    useEffect(() => {
        if (Platform.OS === 'android') {
            const kbShow = Keyboard.addListener('keyboardDidShow', e => {
                Animated.timing(keyboardHeight, {
                    toValue: e.endCoordinates.height,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            });
            const kbHide = Keyboard.addListener('keyboardDidHide', () => {
                Animated.timing(keyboardHeight, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
            });
            return () => {
                kbShow.remove();
                kbHide.remove();
            };
        }
    }, []);

    // Handle initial message from Story Reply
    useEffect(() => {
        if (initialMessage && isConnected && !initialSentRef.current) {
            sendMessage(initialMessage);
            initialSentRef.current = true;
            // Clear message from navigation params to prevent re-send on mount
            navigation.setParams({ initialMessage: undefined } as any);
        }
    }, [initialMessage, isConnected, sendMessage, navigation]);

    // Add header menu
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={(typeof userImage === 'string' && userImage.trim() !== '') ? { uri: userImage } : (userImage && typeof userImage !== 'string' ? userImage : COLORS.defaultProfileImage)}
                        style={styles.headerAvatar}
                    />
                    <View>
                        <Text style={styles.headerName}>{userName}</Text>
                        <Text style={[
                            styles.headerStatus,
                            isOtherTyping && { color: '#4CD964', fontWeight: 'bold' },
                            !isOtherTyping && isOtherOnline && { color: '#4CD964' }
                        ]}>
                            {isOtherTyping ? 'Typing...' : (isOtherOnline ? '● Online' : 'Offline')}
                        </Text>
                    </View>
                </View>
            ),
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 15 }}
                    onPress={() => Alert.alert('Options', 'Select an action', [
                        { text: 'View Profile', onPress: () => navigation.navigate('OtherUserProfile' as any, { userId: otherUserId, userName }) },
                        { text: 'Mute Notifications', onPress: () => { } },
                        { text: 'Block User', style: 'destructive', onPress: () => { } },
                        { text: 'Cancel', style: 'cancel' }
                    ])}
                >
                    <Ionicons name="ellipsis-vertical" size={22} color={COLORS.white} />
                </TouchableOpacity>
            )
        });
    }, [navigation, otherUserId, userName, isConnected, isOtherTyping, isOtherOnline, userImage]);

    const [messageText, setMessageText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const handleTextChange = (text: string) => {
        setMessageText(text);

        // Send typing status
        sendTypingStatus(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to send "stopped typing"
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
        }, 2000);
    };

    const handleSend = () => {
        if (messageText.trim()) {
            const success = sendMessage(messageText.trim());
            if (success) {
                setMessageText('');
                sendTypingStatus(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
            } else {
                Alert.alert("Error", "Not connected to chat server");
            }
        }
    };

    const handleAttach = () => {
        Alert.alert(
            'Share Content',
            'Select an option to share in chat:',
            [
                { text: '📷 Camera', onPress: handleCameraLaunch },
                { text: '🖼️ Gallery', onPress: handleImagePicker },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleCameraLaunch = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need camera permissions to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            sendMediaMessage(result.assets[0].uri);
        }
    };

    const handleImagePicker = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need gallery permissions to pick photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            sendMediaMessage(result.assets[0].uri);
        }
    };

    const sendMediaMessage = (uri: string) => {
        sendMessage(uri, 'IMAGE');
        setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = String(item.senderId) === String(user?.id);
        const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
            <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
                {!isMe && (
                    <Image
                        source={(typeof userImage === 'string' && userImage.trim() !== '') ? { uri: userImage } : (userImage && typeof userImage !== 'string' ? userImage : COLORS.defaultProfileImage)}
                        style={styles.messageAvatar}
                    />
                )}
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    {item.type === 'IMAGE' && (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800' }} style={styles.bubbleImage} />
                            {item.content && <Text style={[styles.imageCaption, isMe ? styles.myText : styles.otherText]}>{item.content}</Text>}
                        </View>
                    )}
                    {item.type !== 'IMAGE' && <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>{item.content}</Text>}
                    <Text style={[styles.bubbleTime, isMe ? styles.myTime : styles.otherTime]}>{timeStr}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                enabled={true}
            >
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        contentContainerStyle={[styles.chatList, { paddingBottom: 10 }]}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        keyboardDismissMode="on-drag"
                        keyboardShouldPersistTaps="handled"
                        ListFooterComponent={
                            isOtherTyping ? (
                                <View style={styles.typingRow}>
                                    <Image
                                        source={(typeof userImage === 'string' && userImage.trim() !== '') ? { uri: userImage } : (userImage && typeof userImage !== 'string' ? userImage : COLORS.defaultProfileImage)}
                                        style={styles.messageAvatar}
                                    />
                                    <View style={styles.typingBubble}>
                                        <Text style={styles.typingDots}>• • •</Text>
                                    </View>
                                </View>
                            ) : null
                        }
                    />
                </View>

                <View style={[
                    styles.inputContainer,
                    { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12 }
                ]}>
                    <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
                        <Ionicons name="add" size={28} color={COLORS.textLight} />
                    </TouchableOpacity>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={COLORS.textExtraLight}
                            value={messageText}
                            onChangeText={handleTextChange}
                            multiline
                        />
                        <TouchableOpacity style={styles.emojiBtn}>
                            <Ionicons name="happy-outline" size={24} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!messageText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                {Platform.OS === 'android' && (
                    <Animated.View style={{ height: keyboardHeight }} />
                )}
            </KeyboardAvoidingView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerName: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatus: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    chatList: {
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    myRow: {
        justifyContent: 'flex-end',
    },
    otherRow: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 4,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myText: {
        color: COLORS.white,
    },
    otherText: {
        color: COLORS.text,
    },
    bubbleTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    otherTime: {
        color: COLORS.textLight,
    },
    imageContainer: {
        width: 240,
        marginBottom: 5,
    },
    bubbleImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    imageCaption: {
        fontSize: 14,
        marginTop: 8,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.medium,
    },
    attachBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.extraLightGray,
        borderRadius: 25,
        paddingHorizontal: 15,
        marginHorizontal: 10,
        minHeight: 44,
        maxHeight: 100,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 15,
        paddingVertical: 10,
    },
    emojiBtn: {
        padding: 5,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    sendBtnDisabled: {
        backgroundColor: '#CBD5E1',
        opacity: 0.8,
    },
    typingRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 10,
    },
    typingBubble: {
        backgroundColor: COLORS.extraLightGray || '#F1F5F9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        marginLeft: 8,
    },
    typingDots: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textLight,
        letterSpacing: 2,
    },
});
