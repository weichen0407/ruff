/**
 * WeightRecordCard
 * Displays a weight check-in record
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, FlatList, Dimensions } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { WeightRecord } from '@/lib/weight/operations';

interface Props {
  record: WeightRecord;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function WeightRecordCard({ record }: Props) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const photos: string[] = record.photos ?? [];

  return (
    <>
      <View style={styles.card}>
        {/* Time */}
        <Text style={styles.time}>{formatTime(record.createdAt)}</Text>

        {/* Content */}
        <View style={styles.content}>
          {/* Weight display */}
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>{record.weight.toFixed(1)}</Text>
            <Text style={styles.weightUnit}>kg</Text>
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
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  weightValue: {
    ...TYPOGRAPHY.title1,
    color: PlatformColor('label'),
    fontWeight: '700',
  },
  weightUnit: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('secondaryLabel'),
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
