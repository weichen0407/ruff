/**
 * CreatePlanSheet Component
 * Form to create a daily training plan with units
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';

interface Unit {
  id: string;
  type: 'run' | 'rest' | 'other';
  paceMode?: string;
  paceValue?: string;
  standardType?: 'time' | 'distance';
  standardValue?: string;
  content?: string;
}

interface Props {
  showFavoriteCheckbox?: boolean;
  onSave: (name: string, units: Unit[], isFavorite: boolean) => void;
  onClose: () => void;
}

const PACE_MODES = ['E', 'M', 'T', 'I', 'R', 'E+10'];

export default function CreatePlanSheet({ showFavoriteCheckbox = false, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const addUnit = () => {
    const newUnit: Unit = {
      id: Date.now().toString(),
      type: 'run',
      paceMode: 'E',
      standardType: 'time',
      standardValue: '30',
    };
    setUnits([...units, newUnit]);
  };

  const removeUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
  };

  const updateUnit = (id: string, updates: Partial<Unit>) => {
    setUnits(units.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, units, isFavorite);
  };

  const renderUnit = (unit: Unit, index: number) => {
    return (
      <View key={unit.id} style={styles.unitCard}>
        <View style={styles.unitHeader}>
          <Text style={styles.unitIndex}>项目 {index + 1}</Text>
          <Pressable onPress={() => removeUnit(unit.id)}>
            <Text style={styles.removeText}>删除</Text>
          </Pressable>
        </View>

        {/* Type Selection */}
        <View style={styles.typeRow}>
          {(['run', 'rest', 'other'] as const).map(t => (
            <Pressable
              key={t}
              style={[styles.typeButton, unit.type === t && styles.typeButtonActive]}
              onPress={() => updateUnit(unit.id, { type: t })}
            >
              <Text style={[styles.typeButtonText, unit.type === t && styles.typeButtonTextActive]}>
                {t === 'run' ? '跑步' : t === 'rest' ? '休息' : '其他'}
              </Text>
            </Pressable>
          ))}
        </View>

        {unit.type === 'run' && (
          <>
            {/* Pace Mode */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>配速区间</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.paceModes}>
                  {PACE_MODES.map(pace => (
                    <Pressable
                      key={pace}
                      style={[styles.paceButton, unit.paceMode === pace && styles.paceButtonActive]}
                      onPress={() => updateUnit(unit.id, { paceMode: pace })}
                    >
                      <Text style={[styles.paceButtonText, unit.paceMode === pace && styles.paceButtonTextActive]}>
                        {pace}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Standard Type */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>训练量</Text>
              <View style={styles.standardRow}>
                <Pressable
                  style={[styles.standardTypeButton, unit.standardType === 'time' && styles.standardTypeActive]}
                  onPress={() => updateUnit(unit.id, { standardType: 'time' })}
                >
                  <Text style={[styles.standardTypeText, unit.standardType === 'time' && styles.standardTypeTextActive]}>
                    时间
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.standardTypeButton, unit.standardType === 'distance' && styles.standardTypeActive]}
                  onPress={() => updateUnit(unit.id, { standardType: 'distance' })}
                >
                  <Text style={[styles.standardTypeText, unit.standardType === 'distance' && styles.standardTypeTextActive]}>
                    距离
                  </Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                value={unit.standardValue}
                onChangeText={(v) => updateUnit(unit.id, { standardValue: v })}
                placeholder={unit.standardType === 'time' ? '分钟' : '公里'}
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        {unit.type === 'rest' && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>休息建议</Text>
            <TextInput
              style={styles.input}
              value={unit.content}
              onChangeText={(v) => updateUnit(unit.id, { content: v })}
              placeholder="如：轻松慢跑、拉伸"
            />
          </View>
        )}

        {unit.type === 'other' && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>内容</Text>
            <TextInput
              style={styles.input}
              value={unit.content}
              onChangeText={(v) => updateUnit(unit.id, { content: v })}
              placeholder="如：力量训练、游泳"
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Text style={styles.cancelText}>取消</Text>
        </Pressable>
        <Text style={styles.title}>创建训练</Text>
        <Pressable onPress={handleSave} disabled={!name.trim()}>
          <Text style={[styles.saveText, !name.trim() && styles.saveTextDisabled]}>保存</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Name Input */}
        <View style={styles.nameField}>
          <Text style={styles.fieldLabel}>训练名称</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="如：周三间歇跑"
          />
        </View>

        {/* Units */}
        <View style={styles.unitsSection}>
          <Text style={styles.sectionTitle}>训练项目</Text>
          {units.map((unit, index) => renderUnit(unit, index))}
          <Pressable style={styles.addButton} onPress={addUnit}>
            <Text style={styles.addButtonText}>+ 添加项目</Text>
          </Pressable>
        </View>

        {/* Favorite Checkbox */}
        {showFavoriteCheckbox && (
          <View style={styles.favoriteRow}>
            <Text style={styles.favoriteLabel}>收藏到我的训练</Text>
            <Switch
              value={isFavorite}
              onValueChange={setIsFavorite}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        )}
      </ScrollView>
    </View>
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
  saveText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
  },
  saveTextDisabled: {
    color: PlatformColor('tertiaryLabel'),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  nameField: {
    gap: SPACING.sm,
  },
  fieldLabel: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
  },
  nameInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: PlatformColor('label'),
  },
  unitsSection: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  unitCard: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitIndex: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('secondaryLabel'),
  },
  removeText: {
    ...TYPOGRAPHY.subhead,
    color: '#FF3B30',
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  field: {
    gap: SPACING.xs,
  },
  paceModes: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  paceButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
  },
  paceButtonActive: {
    backgroundColor: COLORS.primary,
  },
  paceButtonText: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('label'),
  },
  paceButtonTextActive: {
    color: '#FFFFFF',
  },
  standardRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  standardTypeButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    alignItems: 'center',
  },
  standardTypeActive: {
    backgroundColor: COLORS.primary,
  },
  standardTypeText: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('label'),
  },
  standardTypeTextActive: {
    color: '#FFFFFF',
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: PlatformColor('label'),
  },
  addButton: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
  },
  favoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
  },
  favoriteLabel: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('label'),
  },
});
