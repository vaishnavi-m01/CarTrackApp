import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { GalleryAlbum } from '../types/Gallery';
import { useAuth } from './AuthContext';
// import AndroidToastComponent from '../components/AndroidToast';
import apiClient from '../api/apiClient';
import { COLORS } from '../constants/theme';

const getIconForCategory = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('service')) return 'build';
    if (n.includes('repair')) return 'hammer';
    if (n.includes('insurance')) return 'shield-checkmark';
    if (n.includes('tax') || n.includes('toll')) return 'document-text';
    if (n.includes('fuel')) return 'water';
    return 'wallet';
};

const getColorForCategory = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('service')) return COLORS.warning;
    if (n.includes('repair')) return COLORS.danger;
    if (n.includes('insurance')) return COLORS.success;
    if (n.includes('tax') || n.includes('toll')) return COLORS.info;
    if (n.includes('fuel')) return COLORS.primary;
    return COLORS.gray;
};

// --- Types ---
export interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: string;
    registration: string;
    purchaseDate?: string;
    purchasePrice?: string;
    fuelType: string;
    vehicleType: string; // 'car' or 'bike'
    insuranceExpiry?: string;
    policyNumber?: string;
    insuranceProvider?: string;
    mileage?: string; // Current odometer reading
    fuelAvg?: string; // Calculated average
    image?: string; // Image URI
    status?: string;
    statusColor?: string;
    ownerId?: string | number;
    engine?: string;
    transmission?: string;
    color?: string;
    totalTrips?: number;
    totalRefuels?: number;
}

export interface DocumentFile {
    id?: number;
    uri: string;
    name: string;
    type: 'image' | 'pdf' | 'other';
    fileUrl?: string; // For API responses
}

export interface VehicleDocument {
    id: string;
    vehicleId: string;
    type: 'RC' | 'Insurance' | 'Pollution' | 'Service' | 'Other';
    title: string;
    files: DocumentFile[];
    expiryDate?: string;
    addedDate: string;
}

export interface Expense {
    id: string;
    categoryId?: number;
    type: string;
    amount: number;
    date: string;
    vehicleId: string;
    vehicleName: string;
    note?: string;
    icon?: string;
    color?: string;
}

export interface FuelLog {
    id: string;
    vehicleId: string;
    date: string;
    odometer: number;
    liters: number;
    pricePerLiter: number;
    totalCost: number;
    isFullTank: boolean;
    calculatedMileage?: number;
}

export interface Trip {
    id: string;
    vehicleId: string;
    vehicleName: string;
    title: string;
    date: string;
    distance: number;
    duration: string;
    note?: string;
}

interface AppContextType {
    vehicles: Vehicle[];
    expenses: Expense[];
    fuelLogs: FuelLog[];
    documents: VehicleDocument[];
    trips: Trip[];
    savedNewsIds: number[];
    addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
    deleteVehicle: (id: string) => void;
    updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    deleteExpense: (id: string) => void;
    addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
    addDocument: (doc: Omit<VehicleDocument, 'id'>) => void;
    updateDocument: (id: string, doc: Partial<VehicleDocument>) => void;
    deleteDocument: (id: string) => void;
    addTrip: (trip: Omit<Trip, 'id'>) => void;
    getVehicleById: (id: string) => Vehicle | undefined;
    wishlist: string[];
    toggleWishlist: (id: string) => void;
    recentlyViewed: string[];
    addToHistory: (id: string) => void;
    toggleSavedNews: (id: number) => void;
    AndroidToast: (message: string, type?: 'success' | 'error') => void;
    systemUnreadCount: number;
    communityUnreadCount: number;
    setSystemUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    setCommunityUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    fetchUnreadCount: () => Promise<void>;
    fetchVehicles: () => Promise<void>;
    fetchExpenses: (params?: { vehicleId?: string; categoryId?: string; startDate?: string; endDate?: string }) => Promise<void>;
    fetchWishlist: () => Promise<void>;
    isLoading: boolean;
}

