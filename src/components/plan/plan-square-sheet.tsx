/**
 * PlanSquareSheet Component
 * Browse and activate plans from the cloud plan square
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert, ActivityIndicator } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/themes';
import { generateId, now } from '../../db/utils';
import { db, getDatabase, schema } from '../../db';
import { eq } from 'drizzle-orm';

const API_BASE = 'http://localhost:3000';

interface Unit {
  id: string;
  type: string;
  paceMode: string | null;
  paceValue: string | null;
  standardType: string | null;
  standardValue: number | null;
  standard: string | null;
  content: string | null;
}

interface Day {
  id: string;
  dayIndex: number;
  dayDesc: string;
  units: Unit[];
}

interface Week {
  id: string;
  weekIndex: number;
  weekDesc: string | null;
  days: Day[];
}

interface PlanSquare {
  id: string;
  name: string;
  targetDistance: string;
  targetTime: number;
  vdot: number;
  paceE: number;
  paceM: number;
  paceT: number;
  paceI: number;
  paceR: number;
  weeks: number;
  planDesc: string | null;
  isActive: boolean;
  weeksData: Week[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export default function PlanSquareSheet({ visible, onClose, onActivated }: Props) {
  const [plans, setPlans] = useState<PlanSquare[]>([]);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanSquare | null>(null);

  useEffect(() => {
    if (visible) {
      fetchPlans();
    }
  }, [visible]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/plan-square`);
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
      } else {
        Alert.alert('错误', data.error || '获取计划失败');
      }
    } catch (e) {
      Alert.alert('错误', '无法连接到服务器，请确保服务器已启动');
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (planId: string, startWeek: 'this_week' | 'next_week') => {
    setActivating(planId);
    try {
      const res = await fetch(`${API_BASE}/api/plan-square/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, startWeek }),
      });
      const data = await res.json();

      if (data.success) {
        await getDatabase();

        // Write plan to local database
        const existingPlan = await db.query.plan.findFirst({ where: (p, { eq }) => eq(p.id, planId) });
        if (!existingPlan) {
          await db.insert(schema.plan).values({
            id: data.plan.id,
            name: data.plan.name,
            targetDistance: data.plan.targetDistance,
            targetTime: data.plan.targetTime,
            vdot: data.plan.vdot,
            paceE: data.plan.paceE,
            paceM: data.plan.paceM,
            paceT: data.plan.paceT,
            paceI: data.plan.paceI,
            paceR: data.plan.paceR,
            weeks: data.plan.weeks,
            desc: data.plan.planDesc,
            createdAt: now(),
            updatedAt: now(),
          });
        }

        // Write calendar entries to local database
        let entriesCreated = 0;
        for (const entry of data.calendarEntries) {
          const existing = await db.query.userPlanCalendar.findFirst({
            where: (u, { eq }) => eq(u.date, entry.date)
          });
          if (!existing) {
            await db.insert(schema.userPlanCalendar).values({
              id: generateId(),
              planId: planId,
              dailyPlanId: entry.dailyPlanId,
              date: entry.date,
              status: 'pending',
            });
            entriesCreated++;
          }
        }

        Alert.alert('成功', `已创建 ${entriesCreated} 个日历条目`, [
          { text: '确定', onPress: () => { onActivated(); onClose(); setSelectedPlan(null); } }
        ]);
      } else {
        Alert.alert('错误', data.error || '激活计划失败');
      }
    } catch (e: any) {
      Alert.alert('错误', e?.message || '无法连接到服务器');
    } finally {
      setActivating(null);
    }
  };

  const renderPlanItem = (plan: PlanSquare) => {
    const isSelected = selectedPlan?.id === plan.id;
    const isBusy = activating === plan.id;

    return (
      <Pressable
        key={plan.id}
        style={[styles.planItem, isSelected && styles.planItemSelected]}
        onPress={() => setSelectedPlan(isSelected ? null : plan)}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planWeeks}>{plan.weeks}周</Text>
        </View>
        {plan.planDesc && <Text style={styles.planDesc}>{plan.planDesc}</Text>}
        <Text style={styles.planMeta}>
          VDOT {plan.vdot} · {plan.targetDistance}
        </Text>

        {isSelected && (
          <View style={styles.activateSection}>
            <Text style={styles.activateLabel}>开始时间：</Text>
            <View style={styles.activateButtons}>
              <Pressable
                style={[styles.activateBtn, styles.activateBtnThisWeek]}
                onPress={() => activatePlan(plan.id, 'this_week')}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.activateBtnText}>本周</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.activateBtn, styles.activateBtnNextWeek]}
                onPress={() => activatePlan(plan.id, 'next_week')}
                disabled={isBusy}
              >
                <Text style={styles.activateBtnText}>下周</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>计划广场</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeBtn}>关闭</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : plans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无计划</Text>
            </View>
          ) : (
            plans.map(renderPlanItem)
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor('separator'),
  },
  title: {
    ...TYPOGRAPHY.title2,
    color: PlatformColor('label'),
  },
  closeBtn: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('secondaryLabel'),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('secondaryLabel'),
  },
  planItem: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  planItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
    flex: 1,
  },
  planWeeks: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  planDesc: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  planMeta: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('tertiaryLabel'),
  },
  activateSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlatformColor('separator'),
    gap: SPACING.sm,
  },
  activateLabel: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
  },
  activateButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  activateBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  activateBtnThisWeek: {
    backgroundColor: COLORS.primary,
  },
  activateBtnNextWeek: {
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    borderWidth: 1,
    borderColor: PlatformColor('separator'),
  },
  activateBtnText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
});
