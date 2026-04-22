# Ruff Mini — UI/Theme 设计规范

## 1. 设计原则

### 1.1 核心原则

1. **极简**：只保留必要元素，减少认知负担
2. **一致**：所有交互遵循统一的设计语言
3. **高效**：一步能完成的任务不设计两步
4. **可及**：考虑色盲、弱视用户的可访问性

### 1.2 设计参考

- 参考 iOS Human Interface Guidelines
- 参考 Material Design 3 的部分模式
- 保持与 Ruff 主应用一致的品牌语言

---

## 2. 色彩系统

### 2.1 主色调

```css
/* 全局 CSS 变量 */
:root {
  /* Primary - 能量橙 */
  --primary: #FF6B00;
  --primary-foreground: #FFFFFF;
  --primary-container: #FF7A2F;
  --primary-light: #FF8C33;

  /* Secondary */
  --secondary: #49454F;
  --secondary-foreground: #FFFFFF;

  /* Accent */
  --accent: #FF6B00;
  --accent-foreground: #FFFFFF;

  /* 背景色 */
  --background: #FFFBFF;
  --background-dark: #121212;

  /* 表面色 */
  --surface: #FFFFFF;
  --surface-dark: #1E1E1E;
  --surface-container: #F5F5F5;
  --surface-container-dark: #2C2C2C;

  /* 文字色 */
  --foreground: #1C1B1F;
  --foreground-dark: #FFFFFF;
  --text-secondary: #49454F;
  --text-secondary-dark: #CCCCCC;
  --text-tertiary: #79747E;
  --text-tertiary-dark: #A0A0A0;

  /* 语义色 */
  --success: #34C759;
  --warning: #FF9500;
  --error: #FF3B30;
  --info: #007AFF;

  /* 边框 */
  --border: #E5E5EA;
  --border-dark: #333333;
  --divider: #C6C6C8;
  --divider-dark: #404040;

  /* 训练类型颜色 */
  --pace-e: #22C55E;      /* Easy - 绿色 */
  --pace-m: #3B82F6;      /* Marathon - 蓝色 */
  --pace-t: #F97316;      /* Threshold - 橙色 */
  --pace-i: #EF4444;      /* Interval - 红色 */
  --pace-r: #6B7280;      /* Recovery - 灰色 */
  --strength: #8B5CF6;    /* Strength - 紫色 */
  --rest: #9CA3AF;        /* Rest - 浅灰 */
}
```

### 2.2 配速区间颜色

| 配速 | 颜色 | 用途 |
|------|------|------|
| E (Easy) | #22C55E | 有氧跑/轻松跑 |
| M (Marathon) | #3B82F6 | 马拉松配速 |
| T (Threshold) | #F97316 | 阈值跑 |
| I (Interval) | #EF4444 | 间歇跑 |
| R (Recovery) | #6B7280 | 恢复跑 |
| 力量训练 | #8B5CF6 | 力量/核心 |
| 休息 | #9CA3AF | 休息日 |

### 2.3 暗色模式适配

```typescript
// useTheme hook 返回值
interface ThemeColors {
  // 背景
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // 文字
  text: string;
  textSecondary: string;
  textTertiary: string;

  // 品牌色
  primary: string;
  primaryLight: string;

  // 语义色
  success: string;
  warning: string;
  error: string;

  // 边框
  border: string;
  divider: string;

  // 训练色
  paceColors: {
    E: string;
    M: string;
    T: string;
    I: string;
    R: string;
    strength: string;
    rest: string;
  };
}
```

---

## 3. 字体系统

### 3.1 字体家族

```typescript
// 字体配置
const fonts = {
  headline: {
    fontFamily: 'Lexend',
    fontWeight: '600' as const,
    fontSize: 24,
    lineHeight: 32,
  },
  title: {
    fontFamily: 'Lexend',
    fontWeight: '600' as const,
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'Manrope',
    fontWeight: '400' as const,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: 'Manrope',
    fontWeight: '500' as const,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Manrope',
    fontWeight: '400' as const,
    fontSize: 12,
    lineHeight: 16,
  },
};
```

### 3.2 字体使用规范

| 场景 | 字体 | 大小 | 字重 | 颜色 |
|------|------|------|------|------|
| 页面标题 | Lexend | 24px | 600 | text |
| 卡片标题 | Lexend | 18px | 600 | text |
| 正文内容 | Manrope | 16px | 400 | text |
| 按钮文字 | Manrope | 16px | 600 | foreground |
| 标签文字 | Manrope | 14px | 500 | textSecondary |
| 辅助说明 | Manrope | 12px | 400 | textTertiary |

---

## 4. 间距系统

### 4.1 基础间距

基于 4px 网格系统：

