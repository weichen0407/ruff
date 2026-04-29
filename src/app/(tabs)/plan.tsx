import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlatformColor } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SPACING, TYPOGRAPHY } from '../../constants/themes';
import {
  AddButton,
  CurrentPlanCard,
  PaceTable,
  WeeklyPlanCarousel,
  getCurrentPlanDetail,
  type PlanDetail,
} from '../../components/plan';
import { seedLocalDatabase } from '../../lib/api/local-plan';

export default function PlanScreen() {
  const router = useRouter();
  const [planDetail, setPlanDetail] = useState<PlanDetail | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loadPlan = async () => {
    try {
      console.log('[PlanScreen] loading plan...');
      const detail = await getCurrentPlanDetail();
      console.log('[PlanScreen] plan detail:', detail ? 'found' : 'null');
      setPlanDetail(detail);
    } catch (err: any) {
      console.error('[PlanScreen] loadPlan error:', err?.message ?? err);
      setPlanDetail(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [])
  );

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedLocalDatabase();
      console.log('[PlanScreen] Seed done');
    } catch (err: any) {
      console.error('[PlanScreen] Seed error:', err?.message ?? err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>计划</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.seedButton} onPress={handleSeed} disabled={seeding}>
              <Text style={styles.seedButtonText}>{seeding ? '...' : 'Seed'}</Text>
            </TouchableOpacity>
            <AddButton onPress={() => router.push('/plan-square')} />
          </View>
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
            <TouchableOpacity
              style={styles.squareButton}
              onPress={() => router.push('/plan-square')}
            >
              <Text style={styles.squareButtonText}>去计划广场看看</Text>
            </TouchableOpacity>
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
    gap: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    color: PlatformColor('secondaryLabel'),
  },
  headerWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  seedButton: {
    backgroundColor: '#FF9500',
    borderRadius: 980,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  seedButtonText: {
    ...TYPOGRAPHY.footnote,
    color: '#FFFFFF',
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: PlatformColor('label'),
  },
  squareButton: {
    backgroundColor: '#FF9500',
    borderRadius: 980,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  squareButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
});
