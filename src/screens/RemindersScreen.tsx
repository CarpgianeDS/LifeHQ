import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryLabels, categoryOrder } from '../data/categories';
import { useReminders } from '../state/RemindersContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { CategoryKey } from '../theme/tokens';
import type { Reminder } from '../types/models';

type RangeFilter = 'week' | 'month' | 'all';

const ranges: { key: RangeFilter; label: string }[] = [
  { key: 'week', label: 'Week ahead' },
  { key: 'month', label: 'Month ahead' },
  { key: 'all', label: 'All' },
];

const snoozeOptions: { key: string; label: string; taps: string }[] = [
  { key: '15m', label: '15m', taps: '15 min' },
  { key: '1h', label: '1h', taps: '1 hour' },
  { key: 'tomorrow', label: 'Tomorrow', taps: 'tomorrow' },
];

export function RemindersScreen() {
  const { reminders, toggleComplete, snooze, setCategory } = useReminders();
  const [range, setRange] = useState<RangeFilter>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => a.daysOut - b.daysOut);
    if (range === 'week') return sorted.filter((r) => r.daysOut <= 7);
    if (range === 'month') return sorted.filter((r) => r.daysOut <= 30);
    return sorted;
  }, [reminders, range]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Reminders</Text>

        <View style={styles.chipRow}>
          {ranges.map((r) => {
            const active = range === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRange(r.key)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.accent : colors.divider },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.listCard}>
          {visible.map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              menuOpen={menuOpenId === r.id}
              onToggleMenu={() => setMenuOpenId((cur) => (cur === r.id ? null : r.id))}
              onToggleComplete={() => toggleComplete(r.id)}
              onSelectCategory={(module) => {
                setCategory(r.id, module);
                setMenuOpenId(null);
              }}
              onSnooze={(label) => snooze(r.id, label)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

interface ReminderRowProps {
  reminder: Reminder;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onToggleComplete: () => void;
  onSelectCategory: (module: CategoryKey) => void;
  onSnooze: (label: string) => void;
}

function ReminderRow({
  reminder,
  menuOpen,
  onToggleMenu,
  onToggleComplete,
  onSelectCategory,
  onSnooze,
}: ReminderRowProps) {
  const isEvent = !reminder.taskId;
  const category = colors.category[reminder.module];
  const checkColor = reminder.completed ? colors.success : '#D9D2C7';
  const checkBg = reminder.completed ? colors.success : 'transparent';

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Pressable
          onPress={onToggleComplete}
          hitSlop={8}
          style={[
            styles.checkbox,
            isEvent ? styles.checkboxSquare : styles.checkboxCircle,
            { borderColor: checkColor, backgroundColor: checkBg },
          ]}
        />
        <View style={styles.rowBody}>
          <Text
            style={[
              styles.rowTitle,
              reminder.completed && styles.rowTitleCompleted,
            ]}
          >
            {reminder.title}
          </Text>
          <Text style={styles.rowTime}>{reminder.time}</Text>
        </View>
        {isEvent && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeLabel}>Event</Text>
          </View>
        )}
        {reminder.recurring && (
          <View style={styles.recurringBadge}>
            <Text style={styles.recurringBadgeLabel}>Recurring</Text>
          </View>
        )}
        <Pressable
          onPress={onToggleMenu}
          style={[styles.modulePill, { backgroundColor: category.bg }]}
        >
          <Text style={[styles.modulePillLabel, { color: category.fg }]}>
            {categoryLabels[reminder.module]}
          </Text>
        </Pressable>
      </View>

      {menuOpen && (
        <View style={styles.categoryMenu}>
          {categoryOrder.map((key) => {
            const active = reminder.module === key;
            const activeColor = colors.category[key].fg;
            return (
              <Pressable
                key={key}
                onPress={() => onSelectCategory(key)}
                style={[
                  styles.categoryOption,
                  { backgroundColor: active ? activeColor : colors.divider },
                ]}
              >
                <Text
                  style={[
                    styles.categoryOptionLabel,
                    { color: active ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {categoryLabels[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.snoozeRow}>
        {snoozeOptions.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => onSnooze(opt.taps)}
            style={styles.snoozeButton}
          >
            <Text style={styles.snoozeButtonLabel}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
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
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  listCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  row: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
  },
  checkboxCircle: {
    borderRadius: 11,
  },
  checkboxSquare: {
    borderRadius: 6,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  rowTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.45,
  },
  rowTime: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  eventBadge: {
    backgroundColor: colors.divider,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  eventBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  recurringBadge: {
    backgroundColor: colors.category.admin.bg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  recurringBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.category.admin.fg,
  },
  modulePill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
  },
  modulePillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryMenu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingLeft: 34,
  },
  categoryOption: {
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  categoryOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingLeft: 34,
  },
  snoozeButton: {
    backgroundColor: colors.divider,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  snoozeButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
