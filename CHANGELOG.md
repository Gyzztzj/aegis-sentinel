# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-28

### 性能优化（核心改进）

#### 后台工作线程

- 新增 `scanner-worker.ts`，将扫描任务放到独立线程执行
- 使用 Node.js `worker_threads` API，避免阻塞主线程
- 大型项目扫描时界面保持流畅响应

#### 并行扫描架构

- 重构 `scanner.ts`，使用 `Promise.all` 并行执行所有插件
- 扫描速度大幅提升：总时间 ≈ 最慢插件时间（而非所有插件之和）
- 充分利用多核 CPU 性能

#### 构建配置优化

- 配置 worker_threads 为外部依赖
- 将 scanner-worker 作为独立入口点构建

### 新增

#### 功能特性

- **历史记录页面**：完整展示所有检测历史记录，支持单条删除和清空全部操作，统计概览卡片展示累计数据
- **信息分类标签化展示**：检测结果分为5个标签页（全部/高危问题/警告提示/信息提示/AI优化建议），每个标签页带有数量徽章
- **Tabs组件**：通用标签页组件，支持图标、徽章、平滑切换动画

#### UI组件库

- `Button`：按钮组件，支持3种变体（primary/secondary/accent）和3种尺寸（sm/md/lg）
- `Card`：卡片容器组件，支持标题和头部右侧内容
- `Badge`：标签徽章组件，支持4种语义变体（error/warning/info/success）
- `Input`：输入框组件，支持label、type、placeholder等属性
- `ToggleSwitch`：开关切换组件
- `Loading`：加载状态组件
- `EmptyState`：空状态提示组件
- `ResultItem`：扫描结果项组件，根据级别展示不同样式
- `HistoryItem`：历史记录项组件
- `Sidebar`：侧边栏导航组件，支持悬停展开动画

#### 目录结构

- `src/renderer/src/components/`：UI组件目录
- `src/renderer/src/types/`：类型定义目录
- `src/renderer/src/utils/`：工具函数目录（config-store、db）
- `src/main/workers/`：后台工作线程

### 改进

#### 设计系统

- 建立完整的CSS变量体系：色彩体系（主色调、辅助色、中性色、语义色）
- 排版规范：8级字号系统、4级字重、3级行高
- 间距系统：12级间距变量（4px - 80px）
- 圆角系统：6级圆角变量（4px - 9999px）
- 阴影系统：5级阴影变量
- 过渡动画：3级过渡时长

#### 界面布局

- 现代化侧边栏布局：64px窄模式，悬停展开至180px
- 卡片式内容布局，信息层次分明
- 响应式设计：适配桌面端（≥768px）、平板端（≤768px）、移动端（≤480px）

#### 交互体验

- 平滑过渡动画：hover效果、展开动画、加载状态
- 完善的加载状态和空状态提示
- 按钮尺寸优化，提升可点击性
- AI分析完成后自动切换到AI标签页
- 历史记录点击快速加载到检测页面

### 重构

#### 代码结构

- 将ScanPage从App.tsx中提取为独立组件
- 移除所有内联样式，统一使用CSS类
- 组件化拆分，单一职责原则
- 代码结构清晰，便于维护和扩展

#### 样式优化

- 重写base.css，建立设计系统基础变量
- 重写main.css，统一组件样式和布局
- 优化滚动条样式
- 添加动画类（fadeIn、slideIn、pulse、spin）

### 技术栈更新

- Electron 39 + React 19 + TypeScript
- electron-vite 5
- ESLint 9 + Prettier 3

### 测试结果

- ✅ TypeScript类型检查通过
- ✅ 生产构建成功
- ✅ 业务功能完整性保持
