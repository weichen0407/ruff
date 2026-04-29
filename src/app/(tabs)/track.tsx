import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable, Modal } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from '../../constants/themes';
import { CheckInTriangle, CreatePlanSheet, TodayPlanCard, CheckInConfirmSheet, TodayCheckInCard } from '../../components/checkin';
import { generateId, now } from '../../db/utils';
import { db, getDatabase, schema } from '../../db';
import { eq } from 'drizzle-orm';
import { getCheckInsForDate } from '../../lib/checkin/operations';
import type { CheckInWithDetails } from '../../lib/checkin/types';

interface UnitForCheckIn {
  id: string;
  type: 'run' | 'rest' | 'other';
  paceMode?: string | null;
  paceValue?: string | null;
  standardType?: string | null;
  standardValue?: number | null;
  content?: string | null;
}

interface DayPlan {
  date: string;
  dayName: string;
  planName: string;
  dailyPlanDesc: string;
  isCompleted: boolean;
  calendarEntryId: string;
  paceValues?: { paceE: number; paceM: number; paceT: number; paceI: number; paceR: number };
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
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [pendingUnits, setPendingUnits] = useState<UnitForCheckIn[]>([]);
  const [pendingCalendarEntryId, setPendingCalendarEntryId] = useState<string | undefined>(undefined);
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInWithDetails[]>([]);

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
      paceValues: planRow.length > 0
        ? { paceE: planRow[0].paceE, paceM: planRow[0].paceM, paceT: planRow[0].paceT, paceI: planRow[0].paceI, paceR: planRow[0].paceR }
        : undefined,
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

  const todayStr = new Date().getFullYear() + '-' +
    String(new Date().getMonth() + 1).padStart(2, '0') + '-' +
    String(new Date().getDate()).padStart(2, '0');

  const loadTodayCheckIns = async () => {
    const checkIns = await getCheckInsForDate(todayStr);
    setTodayCheckIns(checkIns);
  };

  useEffect(() => {
    loadTodayCheckIns();
  }, []);

  const handleToggleComplete = async () => {
    if (!todayPlan?.calendarEntryId) return;
    await getDatabase();

    const newStatus = todayPlan.isCompleted ? 'pending' : 'completed';
    await db.update(schema.userPlanCalendar)
      .set({ status: newStatus as any })
      .where(eq(schema.userPlanCalendar.id, todayPlan.calendarEntryId));

    loadTodayPlan();
  };

  const handleOpenCheckIn = () => {
    if (!todayPlan) return;
    setPendingUnits(todayPlan.units as UnitForCheckIn[]);
    setShowConfirmSheet(true);
  };

  const handleNextStep = async (name: string, units: any[]) => {
    await getDatabase();

    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    const planName = name.trim() || '今日训练';

    // Create standalone plan
    const planId = generateId();
    await db.insert(schema.plan).values({
      id: planId,
      name: planName,
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

    const standaloneWpId = generateId();
    await db.insert(schema.weeklyPlan).values({
      id: standaloneWpId,
      planId,
      weekIndex: 1,
      desc: planName,
    });

    const dailyPlanId = generateId();
    await db.insert(schema.dailyPlan).values({
      id: dailyPlanId,
      weeklyPlanId: standaloneWpId,
      dayIndex: 1,
      desc: planName,
    });

    const calendarEntryId = generateId();
    await db.insert(schema.userPlanCalendar).values({
      id: calendarEntryId,
      planId,
      dailyPlanId,
      date: todayStr,
      status: 'pending',
    });

    const savedUnits: UnitForCheckIn[] = [];
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      let savedPaceMode: string | null = null;
      let savedPaceValue: string | null = null;
      let savedStandardType: 'time' | 'distance' | null = null;
      let savedStandardValue: number | null = null;

      if (u.type === 'rest') {
        // Rest: store time in standardValue
        savedStandardType = 'time';
        const mins = parseInt(u.restMinutes || '0', 10);
        savedStandardValue = isNaN(mins) ? null : mins * 60;
      } else if (u.type === 'run') {
        if (u.inputMode === 'value') {
          savedPaceMode = null;
          savedPaceValue = u.paceValue ?? null;
        } else {
          const offset = u.paceOffset ?? 0;
          if (offset === 0) {
            savedPaceMode = u.paceMode ?? null;
          } else {
            savedPaceMode = `${u.paceMode}${offset > 0 ? '+' : ''}${offset}`;
          }
        }
        if (u.standardType && u.standardValue) {
          savedStandardType = u.standardType as 'time' | 'distance';
          savedStandardValue = u.standardType === 'time'
            ? parseInt(u.standardValue, 10) * 60
            : parseFloat(u.standardValue) * 1000;
        }
      }

      const unitId = generateId();
      await db.insert(schema.unit).values({
        id: unitId,
        dailyPlanId,
        type: u.type,
        orderIndex: i + 1,
        paceMode: savedPaceMode,
        paceValue: savedPaceValue,
        standardType: savedStandardType,
        standardValue: savedStandardValue,
        content: u.content,
      });

      savedUnits.push({
        id: unitId,
        type: u.type,
        paceMode: savedPaceMode,
        paceValue: savedPaceValue,
        standardType: savedStandardType,
        standardValue: savedStandardValue,
        content: u.content,
      });
    }

    setShowCreateSheet(false);
    setPendingCalendarEntryId(calendarEntryId);
    setPendingUnits(savedUnits);
    setShowConfirmSheet(true);
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
              onPress={todayPlan.calendarEntryId ? handleOpenCheckIn : undefined}
            />
          ) : (
            <View style={styles.noPlanCard}>
              <Text style={styles.noPlanText}>今日暂无训练计划</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.triangleContainer}>
            <CheckInTriangle
              active={todayCheckIns.length > 0}
              onSegmentPress={(index) => {
                if (index === 0) {
                  if (todayPlan?.calendarEntryId) {
                    handleOpenCheckIn();
                  } else {
                    setShowCreateSheet(true);
                  }
                }
              }}
            />
          </View>
        </View>

        {/* Today's check-in records */}
        {todayCheckIns.length > 0 && (
          <View style={styles.checkInsSection}>
            <Text style={styles.sectionTitle}>今日打卡</Text>
            <View style={styles.checkInsList}>
              {todayCheckIns.map(record => (
                <TodayCheckInCard key={record.id} record={record} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateSheet}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CreatePlanSheet
          showFavoriteCheckbox={true}
          paceValues={todayPlan?.paceValues}
          onNextStep={handleNextStep}
          onClose={() => setShowCreateSheet(false)}
        />
      </Modal>

      <CheckInConfirmSheet
        visible={showConfirmSheet}
        calendarEntryId={pendingCalendarEntryId ?? todayPlan?.calendarEntryId}
        date={todayPlan?.date ?? ''}
        units={pendingUnits}
        paceValues={todayPlan?.paceValues}
        onClose={() => setShowConfirmSheet(false)}
        onConfirmed={() => {
          setShowConfirmSheet(false);
          setPendingCalendarEntryId(undefined);
          loadTodayPlan();
          loadTodayCheckIns();
        }}
      />
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
  checkInsSection: {
    gap: SPACING.sm,
  },
  checkInsList: {
    gap: SPACING.sm,
  },
});
