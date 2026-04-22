# 训练页面重构 PRD

## Problem Statement

The user is experiencing a complex and cluttered training page that mixes multiple concerns:
- Weekly plan viewing with horizontal swiping
- "Generate next week" and "Modify" buttons that add unnecessary complexity
- A check-in flow that doesn't ask whether the user completed the planned workout
- Weight tracking and sleep tracking buried in separate components
- Check-in records displayed separately from the training content
- The need to support both planned workouts and spontaneous/custom activities

The user wants a streamlined training page focused on:
- Displaying today's plan and allowing easy check-in
- A cleaner flow that asks if the planned workout was completed
- Support for both planned templates and custom activities
- A social feed-style display of check-ins with images and descriptions
- Moving weight and sleep tracking to the check-in page cards

## Solution

### New Training Page (Run Tab) - Simplified Focus

The training page is redesigned to be the **daily training command center**:

1. **Header**: Title "训练" / "Training" with action buttons
2. **Today's Plan Card**: Shows current day's training from the active plan
3. **Check-in Button**: Primary CTA that asks whether planned workout was completed
4. **This Week + Next Week Preview**: Two sections showing both weeks' content (no horizontal swiping)
5. **Quick Stats Row**: Today's progress indicator

### Check-in Flow - Two Paths

**Path A - Completed Planned Workout:**
- User taps check-in
- Modal asks: "Did you complete today's planned workout?" (with a checkbox-style confirmation)
- If confirmed: marks the day's plan entry as completed automatically
- Shows completion celebration, records timestamp
- No further input required

**Path B - Different/Custom Workout:**
- User taps check-in but unchecks the "completed planned workout" option
- Presented with options:
  - **Select from template library**: Browse and pick a different template
  - **Create custom activity**: Name + icon only (NOT saved to template library)
- Then: Add image(s) and text description
- Submit creates a custom check-in record

### Check-in Page Redesign

The check-in page becomes the **daily status hub**:

1. **Stat Cards Row**: Weight, Sleep Time, Wake Time (tap to log)
2. **Today's Check-in Feed**: Social feed style (朋友圈/ Moments)
   - Shows training check-ins with template image, description, feeling
   - Images displayed prominently
   - Comments/likes (future consideration)
3. **Historical entries** below

### Template Selection Behavior

- **From Template Library**: Full template details, saved to user's library
- **Create Custom (Check-in only)**: Name + icon only, temporary for this check-in, NOT saved to template library

## User Stories

### Training Page (Run Tab)

1. As a runner, I want to see my today's training plan at a glance, so I know what I should do today
2. As a runner, I want to see my current week's plan (本周) in a simple view, so I can quickly see what's scheduled
3. As a runner, I want to quickly check in when I complete my workout, so I don't forget to log my training
4. As a runner, I want a checkbox asking if I completed the planned workout, so I can either confirm or choose a different activity
5. As a runner, I want to upload images and descriptions even when completing the planned workout, so I can share details
6. As a runner, I want to select a different template from my favorites (我的收藏) if I changed my workout, so I'm not locked into one option
7. As a runner, I want to create a custom activity for today only, so I can log impromptu workouts without cluttering my favorites
8. As a runner with no active plan, I want to see an empty state guiding me to start a plan, so I know what to do next

### Check-in Page

9. As a runner, I want to see 4 stat cards (体重, 睡眠, 起床, 训练) that I can tap to log, so tracking is convenient
10. As a runner, I want to log my weight by tapping the weight card, so tracking weight is quick
11. As a runner, I want to log my sleep and wake times by tapping cards, so I can track my sleep habits
12. As a runner, I want to see a social feed showing **all today's check-ins** with images and descriptions, so I can review my day's training
13. As a runner, I want to see detailed content (template, images, feelings) of each check-in, so I can remember what I did

### Template & Favorites System

14. As a runner, I want to select from my favorited templates (我的收藏) when checking in to a different workout, so I can reuse templates I've saved
15. As a runner, I want custom activities created during check-in to NOT appear in my favorites, so my favorites stays clean
16. As a runner, I want to go to my favorites section to create a new template that gets saved, so I can build up my template collection

### Data & Query

17. As a runner, I want my check-in to immediately update the UI, so I see my progress right away
18. As a runner, I want my check-in data to persist and show in the feed, so I can review it later

## Implementation Decisions

### 1. Training Page (Run Tab) Components

