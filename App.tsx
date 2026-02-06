import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MainNavigator from './src/navigation/MainNavigator';

import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';

import * as Linking from 'expo-linking';

export default function App() {
  const prefix = Linking.createURL('/');

  const linking = {
    prefixes: [prefix, 'cartrack://'],
    config: {
      screens: {
        VehicleDetails: 'vehicle/:id',
        VehicleSpec: 'spec/:id',
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
          <StatusBar style="light" />
          <NavigationContainer linking={linking}>
            <MainNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </AppProvider>
    </AuthProvider>
  );
}
