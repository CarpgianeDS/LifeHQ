import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { TasksScreen } from '../screens/TasksScreen';

export type TasksStackParamList = {
  TasksHome: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<TasksStackParamList>();

export function TasksStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TasksHome" component={TasksScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
    </Stack.Navigator>
  );
}
