import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { computeNotifSummary } from '../data/notifications';
import { useTasks } from '../state/TasksContext';
import { useTestNotification } from '../state/TestNotificationContext';
import { colors, radii, spacing } from '../theme/tokens';

type Props = {
  navigation: { goBack: () => void };
};

const timeOptions = ['7:00 AM', '8:00 AM', '9:00 AM'];

export function NotificationSettingsScreen({ navigation }: Props) {
  const { tasks } = useTasks();
  const { trigger } = useTestNotification();
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('8:00 AM');

  const summary = computeNotifSummary(tasks);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Get a daily summary of what&apos;s due.</Text>

      <View style={styles.toggleCard}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.toggleTitle}>Daily task summary</Text>
          <Text style={styles.toggleSubtitle}>
            Sent to your iPhone and Apple Watch each morning
          </Text>
        </View>
        <Pressable
          onPress={() => setEnabled((v) => !v)}
          style={[styles.track, { backgroundColor: enabled ? colors.accent : '#D9D2C7' }]}
        >
          <View style={[styles.knob, { left: enabled ? 22 : 2 }]} />
        </Pressable>
      </View>

      {enabled && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Delivery time</Text>
            <View style={styles.pillRow}>
              {timeOptions.map((t) => {
                const active = time === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTime(t)}
                    style={[styles.pill, { backgroundColor: active ? colors.accent : colors.divider }]}
                  >
                    <Text style={[styles.pillLabel, { color: active ? '#fff' : colors.textSecondary }]}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewIcon} />
            <View style={styles.previewBody}>
              <View style={styles.previewTopRow}>
                <Text style={styles.previewAppName}>LifeHQ</Text>
                <Text style={styles.previewTime}>{time}</Text>
              </View>
              <Text style={styles.previewSummary}>{summary}</Text>
            </View>
          </View>

          <Pressable onPress={trigger} style={styles.testButton}>
            <Text style={styles.testButtonLabel}>Send Test Notification</Text>
          </Pressable>
          <Text style={styles.testHint}>Sends to both the iPhone and Apple Watch mockups below.</Text>
        </>
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
  toggleCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  track: {
    width: 44,
    height: 26,
    borderRadius: radii.pill,
  },
  knob: {
    position: 'absolute',
    top: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  card: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    marginTop: 22,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  previewCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  previewIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  previewBody: {
    flex: 1,
    minWidth: 0,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewAppName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewTime: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  previewSummary: {
    fontSize: 13.5,
    color: colors.textBody,
    marginTop: 3,
    lineHeight: 18,
  },
  testButton: {
    marginTop: 16,
    backgroundColor: colors.divider,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  testButtonLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  testHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