| Token | 数值 | 用途 |
|-------|------|------|
| `space-1` | 4px | 紧凑元素间距 |
| `space-2` | 8px | 图标与文字间距 |
| `space-3` | 12px | 列表项间距 |
| `space-4` | 16px | 卡片内边距 |
| `space-5` | 20px | 区块间距 |
| `space-6` | 24px | 主要区块间距 |
| `space-8` | 32px | 页面边距 |
| `space-10` | 40px | 大区块间距 |

### 4.2 组件间距规范

```typescript
// 卡片内边距
const cardPadding = 16; // space-4

// 列表项边距
const listItemPadding = 12; // space-3

// 页面水平边距
const screenPadding = 16; // space-4

// 元素间距
const elementGap = 8; // space-2

// 分组间距
const sectionGap = 24; // space-6
```

---

## 5. 圆角系统

### 5.1 圆角规范

| 元素 | 圆角值 | Tailwind 类 |
|------|--------|-------------|
| 按钮 | 16px | `rounded-2xl` |
| 卡片 | 28px | `rounded-[28px]` |
| 输入框 | 12px | `rounded-xl` |
| 小标签 | 8px | `rounded-lg` |
| 头像 | 50% | `rounded-full` |
| 底部弹窗 | 顶部 28px | `rounded-t-[28px]` |

### 5.2 组件圆角示例

```typescript
// 按钮
<Pressable style={styles.button}>
// button: { borderRadius: 16 }

// 卡片
<View style={styles.card}>
// card: { borderRadius: 28 }

// 输入框
<TextInput style={styles.input}>
// input: { borderRadius: 12 }

// 标签/徽章
<View style={styles.badge}>
// badge: { borderRadius: 8 }
```

---

## 6. 阴影系统

### 6.1 iOS 阴影 (Light Mode)

```typescript
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
```

### 6.2 阴影使用场景

| 场景 | 阴影级别 | 说明 |
|------|----------|------|
| 卡片 (默认) | `sm` | 轻微提升感 |
| 卡片 (悬停/按下) | `md` | 强调交互 |
| 底部弹窗 | `lg` | 强烈提升感 |
| 浮动按钮 | `md` | 吸引注意 |
| Toast 通知 | `sm` | 轻微提示 |

---

## 7. 图标系统

### 7.1 图标库

主要使用 `lucide-react-native`，备选 `@expo/vector-icons` (Ionicons)。

### 7.2 常用图标

| 场景 | 图标名 | 库 |
|------|--------|-----|
| 导航-计划 | `Calendar` | lucide |
| 导航-打卡 | `CheckCircle` | lucide |
| 导航-历史 | `History` | lucide |
| 返回 | `ChevronLeft` | lucide |
| 关闭 | `X` | lucide |
| 添加 | `Plus` | lucide |
| 编辑 | `Pencil` | lucide |
| 删除 | `Trash2` | lucide |
| 确认 | `Check` | lucide |
| 警告 | `AlertTriangle` | lucide |
| 加载 | `Loader2` | lucide |
| 跑步 | `Footprints` | lucide |
| 睡眠 | `Moon` | lucide |
| 体重 | `Scale` | lucide |
| 设置 | `Settings` | lucide |
| 分享 | `Share2` | lucide |
| 导出 | `Download` | lucide |

### 7.3 图标尺寸

| 场景 | 尺寸 |
|------|------|
| Tab Bar | 24px |
| 按钮内图标 | 18px |
| 卡片标题旁 | 20px |
| 列表项前缀 | 18px |
| 空状态图标 | 48px |
| 加载动画 | 24px |

---

## 8. 组件规范

### 8.1 按钮

```typescript
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress: () => void;
}

// 按钮高度规范
const buttonHeights = {
  sm: 36,  // 小按钮
  md: 44,  // 默认按钮
  lg: 52,  // 大按钮
};

// 按钮变体样式
const buttonVariants = {
  primary: {
    background: 'var(--primary)',
    foreground: '#FFFFFF',
  },
  secondary: {
    background: 'var(--surface-container)',
    foreground: 'var(--text)',
  },
  ghost: {
    background: 'transparent',
    foreground: 'var(--text)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'var(--error)',
    foreground: '#FFFFFF',
  },
};
```

### 8.2 卡片

```typescript
interface CardProps {
  children: ReactNode;
  padding?: number;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
}

// 卡片样式
const cardStyles = {
  default: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: 'var(--surface)',
    borderWidth: 1,
    borderColor: 'var(--border)',
  },
  elevated: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: 'var(--surface)',
    // 使用阴影而非边框
  },
  outlined: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'var(--border)',
  },
};
```

### 8.3 输入框

