/**
 * TodayCheckInCard
 * Displays a single check-in record in social-media style
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, FlatList, Dimensions } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import type { CheckInWithDetails, Feeling } from '@/lib/checkin/types';

interface Props {
  record: CheckInWithDetails;
}

const FEELING_LABELS: Record<Feeling, string> = {
  easy: '轻松',
  moderate: '适中',
  hard: '吃力',
};

const FEELING_COLORS: Record<Feeling, string> = {
  easy: '#34C759',
  moderate: '#FF9500',
  hard: '#FF3B30',
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getUnitSummary(u: NonNullable<CheckInWithDetails['units']>[number]): string {
  if (u.type === 'run') {
    const pace = u.paceValue ?? u.paceMode ?? '--:--';
    const vol = u.standardValue
      ? `${u.standardType === 'time' ? Math.round(u.standardValue / 60) + '分钟' : (u.standardValue / 1000).toFixed(1) + '公里'}`
      : '';
    return `跑步 ${pace} ${vol}`.trim();
  }
  if (u.type === 'rest') {
    return u.standardValue ? `休息 ${Math.round((u.standardValue as number) / 60)}分钟` : '休息';
  }
  return u.content ? `其他 ${u.content}` : '其他';
}

export default function TodayCheckInCard({ record }: Props) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const photos: string[] = record.photos ?? [];

  useEffect(() => {
    if (previewIndex !== null) {
      setCurrentIndex(previewIndex);
    }
  }, [previewIndex]);

  return (
    <>
      <View style={styles.card}>
        {/* Time */}
        <Text style={styles.time}>{formatTime(record.createdAt)}</Text>

        {/* Content */}
        <View style={styles.content}>
          {/* Comment */}
          {record.comment ? (
            <Text style={styles.comment}>{record.comment}</Text>
          ) : null}

          {/* Feeling tag */}
          {record.feeling ? (
            <View style={[styles.feelingTag, { backgroundColor: FEELING_COLORS[record.feeling] + '22' }]}>
              <Text style={[styles.feelingText, { color: FEELING_COLORS[record.feeling] }]}>
                {FEELING_LABELS[record.feeling]}
              </Text>
            </View>
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

          {/* Training units */}
          <View style={styles.unitsSection}>
            <Text style={styles.unitsTitle}>今日训练</Text>
            {record.units && record.units.length > 0 ? (
              record.units.map((u, i) => (
                <Text key={u.id || i} style={styles.unitText}>
                  • {getUnitSummary(u)}
                </Text>
              ))
            ) : (
              <Text style={styles.unitText}>• 自由训练</Text>
            )}
          </View>
        </View>
      </View>

      {/* Photo gallery modal with horizontal swipe */}
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
            getItemLayout={(_, index) => ({ length: Dimensions.get('window').width, offset: Dimensions.get('window').width * index, index })}
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
  comment: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('label'),
  },
  feelingTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  feelingText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
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
  unitsSection: {
    gap: 2,
    marginTop: SPACING.xs,
  },
  unitsTitle: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('secondaryLabel'),
    marginBottom: 2,
  },
  unitText: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('label'),
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
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
  previewCloseText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '300',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});
