/**
 * CheckInTriangle Component
 * An equilateral triangle divided into 3 parts from center to vertices
 * Each part can be filled independently by clicking corresponding buttons
 */

import { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';
import { PlatformColor } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS } from '@/constants/themes';

const SIZE = 200;
const HEIGHT = SIZE * Math.sqrt(3) / 2;

// Triangle vertices
const TOP = { x: SIZE / 2, y: 0 };
const BOTTOM_LEFT = { x: 0, y: HEIGHT };
const BOTTOM_RIGHT = { x: SIZE, y: HEIGHT };
// Center (centroid) is at 2/3 of the height from top
const CENTER = { x: SIZE / 2, y: (HEIGHT * 2) / 3 };

// 3 triangle segments from center to vertices
const SEGMENTS = [
  { id: 0, points: `${CENTER.x},${CENTER.y} ${TOP.x},${TOP.y} ${BOTTOM_RIGHT.x},${BOTTOM_RIGHT.y}`, label: '训练' },
  { id: 1, points: `${CENTER.x},${CENTER.y} ${BOTTOM_RIGHT.x},${BOTTOM_RIGHT.y} ${BOTTOM_LEFT.x},${BOTTOM_LEFT.y}`, label: '休息' },
  { id: 2, points: `${CENTER.x},${CENTER.y} ${BOTTOM_LEFT.x},${BOTTOM_LEFT.y} ${TOP.x},${TOP.y}`, label: '营养' },
];

const COLORS = {
  fill: '#FF9500',
  stroke: '#FF9500',
  strokeWidth: 2,
};

interface Props {
  onSegmentPress?: (index: number) => void;
  filledSegments?: number[];
}

export default function CheckInTriangle({ onSegmentPress, filledSegments = [] }: Props) {
  const [activeSegments, setActiveSegments] = useState<number[]>(filledSegments);

  const handleSegmentPress = (index: number) => {
    const newSegments = activeSegments.includes(index)
      ? activeSegments.filter((i) => i !== index)
      : [...activeSegments, index];
    setActiveSegments(newSegments);
    onSegmentPress?.(index);
  };

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={HEIGHT} viewBox={`0 0 ${SIZE} ${HEIGHT}`}>
        {/* Draw 3 triangle segments */}
        {SEGMENTS.map((segment, index) => (
          <Polygon
            key={segment.id}
            points={segment.points}
            fill={activeSegments.includes(index) ? COLORS.fill : 'transparent'}
            stroke={COLORS.stroke}
            strokeWidth={COLORS.strokeWidth}
            onPress={() => handleSegmentPress(index)}
          />
        ))}
        {/* Lines from center to vertices */}
        <Line x1={CENTER.x} y1={CENTER.y} x2={TOP.x} y2={TOP.y} stroke={COLORS.stroke} strokeWidth={1} />
        <Line x1={CENTER.x} y1={CENTER.y} x2={BOTTOM_RIGHT.x} y2={BOTTOM_RIGHT.y} stroke={COLORS.stroke} strokeWidth={1} />
        <Line x1={CENTER.x} y1={CENTER.y} x2={BOTTOM_LEFT.x} y2={BOTTOM_LEFT.y} stroke={COLORS.stroke} strokeWidth={1} />
      </Svg>

      {/* Buttons below */}
      <View style={styles.buttons}>
        {SEGMENTS.map((segment, index) => (
          <Pressable
            key={segment.id}
            style={[
              styles.button,
              activeSegments.includes(index) && styles.buttonActive,
            ]}
            onPress={() => handleSegmentPress(index)}
          >
            <Text style={[styles.buttonText, activeSegments.includes(index) && styles.buttonTextActive]}>
              {segment.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  button: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderWidth: 1,
    borderColor: PlatformColor('separator'),
  },
  buttonActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  buttonText: {
    ...TYPOGRAPHY.headline,
    color: PlatformColor('label'),
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
});