// --- Context ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Provider ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();

    // State Declarations
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
    const [documents, setDocuments] = useState<VehicleDocument[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
    const [savedNewsIds, setSavedNewsIds] = useState<number[]>([]);
    const [systemUnreadCount, setSystemUnreadCount] = useState(0);
    const [communityUnreadCount, setCommunityUnreadCount] = useState(0);

    const AndroidToast = (message: string, type: 'success' | 'error' = 'success') => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        }
    };

    const [isLoading, setIsLoading] = useState(false);

    // Fetch vehicles from API
    const fetchVehicles = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            // First fetch types to map them
            const [vTypesRes, fTypesRes, vehiclesRes] = await Promise.all([
                apiClient.get('/vehicle-type'),
                apiClient.get('/fuelType'),
                apiClient.get(`/vehicles?userId=${user.id}`)
            ]);

            const vTypes = vTypesRes.data || [];
            const fTypes = fTypesRes.data || [];
            const fetchedVehicles = vehiclesRes.data || [];

            const mappedVehicles: Vehicle[] = fetchedVehicles.map((v: any) => ({
                id: v.id.toString(),
                brand: v.customBrandName || v.brandId?.toString() || '',
                model: v.customModelName || v.modelId?.toString() || '',
                year: v.year?.toString() || '',
                registration: v.registration || '',
                purchaseDate: v.purchaseDate,
                purchasePrice: v.purchasePrice?.toString(),
                fuelType: fTypes.find((t: any) => t.id === v.fuelTypeId)?.name || 'Unknown',
                vehicleType: vTypes.find((t: any) => t.id === v.vehicleTypeId)?.name?.toLowerCase() || 'car',
                mileage: v.mileage ? v.mileage.toString() : '0',
                engine: v.engineCapacity,
                transmission: v.transmission,
                color: v.color,
                fuelAvg: v.fuelAvg ? v.fuelAvg.toString() : '0',
                image: v.imageUrl,
                status: v.isActive ? 'Active' : 'Inactive',
                statusColor: v.isActive ? '#10b981' : '#ef4444',
                ownerId: v.userId?.toString(),
                totalTrips: v.totalTrips || 0,
                totalRefuels: v.totalRefuels || 0,
                insuranceExpiry: v.insuranceExpiry
            }));

            setVehicles(mappedVehicles);
        } catch (error) {
            console.error('Error fetching vehicles in AppContext:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch expenses from API
    const fetchExpenses = async (params?: { vehicleId?: string; categoryId?: string; startDate?: string; endDate?: string }) => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            let query = '/expenses';
            const queryParams = new Array<string>();
            queryParams.push(`userId=${user.id}`);
            if (params?.vehicleId) queryParams.push(`vehicleId=${params.vehicleId}`);
            if (params?.categoryId) queryParams.push(`categoryId=${params.categoryId}`);
            if (params?.startDate) queryParams.push(`startDate=${params.startDate}`);
            if (params?.endDate) queryParams.push(`endDate=${params.endDate}`);

            const queryString = queryParams.join('&');
            if (queryString) query += `?${queryString}`;

            const response = await apiClient.get(query);
            const fetchedExpenses = response.data || [];

            const mappedExpenses: Expense[] = fetchedExpenses.map((e: any) => ({
                id: e.id.toString(),
                categoryId: e.categoryId,
                type: e.category?.name || 'Other',
                amount: e.amount,
                date: e.date,
                vehicleId: e.vehicleId?.toString(),
                vehicleName: vehicles.find(v => v.id === e.vehicleId?.toString())?.model || 'Unknown',
                note: e.note,
                icon: getIconForCategory(e.category?.name || 'Other'),
                color: getColorForCategory(e.category?.name || 'Other')
            }));

            setExpenses(mappedExpenses);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };



    // Fetch wishlist from API
    const fetchWishlist = async () => {
        if (!user?.id) return;
        try {
            const response = await apiClient.get(`/wishlist/user/${user.id}`);
            const data = response.data || [];
            // Map List<WishlistEntity> to string[] of inventory IDs
            const ids = data.map((item: any) => item.marketInventory.id.toString());
            setWishlist(ids);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    // Fetch saved news from API
    const fetchSavedNews = async () => {
        if (!user?.id) return;
        try {
            const response = await apiClient.get(`/news-highlights/saved?userId=${user.id}`);
            const data = response.data || [];
            const ids = data.map((item: any) => item.id);
            setSavedNewsIds(ids);
        } catch (error) {
            console.error('Error fetching saved news:', error);
        }
    };

    // Fetch all trips
    const fetchTrips = async (vehicleId?: string) => {
        if (!user?.id) return;
        try {
            let url = `/trips?userId=${user.id}`;
            if (vehicleId) url += `&vehicleId=${vehicleId}`;
            const response = await apiClient.get(url);
            const data = response.data || [];
            const mappedTrips: Trip[] = data.map((t: any) => ({
                id: t.id.toString(),
                vehicleId: t.vehicleId?.toString(),
                vehicleName: vehicles.find(v => v.id === t.vehicleId?.toString())?.model || 'Vehicle',
                title: t.title || 'Trip',
                date: t.date,
                distance: t.distance || 0,
                duration: t.duration || '0m',
                note: t.note
            }));
            setTrips(mappedTrips);
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
    };

    // Fetch fuel logs
    const fetchFuelLogs = async (vehicleId?: string) => {
        if (!user?.id) return;
        try {
            let url = `/fuel-logs?userId=${user.id}`;
            if (vehicleId) url += `&vehicleId=${vehicleId}`;
            const response = await apiClient.get(url);
            const data = response.data || [];
            const mappedLogs: FuelLog[] = data.map((l: any) => ({
                id: l.id.toString(),
                vehicleId: l.vehicleId?.toString(),
                date: l.date,
                odometer: l.odometer || 0,
                liters: l.liters || 0,
                pricePerLiter: l.pricePerLiter || 0,
                totalCost: l.totalCost || 0,
                isFullTank: l.isFullTank || false,
                calculatedMileage: l.mileage
            }));
            setFuelLogs(mappedLogs);
        } catch (error) {
            console.error('Error fetching fuel logs:', error);
        }
    };

    // Fetch documents
    const fetchDocuments = async (vehicleId?: string) => {
        if (!user?.id) return;
        try {
            let url = `/documents?userId=${user.id}`;
            if (vehicleId) url += `&vehicleId=${vehicleId}`;
            const response = await apiClient.get(url);
            const data = response.data || [];
            const mappedDocs: VehicleDocument[] = data.map((d: any) => ({
                id: d.id.toString(),
                vehicleId: d.vehicleId?.toString(),
                type: d.type || 'Other',
                title: d.title || 'Document',
                files: (d.files || []).map((f: any) => ({
                    id: f.id,
                    uri: f.fileUrl,
                    name: f.fileName,
                    type: (f.fileName || '').toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                })),
                expiryDate: d.expiryDate,
                addedDate: d.createdAt
            }));
            setDocuments(mappedDocs);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    // Fetch unread notification counts
    const fetchUnreadCount = async () => {
        if (!user?.id) return;
        try {
            const [systemRes, communityRes] = await Promise.all([
                apiClient.get(`/notifications/unread-count?userId=${user.id}&types=NEWS_ALERT,INSURANCE_ALERT,SERVICE_ALERT,CAR_LAUNCH,SYSTEM_ALERT`),
                apiClient.get(`/notifications/unread-count?userId=${user.id}&types=POST_LIKE,POST_COMMENT,STORY_LIKE,STORY_COMMENT,NEW_FOLLOWER,FOLLOW_REQUEST,FOLLOW_ACCEPTED`)
            ]);
            setSystemUnreadCount(systemRes.data || 0);
            setCommunityUnreadCount(communityRes.data || 0);
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    // Load data on user change
    useEffect(() => {
        if (user?.id) {
            fetchVehicles();
            fetchExpenses();
            fetchWishlist();
            fetchSavedNews();
            fetchTrips();
            fetchFuelLogs();
            fetchDocuments();
            fetchUnreadCount();

            // Background polling for unread count (Every 30 seconds)
            // This is a workaround for Expo Go SDK 53 not supporting push notifications
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    // Reset state when user logs out
    useEffect(() => {
        if (!user) {
            setVehicles([]);
            setExpenses([]);
            setFuelLogs([]);
            setDocuments([]);
            setTrips([]);
            setWishlist([]);
            setRecentlyViewed([]);
            setSavedNewsIds([]);
        }
    }, [user]);

    const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
        const newVehicle = {
            ...vehicle,
            id: Date.now().toString(),
            ownerId: user?.id
        };
        setVehicles((prev) => [...prev, newVehicle]);
        AndroidToast('Vehicle added successfully!');
    };

    const deleteVehicle = (id: string) => {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        AndroidToast('Vehicle removed');
        // Also cleanup expenses/logs for this vehicle ideally, but skipping for simplicity now
    };

    const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
        setVehicles((prev) => prev.map((v) => v.id === id ? { ...v, ...updates } : v));
        AndroidToast('Vehicle updated');
    };

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        const newExpense = { ...expense, id: Date.now().toString() };
        setExpenses((prev) => [newExpense, ...prev]); // Newest first
    };

    const deleteExpense = (id: string) => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
    };

    const addFuelLog = (log: Omit<FuelLog, 'id'>) => {
        const newLog = { ...log, id: Date.now().toString() };

        // 1. Add to Fuel Logs
        setFuelLogs((prev) => [newLog, ...prev]);

        // 2. Also Add as an Expense
        const vehicle = getVehicleById(log.vehicleId);
        if (vehicle) {
            addExpense({
                type: 'Fuel',
                amount: log.totalCost,
                date: log.date,
                vehicleId: log.vehicleId,
                vehicleName: `${vehicle.brand} ${vehicle.model}`,
                note: `${log.liters}L @ ${log.pricePerLiter}/L`,
                icon: 'water',
                color: '#667eea'
            });
        }

        // 3. Update Vehicle Odometer
        updateVehicleOdometer(log.vehicleId, log.odometer);
        AndroidToast('Fuel log added successfully!');
    };

    const updateVehicleOdometer = (vehicleId: string, newOdometer: number) => {
        setVehicles(prev => prev.map(v => {
            if (v.id === vehicleId) {
                // Simple check to only increase odometer
                const current = parseFloat(v.mileage || '0');
                return { ...v, mileage: Math.max(current, newOdometer).toString() };
            }
            return v;
        }));
    }

    const addDocument = (doc: Omit<VehicleDocument, 'id'>) => {
        const newDoc = { ...doc, id: Date.now().toString() };
        setDocuments((prev) => [newDoc, ...prev]);
        AndroidToast('Document saved successfully!');
    };

    const updateDocument = (id: string, updatedDoc: Partial<VehicleDocument>) => {
        setDocuments((prev) => prev.map(d => d.id === id ? { ...d, ...updatedDoc } : d));
    };

    const deleteDocument = (id: string) => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
    };

    const addTrip = (trip: Omit<Trip, 'id'>) => {
        const newTrip = { ...trip, id: Date.now().toString() };
        setTrips((prev) => [newTrip, ...prev]);
        AndroidToast('Trip recorded successfully!');
    };

    const toggleWishlist = async (id: string) => {
        if (!user?.id) return;

        // Optimistic UI update
        const isCurrentlyWishlisted = wishlist.includes(id);
        setWishlist((prev) =>
            isCurrentlyWishlisted
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );

        try {
            await apiClient.post(`/wishlist/toggle?userId=${user.id}&inventoryId=${id}`);
            AndroidToast(isCurrentlyWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            // Rollback on error
            setWishlist((prev) =>
                isCurrentlyWishlisted
                    ? [...prev, id]
                    : prev.filter(itemId => itemId !== id)
            );
            AndroidToast('Failed to update wishlist', 'error');
        }
    };

    const toggleSavedNews = async (id: number) => {
        if (!user?.id) return;

        const isCurrentlySaved = savedNewsIds.includes(id);

        // Optimistic UI update
        setSavedNewsIds((prev) =>
            isCurrentlySaved
                ? prev.filter(newsId => newsId !== id)
                : [...prev, id]
        );

        try {
            if (isCurrentlySaved) {
                await apiClient.delete(`/news-highlights/${id}/save?userId=${user.id}`);
                AndroidToast('News unsaved');
            } else {
                await apiClient.post(`/news-highlights/${id}/save?userId=${user.id}`);
                AndroidToast('News saved');
            }
        } catch (error) {
            console.error('Error toggling saved news:', error);
            // Rollback on error
            setSavedNewsIds((prev) =>
                isCurrentlySaved
                    ? [...prev, id]
                    : prev.filter(newsId => newsId !== id)
            );
            AndroidToast('Failed to save news', 'error');
        }
    };

    const addToHistory = (id: string) => {
        setRecentlyViewed((prev) => {
            const filtered = prev.filter(itemId => itemId !== id);
            return [id, ...filtered].slice(0, 20); // Keep last 20, newest first
        });
    };

    const getVehicleById = (id: string) => vehicles.find((v) => v.id === id);


    return (
        <AppContext.Provider
            value={{
                vehicles,
                expenses,
                fuelLogs,
                documents,
                trips,
                addVehicle,
                deleteVehicle,
                updateVehicle,
                addExpense,
                deleteExpense,
                addFuelLog,
                addDocument,
                updateDocument,
                deleteDocument,
                addTrip,
                getVehicleById,
                wishlist,
                toggleWishlist,
                recentlyViewed,
                addToHistory,
                savedNewsIds,
                toggleSavedNews,
                AndroidToast,
                systemUnreadCount,
                communityUnreadCount,
                setSystemUnreadCount,
                setCommunityUnreadCount,
                fetchUnreadCount,
                fetchVehicles,
                fetchExpenses,
                fetchWishlist,
                isLoading,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

// --- Hook ---
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
