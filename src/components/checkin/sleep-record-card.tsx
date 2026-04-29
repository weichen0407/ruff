/**
 * SleepRecordCard
 * Displays a sleep check-in record
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, FlatList, Dimensions } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { SleepRecord } from '@/lib/sleep/operations';

interface Props {
  record: SleepRecord;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

export default function SleepRecordCard({ record }: Props) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const photos: string[] = record.photos ?? [];

  const isWakeRecord = record.sleepTime === '--:--';
  const isSleepRecord = record.wakeTime === '--:--';

  return (
    <>
      <View style={styles.card}>
        {/* Time */}
        <Text style={styles.time}>{formatTime(record.createdAt)}</Text>

        {/* Content */}
        <View style={styles.content}>
          {/* Sleep info row - only show the recorded one */}
          <View style={styles.sleepRow}>
            {isWakeRecord ? (
              <View style={styles.singleRecord}>
                <Text style={styles.recordLabel}>起床</Text>
                <Text style={styles.recordValue}>{record.wakeTime}</Text>
              </View>
            ) : isSleepRecord ? (
              <View style={styles.singleRecord}>
                <Text style={styles.recordLabel}>入睡</Text>
                <Text style={styles.recordValue}>{record.sleepTime}</Text>
              </View>
            ) : (
              <>
                <View style={styles.sleepItem}>
                  <Text style={styles.sleepLabel}>入睡</Text>
                  <Text style={styles.sleepValue}>{record.sleepTime}</Text>
                </View>
                <View style={styles.sleepDivider}>
                  <Text style={styles.sleepDividerText}>→</Text>
                </View>
                <View style={styles.sleepItem}>
                  <Text style={styles.sleepLabel}>起床</Text>
                  <Text style={styles.sleepValue}>{record.wakeTime}</Text>
                </View>
                <View style={styles.sleepDuration}>
                  <Text style={styles.durationValue}>{formatDuration(record.duration)}</Text>
                </View>
              </>
            )}
          </View>

          {/* Comment */}
          {record.comment ? (
            <Text style={styles.comment}>{record.comment}</Text>
          ) : null}

          {/* Photos */}
          {photos.length > 0 ? (
            <View style={styles.photosRow}>
              {photos.map((uri, i) => (
                <Pressable key={uri + i} onPress={() => setPreviewIndex(i)}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Photo gallery modal */}
      <Modal
        visible={previewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewIndex(null)}
      >
        <View style={styles.galleryBackdrop}>
          <Pressable style={styles.galleryClose} onPress={() => setPreviewIndex(null)}>
            <Text style={styles.galleryCloseText}>×</Text>
          </Pressable>

          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={previewIndex ?? 0}
            getItemLayout={(_, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
            keyExtractor={(item, i) => item + i}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setCurrentIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.galleryItem}>
                <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="contain" />
              </View>
            )}
          />

          <View style={styles.galleryCounter}>
            <Text style={styles.galleryCounterText}>
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  time: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
    minWidth: 44,
  },
  content: {
    flex: 1,
    gap: SPACING.sm,
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  singleRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recordLabel: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('secondaryLabel'),
  },
  recordValue: {
    ...TYPOGRAPHY.title2,
    color: PlatformColor('label'),
    fontWeight: '700',
  },
  sleepItem: {
    gap: 2,
  },
  sleepLabel: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('secondaryLabel'),
  },
  sleepValue: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
    fontWeight: '600',
  },
  sleepDivider: {
    paddingHorizontal: SPACING.xs,
  },
  sleepDividerText: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('tertiaryLabel'),
  },
  sleepDuration: {
    marginLeft: 'auto',
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  durationValue: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
    fontWeight: '600',
  },
  comment: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('label'),
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
  },
  galleryBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  galleryClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  galleryCloseText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '300',
  },
  galleryItem: {
    width: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
  },
  galleryCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  galleryCounterText: {
    ...TYPOGRAPHY.caption1,
    color: '#FFFFFF',
  },
});
