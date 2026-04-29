import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable, Modal } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from '../../constants/themes';
import { CheckInTriangle, CreatePlanSheet, TodayPlanCard } from '../../components/checkin';
import { generateId, now } from '../../db/utils';
import { db, getDatabase, schema } from '../../db';
import { eq } from 'drizzle-orm';

interface DayPlan {
  date: string;
  dayName: string;
  planName: string;
  dailyPlanDesc: string;
  isCompleted: boolean;
  calendarEntryId: string;
  units: Array<{
    id: string;
    type: 'run' | 'rest' | 'other';
    paceMode: string | null;
    paceValue: string | null;
    standardType: 'time' | 'distance' | null;
    standardValue: number | null;
    content: string | null;
  }>;
}

export default function TrackScreen() {
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);

  useEffect(() => {
    loadTodayPlan();
  }, []);

  const loadTodayPlan = async () => {
    await getDatabase();

    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayName = '今日';

    const entries = await db.select()
      .from(schema.userPlanCalendar)
      .where(eq(schema.userPlanCalendar.date, todayStr))
      .limit(1);

    if (entries.length === 0) {
      setTodayPlan({ date: todayStr, dayName, planName: '', dailyPlanDesc: '今日暂无训练计划', isCompleted: false, calendarEntryId: '', units: [] });
      return;
    }

    const entry = entries[0];

    const planRow = await db.select()
      .from(schema.plan)
      .where(eq(schema.plan.id, entry.planId))
      .limit(1);

    const dailyPlans = await db.select()
      .from(schema.dailyPlan)
      .where(eq(schema.dailyPlan.id, entry.dailyPlanId))
      .limit(1);

    const units = dailyPlans.length > 0
      ? await db.select().from(schema.unit).where(eq(schema.unit.dailyPlanId, dailyPlans[0].id))
      : [];

    setTodayPlan({
      date: todayStr,
      dayName,
      planName: planRow.length > 0 ? planRow[0].name : '',
      dailyPlanDesc: dailyPlans.length > 0 ? (dailyPlans[0].desc || '') : '',
      isCompleted: entry.status === 'completed',
      calendarEntryId: entry.id,
      units: units.map(u => ({
        id: u.id,
        type: u.type as 'run' | 'rest' | 'other',
        paceMode: u.paceMode,
        paceValue: u.paceValue,
        standardType: u.standardType as 'time' | 'distance' | null,
        standardValue: u.standardValue,
        content: u.content,
      })),
    });
  };

  const handleToggleComplete = async () => {
    if (!todayPlan?.calendarEntryId) return;
    await getDatabase();

    const newStatus = todayPlan.isCompleted ? 'pending' : 'completed';
    await db.update(schema.userPlanCalendar)
      .set({ status: newStatus as any })
      .where(eq(schema.userPlanCalendar.id, todayPlan.calendarEntryId));

    loadTodayPlan();
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

    // Create calendar entry for today
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    await db.insert(schema.userPlanCalendar).values({
      id: generateId(),
      planId,
      dailyPlanId,
      date: todayStr,
      status: 'pending',
    });

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

    if (isFavorite) {
      await db.insert(schema.userFavorite).values({
        id: generateId(),
        name,
        units: JSON.stringify(units),
        createdAt: now(),
      });
    }

    setShowCreateSheet(false);
    loadTodayPlan();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>打卡</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Today's Plan Card */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>今日计划</Text>
          {todayPlan ? (
            <TodayPlanCard
              dayName={todayPlan.dayName}
              planName={todayPlan.planName || todayPlan.dailyPlanDesc || '休息日'}
              units={todayPlan.units}
              isCompleted={todayPlan.isCompleted}
              onToggleComplete={todayPlan.calendarEntryId ? handleToggleComplete : undefined}
            />
          ) : (
            <View style={styles.noPlanCard}>
              <Text style={styles.noPlanText}>今日暂无训练计划</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.triangleContainer}>
            <CheckInTriangle />
          </View>

          <Pressable style={styles.actionButton} onPress={() => setShowCreateSheet(true)}>
            <Text style={styles.actionButtonText}>运动打卡</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showCreateSheet}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CreatePlanSheet
          showFavoriteCheckbox={true}
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
  header: {
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: PlatformColor('label'),
  },
  date: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  todaySection: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  noPlanCard: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  noPlanText: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('tertiaryLabel'),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xl,
  },
  triangleContainer: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  actionButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
});
