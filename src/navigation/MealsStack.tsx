import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { MealsScreen } from '../screens/MealsScreen';
import { ShoppingListScreen } from '../screens/ShoppingListScreen';

export type MealsStackParamList = {
  MealsHome: undefined;
  ShoppingList: undefined;
};

const Stack = createNativeStackNavigator<MealsStackParamList>();

export function MealsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealsHome" component={MealsScreen} />
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
    </Stack.Navigator>
  );
}
