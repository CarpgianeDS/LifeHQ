import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
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
      <Stack.Screen name="Household">
        {() => <PlaceholderScreen label="Household" />}
      </Stack.Screen>
      <Stack.Screen name="NotificationSettings">
        {() => <PlaceholderScreen label="Notifications" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
