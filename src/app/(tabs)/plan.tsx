import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Modal, Pressable } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/themes';
import {
  CurrentPlanCard,
  PaceTable,
  WeeklyPlanCarousel,
  getCurrentPlanDetail,
  type PlanDetail,
} from '../../components/plan';
import { CreatePlanSheet } from '../../components/checkin';
import { generateId, now } from '../../db/utils';
import { db, getDatabase, schema } from '../../db';

export default function PlanScreen() {
  const [planDetail, setPlanDetail] = useState<PlanDetail | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    const detail = await getCurrentPlanDetail();
    setPlanDetail(detail);
  };

  const handleSave = async (name: string, units: any[], isFavorite: boolean) => {
    await getDatabase();

    // Create the plan record first
    const planId = generateId();
    await db.insert(schema.plan).values({
      id: planId,
      name,
      targetDistance: '5k',
      targetTime: 0,
      vdot: 0,
      paceE: 0,
      paceM: 0,
      paceT: 0,
      paceI: 0,
      paceR: 0,
      weeks: 1,
      createdAt: now(),
      updatedAt: now(),
    });

    // Create standalone weekly plan
    const standaloneWpId = generateId();
    await db.insert(schema.weeklyPlan).values({
      id: standaloneWpId,
      planId,
      weekIndex: 1,
      desc: name,
    });

    // Create daily plan
    const dailyPlanId = generateId();
    await db.insert(schema.dailyPlan).values({
      id: dailyPlanId,
      weeklyPlanId: standaloneWpId,
      dayIndex: 1,
      desc: name,
    });

    // Create units
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      await db.insert(schema.unit).values({
        id: generateId(),
        dailyPlanId,
        type: u.type,
        orderIndex: i + 1,
        paceMode: u.paceMode as any,
        paceValue: u.paceValue,
        standardType: u.standardType as any,
        standardValue: u.standardType === 'time' ? parseInt(u.standardValue) * 60 : parseFloat(u.standardValue) * 1000,
        content: u.content,
      });
    }

    // Save to favorites if needed
    if (isFavorite) {
      await db.insert(schema.userFavorite).values({
        id: generateId(),
        name,
        units: JSON.stringify(units),
        createdAt: now(),
      });
    }

    setShowCreateSheet(false);
    loadPlan();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>计划</Text>
        </View>
        <View style={styles.content}>
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
          <Pressable style={styles.createButton} onPress={() => setShowCreateSheet(true)}>
            <Text style={styles.createButtonText}>创建计划</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showCreateSheet}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CreatePlanSheet
          showFavoriteCheckbox={false}
          onSave={handleSave}
          onClose={() => setShowCreateSheet(false)}
        />
      </Modal>
    </>
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
  content: {
    flex: 1,
    gap: SPACING.lg,
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
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  createButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
});
