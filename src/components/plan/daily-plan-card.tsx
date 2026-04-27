/**
 * DailyPlanCard Component
 * Shows a single day's training plan
 */

import { View, Text, StyleSheet } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { DayPlan } from './types';
import { formatPace, formatDuration } from './queries';

interface Props {
  dayPlan: DayPlan;
  isToday?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  run: '#FF9500',
  rest: '#34C759',
  other: '#8E8E93',
};

const TYPE_NAMES: Record<string, string> = {
  run: '跑步',
  rest: '休息',
  other: '其他',
};

export default function DailyPlanCard({ dayPlan, isToday }: Props) {
  const { dayName, units, desc } = dayPlan;

  const renderUnit = (unit: DayPlan['units'][0], index: number) => {
    let mainInfo = '';
    let subInfo = '';

    if (unit.type === 'run') {
      const paceStr = unit.paceValue ? `${unit.paceValue}` : '';
      if (unit.standardType === 'time') {
        mainInfo = `${paceStr} · ${formatDuration(unit.standardValue!)}`;
      } else if (unit.standardType === 'distance') {
        const distKm = (unit.standardValue! / 1000).toFixed(1);
        mainInfo = `${paceStr} · ${distKm}km`;
      }
    } else if (unit.type === 'rest') {
      mainInfo = '休息';
      if (unit.standard) {
        subInfo = unit.standard;
      }
    } else {
      mainInfo = unit.content ?? '其他';
    }

    return (
      <View key={unit.id} style={styles.unit}>
        <View
          style={[
            styles.unitDot,
            { backgroundColor: TYPE_COLORS[unit.type] ?? TYPE_COLORS.other },
          ]}
        />
        <Text style={styles.unitMain}>{mainInfo}</Text>
        {subInfo ? <Text style={styles.unitSub}>{subInfo}</Text> : null}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.card,
        isToday && styles.cardToday,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
          {dayName}
        </Text>
        {isToday && <View style={styles.todayBadge}><Text style={styles.todayText}>今天</Text></View>}
      </View>

      <View style={styles.units}>
        {units.length === 0 ? (
          <Text style={styles.noPlan}>暂无计划</Text>
        ) : (
          units.map((unit, i) => renderUnit(unit, i))
        )}
      </View>

      {desc && <Text style={styles.dayDesc}>{desc}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: 140,
    gap: SPACING.sm,
  },
  cardToday: {
    borderWidth: 2,
    borderColor: PlatformColor('systemOrange'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dayName: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  dayNameToday: {
    color: PlatformColor('systemOrange'),
  },
  todayBadge: {
    backgroundColor: PlatformColor('systemOrange'),
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  todayText: {
    ...TYPOGRAPHY.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  units: {
    gap: SPACING.xs,
  },
  unit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  unitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unitMain: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
  },
  unitSub: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('secondaryLabel'),
  },
  noPlan: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('tertiaryLabel'),
  },
  dayDesc: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('secondaryLabel'),
    marginTop: SPACING.xs,
  },
});
