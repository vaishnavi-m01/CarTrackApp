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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootTabParamList, RootStackParamList } from '../navigation/MainNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type ProfileScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, 'Profile'>,
    StackNavigationProp<RootStackParamList>
>;

interface ProfileScreenProps {
    navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
    const { vehicles, communityPosts, wishlist } = useApp();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

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

        if (!result.canceled) {
            setAvatarImage(result.assets[0].uri);
        }
    };

    // Data derived for tabs
    const userPosts = communityPosts.filter(p => p.userId === user?.id && p.media && p.media.length > 0);
    const savedPosts = communityPosts.filter(p => wishlist.includes(p.id));

    const displayPosts = activeTab === 'posts' ? userPosts : savedPosts;

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
                        <TouchableOpacity
                            style={styles.settingsBtnSmall}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Ionicons name="settings-outline" size={22} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Overlapping Profile Info Section */}
                <View style={styles.profileOverlappingContainer}>
                    <TouchableOpacity
                        style={styles.mainAvatarContainer}
                        onPress={pickImage}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: avatarImage || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200' }}
                            style={styles.mainAvatar}
                        />
                        <View style={styles.cameraIconBadgeProminent}>
                            <Ionicons name="camera" size={14} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.nameText}>{user?.name || 'Alex "Turbo" Rivera'}</Text>
                    <Text style={styles.handleText}>@{user?.name ? user.name.toLowerCase().replace(/\s+/g, '_') : 'alex_911_turbo'}</Text>
                    <Text style={styles.bioText}>Automotive Enthusiast | Track Day Junkie | Miami, FL</Text>

                    {/* Edit Profile Action */}
                    <TouchableOpacity
                        style={styles.editProfileBtnNeat}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Text style={styles.editProfileBtnTextNeat}>Edit Profile</Text>
                    </TouchableOpacity>

                    {/* Stats Section (Elegant Bordered) */}
                    <View style={styles.elegantStatsCardNeat}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValueText}>124</Text>
                            <Text style={styles.statLabelText}>POSTS</Text>
                        </View>
                        <View style={styles.statDividerNeat} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValueText}>2.5k</Text>
                            <Text style={styles.statLabelText}>FOLLOWERS</Text>
                        </View>
                        <View style={styles.statDividerNeat} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValueText}>{vehicles.length}</Text>
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

                {/* Posts Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{activeTab === 'posts' ? 'Posts' : 'Saved Posts'}</Text>
                    <View style={styles.postsActions}>
                        <TouchableOpacity
                            style={[styles.postActionBtn, activeTab === 'posts' && { borderColor: COLORS.primary }]}
                            onPress={() => setActiveTab('posts')}
                        >
                            <Ionicons name="grid" size={20} color={activeTab === 'posts' ? COLORS.primary : COLORS.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.postActionBtn, activeTab === 'saved' && { borderColor: COLORS.primary }]}
                            onPress={() => setActiveTab('saved')}
                        >
                            <Ionicons name="bookmark-outline" size={20} color={activeTab === 'saved' ? COLORS.primary : COLORS.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.postsGrid}>
                    {displayPosts.length > 0 ? displayPosts.map((post, index) => (
                        <TouchableOpacity
                            key={post.id}
                            style={styles.gridItem}
                            onPress={() => navigation.navigate('PostDetail', {
                                initialPost: post,
                                allPosts: displayPosts
                            })}
                        >
                            <Image source={{ uri: post.media[0].uri }} style={styles.gridImage} />
                        </TouchableOpacity>
                    )) : (
                        <View style={styles.emptyPosts}>
                            <Ionicons
                                name={activeTab === 'posts' ? "images-outline" : "bookmark-outline"}
                                size={40}
                                color={COLORS.border}
                            />
                            <Text style={styles.emptyPostsText}>
                                {activeTab === 'posts' ? 'No posts yet' : 'No saved posts'}
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
    postsActions: {
        flexDirection: 'row',
        gap: 12,
    },
    postActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#EEF2F7',
        ...SHADOWS.light,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 18,
        gap: 6,
    },
    gridItem: {
        width: (width - 40) / 3 - 4,
        height: (width - 40) / 3 - 4,
        margin: 0,
        borderRadius: 12,
        overflow: 'hidden',
        ...SHADOWS.light,
    },
    gridImage: {
        width: '100%',
        height: '100%',
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
    statDividerNeat: {
        width: 1,
        height: '65%',
        backgroundColor: '#E8EEF7',
    },
});
