import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { View } from 'react-native';
import { CalendarStack } from './CalendarStack';
import { DashboardStack } from './DashboardStack';
import { MealsStack } from './MealsStack';
import { TasksStack } from './TasksStack';
import { RemindersScreen } from '../screens/RemindersScreen';
import { colors } from '../theme/tokens';

export type RootTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Reminders: undefined;
  Meals: undefined;
  Calendar: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabDot({ color }: { color: string }) {
  return (
    <View
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}
    />
  );
}

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarIcon: ({ color }) => <TabDot color={color} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Tasks" component={TasksStack} />
      <Tab.Screen name="Reminders" component={RemindersScreen} />
      <Tab.Screen name="Meals" component={MealsStack} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
    </Tab.Navigator>
  );
}
