import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Animated, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { NavigatorScreenParams } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
// import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Screens
import HomeScreen from '../tabs/HomeScreen';
import MarketScreen from '../tabs/MarketScreen';
import ExpensesScreen from '../tabs/ExpensesScreen';
import CommunityScreen from '../tabs/CommunityScreen';
import ProfileScreen from '../tabs/ProfileScreen';
import OtherUserProfileScreen from '../screens/OtherUserProfileScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import LoanCalculatorScreen from '../screens/LoanCalculatorScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import AddFuelScreen from '../screens/AddFuelScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import MyVehiclesScreen from '../screens/MyVehiclesScreen';
import VehicleLogsScreen from '../screens/VehicleLogsScreen';
import VehicleDocumentsScreen from '../screens/VehicleDocumentsScreen';
import AddDocumentScreen from '../screens/AddDocumentScreen';
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';
import GalleryScreen from '../screens/GalleryScreen';
import TripsScreen from '../screens/TripsScreen';
import AddTripScreen from '../screens/AddTripScreen';
import RenewInsuranceScreen from '../screens/RenewInsuranceScreen';
import StackHeader from '../components/StackHeader';
import InsuranceScreen from '../screens/InsuranceScreen';
import ServiceRecordsScreen from '../screens/ServiceRecordsScreen';
import AddServiceScreen from '../screens/AddServiceScreen';
import VehicleSpecScreen from '../screens/VehicleSpecScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import AddStoryScreen from '../screens/AddStoryScreen';
import StoryViewerScreen from '../screens/StoryViewerScreen';
import NewsScreen from '../tabs/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { StoryGroup } from '../types/Story';
import { useAuth } from '../context/AuthContext';
import { useApp, VehicleDocument } from '../context/AppContext';
import { CommunityPost } from '../types/Community';
import SplashScreen from '../screens/SplashScreen';

import MessagesScreen from '../screens/MessagesScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import SystemNotificationsScreen from '../screens/SystemNotificationsScreen';
import CommunityNotificationsScreen from '../screens/CommunityNotificationsScreen';
import FollowersScreen from '../screens/FollowersScreen';
import DiscoverPeopleScreen from '../screens/DiscoverPeopleScreen';


export type RootTabParamList = {
    Home: undefined;
    Market: undefined;
    Expenses: undefined;
    Community: undefined;
    Profile: undefined;
};


const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Define RootStackParamList
export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Register: undefined;
    MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
    VehicleDetails: { vehicle?: any; id?: string };
    Comparison: undefined;
    LoanCalculator: { amount?: string };
    AddVehicle: undefined;
    AddFuel: { vehicleId?: string; fuelLog?: any };
    AddExpense: undefined;
    MyVehicles: undefined;
    VehicleLogs: { vehicle: any };
    Expenses: undefined;
    VehicleDocuments: { vehicleId: string };
    AddDocument: { vehicleId: string; document?: any };
    ExpenseHistory: {
        vehicleId?: string;
        categoryId?: number;
        startDate?: string;
        endDate?: string;
        period?: string;
    };
    Gallery: { vehicleId?: string };
    Trips: { vehicleId?: string };
    AddTrip: { vehicleId?: string; trip?: any };
    RenewInsurance: { vehicleId?: string; insurance?: any };
    Insurance: { vehicleId?: string };
    ServiceRecords: { vehicleId?: string };
    AddService: { vehicleId?: string };
    VehicleSpec: { vehicle: any };
    FuelLogForm: { vehicleId: string };
    Wishlist: undefined;
    CreatePost: undefined;
    AddStory: undefined;
    StoryViewer: {
        storyGroup?: StoryGroup;
        allGroups?: StoryGroup[];
        startIndex?: number;
        storyId?: string;
        onUpdateStoryLike?: (storyId: string | number, isLiked: boolean, likesCount: number) => void;
        onClose?: () => void;
    };
    News: undefined;
    NewsDetail: { news: any };
    Settings: undefined;
    EditProfile: undefined;
    PostDetail: { initialPost: CommunityPost; allPosts: CommunityPost[] };
    Messages: undefined;
    ChatDetail: { userId: string; userName: string; userImage?: string; initialMessage?: string };
    SystemNotifications: { filter: 'system' };
    CommunityNotifications: { filter: 'community' };
    OtherUserProfile: { userId: string; userName: string };
    Followers: { userId: string | number; type: 'followers' | 'following' };
    NewMessage: undefined;
    Reports: { vehicleId?: string };
    DocumentDetail: { document: VehicleDocument };
    DiscoverPeople: undefined;
};

