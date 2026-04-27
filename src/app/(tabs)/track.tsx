import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../../constants/themes';
import CheckInTriangle from '../../components/checkin/check-in-triangle';

export default function TrackScreen() {
  return (
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
  },
  triangleContainer: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
});