**`RunScreen` (src/app/(tabs)/run.tsx)**
- Remove horizontal week pager (WeeklyPlansSection)
- Display current week only (本周) as a static 7-day grid (NOT swipeable)
- Remove "Generate Next Week" button
- Simplify header actions

**New Components:**
- `TodayPlanCard`: Shows today's planned workout with template icon, name, description
- `QuickCheckInButton`: Primary CTA that triggers the check-in flow
- `WeekSummarySection`: Current week 7-day overview (static, no swipe)
- `CheckInFlowSheet`: Main check-in bottom sheet

**Query Changes:**
- Fetch `calendarEntries` for current week and next week only (not all weeks)
- `queryKey: ["calendarEntries", weekIndex]` for specific week
- `queryKey: ["trainingCheckIns", date]` for check-in records

### 2. Check-in Flow

**New `CheckInFlowSheet` component:**
```
┌─────────────────────────────────────┐
│  训练打卡 / Training Check-in        │
│                                     │
│  ☐ 完成了今日计划                   │
│    (I completed today's plan)        │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  [上传图片 / Add Images]            │
│  [添加描述 / Add Description]       │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  如果勾选"完成了今日计划":           │
│  → 训练内容来自今日计划模板          │
│  → 用户仍可上传图片和描述            │
│                                     │
│  如果不勾选:                        │
│  → 从"我的收藏"选择模板             │
│  → 或创建自定义(不保存到收藏)        │
│                                     │
│  [完成打卡 / Complete Check-in]     │
└─────────────────────────────────────┘
```

**Behavior:**
- Checkbox default: UNCHECKED (user must actively confirm)
- If checked: Use today's planned template, user adds images + feeling
- If unchecked: Show template picker from "我的收藏" (favorites) OR custom creation
- Custom activities: name + icon only, NOT saved to favorites
- Submit via `createTrainingCheckIn()`

### 3. Template Selection Logic

**Templates come from "我的收藏" (favorites/library)**

**Path A - Completed Planned Workout (checkbox checked):**
- Use today's planned template from `calendarEntries`
- User uploads images + feeling description
- Call `createTrainingCheckIn()` with `templateId`, `templateName`, `templateIcon`

**Path B - Different Workout (checkbox unchecked):**
- User selects from "我的收藏" (favorited templates)
- OR creates custom activity (name + icon only, NOT saved to favorites)
- User uploads images + feeling description
- Call `createTrainingCheckIn()` with `templateId` OR custom name/icon

**Path C - Create Template for Library:**
- User must go to "我的收藏" (Templates section)
- Full template creation flow
- Saved to `templatePlans` table with `isLibrary: true`

**Key distinction:**
- Check-in custom = temporary, NOT in favorites
- Favorites templates = created separately, reusable

### 4. Check-in Page (打卡页面) Redesign

**Keep (for future复用):**
- `TabCalendar` - calendar component
- `StatCard` - reusable stat display
- `DailyTaskCard` - daily task display

**4 Stat Cards (tap to log):**
1. 体重 (Weight) - tap opens weight input
2. 睡眠 (Sleep) - tap logs sleep time
3. 起床 (Wake) - tap logs wake time
4. 训练 (Training) - tap opens check-in flow

**Add:**
- `CheckInFeedSection`: Social feed style - shows **all today's check-ins** (multiple items if any)
- Each feed item shows: template icon, name, images, description, timestamp, feeling

### 5. Data Schema Considerations

**`trainingCheckIns` table** (already exists):
- `id`, `userId`, `date`, `workoutType`, `feeling`, `imageUrls`, `createdAt`
- May need to add `templateId` or `templateName` for custom check-ins

**`dailyTasks` table** (already exists):
- Links user to a template for the day
- `completeDailyTask()` marks it complete

**No new tables needed** - reuse existing `trainingCheckIns` for custom activities

### 6. API Changes

**`POST /api/training-check-ins`:**
```typescript
interface CreateTrainingCheckInRequest {
  date: string;
  workoutType: "running" | "cycling" | "swimming" | "strength" | "yoga" | "walking" | "other";
  feeling?: string;
  imageUrls?: string[];
  templateId?: string;      // If from template
  templateName?: string;     // If custom
  templateIcon?: string;    // If custom
  isCustomActivity?: boolean; // Flag for custom (not from template library)
}
```

