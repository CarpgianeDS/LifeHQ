import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { TaskRow } from '../components/TaskRow';
import { categoryLabels, categoryOrder } from '../data/categories';
import { useTasks } from '../state/TasksContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { CategoryKey } from '../theme/tokens';
import type { DueBucket } from '../types/models';
import type { TasksStackParamList } from '../navigation/TasksStack';

type Props = NativeStackScreenProps<TasksStackParamList, 'TasksHome'>;

type StatusFilter = 'all' | DueBucket;
type CategoryFilter = 'all' | CategoryKey;

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
];

const categoryFilters: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...categoryOrder.map((key) => ({ key, label: categoryLabels[key] })),
];

export function TasksScreen({ navigation }: Props) {
  const { tasks, loading, loadError, mutationError, toggleTask, retry } = useTasks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.dueBucket !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.module !== categoryFilter) return false;
    return true;
  });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tasks</Text>

        {loading && (
          <View style={styles.statusCard}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.statusLabel}>Loading tasks…</Text>
          </View>
        )}

        {loadError && !loading && (
          <View style={styles.statusCard}>
            <Text style={styles.errorLabel}>{loadError}</Text>
            <Pressable onPress={retry} style={styles.retryButton}>
              <Text style={styles.retryButtonLabel}>Retry</Text>
            </Pressable>
          </View>
        )}

        {!loading && !loadError && (
          <>
            {mutationError && (
              <View style={styles.mutationErrorCard}>
                <Text style={styles.mutationErrorText}>{mutationError.message}</Text>
              </View>
            )}

            <View style={styles.chipRow}>
              {statusFilters.map((f) => {
                const active = statusFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setStatusFilter(f.key)}
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
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.chipRow}>
              {categoryFilters.map((f) => {
                const active = categoryFilter === f.key;
                const activeBg = f.key === 'all' ? colors.textPrimary : colors.category[f.key].fg;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setCategoryFilter(f.key)}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? activeBg : colors.divider },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: active ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.listCard}>
              {filteredTasks.length === 0 && (
                <Text style={styles.emptyLabel}>No tasks match these filters.</Text>
              )}
              {filteredTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  title={t.title}
                  dueLabel={t.dueLabel}
                  moduleColor={colors.category[t.module].fg}
                  completed={t.completed}
                  overdue={t.dueBucket === 'overdue'}
                  onToggle={() => toggleTask(t.id)}
                  onOpen={() => navigation.navigate('TaskDetail', { taskId: t.id })}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Pressable onPress={() => setQuickAddOpen(true)} style={styles.fab}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>

      <QuickAddSheet visible={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
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
    paddingBottom: 100,
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
  statusCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryButtonLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  mutationErrorCard: {
    marginTop: 18,
    backgroundColor: colors.reviewBg,
    borderRadius: radii.card,
    padding: spacing.cardPadding,
  },
  mutationErrorText: {
    fontSize: 13,
    color: colors.reviewText,
    fontWeight: '600',
  },
  listCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  emptyLabel: {
    padding: 16,
    fontSize: 13,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 12px rgba(181,101,29,0.35)',
    elevation: 6,
  },
  fabLabel: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '400',
    marginTop: -2,
  },
});
