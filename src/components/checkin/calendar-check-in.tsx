/**
 * CalendarCheckIn
 * Calendar grid with triangle check-in indicators for each date
 * Adapted from ruff-v1 CalendarHeatmap
 */

import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { PlatformColor } from "react-native";
import { TriangleCheckIn } from "./triangle-check-in";
import { SPACING, TYPOGRAPHY, RADIUS } from "@/constants/themes";

interface DailyCheckInSnapshot {
  date: string;
  hasCheckIn: boolean;
  hasSleepRecord: boolean;
  hasWeightRecord: boolean;
  modulesCheckedIn?: string[];
}

interface CalendarCheckInProps {
  year: number;
  month: number;
  snapshots: DailyCheckInSnapshot[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  accentColor?: string;
  showBorder?: boolean;
}

// Generate calendar dates for a given month (Monday-start weeks)
function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  // Start from Monday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + mondayOffset);

  const endDate = new Date(lastDay);
  const endDayOfWeek = endDate.getDay();
  const endMondayOffset = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
  endDate.setDate(endDate.getDate() + endMondayOffset);

  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return { dates, firstDay, lastDay };
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

const WEEK_DAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function CalendarCheckIn({
  year,
  month,
  snapshots,
  selectedDate,
  onSelectDate,
  accentColor = "#FF9500",
  showBorder = true,
}: CalendarCheckInProps) {
  const { dates, firstDay, lastDay } = useMemo(
    () => getMonthDates(year, month),
    [year, month]
  );

  const todayStr = formatDateKey(new Date());

  const snapshotMap = useMemo(() => {
    const map: Record<string, DailyCheckInSnapshot> = {};
    snapshots.forEach((s) => {
      map[s.date] = s;
    });
    return map;
  }, [snapshots]);

  const weeks: Date[][] = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  return (
    <View style={{ paddingHorizontal: SPACING.md }}>
      {/* Weekday headers */}
      <View
        style={{
          flexDirection: "row",
          borderRadius: RADIUS.lg,
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.sm,
          backgroundColor: PlatformColor('secondarySystemBackground') as unknown as string,
          marginBottom: SPACING.sm,
        }}
      >
        {WEEK_DAYS.map((day, idx) => (
          <View key={idx} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                ...TYPOGRAPHY.caption1,
                color: PlatformColor('secondaryLabel') as unknown as string,
              }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ gap: 4 }}>
        {weeks.map((week, weekIdx) => (
          <View key={weekIdx} style={{ flexDirection: "row", gap: 4 }}>
            {week.map((date, dayIdx) => {
              const dateStr = formatDateKey(date);
              const snapshot = snapshotMap[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isCurrentMonth = date >= firstDay && date <= lastDay;

              // Build modules array from snapshot
              const modules: string[] = [];
              if (snapshot?.hasCheckIn) modules.push("training");
              if (snapshot?.hasSleepRecord) modules.push("sleep");
              if (snapshot?.hasWeightRecord) modules.push("weight");

              return (
                <Pressable
                  key={dayIdx}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: RADIUS.lg,
                    borderWidth: isSelected ? 1 : 0,
                    borderColor: accentColor,
                    minHeight: 64,
                    backgroundColor: isCurrentMonth
                      ? (PlatformColor('secondarySystemBackground') as unknown as string)
                      : (PlatformColor('tertiarySystemBackground') as unknown as string),
                    opacity: isCurrentMonth ? 1 : 0.4,
                  }}
                  onPress={() => onSelectDate(dateStr)}
                >
                  <Text
                    style={{
                      ...TYPOGRAPHY.footnote,
                      fontWeight: isToday ? "700" : "400",
                      color: isToday
                        ? accentColor
                        : isCurrentMonth
                          ? (PlatformColor('label') as unknown as string)
                          : (PlatformColor('tertiaryLabel') as unknown as string),
                    }}
                  >
                    {date.getDate()}
                  </Text>

                  {/* Triangle indicator */}
                  <View style={{ marginTop: 4 }}>
                    <TriangleCheckIn
                      size={20}
                      modules={modules}
                      showBorder={showBorder}
                      accentColor={accentColor}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
