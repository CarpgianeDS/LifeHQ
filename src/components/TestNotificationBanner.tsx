import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { computeNotifSummary } from '../data/notifications';
import { useTasks } from '../state/TasksContext';
import { useTestNotification } from '../state/TestNotificationContext';
import { colors } from '../theme/tokens';

export function TestNotificationBanner() {
  const { visible } = useTestNotification();
  const { tasks } = useTasks();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -120,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
        <View style={styles.icon} />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.appName}>LifeHQ</Text>
            <Text style={styles.now}>now</Text>
          </View>
          <Text style={styles.summary}>{computeNotifSummary(tasks)}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'stretch',
    paddingHorizontal: 8,
    paddingTop: 56,
    zIndex: 100,
    pointerEvents: 'none',
  },
  banner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 14,
    boxShadow: '0px 10px 20px rgba(0,0,0,0.18)',
    elevation: 8,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  now: {
    fontSize: 11,
    color: colors.textMuted,
  },
  summary: {
    fontSize: 13,
    color: colors.textBody,
    marginTop: 2,
    lineHeight: 18,
  },
});
