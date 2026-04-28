/**
 * PaceTable Component
 * Shows the 5 pace values (E, M, T, I, R) for the current plan
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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
  E: 'E',
  M: 'M',
  T: 'T',
  I: 'I',
  R: 'R',
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
    <Animated.View style={styles.container} entering={FadeIn.delay(100)}>
      <Text style={styles.title}>配速表</Text>
      <View style={styles.table}>
        {paceEntries.map(({ key, value }) => (
          <View key={key} style={styles.paceItem}>
            <View style={styles.circle}>
              <Text style={styles.circleLetter}>{key}</Text>
            </View>
            <Text style={styles.paceValue}>{formatPace(value)}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
    paddingLeft: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: PlatformColor('label'),
  },
  table: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  paceItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: "0 2px 4px rgba(255, 149, 0, 0.3)",
  },
  circleLetter: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
  paceValue: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
    fontVariant: ['tabular-nums'],
  },
});
