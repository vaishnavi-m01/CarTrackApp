import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { NavigatorScreenParams } from '@react-navigation/native';
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
        storyGroup: StoryGroup;
        allGroups: StoryGroup[];
        startIndex: number;
        onUpdateStoryLike?: (storyId: string | number, isLiked: boolean, likesCount: number) => void;
    };
    News: undefined;
    NewsDetail: { news: any };
    Settings: undefined;
    EditProfile: undefined;
    PostDetail: { initialPost: CommunityPost; allPosts: CommunityPost[] };
    Messages: undefined;
    ChatDetail: { userId: string; userName: string; userImage?: string };
    SystemNotifications: { filter: 'system' };
    CommunityNotifications: { filter: 'community' };
    OtherUserProfile: { userId: string; userName: string };
    Reports: { vehicleId?: string };
    DocumentDetail: { document: VehicleDocument };
};

// Main Tab Navigator
function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Market') {
                        iconName = focused ? 'car' : 'car-outline';
                    } else if (route.name === 'Expenses') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
                    } else if (route.name === 'Community') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
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
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: insets.bottom > 0 ? 0 : 5,
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Market" component={MarketScreen} />
            <Tab.Screen name="Expenses" component={ExpensesScreen} />
            <Tab.Screen name="Community" component={CommunityScreen} />
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
                        headerRight={(props.options as any).headerRight}
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
                    <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Comparison" component={ComparisonScreen} options={{ title: 'Compare Vehicles' }} />
                    <Stack.Screen name="LoanCalculator" component={LoanCalculatorScreen} options={{ title: 'Loan Calculator' }} />
                    <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Add New Vehicle' }} />
                    <Stack.Screen name="AddFuel" component={AddFuelScreen} options={{ title: 'Add Fuel Log' }} />
                    <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
                    <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} options={{ title: 'My Vehicles' }} />
                    <Stack.Screen name="VehicleLogs" component={VehicleLogsScreen} options={{ title: 'Vehicle Logs' }} />
                    <Stack.Screen
                        name="VehicleDocuments"
                        component={VehicleDocumentsScreen}
                        options={({ route }: any) => {
                            const vehicleId = route.params?.vehicleId;
                            const vehicle = vehicles.find(v => v.id === vehicleId);
                            return {
                                title: 'Vehicle Documents',
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined
                            } as any;
                        }}
                    />
                    <Stack.Screen name="AddDocument" component={AddDocumentScreen} options={{ title: 'Add Document' }} />
                    <Stack.Screen name="ExpenseHistory" component={ExpenseHistoryScreen} options={{ headerShown: true }} />
                    {/* <Stack.Screen name="Gallery" component={GalleryScreen} options={{ title: 'Gallery' }} /> */}
                    <Stack.Screen
                        name="Trips"
                        component={TripsScreen}
                        options={({ route }: any) => {
                            const vehicleId = route.params?.vehicleId;
                            const vehicle = vehicles.find(v => v.id === vehicleId);
                            return {
                                title: 'My Trips',
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined
                            } as any;
                        }}
                    />
                    <Stack.Screen name="AddTrip" component={AddTripScreen} options={{ title: 'Start New Trip' }} />
                    <Stack.Screen name="RenewInsurance" component={RenewInsuranceScreen} options={{ title: 'Renew Policy' }} />
                    <Stack.Screen
                        name="Insurance"
                        component={InsuranceScreen}
                        options={({ route }: any) => {
                            const vehicleId = route.params?.vehicleId;
                            const vehicle = vehicles.find(v => v.id === vehicleId);
                            return {
                                title: 'Insurance',
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined
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
                                headerSubtitle: vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.registration}` : undefined
                            } as any;
                        }}
                    />
                    <Stack.Screen name="AddService" component={AddServiceScreen} options={{ title: 'Log Service' }} />
                    <Stack.Screen name="VehicleSpec" component={VehicleSpecScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ headerShown: true, title: 'Wishlist', headerSubtitle: 'Your favorite cars' } as any} />
                    <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: true, title: 'Create Post', headerBackTitleVisible: false }} />
                    <Stack.Screen name="AddStory" component={AddStoryScreen} options={{ headerShown: true, title: 'Add Story', headerBackTitleVisible: false }} />
                    <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false, presentation: 'modal', cardStyle: { backgroundColor: 'transparent' }, cardOverlayEnabled: true, cardStyleInterpolator: ({ current: { progress } }) => ({ cardStyle: { opacity: progress, }, }), }} />
                    <Stack.Screen name="News" component={NewsScreen} options={{ headerShown: true, title: 'Auto News', headerSubtitle: 'Stay updated with latest automotive news' } as any} />
                    <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings', headerSubtitle: 'Manage your preferences' } as any} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
                    <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: false, animationEnabled: false }} />
                    <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: true, title: 'Messages' }} />
                    <Stack.Screen
                        name="ChatDetail"
                        component={ChatDetailScreen}
                        options={({ route }: any) => ({
                            headerShown: true,
                            title: route.params?.userName || 'Chat',
                            headerSubtitle: 'Online'
                        }) as any}
                    />
                    <Stack.Screen
                        name="SystemNotifications"
                        component={SystemNotificationsScreen}
                        options={{ headerShown: true, title: 'System Alerts' }}
                    />
                    <Stack.Screen
                        name="CommunityNotifications"
                        component={CommunityNotificationsScreen}
                        options={{ headerShown: true, title: 'Community Activity' }}
                    />
                    <Stack.Screen
                        name="OtherUserProfile"
                        component={OtherUserProfileScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Reports"
                        component={ReportsScreen}
                        options={{ title: 'Vehicle Analytics' }}
                    />
                    <Stack.Screen
                        name="DocumentDetail"
                        component={require('../screens/DocumentDetailScreen').default}
                        options={({ route }: any) => ({
                            title: route.params?.document?.title || 'Document Details'
                        })}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
