import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        try {
            // Get existing users
            const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
            const users = usersData ? JSON.parse(usersData) : [];

            // Check if email already exists
            const existingUser = users.find((u: any) => u.email === email);
            if (existingUser) {
                return false; // Email already registered
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password, // In production, this should be hashed
            };

            // Save to users database
            users.push(newUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));

            // Auto-login after registration
            const userToStore = { id: newUser.id, name: newUser.name, email: newUser.email, following: [] };
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
            setUser(userToStore);

            return true;
        } catch (error) {
            console.error('Error during registration:', error);
            return false;
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // Get users database
            const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
            const users = usersData ? JSON.parse(usersData) : [];

            // Find user with matching credentials
            const foundUser = users.find(
                (u: any) => u.email === email && u.password === password
            );

            if (foundUser) {
                // Store user session
                const followingData = await AsyncStorage.getItem(STORAGE_KEYS.FOLLOWING);
                const following = followingData ? JSON.parse(followingData) : [];

                const userToStore = {
                    id: foundUser.id,
                    name: foundUser.name,
                    email: foundUser.email,
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
