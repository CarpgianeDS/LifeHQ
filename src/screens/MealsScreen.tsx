import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mealPools } from '../data/mealPools';
import { useMealPlan } from '../state/MealPlanContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { MealsStackParamList } from '../navigation/MealsStack';

type Props = NativeStackScreenProps<MealsStackParamList, 'MealsHome'>;

export function MealsScreen({ navigation }: Props) {
  const { mealPlan, shuffleDay } = useMealPlan();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Meal Plan</Text>
          <Pressable
            onPress={() => navigation.navigate('ShoppingList')}
            style={styles.shoppingButton}
          >
            <Text style={styles.shoppingButtonLabel}>Shopping List</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>This week · 2 adults, 1 toddler</Text>

        <View style={styles.dayList}>
          {mealPlan.map((m) => {
            const breakfast = mealPools.breakfast[m.b];
            const lunch = mealPools.lunch[m.l];
            const dinner = mealPools.dinner[m.d];
            return (
              <View key={m.day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>{m.day}</Text>
                  <Pressable onPress={() => shuffleDay(m.day)} style={styles.shuffleButton}>
                    <Text style={styles.shuffleButtonLabel}>Shuffle</Text>
                  </Pressable>
                </View>
                <MealSlotRow label="Breakfast" title={breakfast.title} toddlerAdapt={breakfast.toddlerAdapt} />
                <MealSlotRow label="Lunch" title={lunch.title} toddlerAdapt={lunch.toddlerAdapt} />
                <MealSlotRow label="Dinner" title={dinner.title} toddlerAdapt={dinner.toddlerAdapt} />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function MealSlotRow({
  label,
  title,
  toddlerAdapt,
}: {
  label: string;
  title: string;
  toddlerAdapt: string;
}) {
  return (
    <View style={styles.slotRow}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.slotTitle}>{title}</Text>
      <Text style={styles.slotAdapt}>{toddlerAdapt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shoppingButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  shoppingButtonLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  dayList: {
    marginTop: 18,
    gap: 12,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shuffleButton: {
    backgroundColor: colors.divider,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  shuffleButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slotRow: {
    marginTop: 10,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  slotTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 2,
  },
  slotAdapt: {
    fontSize: 12,
    color: colors.priority.low,
    marginTop: 1,
  },
});
