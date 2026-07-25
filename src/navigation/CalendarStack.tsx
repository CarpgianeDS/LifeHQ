import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CalendarSyncScreen } from '../screens/CalendarSyncScreen';

export type CalendarStackParamList = {
  CalendarHome: undefined;
  CalendarSync: undefined;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarHome" component={CalendarScreen} />
      <Stack.Screen name="CalendarSync" component={CalendarSyncScreen} />
    </Stack.Navigator>
  );
}
