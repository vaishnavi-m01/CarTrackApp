import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CommunityPost, MediaItem } from '../types/Community';
import { Story, StoryGroup } from '../types/Story';
import { GalleryAlbum } from '../types/Gallery';
import { useAuth } from './AuthContext';
import AndroidToastComponent from '../components/AndroidToast';

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
    ownerId?: string;
    engine?: string;
    transmission?: string;
    color?: string;
}

export interface DocumentFile {
    uri: string;
    name: string;
    type: 'image' | 'pdf' | 'other';
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
    type: 'Fuel' | 'Service' | 'Repair' | 'Insurance' | 'Tax' | 'Parts' | 'Other';
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
    communityPosts: CommunityPost[];
    stories: Story[];
    galleryAlbums: GalleryAlbum[];
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
    addCommunityPost: (post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'likedByUser' | 'commentCount' | 'views'>) => void;
    togglePostLike: (postId: string) => void;
    addCommentToPost: (postId: string, commentText: string) => void;
    deletePost: (postId: string) => void;
    editPost: (postId: string, updates: { content?: string; location?: string; tags?: string[] }) => void;
    getVehicleById: (id: string) => Vehicle | undefined;
    wishlist: string[];
    toggleWishlist: (id: string) => void;
    recentlyViewed: string[];
    addToHistory: (id: string) => void;
    addStory: (story: Omit<Story, 'id' | 'timestamp' | 'expiresAt' | 'viewed'>) => void;
    deleteStory: (storyId: string) => void;
    editStory: (storyId: string, updates: { caption?: string; captionPosition?: { x: number, y: number }; captionStyle?: any }) => void;
    markStoryAsViewed: (storyId: string) => void;
    getStoryGroups: () => StoryGroup[];
    createGalleryAlbum: (title: string) => void;
    addMediaToGallery: (albumId: string, media: MediaItem[]) => void;
    toggleSavedNews: (id: number) => void;
    AndroidToast: (message: string, type?: 'success' | 'error') => void;
}

// Initial Data Constants
const INITIAL_VEHICLES: Vehicle[] = [
    {
        id: '1',
        brand: 'Honda',
        model: 'Civic',
        year: '2022',
        registration: 'TN 01 AB 1234',
        fuelType: 'Petrol',
        vehicleType: 'car',
        mileage: '25450',
        fuelAvg: '18.5',
        image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=1200',
        status: 'Active',
        statusColor: '#10b981',
        policyNumber: 'POL-8829-331-X',
        insuranceProvider: 'HDFC ERGO',
        insuranceExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
        ownerId: 'user1',
        engine: '1.2L i-VTEC',
        transmission: 'Manual',
        color: 'Platinum White'
    },
    {
        id: '2',
        brand: 'Toyota',
        model: 'Fortuner',
        year: '2023',
        registration: 'TN 07 CD 5678',
        fuelType: 'Diesel',
        vehicleType: 'car',
        mileage: '12500',
        fuelAvg: '12.8',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1200',
        status: 'Service Due',
        statusColor: '#f59e0b',
        policyNumber: 'POL-9910-442-Y',
        insuranceProvider: 'ICICI Lombard',
        insuranceExpiry: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
        ownerId: 'user1',
        engine: '2.8L Diesel',
        transmission: 'Automatic',
        color: 'Phantom Brown'
    }
];

const INITIAL_EXPENSES: Expense[] = [
    {
        id: '1',
        type: 'Fuel',
        amount: 2500,
        date: new Date().toISOString(),
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        icon: 'water',
        color: '#667eea'
    },
    {
        id: '2',
        type: 'Service',
        amount: 8500,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        icon: 'build',
        color: '#f59e0b'
    },
    {
        id: '3',
        type: 'Insurance',
        amount: 12000,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        icon: 'shield-checkmark',
        color: '#10b981'
    },
    {
        id: '4',
        type: 'Repair',
        amount: 4500,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        icon: 'hammer',
        color: '#ef4444'
    },
    {
        id: '5',
        type: 'Tax',
        amount: 2000,
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        icon: 'cash',
        color: '#8b5cf6'
    },
    {
        id: '6',
        type: 'Parts',
        amount: 3200,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        icon: 'cog',
        color: '#ec4899'
    }
];

