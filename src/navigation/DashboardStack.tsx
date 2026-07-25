import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HouseholdScreen } from '../screens/HouseholdScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  TaskDetail: { taskId: string };
  Household: undefined;
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="Household" component={HouseholdScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </Stack.Navigator>
  );
}
