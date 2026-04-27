/**
 * WeeklyPlanCarousel Component
 * Horizontally scrollable week cards showing daily plans
 */

import { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { WeekPlan } from './types';
import DailyPlanCard from './daily-plan-card';

interface Props {
  weeks: WeekPlan[];
  currentWeekIndex?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CARD_WIDTH = Math.floor(SCREEN_WIDTH * 0.44);
const CARD_GAP = 20;
const WEEK_CARD_WIDTH = Math.floor(SCREEN_WIDTH * 0.92);

export default function WeeklyPlanCarousel({ weeks, currentWeekIndex = 1 }: Props) {
  const flatListRef = useRef<FlatList>(null);
  const [currentWeek, setCurrentWeek] = useState(currentWeekIndex);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstVisible = viewableItems[0].index ?? 0;
      setCurrentWeek(weeks[firstVisible]?.weekIndex ?? firstVisible + 1);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderWeek = ({ item }: { item: WeekPlan }) => {
    const todayDayIndex = new Date().getDay();
    const adjustedToday = todayDayIndex === 0 ? 7 : todayDayIndex;

    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>第 {item.weekIndex} 周</Text>
        </View>
        <FlatList
          horizontal
          data={item.days}
          keyExtractor={(day) => day.dayIndex.toString()}
          renderItem={({ item: day, index }) => (
            <View style={index < item.days.length - 1 ? { marginRight: CARD_GAP } : undefined}>
              <DailyPlanCard
                dayPlan={day}
                isToday={item.weekIndex === currentWeekIndex && day.dayIndex === adjustedToday}
              />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContainer}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>周计划</Text>
        <Text style={styles.weekIndicator}>
          {currentWeek} / {weeks.length}
        </Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={weeks}
        keyExtractor={(item) => item.weekIndex.toString()}
        renderItem={renderWeek}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.carouselContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: PlatformColor('label'),
  },
  weekIndicator: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  carouselContent: {
    paddingHorizontal: SPACING.md,
  },
  weekContainer: {
    width: WEEK_CARD_WIDTH,
    gap: SPACING.sm,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  weekTitle: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  daysContainer: {
    paddingVertical: SPACING.sm,
    width: WEEK_CARD_WIDTH,
  },
});
