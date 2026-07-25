import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildShoppingGroups, countUnchecked } from '../data/shoppingList';
import { useMealPlan } from '../state/MealPlanContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { MealsStackParamList } from '../navigation/MealsStack';

type Props = NativeStackScreenProps<MealsStackParamList, 'ShoppingList'>;

export function ShoppingListScreen({ navigation }: Props) {
  const {
    mealPlan,
    shoppingChecked,
    toggleShoppingItem,
    tescoConnected,
    tescoConnecting,
    connectTesco,
    tescoStatus,
    addToTescoBasket,
  } = useMealPlan();

  const groups = useMemo(() => buildShoppingGroups(mealPlan), [mealPlan]);
  const uncheckedCount = useMemo(
    () => countUnchecked(groups, shoppingChecked),
    [groups, shoppingChecked],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Shopping List</Text>
      <Text style={styles.subtitle}>Generated from this week&apos;s meal plan</Text>

      {groups.map((group) => (
        <View key={group.category} style={styles.groupBlock}>
          <Text style={styles.groupLabel}>{group.category}</Text>
          <View style={styles.listCard}>
            {group.items.map((item) => {
              const checked = !!shoppingChecked[item.name];
              return (
                <Pressable
                  key={item.name}
                  onPress={() => toggleShoppingItem(item.name)}
                  style={styles.itemRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: checked ? colors.success : '#D9D2C7',
                        backgroundColor: checked ? colors.success : 'transparent',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.itemName,
                      checked && styles.itemNameChecked,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.count > 1 && (
                    <Text style={styles.itemQty}>{`×${item.count}`}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {!tescoConnected && !tescoConnecting && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connect your Tesco account</Text>
          <Text style={styles.cardBody}>
            Sign in to send this list straight to your Tesco online shopping basket.
          </Text>
          <Pressable onPress={connectTesco} style={styles.tescoButton}>
            <Text style={styles.tescoButtonLabel}>Connect Tesco Account</Text>
          </Pressable>
        </View>
      )}

      {tescoConnecting && (
        <View style={[styles.card, styles.rowCard]}>
          <ActivityIndicator color={colors.tescoAction} />
          <Text style={styles.statusLabel}>Connecting to Tesco…</Text>
        </View>
      )}

      {tescoConnected && tescoStatus === 'idle' && uncheckedCount > 0 && (
        <Pressable onPress={addToTescoBasket} style={styles.basketButton}>
          <Text style={styles.basketButtonLabel}>
            Add {uncheckedCount} items to Tesco Basket
          </Text>
        </Pressable>
      )}

      {tescoConnected && tescoStatus === 'sending' && (
        <View style={[styles.card, styles.rowCard]}>
          <ActivityIndicator color={colors.tescoAction} />
          <Text style={styles.statusLabel}>Adding to Tesco basket…</Text>
        </View>
      )}

      {tescoConnected && tescoStatus === 'done' && (
        <View style={[styles.card, styles.rowCard]}>
          <View style={styles.doneBadge}>
            <View style={styles.doneCheck} />
          </View>
          <View style={styles.doneTextGroup}>
            <Text style={styles.doneTitle}>
              {uncheckedCount} items added to your Tesco basket
            </Text>
            <Text style={styles.doneSubtitle}>
              Open the Tesco app to review and check out.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 8,
    paddingBottom: 40,
  },
  back: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  groupBlock: {
    marginTop: 22,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  listCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.4,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  card: {
    marginTop: 22,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardBody: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  tescoButton: {
    marginTop: 12,
    backgroundColor: colors.tescoAction,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  tescoButtonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  basketButton: {
    marginTop: 22,
    backgroundColor: colors.tescoAction,
    borderRadius: radii.card,
    paddingVertical: 14,
    alignItems: 'center',
  },
  basketButtonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: {
    width: 12,
    height: 7,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: '#fff',
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  doneTextGroup: {
    flex: 1,
  },
  doneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  doneSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
});
