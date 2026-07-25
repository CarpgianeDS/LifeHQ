import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { TaskRow } from '../components/TaskRow';
import { initialEmailSuggestions } from '../data/mockTasks';
import { useTasks } from '../state/TasksContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { EmailSuggestion, Task } from '../types/models';
import type { DashboardStackParamList } from '../navigation/DashboardStack';
import type { RootTabParamList } from '../navigation/RootTabs';

type Props = NativeStackScreenProps<DashboardStackParamList, 'DashboardHome'>;

type EmailBannerState = 'connect' | 'scanning' | 'suggestions' | 'done';

export function DashboardScreen({ navigation }: Props) {
  const { tasks, toggleTask, addTask } = useTasks();

  const [emailState, setEmailState] = useState<EmailBannerState>('connect');
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>(initialEmailSuggestions);

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const overdueTasks = tasks.filter((t) => !t.completed && t.dueBucket === 'overdue');
  const todayTasks = tasks.filter((t) => !t.completed && t.dueBucket === 'today');
  const upcomingPreview = tasks
    .filter((t) => !t.completed && t.dueBucket === 'upcoming')
    .slice(0, 3);

  function connectEmail() {
    setEmailState('scanning');
    setTimeout(() => setEmailState('suggestions'), 1200);
  }

  function dismissSuggestion(id: string) {
    setSuggestions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) setEmailState('done');
      return next;
    });
  }

  function addSuggestion(sug: EmailSuggestion) {
    const task: Task = {
      id: `sug-${sug.id}-${Date.now()}`,
      title: sug.title,
      module: sug.module,
      dueLabel: sug.dueLabel,
      dueBucket: sug.dueBucket,
      priority: 'medium',
      completed: false,
      source: 'email',
      notes: sug.detail,
      needsReview: sug.confidence < 0.85,
    };
    addTask(task);
    dismissSuggestion(sug.id);
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>Alex</Text>
            <Text style={styles.date}>Wednesday, 8 July</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate('NotificationSettings')}
              style={styles.bellButton}
            >
              <View style={styles.bellShape} />
              <View style={styles.bellDot} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Household')}
              style={styles.avatarButton}
              hitSlop={8}
            >
              <View style={[styles.avatarCircle, styles.avatarBack]} />
              <View style={[styles.avatarCircle, styles.avatarFront]} />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={() => setQuickAddOpen(true)} style={styles.quickAddButton}>
          <Text style={styles.quickAddLabel}>+ Quick Add</Text>
        </Pressable>

        {emailState === 'connect' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Catch bills automatically</Text>
            <Text style={styles.cardBody}>
              Connect your email so LifeHQ can scan for renewals like insurance and tax, and
              turn them into reminders.
            </Text>
            <Pressable onPress={connectEmail} style={styles.connectButton}>
              <Text style={styles.connectButtonLabel}>Connect Email</Text>
            </Pressable>
          </View>
        )}

        {emailState === 'scanning' && (
          <View style={[styles.card, styles.rowCard]}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.scanningLabel}>Scanning inbox for bills…</Text>
          </View>
        )}

        {emailState === 'suggestions' && suggestions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Detected From Email</Text>
            <View style={styles.listCard}>
              {suggestions.map((sug) => {
                const category = colors.category[sug.module];
                const highConfidence = sug.confidence >= 0.85;
                return (
                  <View key={sug.id} style={styles.suggestionRow}>
                    <View style={styles.suggestionHeader}>
                      <View style={styles.suggestionTitleGroup}>
                        <View style={[styles.dot, { backgroundColor: category.fg }]} />
                        <Text numberOfLines={1} style={styles.suggestionTitle}>
                          {sug.title}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.confidenceBadge,
                          {
                            backgroundColor: highConfidence ? colors.category.house.bg : colors.reviewBg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.confidenceLabel,
                            { color: highConfidence ? colors.category.house.fg : colors.reviewText },
                          ]}
                        >
                          {highConfidence ? 'High confidence' : 'Needs review'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.suggestionDetail}>{sug.detail}</Text>
                    <View style={styles.suggestionActions}>
                      <Pressable
                        onPress={() => dismissSuggestion(sug.id)}
                        style={[styles.smallButton, styles.dismissButton]}
                      >
                        <Text style={styles.dismissButtonLabel}>Dismiss</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => addSuggestion(sug)}
                        style={[styles.smallButton, styles.addButton]}
                      >
                        <Text style={styles.addButtonLabel}>Add Reminder</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {overdueTasks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.overdueLabel]}>Overdue</Text>
            <View style={styles.listCard}>
              {overdueTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  title={t.title}
                  dueLabel={t.dueLabel}
                  moduleColor={colors.category[t.module].fg}
                  completed={t.completed}
                  overdue
                  onToggle={() => toggleTask(t.id)}
                  onOpen={() => navigation.navigate('TaskDetail', { taskId: t.id })}
                />
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Today</Text>
        <View style={styles.listCard}>
          {todayTasks.length === 0 && (
            <Text style={styles.emptyLabel}>Nothing due today — enjoy the break.</Text>
          )}
          {todayTasks.map((t) => (
            <TaskRow
              key={t.id}
              title={t.title}
              dueLabel={t.dueLabel}
              moduleColor={colors.category[t.module].fg}
              completed={t.completed}
              onToggle={() => toggleTask(t.id)}
              onOpen={() => navigation.navigate('TaskDetail', { taskId: t.id })}
            />
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Upcoming Reminders</Text>
          <Pressable
            onPress={() =>
              navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()?.navigate('Reminders')
            }
          >
            <Text style={styles.viewAllLabel}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.listCard}>
          {upcomingPreview.map((t) => (
            <TaskRow
              key={t.id}
              title={t.title}
              dueLabel={t.dueLabel}
              moduleColor={colors.category[t.module].fg}
              completed={t.completed}
              onToggle={() => toggleTask(t.id)}
              onOpen={() => navigation.navigate('TaskDetail', { taskId: t.id })}
            />
          ))}
        </View>
      </ScrollView>

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
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
  name: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellShape: {
    width: 12,
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.textSecondary,
  },
  bellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
    marginTop: 1,
  },
  avatarButton: {
    width: 36,
    height: 32,
  },
  avatarCircle: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.screenBg,
  },
  avatarBack: {
    left: 0,
    backgroundColor: colors.accent,
  },
  avatarFront: {
    left: 14,
    backgroundColor: colors.tescoAction,
  },
  quickAddButton: {
    marginTop: 18,
    backgroundColor: colors.accent,
    borderRadius: radii.card,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  quickAddLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    marginTop: 14,
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
  connectButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  connectButtonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  scanningLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionLabel: {
    marginTop: 26,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  overdueLabel: {
    color: colors.priority.high,
  },
  sectionHeaderRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  listCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  emptyLabel: {
    padding: 16,
    fontSize: 13,
    color: colors.textMuted,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  suggestionRow: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  suggestionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  confidenceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionDetail: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  smallButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: colors.divider,
  },
  dismissButtonLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.accent,
  },
  addButtonLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
