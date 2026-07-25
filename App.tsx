import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootTabs } from './src/navigation/RootTabs';
import { TasksProvider } from './src/state/TasksContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <TasksProvider>
        <NavigationContainer>
          <RootTabs />
          <StatusBar style="auto" />
        </NavigationContainer>
      </TasksProvider>
    </SafeAreaProvider>
  );
}
