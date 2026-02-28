import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MainNavigator from './src/navigation/MainNavigator';

import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';

import * as Linking from 'expo-linking';

import { NotificationHandler } from './src/components/NotificationHandler';

import { navigationRef } from './src/navigation/NavigationService';

export default function App() {
  const prefix = Linking.createURL('/');

  const linking = {
    prefixes: [prefix, 'cartrack://'],
    config: {
      screens: {
        VehicleDetails: 'vehicle/:id',
        VehicleSpec: 'spec/:id',
        StoryViewer: 'story/:storyId',
        MainTabs: {
          path: 'tabs',
          screens: {
            Home: 'home',
            Expenses: 'expenses',
          },
        },
      },
    },
  };

  return (
    <AuthProvider>
      <AppProvider>
        <SafeAreaProvider>
          <NotificationHandler>
            <StatusBar style="light" />
            <NavigationContainer ref={navigationRef} linking={linking}>
              <MainNavigator />
            </NavigationContainer>
          </NotificationHandler>
        </SafeAreaProvider>
      </AppProvider>
    </AuthProvider>
  );
}
