import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';
import type { CategoryKey } from '../theme/tokens';

interface TaskRowProps {
  title: string;
  dueLabel: string;
  moduleColor: string;
  completed: boolean;
  overdue?: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

export function TaskRow({
  title,
  dueLabel,
  moduleColor,
  completed,
  overdue = false,
  onToggle,
  onOpen,
}: TaskRowProps) {
  const checkColor = completed ? colors.success : '#D9D2C7';
  const checkBg = completed ? colors.success : 'transparent';
  const dueColor = overdue ? colors.priority.high : colors.textMuted;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        style={[styles.checkbox, { borderColor: checkColor, backgroundColor: checkBg }]}
      />
      <View style={[styles.dot, { backgroundColor: moduleColor }]} />
      <Pressable onPress={onOpen} style={styles.body}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            completed && styles.titleCompleted,
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.due, { color: dueColor, fontWeight: overdue ? '700' : '400' }]}>
          {dueLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  due: {
    fontSize: 12.5,
    marginTop: 2,
  },
});
