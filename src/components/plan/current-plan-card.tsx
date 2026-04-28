/**
 * CurrentPlanCard Component
 * Shows current plan overview: name, target, weeks, vdot, desc
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { PlanInfo } from './types';
import { formatDuration, formatTargetDistance } from './queries';

interface Props {
  plan: PlanInfo;
}

export default function CurrentPlanCard({ plan }: Props) {
  return (
    <Animated.View style={styles.card} entering={FadeIn}>
      <Text style={styles.name}>{plan.name}</Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>目标</Text>
          <Text style={styles.statValue}>
            {formatTargetDistance(plan.targetDistance)} · {formatDuration(plan.targetTime)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>周期</Text>
          <Text style={styles.statValue}>{plan.weeks} 周</Text>
        </View>
        <View style={styles.vdotBadge}>
          <Text style={styles.vdotLabel}>VDOT</Text>
          <Text style={styles.vdotValue}>{plan.vdot}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginLeft: SPACING.md,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  name: {
    ...TYPOGRAPHY.title2,
    color: PlatformColor('label'),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  stat: {
    gap: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
  },
  statValue: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  vdotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginLeft: 'auto',
  },
  vdotLabel: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
  },
  vdotValue: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
  },
});
