import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryLabels } from '../data/categories';
import { useTasks } from '../state/TasksContext';
import { colors, radii, spacing } from '../theme/tokens';

// Structural typing (rather than a specific stack's ParamList) so this screen
// can be registered in multiple stacks (Dashboard, Tasks) unchanged.
type Props = {
  route: { params: { taskId: string } };
  navigation: { goBack: () => void };
};

const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low' } as const;

const sourceLabels = {
  manual: 'Added manually',
  watch_voice: 'Captured via Apple Watch voice',
  email: 'Detected from email',
} as const;

export function TaskDetailScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const { tasks, toggleTask } = useTasks();
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <View style={styles.screen}>
        <Text style={styles.notFound}>Task not found.</Text>
      </View>
    );
  }

  const category = colors.category[task.module];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      {task.needsReview && (
        <View style={styles.reviewBanner}>
          <Text style={styles.reviewText}>Captured by AI — please confirm details</Text>
          <Pressable style={styles.confirmButton}>
            <Text style={styles.confirmButtonLabel}>Confirm</Text>
          </Pressable>
        </View>
      )}

      <Text style={[styles.title, task.completed && styles.titleCompleted]}>{task.title}</Text>

      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: category.bg }]}>
          <Text style={[styles.pillLabel, { color: category.fg }]}>
            {categoryLabels[task.module]}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.divider }]}>
          <Text style={[styles.pillLabel, { color: colors.priority[task.priority] }]}>
            {priorityLabels[task.priority]} priority
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Due</Text>
        <Text style={styles.cardValue}>{task.dueLabel}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Notes</Text>
        <Text style={styles.notes}>{task.notes || '—'}</Text>
      </View>

      <Text style={styles.source}>{sourceLabels[task.source]}</Text>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => toggleTask(task.id)}
          style={[styles.actionButton, styles.completeButton]}
        >
          <Text style={styles.completeButtonLabel}>
            {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.snoozeButton]}>
          <Text style={styles.snoozeButtonLabel}>Snooze</Text>
        </Pressable>
      </View>
      <Pressable style={styles.deleteButton}>
        <Text style={styles.deleteButtonLabel}>Delete task</Text>
      </Pressable>
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
  notFound: {
    padding: 20,
    color: colors.textMuted,
  },
  back: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
  },
  reviewBanner: {
    backgroundColor: colors.reviewBg,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewText: {
    flex: 1,
    fontSize: 13,
    color: colors.reviewText,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  confirmButtonLabel: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  pillLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  card: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
  notes: {
    fontSize: 14.5,
    color: colors.textBody,
    lineHeight: 21,
    marginTop: 6,
  },
  source: {
    marginTop: 14,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  completeButtonLabel: {
    color: '#fff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  snoozeButton: {
    backgroundColor: colors.divider,
  },
  snoozeButtonLabel: {
    color: colors.textSecondary,
    fontSize: 14.5,
    fontWeight: '700',
  },
  deleteButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonLabel: {
    color: colors.priority.high,
    fontSize: 14.5,
    fontWeight: '600',
  },
});
