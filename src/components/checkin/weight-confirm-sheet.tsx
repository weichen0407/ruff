/**
 * WeightConfirmSheet
 * Weight check-in: weight input + photos + comment
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Image } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';
import { createWeightRecord } from '@/lib/weight/operations';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  visible: boolean;
  date: string;
  onClose: () => void;
  onConfirmed: () => void;
}

export default function WeightConfirmSheet({ visible, date, onClose, onConfirmed }: Props) {
  const [weight, setWeight] = useState('');
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

  const handleConfirm = async () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('请输入有效体重');
      return;
    }
    setLoading(true);
    try {
      await createWeightRecord({
        date,
        weight: weightNum,
        photos: photos.length > 0 ? photos : undefined,
        comment: comment.trim() || undefined,
      });
      setWeight('');
      setPhotos([]);
      setComment('');
      onConfirmed();
    } catch (err) {
      console.error('[WeightConfirmSheet] confirm error:', err);
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
          <Text style={styles.title}>体重打卡</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Weight input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>体重</Text>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.weightUnit}>kg</Text>
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
  section: { gap: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.headline, color: PlatformColor('label') },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  weightInput: {
    ...TYPOGRAPHY.largeTitle,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: PlatformColor('label'),
    textAlign: 'center',
    minWidth: 120,
  },
  weightUnit: { ...TYPOGRAPHY.title2, color: PlatformColor('secondaryLabel') },
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
