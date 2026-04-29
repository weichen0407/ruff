/**
 * DateDetailSheet
 * Shows all check-in records for a specific date with tabs
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from '../../constants/themes';
import { getDatabase } from '../../db';
import { schema } from '../../db';
import { eq } from 'drizzle-orm';
import { getCheckInsForDate, type CheckInWithDetails } from '../../lib/checkin/operations';
import { getWeightRecordForDate, type WeightRecord } from '../../lib/weight/operations';
import { getSleepRecordForDate, type SleepRecord } from '../../lib/sleep/operations';
import { TodayCheckInCard, WeightRecordCard, SleepRecordCard } from '../../components/checkin';

interface DateDetailSheetProps {
  visible: boolean;
  date: string; // YYYY-MM-DD
  onClose: () => void;
}

type Tab = 'training' | 'sleep' | 'weight';

export default function DateDetailSheet({ visible, date, onClose }: DateDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('training');
  const [checkIns, setCheckIns] = useState<CheckInWithDetails[]>([]);
  const [weightRecord, setWeightRecord] = useState<WeightRecord | null>(null);
  const [sleepRecord, setSleepRecord] = useState<SleepRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && date) {
      loadData();
    }
  }, [visible, date]);

  const loadData = async () => {
    setLoading(true);
    await getDatabase();

    const [checkInsData, weightData, sleepData] = await Promise.all([
      getCheckInsForDate(date),
      getWeightRecordForDate(date),
      getSleepRecordForDate(date),
    ]);

    setCheckIns(checkInsData);
    setWeightRecord(weightData);
    setSleepRecord(sleepData);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  const hasData = (tab: Tab) => {
    if (tab === 'training') return checkIns.length > 0;
    if (tab === 'sleep') return !!sleepRecord;
    if (tab === 'weight') return !!weightRecord;
    return false;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerHandle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{formatDate(date)}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>关闭</Text>
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'training' && styles.tabActive]}
            onPress={() => setActiveTab('training')}
          >
            <Text style={[styles.tabText, activeTab === 'training' && styles.tabTextActive]}>
              训练
            </Text>
            {hasData('training') && <View style={styles.tabBadge} />}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'sleep' && styles.tabActive]}
            onPress={() => setActiveTab('sleep')}
          >
            <Text style={[styles.tabText, activeTab === 'sleep' && styles.tabTextActive]}>
              睡眠
            </Text>
            {hasData('sleep') && <View style={styles.tabBadge} />}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'weight' && styles.tabActive]}
            onPress={() => setActiveTab('weight')}
          >
            <Text style={[styles.tabText, activeTab === 'weight' && styles.tabTextActive]}>
              体重
            </Text>
            {hasData('weight') && <View style={styles.tabBadge} />}
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {activeTab === 'training' && (
            checkIns.length > 0 ? (
              <View style={styles.recordsList}>
                {checkIns.map(record => (
                  <TodayCheckInCard key={record.id} record={record} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>暂无训练记录</Text>
              </View>
            )
          )}

          {activeTab === 'sleep' && (
            sleepRecord ? (
              <View style={styles.recordsList}>
                <SleepRecordCard record={sleepRecord} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>暂无睡眠记录</Text>
              </View>
            )
          )}

          {activeTab === 'weight' && (
            weightRecord ? (
              <View style={styles.recordsList}>
                <WeightRecordCard record={weightRecord} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>暂无体重记录</Text>
              </View>
            )
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
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor('separator'),
  },
  headerHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: PlatformColor('tertiarySystemFill'),
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
  tabBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: PlatformColor('secondarySystemBackground'),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  recordsList: {
    gap: SPACING.sm,
  },
  emptyState: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('tertiaryLabel'),
  },
});
