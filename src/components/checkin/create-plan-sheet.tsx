/**
 * CreatePlanSheet Component
 * Form to create a daily training plan with units
 * Flow: build units → 确定 each → 下一页 → CheckInConfirmSheet
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { PlatformColor } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';

interface Unit {
  id: string;
  type: 'run' | 'rest' | 'other';
  inputMode?: 'pace' | 'value';
  paceMode?: string;
  paceOffset?: number;
  paceValue?: string;
  standardType?: 'time' | 'distance';
  standardValue?: string;
  content?: string;
  restMinutes?: string;  // for rest type only
  isDone?: boolean;
}

interface Props {
  showFavoriteCheckbox?: boolean;
  paceValues?: { paceE: number; paceM: number; paceT: number; paceI: number; paceR: number };
  /** Called when user taps 下一页 after all units are done */
  onNextStep?: (name: string, units: Unit[]) => void;
  onClose: () => void;
}

const PACE_ZONES = ['E', 'M', 'T', 'I', 'R'];
const PACE_OFFSETS = [-10, -5, 5, 10];

function getBasePace(paceMode: string | undefined, paceValues?: Props['paceValues']): number | null {
  if (!paceMode || !paceValues) return null;
  const key = `pace${paceMode.replace('+', '').replace('-', '')}` as keyof typeof paceValues;
  return (paceValues as any)[key] ?? null;
}

function formatPaceFromSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPaceDisplay(paceMode?: string, offset?: number, paceValues?: Props['paceValues']): string {
  if (!paceMode) return '--:--';
  const base = getBasePace(paceMode, paceValues);
  const adjusted = base !== null ? base + (offset ?? 0) : null;
  const paceStr = adjusted !== null ? formatPaceFromSeconds(adjusted) : '--:--';
  const offsetLabel = (offset ?? 0) !== 0 ? `${offset > 0 ? '+' : ''}${offset}` : '';
  return `${paceMode}${offsetLabel} ${paceStr}`;
}

