# Ruff Running App - Design Specification

## 1. Concept & Vision

Ruff 是一个 iOS 原生的跑步训练应用，采用 Apple 设计语言。界面遵循 Apple 的设计原则：以产品为核心，UI 退居幕后让内容说话。设计追求安静但不冷漠，精致但不华丽，为跑者提供沉浸式的训练计划管理、打卡记录和历史回顾体验。

## 2. Design Language

### Apple Design Principles
- **Photography-first**: 内容优先，UI 让位于产品
- **Single accent**: 单一强调色用于所有交互元素
- **Quiet typography**: 自信但克制的排版
- **Elevation as pedestal**: 留白是产品的展台

### Color Themes (保持不变)

| Theme | Primary | Secondary | Accent | Background | Glass BG |
|-------|---------|-----------|--------|------------|----------|
| **活力橙** | `#FF9500` | `#FF6B00` | `#34C759` | `#000000` | `rgba(255,149,0,0.15)` |
| **清新青** | `#32ADE6` | `#0A84FF` | `#34C759` | `#000000` | `rgba(50,173,230,0.15)` |
| **沉稳靛** | `#5E5CE6` | `#BF5AF2` | `#30D158` | `#000000` | `rgba(94,92,230,0.15)` |

通用颜色:
- Card Background: `#1C1C1E`
- Text: `#FFFFFF`
- Muted: `#8E8E93`

## 3. Typography (Apple System)

### Font Family
- **Display**: SF Pro Display, -apple-system, BlinkMacSystemFont (iOS 自动解析为 SF Pro)
- **Body/UI**: SF Pro Text, -apple-system, BlinkMacSystemFont

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Large Title | 34px | 700 (Bold) | 1.07 | -0.374px |
| Title 1 | 28px | 600 | 1.10 | - |
| Title 2 | 22px | 600 | 1.14 | - |
| Title 3 | 20px | 600 | 1.19 | - |
| Headline | 17px | 600 | 1.24 | -0.374px |
| Body | 17px | 400 | 1.47 | -0.374px |
| Callout | 16px | 400 | 1.19 | - |
| Subhead | 15px | 400 | 1.21 | - |
| Footnote | 13px | 400 | 1.34 | - |
| Caption 1 | 12px | 400 | 1.33 | - |
| Caption 2 | 11px | 400 | 1.29 | - |

### Principles
- **负字间距**: 17px 以上标题使用 `-0.374px` 收紧字间距
- **Body 17px**: Apple 标准正文为 17px，非常规的 16px
- **Weight 600 非 700**: Apple 标题使用 600 而非 700

## 4. Layout & Structure

### Spacing System (8pt Grid)

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | 紧凑间距 |
| sm | 8px | 小间距 |
| md | 16px | 标准间距 |
| lg | 24px | 大间距 |
| xl | 32px | 区块间距 |
| xxl | 48px | 区域间距 |

### App Structure

```
┌─────────────────────────────┐
│ ▔▔▔▔▔▔▔ Safe Area ▔▔▔▔▔▔▔▔ │
├─────────────────────────────┤
│        Header (Large Title) │
│              34px Bold      │
├─────────────────────────────┤
│                             │
│       Content Area           │
│    (Scrollable/Stack)       │
│                             │
│                             │
├─────────────────────────────┤
│ ▔▔▔▔▔▔ Home Indicator ▔▔▔ │
│  [计划]    [打卡]    [历史] │
└─────────────────────────────┘
```

### Tab Bar (Apple Style)
- 高度: 49px + safe area bottom
- 图标: SF Symbols 风格 (Ionicons)
- Active: Primary color
- Inactive: `#8E8E93`
- Border: none (使用留白分隔)

## 5. Component Styling

### Buttons

**Primary Button — Apple Pill CTA**
- Background: Primary (theme color)
- Text: `#FFFFFF`, SF Pro Text 17px, weight 600
- Border: none
- Radius: 980px (full pill)
- Padding: 11px 22px
- Active state: `transform: scale(0.95)`
- Shadow: none

**Secondary Button — Ghost**
- Background: transparent
- Text: Primary (theme color), 17px, weight 600
- Border: 1.5px solid Primary
- Radius: 980px
- Padding: 11px 22px

**Utility Button — Dark**
- Background: `#1C1C1E`
- Text: `#FFFFFF`, 14px, weight 400
- Border: none
- Radius: 8px
- Padding: 8px 15px

### Cards & Containers

**Glass Card — Primary Card**
- Background: Glass (theme color 15% opacity)
- Border: 1px solid (theme color 30% opacity)
- Radius: 16px
- Padding: 20px
- Shadow: none (elevation via blur only)

**Utility Card — Secondary**
- Background: `#1C1C1E`
- Border: 1px solid rgba(255,255,255,0.08)
- Radius: 12px
- Padding: 16px

