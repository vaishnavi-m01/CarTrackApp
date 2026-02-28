import React, { createContext, useContext } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

interface NotificationContextType {
    unregisterToken: (uid: string | number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationActions = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationActions must be used within a NotificationHandler');
    }
    return context;
};

export const NotificationHandler = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { unregisterTokenWithBackend } = useNotifications(user?.id);

    return (
        <NotificationContext.Provider value={{ unregisterToken: unregisterTokenWithBackend }}>
            {children}
        </NotificationContext.Provider>
    );
};
