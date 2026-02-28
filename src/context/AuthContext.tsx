import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

interface User {
    id: string | number;
    name: string;
    username?: string;
    email: string;
    profilePicUrl?: string;
    bio?: string;
    phone?: string;
    isPrivate?: boolean;
    followersCount?: number;
    followingCount?: number;
    garageCount?: number;
    following: string[];
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    hasSeenSplash: boolean;
    setHasSeenSplash: (v: boolean) => void;

    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    followUser: (userId: string) => Promise<void>;
    unfollowUser: (userId: string) => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
    USER: '@cartrack_user',
    USERS_DB: '@cartrack_users_db',
    FOLLOWING: '@cartrack_following',
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [hasSeenSplash, setHasSeenSplash] = useState(false);

    // Check if user is already logged in on app start
    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            if (userData) {
                const parsedUser = JSON.parse(userData);
                const followingData = await AsyncStorage.getItem(STORAGE_KEYS.FOLLOWING);
                const following = followingData ? JSON.parse(followingData) : (parsedUser.following || []);

                const finalUser = {
                    ...parsedUser,
                    name: parsedUser.name || parsedUser.username || 'User',
                    following
                };
                setUser(finalUser);
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const register = async (name: string, email: string, password: string): Promise<boolean> => {
        // Register relies on RegisterScreen logic for now, or can be moved here.
        // For now, this is kept as is but should ideally use API if RegisterScreen logic moves here.
        // However, user specifically asked about LOGIN API integration.
        // Let's keep register as place holder or update it if needed. 
        // Based on previous files, RegisterScreen handles registration directly.
        return true;
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await apiClient.post('login', {
                email,
                password
            });

            if (response.data && response.data.success) {
                const userData = response.data.user;

                // Store user session
                // We'll keep 'following' logic local for now if it's not in the user object
                const followingData = await AsyncStorage.getItem(STORAGE_KEYS.FOLLOWING);
                const following = followingData ? JSON.parse(followingData) : (userData.following || []);

                const userToStore = {
                    ...userData,
                    name: userData.name || userData.username || 'User',
                    following
                };

                await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
                setUser(userToStore);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.USER,
                STORAGE_KEYS.FOLLOWING
            ]);
            setUser(null);
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const followUser = async (userId: string | number) => {
        if (!user) return;
        try {
            await apiClient.post(`users/${user.id}/follow/${userId}`);
            // Optimistically update counts
            const newFollowing = [...user.following, String(userId)];
            const updatedUser = {
                ...user,
                following: newFollowing,
                followingCount: (user.followingCount || 0) + 1
            };
            setUser(updatedUser);
            await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(newFollowing));
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const unfollowUser = async (userId: string | number) => {
        if (!user) return;
        try {
            await apiClient.post(`users/${user.id}/unfollow/${userId}`);
            // Optimistically update counts
            const newFollowing = user.following.filter(id => id !== String(userId));
            const updatedUser = {
                ...user,
                following: newFollowing,
                followingCount: Math.max(0, (user.followingCount || 0) - 1)
            };
            setUser(updatedUser);
            await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(newFollowing));
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            hasSeenSplash,
            setHasSeenSplash,
            login,
            register,
            logout,
            followUser,
            unfollowUser,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
