/**
 * CheckInConfirmSheet
 * Step 2 of check-in flow: confirm details (photos, feeling, comment)
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Image } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import { checkinFromPlan, checkinCustom } from '@/lib/checkin/operations';
import type { CheckInType, Feeling } from '@/lib/checkin/types';
import * as ImagePicker from 'expo-image-picker';

interface UnitForCheckIn {
  id: string;
  type: 'run' | 'rest' | 'other';
  paceMode?: string | null;
  paceValue?: string | null;
  standardType?: string | null;
  standardValue?: number | null;
  content?: string | null;
}

interface Props {
  visible: boolean;
  calendarEntryId?: string;   // if from a planned training
  date: string;              // YYYY-MM-DD
  units: UnitForCheckIn[];
  paceValues?: { paceE: number; paceM: number; paceT: number; paceI: number; paceR: number };
  onClose: () => void;
  onConfirmed: () => void;   // called after successful check-in
}

const FEELINGS: { value: Feeling; label: string }[] = [
  { value: 'easy', label: '轻松' },
  { value: 'moderate', label: '适中' },
  { value: 'hard', label: '吃力' },
];

export default function CheckInConfirmSheet({
  visible,
  calendarEntryId,
  date,
  units,
  paceValues,
  onClose,
  onConfirmed,
}: Props) {
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要相册权限', '请在设置中开启相册访问权限');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const uris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...uris]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Determine primary type from units (run > rest > other)
  const primaryType: CheckInType = units.some(u => u.type === 'run')
    ? 'run'
    : units.some(u => u.type === 'rest')
    ? 'rest'
    : 'other';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (calendarEntryId) {
        await checkinFromPlan({
          calendarEntryId,
          type: primaryType,
          feeling: feeling ?? undefined,
          photos: photos.length > 0 ? photos : undefined,
          comment: comment.trim() || undefined,
        });
      } else {
        await checkinCustom({
          date,
          type: primaryType,
          feeling: feeling ?? undefined,
          photos: photos.length > 0 ? photos : undefined,
          comment: comment.trim() || undefined,
        });
      }
      onConfirmed();
    } catch (err) {
      console.error('[CheckInConfirmSheet] confirm error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUnitSummary = (u: UnitForCheckIn): string => {
    if (u.type === 'run') {
      const pace = u.paceValue ?? u.paceMode ?? '--:--';
      const vol = u.standardValue && u.standardValue > 0
        ? `${u.standardType === 'time' ? Math.round(u.standardValue / 60) + '分钟' : (u.standardValue / 1000).toFixed(1) + '公里'}`
        : '';
      return `跑步 ${pace} ${vol}`.trim();
    }
    if (u.type === 'rest') {
      const secs = u.standardValue;
      if (secs && secs > 0) {
        return `休息 ${Math.round(secs / 60)}分钟`;
      }
      return '休息';
    }
    return u.content ? `其他 ${u.content}` : '其他';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Text style={styles.title}>确认打卡</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Plan summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>计划内容</Text>
            <View style={styles.summaryCard}>
              {units.length > 0 ? (
                units.map((u, i) => (
                  <View key={u.id || i} style={styles.summaryRow}>
                    <Text style={styles.summaryText}>{getUnitSummary(u)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.summaryText}>自由训练</Text>
              )}
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>照片</Text>
            <View style={styles.photosRow}>
            {photos.map((uri, i) => (
                <View key={uri} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoThumbImage} />
                  <Pressable style={styles.photoRemove} onPress={() => handleRemovePhoto(i)}>
                    <Text style={styles.photoRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Text style={styles.addPhotoText}>+ 添加</Text>
              </Pressable>
            </View>
          </View>

          {/* Feeling */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>感受</Text>
            <View style={styles.feelingRow}>
              {FEELINGS.map(f => (
                <Pressable
                  key={f.value}
                  style={[styles.feelingButton, feeling === f.value && styles.feelingButtonActive]}
                  onPress={() => setFeeling(feeling === f.value ? null : f.value)}
                >
                  <Text style={[styles.feelingButtonText, feeling === f.value && styles.feelingButtonTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>心得评论</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="说点什么..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Confirm button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? '保存中...' : '确认打卡'}
            </Text>
          </Pressable>
        </View>
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
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('secondaryLabel'),
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.xl,
  },
  section: { gap: SPACING.sm },
  sectionTitle: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  summaryCard: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryText: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputGroup: {
    flex: 1,
    gap: SPACING.xs,
  },
  inputLabel: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: PlatformColor('label'),
    textAlign: 'center',
  },
  inputUnit: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  paceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  paceLabel: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  paceValue: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  photoThumbImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
  },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: PlatformColor('separator'),
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    ...TYPOGRAPHY.caption1,
    color: PlatformColor('secondaryLabel'),
  },
  feelingRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  feelingButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    alignItems: 'center',
  },
  feelingButtonActive: {
    backgroundColor: COLORS.primary,
  },
  feelingButtonText: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
  },
  feelingButtonTextActive: {
    color: '#FFFFFF',
  },
  commentInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: PlatformColor('label'),
    minHeight: 80,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlatformColor('separator'),
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
});
