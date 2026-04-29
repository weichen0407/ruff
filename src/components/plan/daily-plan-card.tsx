/**
 * DailyPlanCard Component
 * Shows a single day's training plan within WeeklyPlanCarousel
 */

import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { DayPlan } from './types';
import { formatDuration } from './queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CARD_WIDTH = Math.floor(SCREEN_WIDTH * 0.48);

interface Props {
  dayPlan: DayPlan;
  isToday?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  run: '#FF9500',
  rest: '#34C759',
  other: '#8E8E93',
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
          <Text style={styles.noPlan}>自由训练</Text>
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
    padding: SPACING.lg,
    width: DAY_CARD_WIDTH,
    minHeight: 140,
    gap: SPACING.md,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  cardToday: {
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayName: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  dayNameToday: {
    color: '#FF9500',
  },
  todayBadge: {
    backgroundColor: '#FF9500',
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
    gap: SPACING.sm,
  },
  unit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  unitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  },
});
