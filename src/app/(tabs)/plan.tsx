import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>计划</Text>
          <AddButton onPress={() => {}} />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {planDetail ? (
          <View style={styles.content}>
            <CurrentPlanCard plan={planDetail.plan} />
            <PaceTable paces={{
              paceE: planDetail.plan.paceE,
              paceM: planDetail.plan.paceM,
              paceT: planDetail.plan.paceT,
              paceI: planDetail.plan.paceI,
              paceR: planDetail.plan.paceR,
            }} />
            <WeeklyPlanCarousel weeks={planDetail.weeks} />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>暂无训练计划</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor('separator'),
  },
  headerTitle: {
    ...TYPOGRAPHY.title1,
    color: PlatformColor('label'),
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    color: PlatformColor('secondaryLabel'),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: PlatformColor('label'),
  },
});
