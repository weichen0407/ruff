/**
 * TodayPlanCard Component (for Check-in page)
 * Shows today's training plan with completion status
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';

interface Unit {
  id: string;
  type: 'run' | 'rest' | 'other';
  paceMode?: string | null;
  paceValue?: string | null;
  standardType?: 'time' | 'distance' | null;
  standardValue?: number | null;
  content?: string | null;
}

interface Props {
  dayName: string;
  planName: string;
  units: Unit[];
  isCompleted: boolean;
  onToggleComplete?: () => void;
  onPress?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  run: '#FF9500',
  rest: '#34C759',
  other: '#8E8E93',
};

export default function TodayPlanCard({ dayName, planName, units, isCompleted, onToggleComplete, onPress }: Props) {
  const renderUnit = (unit: Unit, index: number) => {
    let mainInfo = '';
    let subInfo = '';

    if (unit.type === 'run') {
      const paceStr = unit.paceMode ? `${unit.paceMode} · ` : '';
      if (unit.standardType === 'time' && unit.standardValue) {
        const min = Math.floor(unit.standardValue / 60);
        mainInfo = `${paceStr}${min}分钟`;
      } else if (unit.standardType === 'distance' && unit.standardValue) {
        const km = (unit.standardValue / 1000).toFixed(1);
        mainInfo = `${paceStr}${km}公里`;
      }
    } else if (unit.type === 'rest') {
      mainInfo = '休息';
      if (unit.content) {
        subInfo = unit.content;
      }
    } else {
      mainInfo = unit.content ?? '其他';
    }

    return (
      <View key={unit.id || index} style={styles.unit}>
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
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      <Pressable onPress={onPress} style={styles.cardBody}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dayName}>{dayName}</Text>
            <Text style={styles.planName}>{planName}</Text>
          </View>
          <Pressable
            style={[styles.checkButton, isCompleted && styles.checkButtonCompleted]}
            onPress={onToggleComplete}
          >
            <Text style={[styles.checkText, isCompleted && styles.checkTextCompleted]}>
              {isCompleted ? '✓' : '○'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.units}>
          {units.length === 0 ? (
            <Text style={styles.noPlan}>自由训练</Text>
          ) : (
            units.map((unit, i) => renderUnit(unit, i))
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  cardCompleted: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  cardBody: {
    gap: SPACING.md,
  },
  dayName: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  planName: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: COLORS.primary,
  },
  checkText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkTextCompleted: {
    color: '#FFFFFF',
  },
  units: {
    gap: SPACING.xs,
  },
  unit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
});
