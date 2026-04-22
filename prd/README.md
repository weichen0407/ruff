# Ruff Mini 文档索引

## 项目概述

Ruff Mini 是一款极简健身追踪应用，采用本地优先存储策略，专为跑步爱好者设计。

## 文档列表

### 1. [产品需求文档 (PRD)](./ruff-mini-prd.md)

产品的功能需求、用户故事和技术决策。

**主要内容：**
- 产品定位与核心价值
- 三大核心维度（训练/睡眠/体重）
- 三个主 Tab（计划/打卡/历史）
- MVP 范围定义
- 用户故事

---

### 2. [技术架构文档](./ruff-mini-architecture.md)

系统架构、技术栈选型、API 设计和同步策略。

**主要内容：**
- 整体系统架构
- 本地/云端数据库 Schema
- 同步服务设计
- Zustand 状态管理
- TanStack Query 集成
- API 端点设计

---

### 3. [UI/Theme 设计规范](./ruff-mini-ui-theme.md)

视觉设计系统、组件规范和交互模式。

**主要内容：**
- 色彩系统（主色、语义色、配速色）
- 字体系统（Lexend + Manrope）
- 间距与圆角规范
- 阴影系统
- 图标库与尺寸规范
- 组件样式定义
- 动画与空状态规范

---

### 4. [数据模型文档](./ruff-mini-data-model.md)

数据库实体定义、关系图和索引设计。

**主要内容：**
- 实体关系图 (ERD)
- 本地 SQLite Schema
- 云端 PostgreSQL Schema
- 索引设计
- 数据迁移策略
- 验证规则
- CSV 导出格式

---

## 快速导航

### 新项目启动检查清单

- [ ] 阅读 [PRD](./ruff-mini-prd.md) 理解产品需求
- [ ] 参考 [架构文档](./ruff-mini-architecture.md) 设计系统
- [ ] 遵循 [UI 规范](./ruff-mini-ui-theme.md) 实现界面
- [ ] 按 [数据模型](./ruff-mini-data-model.md) 设计数据库

### 开发者指南

1. **环境搭建**
   - React Native 0.83 + Expo SDK 55
   - expo-sqlite + Drizzle ORM
   - Zustand + TanStack Query

2. **核心模块开发顺序**
   - 本地数据库层
   - 状态管理层
   - API 同步服务
   - UI 组件
   - 页面实现

3. **代码规范**
   - 使用 TypeScript
   - 遵循 UI/Theme 规范
   - 组件原子化设计

---

## 文档版本

| 文档 | 版本 | 更新日期 |
|------|------|----------|
| PRD | v1.0 | 2026-04-22 |
| 架构 | v1.0 | 2026-04-22 |
| UI/Theme | v1.0 | 2026-04-22 |
| 数据模型 | v1.0 | 2026-04-22 |

---

*最后更新：2026-04-22*
