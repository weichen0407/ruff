/**
 * TriangleCheckIn
 * Small triangle indicator for calendar - matches CheckInTriangle geometry
 * Left=0 (训练), Bottom-left=1 (睡眠), Bottom-right=2 (体重)
 */

import React from "react";
import { View } from "react-native";
import Svg, { Polygon, Line } from "react-native-svg";
import { PlatformColor } from "react-native";

interface TriangleCheckInProps {
  size?: number;
  modules: string[]; // e.g., ["training", "sleep", "weight"]
  accentColor?: string;
}

export function TriangleCheckIn({
  size = 40,
  modules,
  accentColor = "#FF9500",
}: TriangleCheckInProps) {
  // Match CheckInTriangle geometry (pointing up equilateral triangle)
  // size = full width of triangle
  const width = size;
  const height = width * Math.sqrt(3) / 2;

  // Triangle vertices (pointing up)
  const top = { x: width / 2, y: 0 };
  const bottomLeft = { x: 0, y: height };
  const bottomRight = { x: width, y: height };
  // Center at 2/3 of height from top
  const center = { x: width / 2, y: (height * 2) / 3 };

  // 3 segments matching CheckInTriangle order
  // index 0: top (训练), index 1: bottom-left (睡眠), index 2: bottom-right (体重)
  const segments = [
    { id: "training", points: `${center.x},${center.y} ${top.x},${top.y} ${bottomRight.x},${bottomRight.y}` },
    { id: "sleep", points: `${center.x},${center.y} ${bottomLeft.x},${bottomLeft.y} ${top.x},${top.y}` },
    { id: "weight", points: `${center.x},${center.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}` },
  ];

  const hasModule = (id: string) => modules.includes(id);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* 3 triangle segments */}
        {segments.map((segment) => (
          <Polygon
            key={segment.id}
            points={segment.points}
            fill={hasModule(segment.id) ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth={0.5}
          />
        ))}
        {/* Lines from center to vertices */}
        <Line x1={center.x} y1={center.y} x2={top.x} y2={top.y} stroke={accentColor} strokeWidth={0.3} />
        <Line x1={center.x} y1={center.y} x2={bottomRight.x} y2={bottomRight.y} stroke={accentColor} strokeWidth={0.3} />
        <Line x1={center.x} y1={center.y} x2={bottomLeft.x} y2={bottomLeft.y} stroke={accentColor} strokeWidth={0.3} />
      </Svg>
    </View>
  );
}
