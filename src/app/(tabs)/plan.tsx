import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../../constants/themes';
import {
  AddButton,
  CurrentPlanCard,
  PaceTable,
  WeeklyPlanCarousel,
  getCurrentPlanDetail,
  type PlanDetail,
} from '../../components/plan';

export default function PlanScreen() {
  const [planDetail, setPlanDetail] = useState<PlanDetail | null>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    const detail = await getCurrentPlanDetail();
    setPlanDetail(detail);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>计划</Text>
        <AddButton onPress={() => {}} />
      </View>
      <View style={styles.scrollContent}>
        {planDetail ? (
          <>
            <CurrentPlanCard plan={planDetail.plan} />
            <PaceTable paces={{
              paceE: planDetail.plan.paceE,
              paceM: planDetail.plan.paceM,
              paceT: planDetail.plan.paceT,
              paceI: planDetail.plan.paceI,
              paceR: planDetail.plan.paceR,
            }} />
            <WeeklyPlanCarousel weeks={planDetail.weeks} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>暂无训练计划</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: PlatformColor('label'),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    color: PlatformColor('secondaryLabel'),
  },
});
