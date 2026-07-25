import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  addDaysObj,
  dayShort,
  formatFull,
  mondayIndex,
  monthNames,
  sameYMD,
  TODAY,
  weekDates,
} from '../data/calendarDates';
import type { YMD } from '../data/calendarDates';
import { categoryLabels } from '../data/categories';
import { eventsForDate } from '../data/calendarEvents';
import { useCalendarSync } from '../state/CalendarSyncContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { CalendarStackParamList } from '../navigation/CalendarStack';

type Props = NativeStackScreenProps<CalendarStackParamList, 'CalendarHome'>;

type ViewMode = 'week' | 'month';

export function CalendarScreen({ navigation }: Props) {
  const { connectedCount } = useCalendarSync();
  const [view, setView] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState(2);
  const [viewMonth, setViewMonth] = useState({ y: TODAY.y, m: TODAY.m });
  const [monthSelectedDate, setMonthSelectedDate] = useState<YMD>(TODAY);

  const connectedLabel =
    connectedCount === 0
      ? 'No calendars connected — tap Sync to add one'
      : `${connectedCount} calendar${connectedCount > 1 ? 's' : ''} connected`;

  const selectedDate = weekDates[selectedDay];
  const selectedEvents = useMemo(() => eventsForDate(selectedDate), [selectedDate]);
  const monthSelectedEvents = useMemo(
    () => eventsForDate(monthSelectedDate),
    [monthSelectedDate],
  );

  function navigateMonth(delta: number) {
    let { y, m } = viewMonth;
    m += delta;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth({ y, m });
    setMonthSelectedDate({ y, m, d: 1 });
  }

  const monthWeeks = useMemo(() => buildMonthWeeks(viewMonth, monthSelectedDate), [
    viewMonth,
    monthSelectedDate,
  ]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Calendar</Text>
          <Pressable onPress={() => navigation.navigate('CalendarSync')} style={styles.syncButton}>
            <Text style={styles.syncButtonLabel}>Sync</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>{connectedLabel}</Text>

        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setView('week')}
            style={[styles.chip, { backgroundColor: view === 'week' ? colors.accent : colors.divider }]}
          >
            <Text style={[styles.chipLabel, { color: view === 'week' ? '#fff' : colors.textSecondary }]}>
              Week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setView('month')}
            style={[styles.chip, { backgroundColor: view === 'month' ? colors.accent : colors.divider }]}
          >
            <Text style={[styles.chipLabel, { color: view === 'month' ? '#fff' : colors.textSecondary }]}>
              Month
            </Text>
          </Pressable>
        </View>

        {view === 'week' && (
          <>
            <View style={styles.weekStrip}>
              {dayShort.map((label, i) => {
                const ymd = weekDates[i];
                const isToday = sameYMD(ymd, TODAY);
                const isSelected = i === selectedDay;
                const hasEvents = eventsForDate(ymd).length > 0;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setSelectedDay(i)}
                    style={[
                      styles.dayCell,
                      { backgroundColor: isSelected ? colors.accent : isToday ? colors.reviewBg : colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellLabel,
                        { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text
                      style={[
                        styles.dayCellNum,
                        { color: isSelected ? '#fff' : colors.textPrimary },
                      ]}
                    >
                      {ymd.d}
                    </Text>
                    {hasEvents && (
                      <View
                        style={[
                          styles.dayDot,
                          { backgroundColor: isSelected ? '#fff' : colors.accent },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{formatFull(selectedDate).toUpperCase()}</Text>
            <AgendaList events={selectedEvents} />
          </>
        )}

        {view === 'month' && (
          <>
            <View style={styles.monthNavRow}>
              <Pressable onPress={() => navigateMonth(-1)} style={styles.monthNavButton}>
                <Text style={styles.monthNavButtonLabel}>‹</Text>
              </Pressable>
              <Text style={styles.monthLabel}>
                {monthNames[viewMonth.m]} {viewMonth.y}
              </Text>
              <Pressable onPress={() => navigateMonth(1)} style={styles.monthNavButton}>
                <Text style={styles.monthNavButtonLabel}>›</Text>
              </Pressable>
            </View>

            <View style={styles.monthGridHeader}>
              {dayShort.map((label) => (
                <Text key={label} style={styles.monthWeekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            {monthWeeks.map((week, wi) => (
              <View key={wi} style={styles.monthGridRow}>
                {week.map((cell) => (
                  <Pressable
                    key={`${cell.ymd.y}-${cell.ymd.m}-${cell.ymd.d}`}
                    onPress={() => setMonthSelectedDate(cell.ymd)}
                    style={[
                      styles.monthCell,
                      {
                        backgroundColor: cell.isSelected
                          ? colors.accent
                          : cell.isToday
                            ? colors.reviewBg
                            : cell.inMonth
                              ? colors.surface
                              : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthCellLabel,
                        {
                          color: cell.isSelected
                            ? '#fff'
                            : cell.inMonth
                              ? colors.textPrimary
                              : '#C9C2B8',
                        },
                      ]}
                    >
                      {cell.ymd.d}
                    </Text>
                    {cell.hasEvents && (
                      <View
                        style={[
                          styles.dayDot,
                          { backgroundColor: cell.isSelected ? '#fff' : colors.accent },
                        ]}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            ))}

            <Text style={styles.sectionLabel}>{formatFull(monthSelectedDate).toUpperCase()}</Text>
            <AgendaList events={monthSelectedEvents} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function AgendaList({ events }: { events: ReturnType<typeof eventsForDate> }) {
  return (
    <View style={styles.listCard}>
      {events.length === 0 && <Text style={styles.emptyLabel}>Nothing scheduled</Text>}
      {events.map((ev) => (
        <View key={ev.id} style={styles.agendaRow}>
          <View style={[styles.agendaDot, { backgroundColor: colors.category[ev.module].fg }]} />
          <View style={styles.agendaBody}>
            <Text style={styles.agendaTitle}>{ev.title}</Text>
            <Text style={styles.agendaMeta}>
              {ev.time} · {categoryLabels[ev.module]}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

interface MonthCell {
  ymd: YMD;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
}

function buildMonthWeeks(viewMonth: { y: number; m: number }, selected: YMD): MonthCell[][] {
  const { y, m } = viewMonth;
  const first: YMD = { y, m, d: 1 };
  const startOffset = mondayIndex(first);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const totalCells = startOffset + daysInMonth;
  const numRows = Math.ceil(totalCells / 7);
  const gridStart = addDaysObj(first, -startOffset);

  const rows: MonthCell[][] = [];
  for (let w = 0; w < numRows; w++) {
    const days: MonthCell[] = [];
    for (let d = 0; d < 7; d++) {
      const ymd = addDaysObj(gridStart, w * 7 + d);
      days.push({
        ymd,
        inMonth: ymd.m === m && ymd.y === y,
        isToday: sameYMD(ymd, TODAY),
        isSelected: sameYMD(ymd, selected),
        hasEvents: eventsForDate(ymd).length > 0,
      });
    }
    rows.push(days);
  }
  return rows;
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
  syncButton: {
    backgroundColor: colors.divider,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  syncButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
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
  weekStrip: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  dayCellLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  dayCellNum: {
    fontSize: 15,
    fontWeight: '700',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionLabel: {
    marginTop: 22,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  listCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  emptyLabel: {
    padding: 28,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textMuted,
  },
  agendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  agendaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agendaBody: {
    flex: 1,
    minWidth: 0,
  },
  agendaTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  agendaMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthGridHeader: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  monthWeekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textMuted,
    paddingBottom: 4,
  },
  monthGridRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  monthCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 10,
  },
  monthCellLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
