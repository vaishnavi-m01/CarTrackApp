import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_CHAT = [
    {
        id: '1',
        text: 'Yo! Check out the new exhaust I just installed on the Ducati. Sounds insane!',
        sender: 'other',
        time: '10:42 AM',
    },
    {
        id: '2',
        text: "No way! Is it the titanium system you were talking about?",
        sender: 'me',
        time: '10:43 AM',
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=800',
        sender: 'other',
        time: '10:45 AM',
        caption: "I'm heading here this weekend. You down?",
    },
    {
        id: '4',
        text: "Yeah, exactly. I'll send a clip later. That road looks prime!",
        sender: 'me',
        time: '10:46 AM',
    },
];

export default function ChatDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId, userName, userImage } = route.params as any;
    const insets = useSafeAreaInsets();

    // Add header menu
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 15 }}
                    onPress={() => Alert.alert('Options', 'Select an action', [
                        { text: 'View Profile', onPress: () => navigation.navigate('OtherUserProfile' as any, { userId, userName }) },
                        { text: 'Mute Notifications', onPress: () => { } },
                        { text: 'Block User', style: 'destructive', onPress: () => { } },
                        { text: 'Cancel', style: 'cancel' }
                    ])}
                >
                    <Ionicons name="ellipsis-vertical" size={22} color={COLORS.white} />
                </TouchableOpacity>
            )
        });
    }, [navigation, userId, userName]);

    const [message, setMessage] = useState('');
    const [chatMessages, setChatMessages] = useState(MOCK_CHAT);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (message.trim()) {
            const newMessage = {
                id: Date.now().toString(),
                text: message.trim(),
                sender: 'me',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setChatMessages([...chatMessages, newMessage]);
            setMessage('');
            setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
        }
    };

    const handleAttach = () => {
        Alert.alert(
            'Share Content',
            'Select an option to share in chat:',
            [
                { text: '📷 Camera', onPress: () => sendMockMedia('Photo') },
                { text: '🖼️ Gallery', onPress: () => sendMockMedia('Gallery') },
                { text: '📍 Location', onPress: () => sendMockMedia('Location') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const sendMockMedia = (type: string) => {
        const newMessage: any = {
            id: Date.now().toString(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        if (type === 'Location') {
            newMessage.text = "📍 Shared my location: 12.9716° N, 77.5946° E";
        } else {
            newMessage.image = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800';
            newMessage.caption = `Sent a ${type.toLowerCase()}!`;
        }

        setChatMessages(prev => [...prev, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
                {!isMe && <Image source={{ uri: userImage }} style={styles.messageAvatar} />}
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    {item.image && (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: item.image }} style={styles.bubbleImage} />
                            {item.caption && <Text style={[styles.imageCaption, isMe ? styles.myText : styles.otherText]}>{item.caption}</Text>}
                        </View>
                    )}
                    {item.text && <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>{item.text}</Text>}
                    <Text style={[styles.bubbleTime, isMe ? styles.myTime : styles.otherTime]}>{item.time}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 125 : 100}
            >
                <FlatList
                    ref={flatListRef}
                    data={chatMessages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                />

                <View style={[
                    styles.inputContainer,
                    { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 15) : Math.max(insets.bottom, 12) }
                ]}>
                    <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
                        <Ionicons name="add" size={28} color={COLORS.textLight} />
                    </TouchableOpacity>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={COLORS.textExtraLight}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <TouchableOpacity style={styles.emojiBtn}>
                            <Ionicons name="happy-outline" size={24} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
});
