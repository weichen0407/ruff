import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, COLORS } from '../../constants/themes';
import { CalendarCheckIn, DateDetailSheet } from '../../components/checkin';
import { getMonthlyCheckInData, type MonthlyCheckInData } from '../../lib/checkin/operations';
import { getDatabase } from '../../db';

interface DailyCheckInSnapshot {
  date: string;
  hasCheckIn: boolean;
  hasSleepRecord: boolean;
  hasWeightRecord: boolean;
  modulesCheckedIn?: string[];
}

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() }; // 0-indexed
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyCheckInData>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const loadMonthlyData = useCallback(async () => {
    await getDatabase();
    // currentMonth.month is 0-indexed (JS Date), but getMonthlyCheckInData expects 1-indexed
    const data = await getMonthlyCheckInData(currentMonth.year, currentMonth.month + 1);
    setMonthlyData(data);
  }, [currentMonth.year, currentMonth.month]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  const handlePrevMonth = () => {
    if (currentMonth.month === 0) {
      setCurrentMonth({ year: currentMonth.year - 1, month: 11 });
    } else {
      setCurrentMonth({ year: currentMonth.year, month: currentMonth.month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (currentMonth.month === 11) {
      setCurrentMonth({ year: currentMonth.year + 1, month: 0 });
    } else {
      setCurrentMonth({ year: currentMonth.year, month: currentMonth.month + 1 });
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowDetailSheet(true);
  };

  const formatMonthTitle = (year: number, month: number) => {
    return `${year}年${month + 1}月`;
  };

  const snapshots: DailyCheckInSnapshot[] = Object.entries(monthlyData).map(([date, data]) => ({
    date,
    ...data,
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={styles.title}>历史</Text>
        </View>

        {/* Month navigation */}
        <View style={styles.monthHeader}>
          <Pressable onPress={handlePrevMonth} style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>
            {formatMonthTitle(currentMonth.year, currentMonth.month)}
          </Text>
          <Pressable onPress={handleNextMonth} style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>›</Text>
          </Pressable>
        </View>

        {/* Calendar */}
        <CalendarCheckIn
          year={currentMonth.year}
          month={currentMonth.month}
          snapshots={snapshots}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          accentColor={COLORS.primary}
          showBorder={true}
        />
      </ScrollView>

      <DateDetailSheet
        visible={showDetailSheet}
        date={selectedDate}
        onClose={() => setShowDetailSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: PlatformColor('label'),
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    ...TYPOGRAPHY.title2,
    color: COLORS.primary,
  },
  monthTitle: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
    minWidth: 100,
    textAlign: 'center',
  },
});
