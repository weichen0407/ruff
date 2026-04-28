import { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable, Modal } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from '../../constants/themes';
import { CheckInTriangle, CreatePlanSheet } from '../../components/checkin';
import { generateId, now } from '../../db/utils';
import { db, getDatabase, schema } from '../../db';

export default function TrackScreen() {
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const handleSave = async (name: string, units: any[], isFavorite: boolean) => {
    await getDatabase();

    // Create standalone weekly plan
    const standaloneWpId = generateId();
    await db.insert(schema.weeklyPlan).values({
      id: standaloneWpId,
      planId: 'standalone',
      weekIndex: 0,
      desc: 'Standalone Daily Plans',
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
          <Text style={styles.date}>2024年4月28日</Text>
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
