import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TestNotificationBanner } from './src/components/TestNotificationBanner';
import { RootTabs } from './src/navigation/RootTabs';
import { AppProviders } from './src/state/AppProviders';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <View style={{ flex: 1 }}>
          <NavigationContainer>
            <RootTabs />
            <StatusBar style="auto" />
          </NavigationContainer>
          <TestNotificationBanner />
        </View>
      </AppProviders>
    </SafeAreaProvider>
  );
}
