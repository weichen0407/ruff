/**
 * PaceTable Component
 * Shows the 5 pace values (E, M, T, I, R) for the current plan
 */

import { View, Text, StyleSheet } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { PaceMode } from './types';
import { formatPace } from './queries';

interface Props {
  paces: {
    paceE: number;
    paceM: number;
    paceT: number;
    paceI: number;
    paceR: number;
  };
}

const PACE_LABELS: Record<PaceMode, string> = {
  E: 'E (轻松)',
  M: 'M (马拉松)',
  T: 'T (阈值)',
  I: 'I (间歇)',
  R: 'R (重复)',
};

export default function PaceTable({ paces }: Props) {
  const paceEntries: { key: PaceMode; value: number }[] = [
    { key: 'E', value: paces.paceE },
    { key: 'M', value: paces.paceM },
    { key: 'T', value: paces.paceT },
    { key: 'I', value: paces.paceI },
    { key: 'R', value: paces.paceR },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>配速表</Text>
      <View style={styles.table}>
        {paceEntries.map(({ key, value }) => (
          <View key={key} style={styles.row}>
            <Text style={styles.paceName}>{key}</Text>
            <Text style={styles.paceLabel}>{PACE_LABELS[key]}</Text>
            <Text style={styles.paceValue}>{formatPace(value)}/km</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  table: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  paceName: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('systemOrange'),
    width: 24,
  },
  paceLabel: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
    flex: 1,
  },
  paceValue: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
    fontVariant: ['tabular-nums'],
  },
});
