/**
 * CalendarDayCell
 * Custom day component for react-native-calendars
 * Shows 3 small dots for training, sleep, weight check-ins
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';

interface Props {
  date?: {
    year: number;
    month: number;
    day: number;
    dateString: string;
  };
  state?: 'selected' | 'disabled' | 'inactive' | 'today' | '';
  marking?: {
    hasCheckIn?: boolean;
    hasSleepRecord?: boolean;
    hasWeightRecord?: boolean;
  };
  onPress?: (date: string) => void;
}

const DOT_SIZE = 6;

export default function CalendarDayCell({ date, state, marking, onPress }: Props) {
  if (!date) return <View style={styles.cell} />;

  const { year, month, day, dateString } = date;
  const isToday = state === 'today';
  const isDisabled = state === 'disabled' || state === 'inactive';

  const handlePress = () => {
    if (!isDisabled && onPress) {
      onPress(dateString);
    }
  };

  return (
    <Pressable style={styles.cell} onPress={handlePress} disabled={isDisabled}>
      <View style={[
        styles.dayCircle,
        isToday && styles.dayCircleToday,
        isDisabled && styles.dayCircleDisabled,
      ]}>
        <Text style={[
          styles.dayText,
          isToday && styles.dayTextToday,
          isDisabled && styles.dayTextDisabled,
        ]}>
          {day}
        </Text>
      </View>

      {/* Check-in indicators */}
      <View style={styles.dotsRow}>
        <View style={[
          styles.dot,
          marking?.hasCheckIn ? styles.dotActive : styles.dotInactive,
        ]} />
        <View style={[
          styles.dot,
          marking?.hasSleepRecord ? styles.dotActive : styles.dotInactive,
        ]} />
        <View style={[
          styles.dot,
          marking?.hasWeightRecord ? styles.dotActive : styles.dotInactive,
        ]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 60,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: '#FF9500',
  },
  dayCircleDisabled: {
    opacity: 0.3,
  },
  dayText: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('label'),
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: PlatformColor('tertiaryLabel'),
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotActive: {
    backgroundColor: '#FF9500',
  },
  dotInactive: {
    backgroundColor: PlatformColor('tertiarySystemFill'),
  },
});