const TabBarItem = ({ route, focused, color }: { route: string, focused: boolean, color: string }) => {
    const animation = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(animation, {
            toValue: focused ? 1 : 0,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, [focused]);

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [5, 0]
    });

    const opacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1]
    });

    const labelTranslateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 0]
    });

    let iconName: keyof typeof Ionicons.glyphMap = 'home';
    let label = '';

    if (route === 'Home') {
        iconName = focused ? 'home' : 'home-outline';
        label = 'Home';
    } else if (route === 'Market') {
        iconName = focused ? 'car' : 'car-outline';
        label = 'Market';
    } else if (route === 'Expenses') {
        iconName = focused ? 'receipt' : 'receipt-outline';
        label = 'Expenses';
    } else if (route === 'Community') {
        iconName = focused ? 'people' : 'people-outline';
        label = 'Community';
    } else if (route === 'Profile') {
        iconName = focused ? 'person' : 'person-outline';
        label = 'Profile';
    }

    return (
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: 70,
            paddingTop: 10
        }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
                <Ionicons name={iconName} size={24} color={color} />
            </Animated.View>
            <Animated.View style={{
                opacity,
                transform: [{ translateY: labelTranslateY }],
                marginTop: 2,
                height: 14,
                justifyContent: 'center'
            }}>
                <Text style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color,
                    textAlign: 'center'
                }}>
                    {label}
                </Text>
            </Animated.View>
        </View>
    );
};

