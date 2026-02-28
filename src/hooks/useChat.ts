import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import config from '../config/enviroment';
import apiClient from '../api/apiClient';

// --- POLYFILLS ARE NOW IN index.js / utils/polyfills.ts ---

export interface Message {
    id?: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string | Date;
    type: 'TEXT' | 'IMAGE' | 'LOCATION';
    isRead: boolean;
}

export const useChat = (senderId: number, receiverId: number) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [isOtherOnline, setIsOtherOnline] = useState(false);
    const stompClient = useRef<Client | null>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);

    // Fetch History
    const fetchHistory = useCallback(async () => {
        try {
            const response = await apiClient.get(`/chat/history`, {
                params: { user1: senderId, user2: receiverId }
            });
            setMessages(response.data);
        } catch (error) {
            console.error("❌ Error fetching chat history:", error);
        }
    }, [senderId, receiverId]);

    useEffect(() => {
        fetchHistory();

        // Initialize STOMP client
        const client = new Client({
            brokerURL: config.apiBaseUrl.replace('http', 'ws') + '/ws', // Fallback to WebSocket directly
            webSocketFactory: () => new SockJS(config.apiBaseUrl + '/ws'),
            connectHeaders: {
                userId: String(senderId)
            },
            debug: (str) => {
                if (__DEV__) console.log('💬 STOMP:', str);
            },
            onConnect: () => {
                console.log('✅ Connected to WebSocket');
                setIsConnected(true);

                // Subscribe to private messages
                client.subscribe(`/user/${senderId}/queue/messages`, (message) => {
                    const newMessage = JSON.parse(message.body);
                    console.log('📩 New message received:', newMessage);

                    // Only add if it belongs to current conversation
                    if (newMessage.senderId === receiverId) {
                        setMessages(prev => [...prev, newMessage]);
                    }
                });

                // Subscribe to typing status
                client.subscribe(`/user/${senderId}/queue/typing`, (message) => {
                    const data = JSON.parse(message.body);
                    if (data.senderId === receiverId) {
                        setIsOtherTyping(data.isTyping);
                    }
                });

                // Subscribe to presence status
                client.subscribe(`/user/${senderId}/queue/presence`, (message) => {
                    const data = JSON.parse(message.body);
                    console.log('🌐 Presence update:', data);
                    if (String(data.userId) === String(receiverId)) {
                        setIsOtherOnline(data.isOnline);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('❌ STOMP error:', frame.headers['message']);
            },
            onDisconnect: () => {
                console.log('🔴 Disconnected from WebSocket');
                setIsConnected(false);
            }
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, [senderId, receiverId, fetchHistory]);

    // Send Message
    const sendMessage = useCallback((content: string, type: 'TEXT' | 'IMAGE' | 'LOCATION' = 'TEXT') => {
        if (stompClient.current && isConnected) {
            const chatMessage = {
                senderId,
                receiverId,
                content,
                type,
                timestamp: new Date().toISOString()
            };

            stompClient.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(chatMessage)
            });

            // Optimistically add to UI
            setMessages(prev => [...prev, { ...chatMessage, isRead: false }]);
            return true;
        }
        return false;
    }, [senderId, receiverId, isConnected]);

    // Send Typing Status
    const sendTypingStatus = useCallback((isTyping: boolean) => {
        if (stompClient.current && isConnected) {
            stompClient.current.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({
                    senderId,
                    receiverId,
                    isTyping
                })
            });
        }
    }, [senderId, receiverId, isConnected]);

    return { messages, isConnected, isOtherTyping, isOtherOnline, sendMessage, sendTypingStatus, fetchHistory };
};