export default function CreatePlanSheet({ showFavoriteCheckbox = false, paceValues, onNextStep, onClose }: Props) {
  const [name, setName] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const addUnit = (type: 'run' | 'rest' | 'other' = 'run') => {
    const newUnit: Unit = {
      id: Date.now().toString(),
      type,
      isDone: false,
      ...(type === 'run' ? {
        inputMode: 'pace',
        paceMode: 'E',
        paceOffset: 0,
        standardType: 'time',
        standardValue: '30',
      } : {}),
      ...(type === 'rest' ? {
        restMinutes: '',
      } : {}),
    };
    setUnits([...units, newUnit]);
  };

  const removeUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
  };

  const updateUnit = (id: string, updates: Partial<Unit>) => {
    if (updates.paceMode !== undefined) {
      updates.paceOffset = 0;
    }
    setUnits(units.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const allDone = units.length > 0 && units.every(u => u.isDone);

  // ---- Pace helpers ----

  const renderPaceRow = (unit: Unit) => (
    <View style={styles.paceRow}>
      {PACE_ZONES.map(zone => (
        <Pressable
          key={zone}
          style={[styles.zoneButton, unit.paceMode === zone && styles.zoneButtonActive]}
          onPress={() => updateUnit(unit.id, { paceMode: zone })}
        >
          <Text style={[styles.zoneButtonText, unit.paceMode === zone && styles.zoneButtonTextActive]}>
            {zone}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderOffsetRow = (unit: Unit) => (
    <View style={styles.offsetRow}>
      {PACE_OFFSETS.map(offset => (
        <Pressable
          key={offset}
          style={[styles.offsetButton, unit.paceOffset === offset && styles.offsetButtonActive]}
          onPress={() => updateUnit(unit.id, { paceOffset: (unit.paceOffset ?? 0) + offset })}
        >
          <Text style={[styles.offsetButtonText, unit.paceOffset === offset && styles.offsetButtonTextActive]}>
            {offset > 0 ? `+${offset}` : `${offset}`}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // ---- Summary text for collapsed view ----

  const getUnitSummary = (unit: Unit): string => {
    if (unit.type === 'run') {
      const pace = unit.inputMode === 'value'
        ? (unit.paceValue ?? '--:--')
        : formatPaceDisplay(unit.paceMode, unit.paceOffset, paceValues);
      const vol = unit.standardValue
        ? `${unit.standardType === 'time' ? unit.standardValue + '分钟' : unit.standardValue + '公里'}`
        : '';
      return `跑步 ${pace} ${vol}`.trim();
    }
    if (unit.type === 'rest') {
      return unit.restMinutes ? `休息 ${unit.restMinutes}分钟` : '休息';
    }
    return unit.content ? `其他 ${unit.content}` : '其他';
  };

  // ---- Unit card ----

  const renderCollapsed = (unit: Unit) => (
    <Pressable
      key={unit.id}
      style={styles.unitCardDone}
      onPress={() => updateUnit(unit.id, { isDone: false })}
    >
      <View style={[styles.doneCircle, styles.doneCircleActive]}>
        <Text style={styles.doneCircleText}>✓</Text>
      </View>
      <Text style={styles.unitSummary} numberOfLines={1}>{getUnitSummary(unit)}</Text>
      <Pressable hitSlop={8} onPress={() => removeUnit(unit.id)}>
        <Text style={styles.removeText}>删除</Text>
      </Pressable>
    </Pressable>
  );

  const renderExpanded = (unit: Unit, index: number) => (
    <View key={unit.id} style={styles.unitCard}>
      {/* Header */}
      <View style={styles.unitHeader}>
        <Text style={styles.unitIndex}>项目 {index + 1}</Text>
        <Pressable hitSlop={8} onPress={() => removeUnit(unit.id)}>
          <Text style={styles.removeText}>删除</Text>
        </Pressable>
      </View>

      {/* Type selector */}
      <View style={styles.typeRow}>
        {(['run', 'rest', 'other'] as const).map(t => (
          <Pressable
            key={t}
            style={[styles.typeButton, unit.type === t && styles.typeButtonActive]}
            onPress={() => {
              if (t === 'rest') {
                updateUnit(unit.id, { type: 'rest', restMinutes: '', isDone: false });
              } else if (t === 'run') {
                updateUnit(unit.id, {
                  type: 'run',
                  inputMode: 'pace',
                  paceMode: 'E',
                  paceOffset: 0,
                  standardType: 'time',
                  standardValue: '30',
                  isDone: false,
                });
              } else {
                updateUnit(unit.id, { type: 'other', content: '', isDone: false });
              }
            }}
          >
            <Text style={[styles.typeButtonText, unit.type === t && styles.typeButtonTextActive]}>
              {t === 'run' ? '跑步' : t === 'rest' ? '休息' : '其他'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* RUN fields */}
      {unit.type === 'run' && (
        <>
          {/* Pace mode tab */}
          <View style={styles.inputModeRow}>
            <Pressable
              style={[styles.inputModeTab, unit.inputMode === 'pace' && styles.inputModeTabActive]}
              onPress={() => updateUnit(unit.id, { inputMode: 'pace' })}
            >
              <Text style={[styles.inputModeTabText, unit.inputMode === 'pace' && styles.inputModeTabTextActive]}>配速区间</Text>
            </Pressable>
            <Pressable
              style={[styles.inputModeTab, unit.inputMode === 'value' && styles.inputModeTabActive]}
              onPress={() => updateUnit(unit.id, { inputMode: 'value' })}
            >
              <Text style={[styles.inputModeTabText, unit.inputMode === 'value' && styles.inputModeTabTextActive]}>数值</Text>
            </Pressable>
          </View>

          {unit.inputMode === 'pace' && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>配速区间</Text>
                {renderPaceRow(unit)}
              </View>
              <View style={styles.field}>
                <View style={styles.offsetHeader}>
                  <Text style={styles.fieldLabel}>调整</Text>
                  <View style={styles.adjustedPaceBox}>
                    <Text style={styles.adjustedPaceText}>
                      {formatPaceDisplay(unit.paceMode, unit.paceOffset, paceValues)}
                    </Text>
                  </View>
                </View>
                {renderOffsetRow(unit)}
              </View>
            </>
          )}

          {unit.inputMode === 'value' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>配速</Text>
              <View style={styles.paceValueRow}>
                <TextInput
                  style={[styles.input, styles.paceInput]}
                  value={unit.paceValue ? unit.paceValue.split(':')[0] : ''}
                  onChangeText={(v) => {
                    const sec = unit.paceValue ? (unit.paceValue.split(':')[1] ?? '00') : '00';
                    updateUnit(unit.id, { paceValue: `${v}:${sec}` });
                  }}
                  placeholder="分"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.paceColon}>:</Text>
                <TextInput
                  style={[styles.input, styles.paceInput]}
                  value={unit.paceValue ? unit.paceValue.split(':')[1] ?? '' : ''}
                  onChangeText={(v) => {
                    const min = unit.paceValue ? (unit.paceValue.split(':')[0] ?? '0') : '0';
                    updateUnit(unit.id, { paceValue: `${min}:${v}` });
                  }}
                  placeholder="秒"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          )}

          {/* Training volume */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>训练量</Text>
            <View style={styles.standardRow}>
              <Pressable
                style={[styles.standardTypeButton, unit.standardType === 'time' && styles.standardTypeActive]}
                onPress={() => updateUnit(unit.id, { standardType: 'time' })}
              >
                <Text style={[styles.standardTypeText, unit.standardType === 'time' && styles.standardTypeTextActive]}>时间</Text>
              </Pressable>
              <Pressable
                style={[styles.standardTypeButton, unit.standardType === 'distance' && styles.standardTypeActive]}
                onPress={() => updateUnit(unit.id, { standardType: 'distance' })}
              >
                <Text style={[styles.standardTypeText, unit.standardType === 'distance' && styles.standardTypeTextActive]}>距离</Text>
              </Pressable>
            </View>
            <View style={styles.standardInputRow}>
              <TextInput
                style={[styles.input, styles.standardInputField]}
                value={unit.standardValue}
                onChangeText={(v) => updateUnit(unit.id, { standardValue: v })}
                placeholder={unit.standardType === 'time' ? '30' : '5'}
                keyboardType="numeric"
              />
              <Text style={styles.unitLabel}>{unit.standardType === 'time' ? '分钟' : '千米'}</Text>
            </View>
          </View>
        </>
      )}

      {/* REST fields */}
      {unit.type === 'rest' && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>休息时间</Text>
          <View style={styles.standardInputRow}>
            <TextInput
              style={[styles.input, styles.standardInputField]}
              value={unit.restMinutes}
              onChangeText={(v) => updateUnit(unit.id, { restMinutes: v })}
              placeholder="0"
              keyboardType="numeric"
            />
            <Text style={styles.unitLabel}>分钟</Text>
          </View>
        </View>
      )}

      {/* OTHER fields */}
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

      {/* 确定 button at bottom */}
      <Pressable
        style={styles.confirmButton}
        onPress={() => updateUnit(unit.id, { isDone: true })}
      >
        <Text style={styles.confirmButtonText}>确定</Text>
      </Pressable>
    </View>
  );

  const renderUnit = (unit: Unit, index: number) =>
    unit.isDone ? renderCollapsed(unit) : renderExpanded(unit, index);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Text style={styles.cancelText}>取消</Text>
        </Pressable>
        <Text style={styles.title}>创建训练</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
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
          {units.map((unit, i) => renderUnit(unit, i))}

          {/* Add buttons */}
          <View style={styles.addRow}>
            <Pressable style={styles.addButton} onPress={() => addUnit('run')}>
              <Text style={styles.addButtonText}>+ 跑步</Text>
            </Pressable>
            <Pressable style={styles.addButton} onPress={() => addUnit('rest')}>
              <Text style={styles.addButtonText}>+ 休息</Text>
            </Pressable>
            <Pressable style={styles.addButton} onPress={() => addUnit('other')}>
              <Text style={styles.addButtonText}>+ 其他</Text>
            </Pressable>
          </View>

          {/* 下一页 */}
          {allDone && (
            <Pressable style={styles.nextButton} onPress={() => onNextStep?.(name, units)}>
              <Text style={styles.nextButtonText}>下一页</Text>
            </Pressable>
          )}
        </View>

        {/* Favorite */}
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

// ---- Styles ----

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
    gap: SPACING.lg,
  },
  nameField: { gap: SPACING.sm },
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
  unitsSection: { gap: SPACING.sm },
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
  unitCardDone: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
  unitSummary: {
    flex: 1,
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
  },
  doneCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircleActive: {
    backgroundColor: COLORS.primary,
  },
  doneCircleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  field: { gap: SPACING.xs },
  inputModeRow: {
    flexDirection: 'row',
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: 2,
  },
  inputModeTab: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  inputModeTabActive: {
    backgroundColor: PlatformColor('systemBackground'),
  },
  inputModeTabText: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('secondaryLabel'),
  },
  inputModeTabTextActive: {
    color: PlatformColor('label'),
    fontWeight: '600',
  },
  paceRow: { flexDirection: 'row', gap: SPACING.xs },
  zoneButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    alignItems: 'center',
  },
  zoneButtonActive: { backgroundColor: COLORS.primary },
  zoneButtonText: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  zoneButtonTextActive: { color: '#FFFFFF' },
  offsetRow: { flexDirection: 'row', gap: SPACING.sm },
  offsetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  offsetButtonActive: { backgroundColor: COLORS.primary },
  offsetButtonText: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  offsetButtonTextActive: { color: '#FFFFFF' },
  offsetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustedPaceBox: {
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  adjustedPaceText: {
    ...TYPOGRAPHY.subhead,
    color: PlatformColor('label'),
    fontWeight: '600',
  },
  paceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  paceInput: { flex: 1, textAlign: 'center' },
  paceColon: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  standardRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  standardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  standardInputField: { flex: 1 },
  standardTypeButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    alignItems: 'center',
  },
  standardTypeActive: { backgroundColor: COLORS.primary },
  standardTypeText: {
    ...TYPOGRAPHY.footnote,
    color: PlatformColor('label'),
  },
  standardTypeTextActive: { color: '#FFFFFF' },
  unitLabel: {
    ...TYPOGRAPHY.body,
    color: PlatformColor('secondaryLabel'),
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: PlatformColor('label'),
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
  },
  addRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  addButton: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  nextButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
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
