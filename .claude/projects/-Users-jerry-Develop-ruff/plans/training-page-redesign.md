# Plan: 训练页面重构

> Source PRD: `.claude/projects/-Users-jerry-Develop-ruff/PRD-Training-Page-Redesign.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes**: No new routes; modifies existing `/run` tab and `/check-in` page
- **Schema**: `trainingCheckIns` extended with `templateId`, `templateName`, `templateIcon`, `isCustomActivity` fields
- **Key models**: `CalendarEntry`, `TrainingCheckIn`, `Template`, `DailyTask`
- **API**: `POST /api/training-check-ins` accepts extended payload for custom activities; `PATCH /api/daily-tasks/:id/complete` marks planned tasks done
- **Query keys**: `["trainingCheckIns", date]`, `["calendarEntries"]`, `["todayDailyTask"]`
- **Favorites**: Templates marked `isLibrary: true` are "我的收藏"

---

## Phase 1: 简化训练页面 - 本周静态视图

**User stories**: 1, 2, 8

### What to build

Simplify the Run tab to show today's plan + current week in a static vertical layout. Remove horizontal swipe pager, "Generate Next Week" button, and "Modify" button.

**End-to-end behavior:**
- Run tab shows `TodayPlanCard` (today's planned workout)
- Below it shows `WeekSummarySection` (7-day grid for current week, NOT swipeable)
- Empty state when no active plan

### Acceptance criteria

- [ ] Today's plan displays with template icon, name, description
- [ ] Week shows Mon–Sun 7-day grid, no horizontal swipe
- [ ] "Generate Next Week" button is removed
- [ ] "Modify" button is removed
- [ ] Empty state guides user to start a plan if none exists

---

## Phase 2: 新打卡流程 - CheckInFlowSheet

**User stories**: 3, 4, 5, 6, 7

### What to build

New `CheckInFlowSheet` bottom sheet with checkbox prompt, template selection, and custom activity creation.

**End-to-end behavior:**
- Tap check-in button → opens `CheckInFlowSheet`
- Checkbox "完成了今日计划" (default: unchecked)
- Image upload + feeling text always shown
- If checked → uses today's planned template
- If unchecked → shows:
  - "从我的收藏选择" → template picker
  - "创建自定义" → name + emoji icon only, NOT saved to favorites
- Submit → `createTrainingCheckIn()` API call

### Acceptance criteria

- [ ] Checkbox default unchecked
- [ ] Image upload works (up to 3 images)
- [ ] Feeling text input works
- [ ] Checked path: uses today's planned template from `calendarEntries`
- [ ] Unchecked path: shows template picker from favorites
- [ ] Unchecked + custom: name + icon only, does NOT appear in favorites
- [ ] Submit calls `POST /api/training-check-ins` with correct payload
- [ ] Query invalidation refreshes feed after submit

---

## Phase 3: 打卡页面 - 今日打卡动态

**User stories**: 12, 13

### What to build

`CheckInFeedSection` on check-in page showing today's training check-ins in social feed style.

**End-to-end behavior:**
- Check-in page shows `CheckInFeedSection` with all today's training check-ins
- Each feed item shows: template icon, name, images (horizontal scroll), description, timestamp, feeling
- Multiple items supported if user logged more than one activity
- Tap card → opens detail (future)

### Acceptance criteria

- [ ] Feed shows all today's `TrainingCheckIn` records
- [ ] Template icon and name displayed for each item
- [ ] Images shown horizontally scrollable
- [ ] Description and feeling text displayed
- [ ] Timestamp shown
- [ ] Multiple check-ins display as separate cards
- [ ] Empty state when no check-ins today

---

## Phase 4: 打卡页面 - 4个Stat卡片

**User stories**: 9, 10, 11

### What to build

Enhance stat cards on check-in page to be tappable for quick logging.

**End-to-end behavior:**
- 4 stat cards in a row: 体重, 睡眠, 起床, 训练
- Tap 体重 → opens weight input sheet
- Tap 睡眠 → logs current time as sleep time
- Tap 起床 → logs current time as wake time
- Tap 训练 → opens `CheckInFlowSheet`

### Acceptance criteria

- [ ] 4 cards display: 体重, 睡眠, 起床, 训练
- [ ] Tap 体重 opens weight input
- [ ] Tap 睡眠 logs sleep time
- [ ] Tap 起床 logs wake time
- [ ] Tap 训练 opens CheckInFlowSheet
- [ ] Data persists and shows in card after logging

---

## Phase 5: API扩展 - 支持自定义活动

**User stories**: 14, 15, 16, 17, 18

### What to build

Extend `POST /api/training-check-ins` to accept template info and custom activity flag.

**End-to-end behavior:**
- API accepts `templateId`, `templateName`, `templateIcon`, `isCustomActivity` in request body
- Custom activities stored with `isCustomActivity: true`, not linked to template library
- When `templateId` provided, template info resolved from database
- When custom, `templateName` and `templateIcon` stored directly on check-in record

### Acceptance criteria

- [ ] API accepts `templateId` to link to existing template
- [ ] API accepts `templateName` + `templateIcon` for custom activities
- [ ] `isCustomActivity: true` flag set for non-template check-ins
- [ ] Custom activities do NOT appear in favorites template list
- [ ] Check-in appears in feed after creation

---

## Phase ordering rationale

1. **Phase 1** (UI simplification) → foundation, no API changes
2. **Phase 5** (API extension) → enables Phase 2, can be tested independently
3. **Phase 2** (check-in flow) → core user interaction, depends on Phase 5
4. **Phase 4** (stat cards) → leverages existing APIs, independent
5. **Phase 3** (feed display) → shows data from Phase 2, final polish

Phases 1 and 5 can be built in parallel if two engineers available.