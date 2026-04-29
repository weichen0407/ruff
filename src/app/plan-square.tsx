import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchPlanSquare, type SquarePlan } from '../lib/api/square';
import { savePlanToLocal, seedLocalDatabase } from '../lib/api/local-plan';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/themes';

export default function PlanSquareScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<SquarePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await fetchPlanSquare();
      setPlans(data);
    } catch (err: any) {
      console.error('Fetch plan square error:', err?.message ?? err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (plan: SquarePlan) => {
    setSavingId(plan.id);
    try {
      await savePlanToLocal(plan);
      console.log('[PlanSquare] Plan saved:', plan.id);
      router.back();
    } catch (err: any) {
      console.error('Save plan error:', err?.message ?? err);
    } finally {
      setSavingId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedLocalDatabase();
      console.log('[PlanSquare] Seed done');
    } catch (err: any) {
      console.error('Seed error:', err?.message ?? err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>计划广场</Text>
        <TouchableOpacity style={styles.seedButton} onPress={handleSeed} disabled={seeding}>
          <Text style={styles.seedButtonText}>{seeding ? 'Seeding...' : 'Seed DB'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {plans.length === 0 && (
            <Text style={styles.empty}>暂无公开计划</Text>
          )}

          {plans.map((plan) => (
            <View key={plan.id} style={styles.card}>
              <Text style={styles.cardTitle}>{plan.name}</Text>
              <Text style={styles.cardDesc}>{plan.planDesc ?? '暂无描述'}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaText}>
                  {plan.targetDistance} · {plan.weeks} 周
                </Text>
                <Text style={styles.cardMetaText}>VDOT {plan.vdot}</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleActivate(plan)}
                disabled={savingId === plan.id}
              >
                {savingId === plan.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>加入计划</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.text,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  empty: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardMetaText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.muted,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
  seedButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  seedButtonText: {
    ...TYPOGRAPHY.footnote,
    color: '#FFFFFF',
  },
});