### Input Fields

**Text Input**
- Background: `#1C1C1E`
- Text: `#FFFFFF`, SF Pro Text 17px
- Border: 1px solid rgba(255,255,255,0.1)
- Radius: 12px
- Padding: 14px

**Segmented Control**
- Background: `#1C1C1E`
- Radius: 10px
- Segment: transparent → Selected: Primary (theme color)
- Border: none

## 6. Screen Designs

### Tab 1: 计划 (Plan)
- **Header**: Large Title "训练计划", 34px Bold
- **Theme Toggle**: 右上角调色板图标
- **Content**:
  - 毛玻璃卡片列表
  - 计划卡片: 名称(17px Semibold) + 目标Badge + 信息行
  - 右箭头 Chevron
- **Footer**:
  - Primary Button "创建计划"
  - 980px radius, full width

### Tab 2: 打卡 (Check-in)
- **Header**: Large Title "打卡", 34px Bold
- **Status Card**:
  - 打卡状态徽章
  - 计划名称 + 描述
- **Action Buttons**:
  - Primary: "快速打卡" (full width)
  - Secondary: "按计划打卡" (ghost style)
- **Feeling Selector**:
  - 4列网格
  - 🟢 轻松 / 🟡 适中 / 🔴 吃力 / ⚫ 痛苦
  - 圆形图标按钮
- **Records List**:
  - 今日打卡记录卡片

### Tab 3: 历史 (History)
- **Header**: Large Title "历史", 34px Bold
- **Month Selector**:
  - 左右箭头切换
  - 月份文字居中
- **Stats Row** (3列):
  - 训练天数 (Primary)
  - 总距离 (Secondary)
  - 总时长 (Accent)
- **History List**:
  - 日期大字体 (24px Bold)
  - 活动类型图标 + 标签
  - 距离/时长
  - 心情标签

## 7. Spacing & Depth

### Border Radius Scale

| Size | Use |
|------|-----|
| 8px | 紧凑按钮、输入框 |
| 12px | 卡片、标准按钮 |
| 16px | Glass Card |
| 980px | Primary Pill CTA |

### Depth Levels

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 | No shadow | 标准卡片、按钮 |
| 1 | Backdrop blur | Glass Card |
| 2 | Subtle border | 卡片边框 |

**Shadow Philosophy**: 不使用阴影，elevation 通过 blur 和 surface color 变化实现

## 8. Do's and Don'ts

### Do
- 使用 Primary (theme color) 作为所有交互元素的强调色
- 标题使用负字间距 (-0.374px) 达到 Apple 紧凑感
- Body 使用 17px 而非 16px
- 按钮使用 scale(0.95) 作为按压状态
- 使用 Glass Card 的毛玻璃效果
- 触摸目标最小 44×44px

### Don't
- 不要添加阴影到卡片或按钮
- 不要使用装饰性渐变
- 不要混合多种 border-radius 语法
- 不要在 body 使用 weight 500
- 不要在 17px 以下使用负字间距

## 9. Technical Approach

### Framework
- Expo SDK 55+ (iOS only)
- expo-router (文件路由)
- React 19

### State Management
- React Context (Theme)
- useState/useCallback (Local state)

### Storage
- @react-native-async-storage/async-storage (主题持久化)

### UI
- react-native-safe-area-context
- expo-blur (毛玻璃效果)
- @expo/vector-icons (Ionicons)
- expo-haptics (触觉反馈)

### API
- 复用 server.ts API 端点
- fetch 封装

## 10. File Structure

```
src/
├── app/
│   ├── _layout.tsx              # Root layout with ThemeProvider
│   ├── index.tsx                # Redirect to plan
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator
│       ├── plan.tsx             # Plan tab screen
│       ├── track.tsx            # Check-in tab screen
│       └── calendar.tsx         # History tab screen
├── components/
│   ├── ThemeProvider.tsx        # Theme context
│   ├── ThemeToggle.tsx          # Theme switcher
│   ├── GlassCard.tsx            # Glass card component
│   ├── PlanCard.tsx             # Plan list item
│   ├── CheckinCard.tsx          # Check-in card
│   └── HistoryList.tsx          # History list
├── constants/
│   └── themes.ts                # Theme definitions (3 themes)
└── lib/
    └── api.ts                   # API utilities
```

## 11. iOS-Specific Optimizations

1. **Safe Area**: react-native-safe-area-context 处理刘海屏
2. **Large Title**: iOS 11+ 大标题导航风格
3. **Haptics**: expo-haptics 按钮反馈
4. **Blur**: expo-blur 毛玻璃效果
5. **ActionSheet**: iOS 原生 ActionSheet 主题选择
6. **Touch Target**: 最小 44×44px