const INITIAL_TRIPS: Trip[] = [
    {
        id: 't1',
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        title: 'Weekend at Hills',
        date: '2026-01-20T10:00:00Z',
        distance: 450,
        duration: '6h 30m',
        note: 'Great drive'
    },
    {
        id: 't2',
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        title: 'Office Commute',
        date: '2026-01-25T09:00:00Z',
        distance: 25,
        duration: '0h 45m',
        note: 'Normal traffic'
    },
    {
        id: 't3',
        vehicleId: '1',
        vehicleName: 'Honda Civic',
        title: 'Late Night Drive',
        date: '2026-01-27T23:30:00Z',
        distance: 40,
        duration: '1h 10m',
        note: 'Peaceful'
    }
];

const INITIAL_GALLERY: GalleryAlbum[] = [
    {
        id: 'car',
        title: 'My Cars',
        media: [
            { id: 'c1', type: 'image', uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop' },
            { id: 'c2', type: 'image', uri: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1000&auto=format&fit=crop' }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: 'timeline',
        title: 'Timeline Photos',
        media: [
            { id: 't1', type: 'image', uri: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop' }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: 'trips',
        title: 'Road Trips',
        media: [
            { id: 'tr1', type: 'image', uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop' }
        ],
        createdAt: new Date().toISOString()
    }
];

const INITIAL_STORIES: Story[] = [
    {
        id: 's1_v2',
        userId: 'hyundai_official',
        userName: 'Hyundai India',
        userAvatar: undefined,
        mediaUri: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
        mediaType: 'image',
        caption: 'The all-new CRETA N Line is here! 🏁',
        captionPosition: { x: 0, y: -200 },
        captionStyle: {
            fontSize: 24,
            fontFamily: 'Strong',
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.5)'
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000),
        viewed: false,
    },
    {
        id: 's2_v2',
        userId: 'porsche_fan',
        userName: 'Speed Hunter',
        userAvatar: undefined,
        mediaUri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
        mediaType: 'image',
        caption: 'Weekend track day! 🏎️💨',
        captionPosition: { x: 0, y: 220 },
        captionStyle: {
            fontSize: 22,
            fontFamily: 'Strong',
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.5)'
        },
        timestamp: Date.now() - (2 * 60 * 60 * 1000),
        expiresAt: Date.now() + (22 * 60 * 60 * 1000),
        viewed: false,
    }
];

const INITIAL_POSTS: CommunityPost[] = [
    {
        id: 'trend_official_1',
        userId: 'hyundai_official',
        userName: 'Hyundai India',
        userAvatar: undefined,
        content: 'The all-new CRETA with Level 2 ADAS is here! Experience the ultimate SUV. #HyundaiCreta #SUVLife',
        media: [{ id: 'm_official_1', type: 'image', uri: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800' }],
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        likes: 2450,
        likedByUser: false,
        comments: [],
        commentCount: 450,
        views: 15432,
        category: 'trending',
        isVerified: true,
        vehicleInfo: '2024 Creta N Line',
        location: 'NCR',
    },
    {
        id: 'trend_user_1',
        userId: 'porsche_fan',
        userName: 'Speed Hunter',
        userAvatar: undefined,
        content: 'Spotted the new GT3 RS today! The sound is absolutely insane. 🏎️💨',
        media: [{ id: 'm_trend_1', type: 'image', uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' }],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        likes: 890,
        likedByUser: true,
        comments: [],
        commentCount: 120,
        views: 8700,
        category: 'trending',
        vehicleInfo: '911 GT3 RS',
        location: 'Nurburgring',
    },
    {
        id: 'follow_1',
        userId: 'user1',
        userName: 'Rajesh Kumar',
        userAvatar: undefined,
        content: 'Testing the new Autopilot update on my Tesla. It feels smoother in city traffic! ⚡',
        media: [{ id: 'm_follow_1', type: 'image', uri: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800' }],
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        likes: 45,
        likedByUser: false,
        comments: [],
        commentCount: 5,
        views: 230,
        category: 'following',
    },
    {
        id: 'long_post_test',
        userId: 'test_user',
        userName: 'Testing Read More',
        content: 'Line 1: This is a very long post to test the read more functionality.\nLine 2: We want to make sure it truncates correctly after 4 lines.\nLine 3: If it works, the "...more" label should appear only when needed.\nLine 4: This is the fourth line, it should be the last one visible before truncation.\nLine 5: This line should be hidden initially.\nLine 6: And this one too!',
        media: [{ id: 'm_test_1', type: 'image', uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' }],
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        likes: 10,
        likedByUser: false,
        comments: [],
        commentCount: 0,
        views: 100,
        category: 'feed'
    }
];

// --- Context ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Provider ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();

    // State Declarations
    const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
    const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
    const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
    const [documents, setDocuments] = useState<VehicleDocument[]>([]);
    const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
    const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
    const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>(INITIAL_GALLERY);
    const [savedNewsIds, setSavedNewsIds] = useState<number[]>([]);

    // Toast State
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const AndroidToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    // Reset state when user logs out
    useEffect(() => {
        if (!user) {
            // Reset to clean state (or initial dummy data)
            setVehicles(INITIAL_VEHICLES);
            setExpenses(INITIAL_EXPENSES);
            setFuelLogs([]);
            setDocuments([]);
            setTrips(INITIAL_TRIPS);
            setWishlist([]);
            setRecentlyViewed([]);
            setGalleryAlbums(INITIAL_GALLERY);
            setSavedNewsIds([]);
            // setCommunityPosts([]); // Optional: Keep community posts or clear them
            setStories(INITIAL_STORIES);
        }
    }, [user]);

    const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
        const newVehicle = {
            ...vehicle,
            id: Date.now().toString(),
            ownerId: user?.id
        };
        setVehicles((prev) => [...prev, newVehicle]);
    };

    const deleteVehicle = (id: string) => {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        // Also cleanup expenses/logs for this vehicle ideally, but skipping for simplicity now
    };

    const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
        setVehicles((prev) => prev.map((v) => v.id === id ? { ...v, ...updates } : v));
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
    };

    const toggleWishlist = (id: string) => {
        setWishlist((prev) =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const toggleSavedNews = (id: number) => {
        setSavedNewsIds((prev) =>
            prev.includes(id)
                ? prev.filter(newsId => newsId !== id)
                : [...prev, id]
        );
    };

    const addToHistory = (id: string) => {
        setRecentlyViewed((prev) => {
            const filtered = prev.filter(itemId => itemId !== id);
            return [id, ...filtered].slice(0, 20); // Keep last 20, newest first
        });
    };

    const getVehicleById = (id: string) => vehicles.find((v) => v.id === id);

    const addCommunityPost = (post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'likedByUser' | 'commentCount' | 'views'>) => {
        if (!user) return;
        const newPost: CommunityPost = {
            ...post,
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            timestamp: new Date(),
            likes: 0,
            likedByUser: false,
            commentCount: 0,
            views: 0,
        };
        setCommunityPosts((prev) => [newPost, ...prev]); // Newest first

        // Auto-save to Gallery as a SEPARATE ALBUM (Facebook style)
        if (post.media.length > 0) {
            // Generate title from content or tags
            let albumTitle = 'New Post';
            if (post.tags && post.tags.length > 0) {
                const tag = post.tags[0].replace(/^#+/, '');
                albumTitle = tag.charAt(0).toUpperCase() + tag.slice(1);
            } else if (post.content) {
                const words = post.content.split(' ').slice(0, 3);
                const title = words.join(' ');
                albumTitle = title.charAt(0).toUpperCase() + title.slice(1) + (post.content.split(' ').length > 3 ? '...' : '');
            }

            const newAlbum: GalleryAlbum = {
                id: `post_${newPost.id}`,
                title: albumTitle,
                media: post.media,
                createdAt: new Date().toISOString(),
            };
            setGalleryAlbums(prev => [newAlbum, ...prev]);
        }
    };

    const togglePostLike = (postId: string) => {
        setCommunityPosts((prev) => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    likedByUser: !post.likedByUser,
                    likes: post.likedByUser ? post.likes - 1 : post.likes + 1
                };
            }
            return post;
        }));
    };

    const addCommentToPost = (postId: string, commentText: string) => {
        if (!user) return;
        setCommunityPosts((prev) => prev.map(post => {
            if (post.id === postId) {
                const newComment = {
                    id: Date.now().toString(),
                    userId: user.id,
                    userName: user.name,
                    userAvatar: undefined,
                    content: commentText,
                    timestamp: new Date(),
                    likes: 0,
                };
                return {
                    ...post,
                    comments: [...post.comments, newComment],
                    commentCount: post.commentCount + 1,
                };
            }
            return post;
        }));
    };

    const deletePost = (postId: string) => {
        setCommunityPosts((prev) => prev.filter(post => post.id !== postId));
    };

    const editPost = (postId: string, updates: { content?: string; location?: string; tags?: string[] }) => {
        setCommunityPosts((prev) => prev.map(post => {
            if (post.id === postId) {
                return { ...post, ...updates };
            }
            return post;
        }));
    };

    const addStory = (story: Omit<Story, 'id' | 'timestamp' | 'expiresAt' | 'viewed'>) => {
        const now = Date.now();
        const newStory: Story = {
            ...story,
            id: now.toString(),
            timestamp: now,
            expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours from now
            viewed: false,
            captionPosition: story.captionPosition,
            captionStyle: story.captionStyle,
        };
        setStories((prev) => [newStory, ...prev]);

        // Auto-save story to gallery (Timeline album)
        addMediaToGallery('timeline', [{
            id: `story_${newStory.id}`,
            type: story.mediaType,
            uri: story.mediaUri
        }]);
    };

    const markStoryAsViewed = (storyId: string) => {
        setStories((prev) => prev.map(story =>
            story.id === storyId ? { ...story, viewed: true } : story
        ));
    };

    const deleteStory = (storyId: string) => {
        setStories((prev) => prev.filter(story => story.id !== storyId));
    };

    const editStory = (storyId: string, updates: { caption?: string; captionPosition?: { x: number, y: number }; captionStyle?: any }) => {
        setStories((prev) => prev.map(story =>
            story.id === storyId ? { ...story, ...updates } : story
        ));
    };

    const getStoryGroups = (): StoryGroup[] => {
        const now = Date.now();
        const activeStories = stories.filter(story => story.expiresAt > now);

        const grouped = activeStories.reduce((acc, story) => {
            if (!acc[story.userId]) {
                acc[story.userId] = {
                    userId: story.userId,
                    userName: story.userName,
                    userAvatar: story.userAvatar,
                    stories: [],
                    hasUnviewed: false,
                };
            }
            acc[story.userId].stories.push(story);
            if (!story.viewed) {
                acc[story.userId].hasUnviewed = true;
            }
            return acc;
        }, {} as Record<string, StoryGroup>);

        return Object.values(grouped);
    };

    const createGalleryAlbum = (title: string) => {
        const newAlbum: GalleryAlbum = {
            id: Date.now().toString(),
            title,
            media: [],
            createdAt: new Date().toISOString(),
        };
        setGalleryAlbums(prev => [...prev, newAlbum]);
    };

    const addMediaToGallery = (albumId: string, newMedia: MediaItem[]) => {
        setGalleryAlbums(prev => prev.map(album => {
            if (album.id === albumId) {
                // Remove duplicates and add new ones to front
                const existingUris = new Set(album.media.map(m => m.uri));
                const uniqueNew = newMedia.filter(m => !existingUris.has(m.uri));
                return {
                    ...album,
                    media: [...uniqueNew, ...album.media]
                };
            }
            return album;
        }));
    };

    return (
        <AppContext.Provider
            value={{
                vehicles,
                expenses,
                fuelLogs,
                documents,
                trips,
                communityPosts,
                stories,
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
                addCommunityPost,
                togglePostLike,
                addCommentToPost,
                deletePost,
                editPost,
                getVehicleById,
                wishlist,
                toggleWishlist,
                recentlyViewed,
                addToHistory,
                addStory,
                deleteStory,
                editStory,
                markStoryAsViewed,
                getStoryGroups,
                galleryAlbums,
                createGalleryAlbum,
                addMediaToGallery,
                savedNewsIds,
                toggleSavedNews,
                AndroidToast,
            }}
        >
            {children}
            <AndroidToastComponent
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />
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
