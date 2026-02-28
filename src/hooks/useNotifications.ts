import { useState, useEffect, useRef } from "react";
import { Platform, Alert, ToastAndroid } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import apiClient from "../api/apiClient";
import { useApp } from "../context/AppContext";
import { navigationRef } from "../navigation/NavigationService";

/**
 * Foreground notification behavior
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const useNotifications = (userId: string | number | undefined) => {
    const { fetchUnreadCount } = useApp();

    const [devicePushToken, setDevicePushToken] = useState<string>("");
    const [notification, setNotification] =
        useState<Notifications.Notification | undefined>();

    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        if (!userId) {
            // If user logged out, clear token locally
            setDevicePushToken("");
            return;
        }

        console.log("🚀 Notification system starting for user:", userId);

        /**
         * Get token and register
         */
        setupNotifications(userId);

        /**
         * Foreground notification listener
         */
        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                console.log(
                    "Foreground notification:",
                    notification.request.content.title
                );

                setNotification(notification);
                fetchUnreadCount();
            });

        /**
         * When user taps notification
         */
        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(async (response) => {
                console.log("📩 Notification clicked:", response);
                const data = response.notification.request.content.data as {
                    type?: string;
                    referenceId?: string | number;
                    senderId?: string | number;
                    senderName?: string;
                    senderImage?: string;
                };

                const type = data?.type || "";
                const referenceId = data?.referenceId;

                console.log("📍 Processing notification navigation. Type:", type, "ID:", referenceId);

                try {
                    if (type.includes('POST') && referenceId) {
                        // Fetch the full post data
                        try {
                            console.log(`🌐 Fetching post data for ID: ${referenceId}`);
                            const res = await apiClient.get(`/post/${referenceId}?viewerId=${userId}`);
                            const postData = res.data?.post || res.data;
                            if (postData) {
                                console.log("✅ Post data fetched successfully. Mapped and navigating...");
                                const mappedPost = {
                                    id: postData.id,
                                    userId: postData.userId,
                                    userName: postData.user?.username || `User ${postData.userId}`,
                                    userAvatar: postData.user?.profilePicUrl,
                                    user: postData.user,
                                    content: postData.content || '',
                                    media: (postData.media || []).map((m: any) => ({
                                        id: m.id, postId: m.postId, mediaUrl: m.mediaUrl,
                                        type: m.type || 'image', aspectRatio: m.aspectRatio || 1
                                    })),
                                    createdAt: postData.createdAt,
                                    likes: postData.likesCount || 0,
                                    likesCount: postData.likesCount,
                                    likedByUser: postData.likedByUser || false,
                                    isSaved: postData.saved || false,
                                    comments: [],
                                    commentCount: postData.commentsCount || 0,
                                    commentsCount: postData.commentsCount,
                                    views: postData.viewsCount || 0,
                                    location: postData.location,
                                    feeling: postData.feeling,
                                    allowComments: postData.allowComments ?? true,
                                    isPublic: postData.isPublic ?? true,
                                    vehicleId: postData.vehicleId,
                                };
                                navigationRef.navigate('PostDetail', {
                                    initialPost: mappedPost as any,
                                    allPosts: [mappedPost] as any
                                });
                            } else {
                                console.error("⚠️ No post data in response");
                                navigationRef.navigate('CommunityNotifications', { filter: 'community' });
                            }
                        } catch (err) {
                            console.error("❌ Error fetching post for notification:", err);
                            navigationRef.navigate('CommunityNotifications', { filter: 'community' });
                        }
                    } else if (type === 'CHAT_MESSAGE') {
                        console.log("💬 Navigating to ChatDetail for:", type);
                        if (data.senderId) {
                            navigationRef.navigate('ChatDetail', {
                                userId: String(data.senderId),
                                userName: data.senderName || 'Chat',
                                userImage: data.senderImage
                            });
                        }
                    } else if (type === 'STORY_LIKE' || type === 'STORY_COMMENT' || type === 'LIKE' || type === 'COMMENT') {
                        console.log("🔔 Community activity (Story/Post). Navigating to Community Notifications.");
                        navigationRef.navigate('CommunityNotifications', { filter: 'community' });
                    } else if (type === 'NEW_FOLLOWER' || type === 'FOLLOW_REQUEST' || type === 'FOLLOW_ACCEPTED') {
                        console.log("👤 Follow activity. Navigating to User Profile.");
                        if (data.senderId) {
                            navigationRef.navigate('OtherUserProfile', {
                                userId: String(data.senderId),
                                userName: data.senderName || ''
                            });
                        }
                    } else if (type === 'SYSTEM_ALERT' || type === 'NEWS_ALERT' || type === 'INSURANCE_ALERT' || type === 'SERVICE_ALERT') {
                        console.log("⚙️ System alert. Navigating to System Notifications.");
                        navigationRef.navigate('SystemNotifications', { filter: 'system' });
                    }
                } catch (error) {
                    console.error("❌ Error handling notification click:", error);
                }
            });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }

            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [userId]);

    const setupNotifications = async (uid: string | number) => {
        try {
            console.log("🔗 API Base URL:", apiClient.defaults.baseURL);
            const result = await registerForPushNotificationsAsync();

            if (result.token) {
                console.log("✅ Device Token:", result.token);
                setDevicePushToken(result.token);
                await registerTokenWithBackend(uid, result.token);
            } else {
                console.log("❌ Failed to get device token:", result.error);
                // if (!__DEV__) {
                //     Alert.alert(
                //         "Notification Error",
                //         `Reason: ${result.error}\n\nCheck if Google Play Services are up to date and Firebase SHA-1 is correct.`
                //     );
                // }
            }
        } catch (error) {
            console.error("❌ Error setting up notifications:", error);
            if (!__DEV__) {
                Alert.alert("Notification Error", "Setup failed: " + (error instanceof Error ? error.message : "unknown"));
            }
        }
    };

    /**
     * Send token to backend
     */
    const registerTokenWithBackend = async (
        uid: string | number,
        token: string
    ) => {
        try {
            console.log("📤 Registering token to:", apiClient.defaults.baseURL + "/notifications/register-token");
            await apiClient.post("/notifications/register-token", {
                userId: Number(uid),
                token: token,
                platform: Platform.OS,
            });

            console.log("✅ Token registered with backend for user:", uid);
            // if (!__DEV__) {
            //     if (Platform.OS === 'android') {
            //         ToastAndroid.show("Notification Token Registered", ToastAndroid.SHORT);
            //     }    
            // }
        } catch (error: any) {
            console.error("❌ Error registering token:", error);
            if (!__DEV__) {
                Alert.alert(
                    "Token Registration Failed",
                    `URL: ${apiClient.defaults.baseURL}/notifications/register-token\nError: ${error.message}`
                );
            }
        }
    };

    /**
     * Unregister token from backend (e.g., on logout)
     */
    const unregisterTokenWithBackend = async (uid: string | number) => {
        try {
            const pushToken = await Notifications.getDevicePushTokenAsync();
            const token = pushToken.data;
            await apiClient.post("/notifications/unregister-token", {
                userId: String(uid),
                token: token,
            });
            console.log("✅ Token unregistered for user:", uid);
        } catch (error) {
            console.error("❌ Error unregistering token:", error);
        }
    };

    return { devicePushToken, notification, unregisterTokenWithBackend };
};

/**
 * Get Device Push Token
 */
async function registerForPushNotificationsAsync(): Promise<{ token?: string, error?: string }> {
    if (!Device.isDevice) {
        return { error: "Must use a physical device" };
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
            showBadge: true,
            enableVibrate: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    }

    /**
     * Request permission
     */
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        return { error: "Permission denied" };
    }

    try {
        /**
         * Get Native Device Token (for production)
         */
        const pushToken = await Notifications.getDevicePushTokenAsync();
        const token = pushToken.data;
        console.log("📱 Native Device Token:", token);

        return { token };
    } catch (error: any) {
        console.error("❌ Failed to get push token:", error);
        return { error: error.message || "Failed to get device token" };
    }
}
