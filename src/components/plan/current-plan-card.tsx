/**
 * CurrentPlanCard Component
 * Shows current plan overview: name, target, weeks, vdot, desc
 */

import { View, Text, StyleSheet } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { PlanInfo } from './types';
import { formatDuration, formatTargetDistance } from './queries';

interface Props {
  plan: PlanInfo;
}

export default function CurrentPlanCard({ plan }: Props) {
  return (
    <View style={styles.card}>
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
      </View>

      <View style={styles.vdotBadge}>
        <Text style={styles.vdotLabel}>VDOT</Text>
        <Text style={styles.vdotValue}>{plan.vdot}</Text>
      </View>

      {plan.desc && <Text style={styles.desc}>{plan.desc}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  name: {
    ...TYPOGRAPHY.title1,
    color: PlatformColor('label'),
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.xl,
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
    gap: SPACING.sm,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  vdotLabel: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
  },
  vdotValue: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  desc: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('secondaryLabel'),
    marginTop: SPACING.xs,
  },
});
