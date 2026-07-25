import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/tokens';

export function PlaceholderScreen({ label }: { label: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>{label}</Text>
      <Text style={styles.sub}>Not built yet</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
});
