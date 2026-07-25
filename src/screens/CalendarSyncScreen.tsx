import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { providerIconColors, providerNames, providerOrder } from '../data/calendarSync';
import { useCalendarSync } from '../state/CalendarSyncContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { CalendarStackParamList } from '../navigation/CalendarStack';

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarSync'>;

export function CalendarSyncScreen({ navigation }: Props) {
  const { providers, toggleProvider } = useCalendarSync();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Sync Calendars</Text>
      <Text style={styles.subtitle}>Connect external calendars to see everything in one place.</Text>

      <View style={styles.listCard}>
        {providerOrder.map((key) => {
          const status = providers[key];
          const connecting = status === 'connecting';
          const connected = status === 'connected';
          const statusLabel = connecting
            ? 'Connecting…'
            : connected
              ? 'Connected · syncing events'
              : 'Not connected';
          const btnLabel = connecting ? '…' : connected ? 'Connected' : 'Connect';
          const btnBg = connecting ? colors.divider : connected ? colors.category.house.bg : colors.accent;
          const btnColor = connecting ? colors.textSecondary : connected ? '#2F6B4A' : '#fff';

          return (
            <View key={key} style={styles.row}>
              <View style={styles.iconWrap}>
                <View style={[styles.iconDot, { backgroundColor: providerIconColors[key] }]} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{providerNames[key]}</Text>
                <Text style={styles.rowStatus}>{statusLabel}</Text>
              </View>
              <Pressable
                onPress={() => toggleProvider(key)}
                disabled={connecting}
                style={[styles.actionButton, { backgroundColor: btnBg }]}
              >
                <Text style={[styles.actionButtonLabel, { color: btnColor }]}>{btnLabel}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
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
  listCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowStatus: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  actionButton: {
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionButtonLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
