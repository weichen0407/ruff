/**
 * WeeklyPlanCarousel Component
 * Horizontally scrollable week cards showing daily plans
 */

import { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY } from '@/constants/themes';
import type { WeekPlan } from './types';
import DailyPlanCard from './daily-plan-card';

interface Props {
  weeks: WeekPlan[];
  currentWeekIndex?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CARD_WIDTH = 150;
const CARD_GAP = SPACING.md;

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

  const renderWeek = ({ item, index }: { item: WeekPlan; index: number }) => {
    const todayDayIndex = new Date().getDay();
    const adjustedToday = todayDayIndex === 0 ? 7 : todayDayIndex;

    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>第 {item.weekIndex} 周</Text>
          {item.desc && <Text style={styles.weekDesc}>{item.desc}</Text>}
        </View>
        <FlatList
          horizontal
          data={item.days}
          keyExtractor={(day) => day.dayIndex.toString()}
          renderItem={({ item: day }) => (
            <DailyPlanCard
              dayPlan={day}
              isToday={item.weekIndex === currentWeekIndex && day.dayIndex === adjustedToday}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContainer}
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
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
        snapToInterval={SCREEN_WIDTH}
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
    paddingHorizontal: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  weekIndicator: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  carouselContent: {
    paddingHorizontal: SPACING.md,
  },
  weekContainer: {
    width: SCREEN_WIDTH - SPACING.md * 2,
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
  weekDesc: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('tertiaryLabel'),
  },
  daysContainer: {
    paddingVertical: SPACING.sm,
  },
});