```typescript
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  secureTextEntry?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

// 输入框样式
const inputStyles = {
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'var(--border)',
    backgroundColor: 'var(--surface)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  focused: {
    borderColor: 'var(--primary)',
  },
  error: {
    borderColor: 'var(--error)',
  },
};
```

### 8.4 底部弹窗 (BottomSheet)

使用 HeroUI Native 的 BottomSheet 组件。

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: number[]; // 百分比数组 e.g. [0.5, 0.8]
  children: ReactNode;
}

// 常用 snapPoints 配置
const snapPointPresets = {
  half: [0.5],      // 半屏
  full: [0.9],      // 全屏（留安全边距）
  auto: undefined,  // 自动高度
};
```

---

## 9. 页面布局规范

### 9.1 页面结构

```
┌─────────────────────────────────────┐
│           Safe Area Top             │
├─────────────────────────────────────┤
│           页面标题                  │
│  (可选：返回按钮、右侧操作)          │
├─────────────────────────────────────┤
│                                     │
│           主内容区域                 │
│         (可滚动)                    │
│                                     │
│                                     │
├─────────────────────────────────────┤
│           Tab Bar (底部)            │
├─────────────────────────────────────┤
│           Safe Area Bottom          │
└─────────────────────────────────────┘
```

### 9.2 Tab Bar 设计

```typescript
interface TabBarItem {
  key: 'plan' | 'checkin' | 'history';
  label: string;
  labelZh: string;
  icon: string;
  iconFilled?: string;
}

const tabBarItems: TabBarItem[] = [
  {
    key: 'plan',
    label: 'Plan',
    labelZh: '计划',
    icon: 'calendar-outline',
    iconFilled: 'calendar',
  },
  {
    key: 'checkin',
    label: 'Check In',
    labelZh: '打卡',
    icon: 'checkmark-circle-outline',
    iconFilled: 'checkmark-circle',
  },
  {
    key: 'history',
    label: 'History',
    labelZh: '历史',
    icon: 'time-outline',
    iconFilled: 'time',
  },
];
```

---

## 10. 动画规范

### 10.1 过渡动画

| 动画类型 | 时长 | 缓动函数 |
|----------|------|----------|
| 快速反馈 | 100-150ms | ease-out |
| 页面过渡 | 300ms | ease-in-out |
| 弹窗出现 | 250ms | ease-out |
| 弹窗消失 | 200ms | ease-in |
| 列表项 | 150ms | ease-out |

### 10.2 交互动画

```typescript
// 按钮按下效果
const buttonPressedStyle = {
  transform: [{ scale: 0.97 }],
  opacity: 0.9,
};

// 卡片按下效果
const cardPressedStyle = {
  transform: [{ scale: 0.99 }],
};

// Tab 切换指示器
const tabIndicatorStyle = {
  width: '33.33%',
  height: 3,
  borderRadius: 1.5,
  backgroundColor: 'var(--primary)',
  position: 'absolute',
  bottom: 0,
};
```

### 10.3 骨架屏

```typescript
// 加载骨架屏
<View style={styles.skeleton}>
  <Skeleton variant="rectangular" width="100%" height={200} borderRadius={28} />
  <View style={{ height: 12 }} />
  <Skeleton variant="rectangular" width="80%" height={24} borderRadius={8} />
  <View style={{ height: 8 }} />
  <Skeleton variant="rectangular" width="60%" height={16} borderRadius={8} />
</View>
```

---

## 11. 空状态规范

### 11.1 空状态组件

```typescript
interface EmptyStateProps {
  icon: string; // emoji 或图标名
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// 计划页空状态
const emptyPlanState: EmptyStateProps = {
  icon: '📅',
  title: '暂无训练计划',
  description: '创建第一个训练计划开始你的跑步之旅',
  action: {
    label: '创建计划',
    onPress: () => {},
  },
};

// 打卡页空状态
const emptyCheckInState: EmptyStateProps = {
  icon: '✅',
  title: '今日待打卡',
  description: '记录睡眠和体重，追踪健康数据',
};

// 历史页空状态
const emptyHistoryState: EmptyStateProps = {
  icon: '📊',
  title: '暂无历史记录',
  description: '开始训练后将自动记录你的数据',
};
```

---

## 12. 响应式设计

### 12.1 断点

| 断点 | 宽度 | 设备 |
|------|------|------|
| sm | < 390px | 小屏手机 |
| md | 390-430px | 标准手机 |
| lg | > 430px | 大屏手机/平板 |

### 12.2 适配策略

- 主要采用弹性布局 (flex)
- 使用 min/max 限制元素宽度
- 字号在极端情况下适当缩小
- 日历单元格使用百分比宽度

---

*文档版本：v1.0*
*最后更新：2026-04-22*