// Main Tab Navigator
function TabNavigator() {
    const insets = useSafeAreaInsets();
    // unreadCount removed as it's handled in individual screens

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color }) => (
                    <TabBarItem route={route.name} focused={focused} color={color} />
                ),
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray,
                tabBarStyle: {
                    height: 65 + (insets.bottom > 0 ? insets.bottom : 10),
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 10,
                    backgroundColor: COLORS.white,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarShowLabel: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Market" component={MarketScreen} />
            <Tab.Screen name="Expenses" component={ExpensesScreen} />
            <Tab.Screen
                name="Community"
                component={CommunityScreen}
            />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

// Root Stack Navigator

export default function MainNavigator() {
    const { user, isLoading, hasSeenSplash } = useAuth();
    const { vehicles } = useApp();


    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                header: (props) => (
                    <StackHeader
                        title={props.options.title || props.route.name}
                        subtitle={(props.options as any).headerSubtitle}
                        headerRight={(props.options as any).headerRight || (props.route.params as any)?.headerRight}
                        scrollY={(props.options as any).scrollY || (props.route.params as any)?.scrollY}
                        showSearch={(props.options as any).showSearch || (props.route.params as any)?.showSearch}
                        searchQuery={(props.options as any).searchQuery || (props.route.params as any)?.searchQuery}
                        onSearchChange={(props.options as any).onSearchChange || (props.route.params as any)?.onSearchChange}
                        onSearchClose={(props.options as any).onSearchClose || (props.route.params as any)?.onSearchClose}
                    />
                ),
            }}
        >
            {!user ? (
                <>
                    {!hasSeenSplash && (
                        <Stack.Screen
                            name="Splash"
                            component={SplashScreen}
                            options={{ headerShown: false }}
                        />
                    )}
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                </>
            ) : (
                // App Stack
                <>
                    <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
                    <Stack.Screen
                        name="VehicleDetails"
                        component={VehicleDetailsScreen}
                        options={({ route, navigation }: any) => {
                            const vehicle = route.params?.vehicle || vehicles.find(v => v.id === route.params?.id);
                            return {
                                headerShown: false,
                                title: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle Details',
                                headerSubtitle: vehicle ? vehicle.registration : undefined,
                                headerRight: () => (
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => (navigation as any).navigate('AddVehicle', { vehicle })}
                                    >
                                        <MaterialIcons name="edit" size={22} color={COLORS.white} />
                                    </TouchableOpacity>
                                ),
                                scrollY: route.params?.scrollY
                            } as any;
                        }}
                    />
                    <Stack.Screen
                        name="Comparison"
                        component={ComparisonScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'Compare Vehicles',
                            headerBackTitleVisible: false,
                            scrollY: route.params?.scrollY,
                            headerRight: () => (
                                <TouchableOpacity
                                    onPress={() => route.params?.handleExport?.()}
                                    style={{ marginRight: 15 }}
                                >
                                    <Ionicons name="download-outline" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            )
                        }) as any}
                    />
                    <Stack.Screen name="LoanCalculator" component={LoanCalculatorScreen} options={({ route }: any) => ({ headerShown: true, title: 'Loan Calculator', headerBackTitleVisible: false, scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={({ route }: any) => ({ title: 'Add New Vehicle', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="AddFuel" component={AddFuelScreen} options={({ route }: any) => ({ title: 'Add Fuel Log', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={({ route }: any) => ({ title: 'Add Expense', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen
                        name="MyVehicles"
                        component={MyVehiclesScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'My Garage',
                            headerSubtitle: 'Manage your personal fleet',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen name="VehicleLogs" component={VehicleLogsScreen} options={({ route }: any) => ({ headerShown: true, title: 'Vehicle Logs', headerBackTitleVisible: false, scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen
                        name="VehicleDocuments"
                        component={VehicleDocumentsScreen}
                        options={({ route }: any) => {
                            const vehicleId = route.params?.vehicleId;
                            const vehicle = vehicles.find(v => v.id === vehicleId);
                            return {
                                title: 'Documents',
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined,
                                scrollY: route.params?.scrollY
                            } as any;
                        }}
                    />
                    <Stack.Screen name="AddDocument" component={AddDocumentScreen} options={({ route }: any) => ({ headerShown: true, title: 'Add Document', headerBackTitleVisible: false, scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="ExpenseHistory" component={ExpenseHistoryScreen} options={({ route }: any) => ({ headerShown: true, title: 'Expense History', scrollY: route.params?.scrollY }) as any} />
                    {/* <Stack.Screen name="Gallery" component={GalleryScreen} options={{ title: 'Gallery' }} /> */}
                    <Stack.Screen
                        name="Trips"
                        component={TripsScreen}
                        options={({ route }: any) => {
                            const vehicleId = route.params?.vehicleId;
                            const vehicle = vehicles.find(v => v.id === vehicleId);
                            return {
                                title: 'Trips History',
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined,
                                scrollY: route.params?.scrollY
                            } as any;
                        }}
                    />
                    <Stack.Screen name="AddTrip" component={AddTripScreen} options={({ route }: any) => ({ title: 'Start New Trip', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="RenewInsurance" component={RenewInsuranceScreen} options={({ route }: any) => ({ title: 'Renew Policy', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen
                        name="Insurance"
                        component={InsuranceScreen}
                        options={({ route }: any) => {
                            const vehicleId = route.params?.vehicleId;
                            const vehicle = vehicles.find(v => v.id === vehicleId);
                            return {
                                title: 'Insurance',
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined,
                                scrollY: route.params?.scrollY
                            } as any;
                        }}
                    />
                    <Stack.Screen
                        name="ServiceRecords"
                        component={ServiceRecordsScreen}
                        options={({ route }: any) => {
                            const vehicleId = route.params?.vehicleId;
                            const vehicle = vehicles.find(v => v.id === vehicleId);
                            return {
                                title: 'Service Records',
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined,
                                scrollY: route.params?.scrollY
                            } as any;
                        }}
                    />
                    <Stack.Screen name="AddService" component={AddServiceScreen} options={({ route }: any) => ({ title: 'Log Service', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="VehicleSpec" component={VehicleSpecScreen} options={{ headerShown: false }} />
                    <Stack.Screen
                        name="Wishlist"
                        component={WishlistScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'Wishlist',
                            headerSubtitle: 'Your favorite cars',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen name="CreatePost" component={CreatePostScreen} options={({ route }: any) => ({ headerShown: true, title: 'Create Post', headerBackTitleVisible: false, scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="AddStory" component={AddStoryScreen} options={({ route }: any) => ({ headerShown: true, title: 'Add Story', headerBackTitleVisible: false, scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false, presentation: 'modal', cardStyle: { backgroundColor: 'transparent' }, cardOverlayEnabled: true, cardStyleInterpolator: ({ current: { progress } }) => ({ cardStyle: { opacity: progress, }, }), }} />
                    <Stack.Screen name="News" component={NewsScreen} options={({ route }: any) => ({ title: 'Auto News', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ headerShown: false }} />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'Settings',
                            headerSubtitle: 'Manage your preferences',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen
                        name="EditProfile"
                        component={EditProfileScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'Edit Profile',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen
                        name="PostDetail"
                        component={PostDetailScreen}
                        options={({ route }: any) => ({
                            headerShown: false,
                            title: 'Post',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen name="Messages" component={MessagesScreen} options={({ route }: any) => ({ headerShown: true, title: 'Messages', scrollY: route.params?.scrollY }) as any} />
                    <Stack.Screen
                        name="ChatDetail"
                        component={ChatDetailScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: route.params?.userName || 'Chat',
                            headerSubtitle: 'Online',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen
                        name="SystemNotifications"
                        component={SystemNotificationsScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'System Alerts',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen
                        name="CommunityNotifications"
                        component={CommunityNotificationsScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'Community Activity',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen
                        name="OtherUserProfile"
                        component={OtherUserProfileScreen}
                        options={({ route }: any) => ({
                            headerShown: false,
                            title: route.params?.userName || 'Profile',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen
                        name="Followers"
                        component={FollowersScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: route.params?.type === 'followers' ? 'Followers' : 'Following',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />

                    <Stack.Screen
                        name="Reports"
                        component={ReportsScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'Vehicle Analytics',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                    <Stack.Screen
                        name="DocumentDetail"
                        component={require('../screens/DocumentDetailScreen').default}
                        options={({ route }: any) => ({
                            title: route.params?.document?.title || 'Document Details'
                        })}
                    />
                    <Stack.Screen
                        name="DiscoverPeople"
                        component={DiscoverPeopleScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: 'Discover People',
                            scrollY: route.params?.scrollY
                        }) as any}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
