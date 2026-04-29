/**
 * SleepConfirmSheet
 * Sleep check-in: wake mode and sleep mode
 * Wake: today's date + wake time
 * Sleep: today's date + sleep time
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Image } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import { createSleepRecord } from '@/lib/sleep/operations';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

type SleepMode = 'wake' | 'sleep';

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function getTodayDateString(): string {
  const today = new Date();
  return today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
}

export default function SleepConfirmSheet({ visible, onClose, onConfirmed }: Props) {
  const [mode, setMode] = useState<SleepMode>('wake');
  const [hour, setHour] = useState(() => String(new Date().getHours()).padStart(2, '0'));
  const [minute, setMinute] = useState(() => String(new Date().getMinutes()).padStart(2, '0'));
  const [photos, setPhotos] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const todayStr = getTodayDateString();

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

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const time = `${hour}:${minute}`;
      await createSleepRecord({
        date: todayStr,
        wakeTime: mode === 'wake' ? time : '--:--',
        sleepTime: mode === 'sleep' ? time : '--:--',
        photos: photos.length > 0 ? photos : undefined,
        comment: comment.trim() || undefined,
      });
      setPhotos([]);
      setComment('');
      onConfirmed();
    } catch (err) {
      console.error('[SleepConfirmSheet] confirm error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Text style={styles.title}>睡眠打卡</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Mode tabs */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, mode === 'wake' && styles.tabActive]}
              onPress={() => setMode('wake')}
            >
              <Text style={[styles.tabText, mode === 'wake' && styles.tabTextActive]}>起床</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'sleep' && styles.tabActive]}
              onPress={() => setMode('sleep')}
            >
              <Text style={[styles.tabText, mode === 'sleep' && styles.tabTextActive]}>入睡</Text>
            </Pressable>
          </View>

          {/* Date */}
          <View style={styles.dateLabel}>
            <Text style={styles.dateLabelText}>{formatDisplayDate(todayStr)}</Text>
          </View>

          {/* Time input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{mode === 'wake' ? '起床时间' : '入睡时间'}</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                value={hour}
                onChangeText={setHour}
                placeholder="00"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={minute}
                onChangeText={setMinute}
                placeholder="00"
                keyboardType="number-pad"
                maxLength={2}
              />
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
  container: { flex: 1, backgroundColor: PlatformColor('systemBackground') },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor('separator'),
  },
  title: { ...TYPOGRAPHY.headline, color: PlatformColor('label') },
  cancelText: { ...TYPOGRAPHY.body, color: PlatformColor('secondaryLabel') },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, gap: SPACING.xl },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { ...TYPOGRAPHY.headline, color: PlatformColor('label') },
  tabTextActive: { color: '#FFFFFF' },
  dateLabel: { alignItems: 'center', paddingVertical: SPACING.sm },
  dateLabelText: { ...TYPOGRAPHY.title2, color: PlatformColor('label') },
  section: { gap: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.headline, color: PlatformColor('label') },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  timeInput: {
    ...TYPOGRAPHY.title1,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: PlatformColor('label'),
    textAlign: 'center',
    minWidth: 64,
  },
  timeColon: { ...TYPOGRAPHY.title1, color: PlatformColor('label') },
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoThumb: { width: 80, height: 80, borderRadius: RADIUS.md, overflow: 'hidden' },
  photoThumbImage: { width: 80, height: 80 },
  photoRemove: {
    position: 'absolute', top: 2, right: 2, width: 20, height: 20,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  addPhotoButton: {
    width: 80, height: 80, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: PlatformColor('separator'),
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  addPhotoText: { ...TYPOGRAPHY.caption1, color: PlatformColor('secondaryLabel') },
  commentInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.md, padding: SPACING.md,
    color: PlatformColor('label'), minHeight: 80,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlatformColor('separator'),
  },
  confirmButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
    paddingVertical: 14, alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { ...TYPOGRAPHY.headline, color: '#FFFFFF' },
});
