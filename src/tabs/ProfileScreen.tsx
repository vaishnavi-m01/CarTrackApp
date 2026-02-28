import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    Alert,
    ActivityIndicator,
    ToastAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { CommunityPost } from '../types/Community';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootTabParamList, RootStackParamList } from '../navigation/MainNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommunityPostCard from '../components/CommunityPostCard';

const { width } = Dimensions.get('window');

type ProfileScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, 'Profile'>,
    StackNavigationProp<RootStackParamList>
>;

interface ProfileScreenProps {
    navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
    const { vehicles, wishlist, fetchWishlist } = useApp();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'media' | 'content' | 'savedMedia' | 'savedContent'>('media');
    const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
    const [savedPosts, setSavedPosts] = useState<CommunityPost[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    const [isUploading, setIsUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && user) {
            const asset = result.assets[0];
            setAvatarImage(asset.uri); // Show immediately (optimistic update)

            // Auto-upload to API: POST /users/{id}/upload-profile-pic
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri,
                    name: asset.fileName || 'profile.jpg',
                    type: asset.mimeType || 'image/jpeg',
                } as any);

                await apiClient.post(`/users/${user.id}/upload-profile-pic`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                // Refresh profile so the header shows the new image
                await fetchUserProfile();
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Profile picture updated!', ToastAndroid.SHORT);
                } else {
                    Alert.alert('✅ Success', 'Profile picture updated!');
                }
            } catch (error) {
                console.error('Failed to upload profile picture:', error);
                Alert.alert('Upload Failed', 'Could not update your profile picture. Please try again.');
                setAvatarImage(null); // Revert optimistic update on failure
            } finally {
                setIsUploading(false);
            }
        }
    };

    React.useEffect(() => {
        if (user) {
            fetchUserProfile();
            fetchUserPosts();
            fetchSavedPosts();
        }
    }, [user, activeTab]);

    const fetchUserProfile = async () => {
        if (!user) return;
        setIsProfileLoading(true);
        try {
            const response = await apiClient.get(`/users/${user.id}`);
            setUserProfile(response.data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/post?userId=${user.id}&viewerId=${user.id}`);
            const data = response.data || [];
            setUserPosts(mapPosts(data));
        } catch (error) {
            console.error('Error fetching user posts:', error);
        }
    };

    const fetchSavedPosts = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/post/saved?userId=${user.id}`);
            const data = response.data || [];
            setSavedPosts(mapPosts(data));
        } catch (error) {
            console.error('Error fetching saved posts:', error);
        }
    };

    const mapPosts = (posts: any[]): CommunityPost[] => {
        return posts.map(dto => {
            const post = dto.post || dto;
            return {
                id: post.id,
                userId: post.userId,
                userName: post.user?.username || `User ${post.userId}`,
                userAvatar: post.user?.profilePicUrl,
                user: post.user,
                content: post.content,
                media: (post.media || []).map((m: any) => ({
                    id: m.id,
                    postId: m.postId,
                    mediaUrl: m.mediaUrl,
                    type: m.type || 'image',
                    aspectRatio: m.aspectRatio || 1
                })),
                createdAt: post.createdAt,
                likes: post.likesCount || 0,
                likesCount: post.likesCount,
                likedByUser: dto.likedByUser || false,
                isSaved: dto.isSaved || dto.saved || false,
                comments: (post.comments || []).map((c: any) => ({
                    id: c.id,
                    userId: c.userId,
                    userName: c.userName || 'Unknown',
                    content: c.content,
                    timestamp: c.createdAt,
                    likes: 0
                })),
                commentCount: post.commentsCount || 0,
                commentsCount: post.commentsCount,
                views: post.viewsCount || 0,
                viewsCount: post.viewsCount,
                savesCount: post.savesCount,
                location: post.location,
                feeling: post.feeling,
                allowComments: post.allowComments ?? true,
                isPublic: post.isPublic ?? true,
                vehicleId: post.vehicleId,
                tags: post.tags || []
            };
        });
    };

    const userMediaPosts = userPosts.filter(p => p.media && p.media.length > 0);
    const userContentPosts = userPosts.filter(p => !p.media || p.media.length === 0);
    const savedMediaPosts = savedPosts.filter(p => p.media && p.media.length > 0);
    const savedContentPosts = savedPosts.filter(p => !p.media || p.media.length === 0);

    const getDisplayPosts = () => {
        switch (activeTab) {
            case 'media': return userMediaPosts;
            case 'content': return userContentPosts;
            case 'savedMedia': return savedMediaPosts;
            case 'savedContent': return savedContentPosts;
            default: return userMediaPosts;
        }
    };

    const displayPosts = getDisplayPosts();

    const renderGridItem = (post: CommunityPost) => {
        const firstMedia = post.media?.[0];
        const isVideo = firstMedia?.type?.includes('video');
        const isMulti = post.media && post.media.length > 1;

        return (
            <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                onPress={() => navigation.navigate('PostDetail', { initialPost: post, allPosts: displayPosts })}
            >
                {isVideo ? (
                    <View style={styles.premiumVideoCard}>
                        <Image source={{ uri: firstMedia.mediaUrl }} style={styles.gridImage} />
                        <View style={styles.videoOverlayGradient}>
                            <Ionicons name="play" size={24} color={COLORS.white} style={styles.videoPlayIcon} />
                        </View>
                        <View style={styles.reelsBadge}>
                            <Ionicons name="videocam" size={10} color={COLORS.white} />
                            <Text style={styles.reelsBadgeText}>REEL</Text>
                        </View>
                    </View>
                ) : (
                    <>
                        <Image source={{ uri: firstMedia?.mediaUrl }} style={styles.gridImage} />
                        {isMulti && (
                            <View style={styles.cardIcon}>
                                <Ionicons name="copy" size={16} color={COLORS.white} />
                            </View>
                        )}
                    </>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: COLORS.primary }]}>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={true}
                overScrollMode="never"
            >
                {/* Premium Gradient Header */}
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={[
                        styles.expenseStyleHeader,
                        { height: 90 + insets.top }
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTopRow}>
                        <View style={styles.headerTitleSection}>
                            <Text style={styles.headerTitle}>Profile</Text>
                            <Text style={styles.headerSubtitle}>Your automotive identity</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <TouchableOpacity
                                style={styles.settingsBtnSmall}
                                onPress={() => navigation.navigate('EditProfile')}
                            >
                                <MaterialIcons name="edit" size={22} color={COLORS.white} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.settingsBtnSmall}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <Ionicons name="settings-outline" size={22} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Overlapping Profile Info Section */}
                <View style={styles.profileOverlappingContainer}>
                    <TouchableOpacity
                        style={styles.mainAvatarContainer}
                        onPress={pickImage}
                        activeOpacity={0.8}
                        disabled={isUploading}
                    >
                        <Image
                            source={(avatarImage || userProfile?.profilePicUrl || user?.profilePicUrl) ? { uri: avatarImage || userProfile?.profilePicUrl || user?.profilePicUrl } : COLORS.defaultProfileImage}
                            style={styles.mainAvatar}
                        />
                        {/* Uploading overlay */}
                        {isUploading && (
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        )}
                        <View style={styles.cameraIconBadgeProminent}>
                            <Ionicons name="camera" size={14} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={styles.nameText}>{userProfile?.name || user?.name || userProfile?.username || user?.username || 'User'}</Text>
                        {userProfile?.isPrivate && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}>
                                <Ionicons name="lock-closed" size={10} color={COLORS.textLight} />
                                <Text style={{ fontSize: 9, color: COLORS.textLight, marginLeft: 3, fontWeight: 'bold' }}>PRIVATE</Text>
                            </View>
                        )}
                    </View>
                    {((userProfile?.name || user?.name) && (userProfile?.username || user?.username) && (userProfile?.name || user?.name) !== (userProfile?.username || user?.username)) && (
                        <Text style={[styles.handleText, { marginTop: -2 }]}>@{userProfile?.username || user?.username || 'user'}</Text>
                    )}
                    {userProfile?.email && <Text style={styles.emailText}>{userProfile.email}</Text>}
                    <Text style={styles.bioText}>{userProfile?.bio || 'Automotive Enthusiast | Track Day Junkie'}</Text>


                    {/* Stats Section (Elegant Bordered) */}
                    <View style={styles.elegantStatsCardNeat}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValueText}>{userPosts.length}</Text>
                            <Text style={styles.statLabelText}>POSTS</Text>
                        </View>
                        <View style={styles.statDividerNeat} />
                        <TouchableOpacity
                            style={styles.statBox}
                            onPress={() => navigation.navigate('Followers', { userId: user?.id || 0, type: 'followers' })}
                        >
                            <Text style={styles.statValueText}>{userProfile?.followersCount || 0}</Text>
                            <Text style={styles.statLabelText}>FOLLOWERS</Text>
                        </TouchableOpacity>
                        <View style={styles.statDividerNeat} />
                        <TouchableOpacity
                            style={styles.statBox}
                            onPress={() => navigation.navigate('Followers', { userId: user?.id || 0, type: 'following' })}
                        >
                            <Text style={styles.statValueText}>{userProfile?.followingCount || 0}</Text>
                            <Text style={styles.statLabelText}>FOLLOWING</Text>
                        </TouchableOpacity>
                        <View style={styles.statDividerNeat} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValueText}>{userProfile?.garageCount || vehicles.length}</Text>
                            <Text style={styles.statLabelText}>GARAGE</Text>
                        </View>
                    </View>
                </View>

                {/* My Garage Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Garage</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MyVehicles')}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.garageScroll}
                >
                    {vehicles.length > 0 ? vehicles.map((v) => (
                        <TouchableOpacity
                            key={v.id}
                            style={styles.garageCard}
                            onPress={() => navigation.navigate('VehicleDetails', { vehicle: v })}
                        >
                            <Image source={{ uri: v.image }} style={styles.garageImage} />
                            <View style={styles.garageOverlay}>
                                <View style={styles.garageBadge}>
                                    <Text style={styles.garageBadgeText}>ACTIVE</Text>
                                </View>
                                <View>
                                    <Text style={styles.vehicleYear}>{v.year} {v.brand}</Text>
                                    <Text style={styles.vehicleModel} numberOfLines={1}>{v.model}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )) : (
                        <TouchableOpacity
                            style={styles.addVehicleCard}
                            onPress={() => navigation.navigate('AddVehicle')}
                        >
                            <Ionicons name="add" size={30} color={COLORS.textLight} />
                            <Text style={styles.addVehicleText}>Add Vehicle</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* Asymmetric Tabs */}
                <View style={styles.tabsContainer}>
                    <Text style={styles.tabLabelLeft}>
                        {activeTab === 'media' && 'Posts'}
                        {activeTab === 'content' && 'Activity'}
                        {activeTab === 'savedMedia' && 'Saved Media'}
                        {activeTab === 'savedContent' && 'Saved Activity'}
                    </Text>

                    <View style={styles.tabIconsRightGrp}>
                        <TouchableOpacity
                            style={[styles.tabIconBtn, activeTab === 'media' && styles.tabIconBtnActive]}
                            onPress={() => setActiveTab('media')}
                        >
                            <Ionicons
                                name={activeTab === 'media' ? "grid" : "grid-outline"}
                                size={20}
                                color={activeTab === 'media' ? COLORS.primary : COLORS.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabIconBtn, activeTab === 'content' && styles.tabIconBtnActive]}
                            onPress={() => setActiveTab('content')}
                        >
                            <Ionicons
                                name={activeTab === 'content' ? "document-text" : "document-text-outline"}
                                size={20}
                                color={activeTab === 'content' ? COLORS.primary : COLORS.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabIconBtn, activeTab === 'savedMedia' && styles.tabIconBtnActive]}
                            onPress={() => setActiveTab('savedMedia')}
                        >
                            <Ionicons
                                name={activeTab === 'savedMedia' ? "bookmark" : "bookmark-outline"}
                                size={20}
                                color={activeTab === 'savedMedia' ? COLORS.primary : COLORS.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabIconBtn, activeTab === 'savedContent' && styles.tabIconBtnActive]}
                            onPress={() => setActiveTab('savedContent')}
                        >
                            <Ionicons
                                name={activeTab === 'savedContent' ? "bookmarks" : "bookmarks-outline"}
                                size={20}
                                color={activeTab === 'savedContent' ? COLORS.primary : COLORS.textLight}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.postsList}>
                    {displayPosts.length > 0 ? (
                        (activeTab === 'media' || activeTab === 'savedMedia') ? (
                            <View style={styles.postsGrid}>
                                {displayPosts.map(renderGridItem)}
                            </View>
                        ) : (
                            displayPosts.map((post) => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    onLike={() => { }}
                                    onComment={() => navigation.navigate('PostDetail', { initialPost: post, allPosts: displayPosts })}
                                    onShare={() => { }}
                                    onImagePress={() => navigation.navigate('PostDetail', { initialPost: post, allPosts: displayPosts })}
                                    isSaved={post.isSaved}
                                />
                            ))
                        )
                    ) : (
                        <View style={styles.emptyPosts}>
                            <Ionicons
                                name={activeTab.includes('media') ? "images-outline" : "document-text-outline"}
                                size={40}
                                color={COLORS.border}
                            />
                            <Text style={styles.emptyPostsText}>
                                {activeTab === 'media' && 'No photos or videos yet'}
                                {activeTab === 'content' && 'No text posts yet'}
                                {activeTab === 'savedMedia' && 'No saved photos or videos'}
                                {activeTab === 'savedContent' && 'No saved content'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        backgroundColor: COLORS.background,
        paddingBottom: 0,
    },
    expenseStyleHeader: {
        width: '100%',
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        justifyContent: 'center',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerTitleSection: {
        flex: 1,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
    },
    settingsBtnSmall: {
        width: 38,
        height: 38,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    profileOverlappingContainer: {
        alignItems: 'center',
        marginTop: -35,
        paddingHorizontal: 20,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingTop: 12,
        paddingBottom: 10,
    },
    mainAvatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 5,
        borderColor: COLORS.white,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        ...SHADOWS.dark,
        position: 'relative',
    },
    mainAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    cameraIconBadgeProminent: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: COLORS.white,
        ...SHADOWS.dark,
        zIndex: 10,
    },
    nameText: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 2,
    },
    handleText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '700',
        marginBottom: 2,
    },
    emailText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 8,
    },
    bioText: {
        fontSize: 13,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 25,
        marginBottom: 12,
        fontWeight: '500',
    },
    editProfileBtnNeat: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 8,
        borderRadius: 14,
        marginBottom: 14,
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
    },
    editProfileBtnTextNeat: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
    },
    elegantStatsCardNeat: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#E8EEF7',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'space-around',
        ...SHADOWS.medium,
    },
    statDividerNeat: {
        width: 1,
        height: '60%',
        backgroundColor: '#E2E8F0',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValueText: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 2,
    },
    statLabelText: {
        fontSize: 10,
        color: COLORS.textExtraLight,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 18,
        marginBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
    },
    viewAllText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '700',
    },
    garageScroll: {
        paddingLeft: 20,
        paddingRight: 10,
    },
    garageCard: {
        width: width * 0.45,
        height: 130,
        borderRadius: 24,
        marginRight: 15,
        overflow: 'hidden',
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1.5,
        borderColor: '#EEF2F7',
        ...SHADOWS.medium,
    },
    garageImage: {
        width: '100%',
        height: '100%',
    },
    garageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 12,
        justifyContent: 'space-between',
    },
    garageBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    garageBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    vehicleYear: {
        fontSize: 10,
        color: '#ccc',
        fontWeight: 'bold',
    },
    vehicleModel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    addVehicleCard: {
        width: 130,
        height: 130,
        borderRadius: 24,
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    addVehicleText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 6,
    },
    postsList: {
        width: '100%',
        backgroundColor: COLORS.background,
    },
    tabsContainer: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: COLORS.background,
        paddingHorizontal: 20,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
        marginTop: 5,
    },
    tabLabelLeft: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
    },
    tabIconsRightGrp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tabIconBtn: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabIconBtnActive: {
        // Keeps it simple, only icon color change
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        gap: 2,
    },
    gridItem: {
        width: (width - 30 - 4) / 3, // 30 is horizontal padding, 4 is gap total
        height: (width - 30 - 4) / 3,
        marginBottom: 2,
        overflow: 'hidden',
        backgroundColor: COLORS.border,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    premiumTextCard: {
        width: '100%',
        height: '100%',
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    premiumTextPreview: {
        fontSize: 11,
        color: COLORS.white,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 14,
    },
    cardIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    premiumVideoCard: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
    },
    videoOverlayGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlayIcon: {
        opacity: 0.9,
    },
    reelsBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    reelsBadgeText: {
        color: COLORS.white,
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    emptyPosts: {
        width: '100%',
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.6,
    },
    emptyPostsText: {
        color: COLORS.textLight,
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        ...SHADOWS.dark,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainerNeat: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 15,
        marginBottom: 10,
        gap: 12,
    },
    tabButtonNeat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#EEF2F7',
        ...SHADOWS.light,
    },
    activeTabButtonNeat: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.medium,
    },
    tabButtonTextNeat: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textLight,
    },
    activeTabButtonTextNeat: {
        color: COLORS.white,
    },
});