**`PATCH /api/daily-tasks/:id/complete`:**
- Already exists, use to mark planned task complete

### 7. Component File Structure

```
src/components/run/
├── RunScreenComponents.tsx     # Split out from run.tsx
├── TodayPlanCard.tsx          # Today's planned workout
├── WeekSummarySection.tsx     # Current week 7-day overview
├── QuickCheckInButton.tsx      # Primary CTA
├── CheckInFlowSheet.tsx       # Main check-in flow (modal/bottom sheet)
├── TemplatePickerSheet.tsx     # Select from "我的收藏"
├── CustomActivitySheet.tsx     # Create custom (not saved to favorites)
└── TrainingCheckInSheet.tsx   # Existing - add images/feeling

src/components/check-in/
├── CheckInFeedSection.tsx      # Social feed of today's check-ins
├── CheckInFeedCard.tsx         # Individual feed item
└── (existing components remain)
```

### 8. Key Interactions

**Check-in Button Tap:**
1. Open `CheckInFlowSheet`
2. Show "Did you complete today's plan?" with checkbox (default: unchecked)
3. User uploads images + feeling
4. If checked → Use today's planned template content
5. If unchecked → User selects from "我的收藏" OR creates custom (name + icon only)
6. Submit → `createTrainingCheckIn()`

**Creating Custom Activity (not saved to favorites):**
1. User taps "创建自定义"
2. Enter name + select emoji icon
3. Add images (optional)
4. Add feeling description (optional)
5. Submit → creates `trainingCheckIns` record only, NOT in favorites

**Creating Template in Favorites:**
1. User goes to Templates section (not during check-in)
2. Creates new template with full details
3. Saved to `templatePlans` table

### 9. State Management

**TanStack Query Keys:**
```typescript
// Training page
["calendarEntries", weekIndex]     // Week-specific entries
["trainingCheckIns", date]        // Check-ins for date
["todayPlan"]                      // Today's planned entry

// Check-in page
["dailySnapshots"]                 // Aggregated daily data
["weightRecords"]                  // Weight history
["sleepRecords"]                   // Sleep history
["userPosts"]                     // Social feed posts
```

**Zustand Store:**
- `useSelectedPlanStore` - current selected plan (keep)

## Testing Decisions

### What Makes a Good Test

- **External behavior only**: Test that check-in flow works, not internal state
- **User interaction focused**: Tap check-in → see prompt → complete
- **Query invalidation**: After check-in, UI updates correctly
- **Data persistence**: Check-in appears in feed after creation

### Modules to Test

1. **CheckInFlowSheet**
   - Checkbox state affects available options
   - "Completed plan" path calls correct API
   - "Custom activity" path allows name/icon entry only
   - Image upload UI works

2. **TrainingCheckInSheet**
   - Submit creates correct API payload
   - Custom activities have `isCustomActivity: true` flag

3. **RunScreen**
   - Today's plan displays correctly
   - Week summary shows current + next week
   - Check-in button opens flow

4. **CheckInFeedSection**
   - Displays check-ins in reverse chronological order
   - Images render correctly
   - Template icon shows for planned activities

### Prior Art

- Existing tests in `src/lib/check-in/__tests__/snapshot-aggregator.test.ts`
- Similar pattern: test API calls and query invalidation

## Out of Scope

1. **Likes/Comments on check-ins**: Social features beyond viewing
2. **Sharing check-ins to external platforms**: Internal feed only
3. **Automatic workout detection**: Manual entry only
4. **Calendar view on training page**: Keep on check-in page
5. **Charts on training page**: Keep on check-in page
6. **Multiple plan support**: Single active plan at a time
7. **Group/跑团 tasks integration**: Future consideration

## Further Notes

### Migration Path

1. Keep existing `dailyTasks` and `calendarEntries` for planned workouts
2. Extend `trainingCheckIns` to support custom activities with `isCustomActivity` flag
3. Don't delete existing code - wrap in feature flags or keep for backward compatibility
4. Gradual component migration: start with check-in flow, then week display

### Key UX Principles

1. **Default to the plan**: Most users complete their planned workout, so default to "completed"
2. **One-tap for common path**: Completing planned workout should be fastest option
3. **Custom without clutter**: Custom activities don't pollute template library
4. **Visual feed**: Images and descriptions make check-ins memorable
5. **Progressive disclosure**: Show simple view first, details on demand
