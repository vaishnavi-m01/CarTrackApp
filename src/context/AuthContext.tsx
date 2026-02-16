import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

interface User {
    id: string;
    name: string;
    email: string;
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
                // Load following separately or from user data if it was saved there
                const followingData = await AsyncStorage.getItem(STORAGE_KEYS.FOLLOWING);
                const following = followingData ? JSON.parse(followingData) : (parsedUser.following || []);

                setUser({ ...parsedUser, following });
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
            await AsyncStorage.removeItem(STORAGE_KEYS.USER);
            // Optional: Call logout API if exists
            setUser(null);
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const followUser = async (userId: string) => {
        if (!user) return;
        const newFollowing = [...user.following, userId];
        const updatedUser = { ...user, following: newFollowing };
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(newFollowing));
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    };

    const unfollowUser = async (userId: string) => {
        if (!user) return;
        const newFollowing = user.following.filter(id => id !== userId);
        const updatedUser = { ...user, following: newFollowing };
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(newFollowing));
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
