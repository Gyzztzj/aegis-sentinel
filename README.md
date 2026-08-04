# Aegis Sentinel

面向前端工程化的本地智能巡检工具，打造前端项目的「工程质量哨兵」。

## 🌟 项目简介

Aegis Sentinel 是一套基于 **微内核 + 插件化架构** 的本地前端工程检测工具，面向前端开发者，提供多维度项目体检能力。

**核心特性：**

- 🔒 **本地运行**：所有检测逻辑在本地执行，保障代码隐私安全
- 🧩 **插件化架构**：通过插件机制无限扩展检测能力
- 🤖 **AI 优化建议**：结合 AI 大模型输出结构化优化建议，支持流式输出
- 📊 **多维度检测**：依赖风险、配置规范、代码质量等全方位扫描
- 📝 **报告导出**：支持 Markdown 格式检测报告导出
- 📋 **历史记录**：完整保存检测历史，支持快速查看、对比和管理
- 🎨 **现代化界面**：固定头部 + 独立滚动布局，左右分栏设计
- 🔄 **配置持久化**：插件开关、AI 配置自动保存，重启后立即生效

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
$ npm install
```

### 开发模式

```bash
$ npm run dev
```

### 构建打包

```bash
# Windows
$ npm run build:win

# macOS
$ npm run build:mac

# Linux
$ npm run build:linux
```

## ⚙️ 环境配置

AI 优化建议功能需要配置 API Key。创建 `.env` 文件：

```env
AI_API_KEY=your-api-key-here
```

> 当前使用火山引擎 Doubao API，如需更换其他 API 请修改 `src/main/ipc/scan-handlers.ts` 中的配置。

## 🛠️ 技术栈

| 模块     | 技术                                |
| -------- | ----------------------------------- |
| 框架     | Electron 39 + React 19 + TypeScript |
| 构建工具 | electron-vite 5                     |
| 代码规范 | ESLint 9 + Prettier 3               |
| 包管理   | npm                                 |

## 📁 项目结构

```
src/
├── main/                 # 主进程
│   ├── core/             # 核心模块
│   │   ├── scanner.ts    # 扫描器（并行扫描）
│   │   └── context.ts    # 扫描上下文
│   ├── plugins/          # 插件目录
│   │   ├── dependency-audit.ts          # 依赖审计插件
│   │   ├── check-env.ts                 # 环境变量检测插件
│   │   ├── check-project-standard.ts    # 项目规范检测插件
│   │   ├── check-tsconfig.ts            # TypeScript 配置检测插件
│   │   ├── check-build-artifacts.ts     # 构建产物检测插件
│   │   ├── check-browserslist.ts        # 浏览器兼容性检测插件
│   │   ├── check-package-manager.ts     # 包管理器一致性检测插件
│   │   ├── check-node-version.ts        # Node 版本管理检测插件
│   │   ├── check-eslintrc.ts            # ESLint 配置检测插件
│   │   ├── check-vite-config.ts         # Vite 配置检测插件
│   │   └── index.ts                     # 插件注册
│   ├── ipc/              # IPC 通信
│   │   └── scan-handlers.ts             # 扫描/AI/插件配置处理
│   ├── types/            # 类型定义
│   ├── workers/          # 后台工作线程
│   │   └── scanner-worker.ts            # 扫描 Worker
│   └── index.ts          # 入口文件
├── preload/              # 预加载脚本
│   ├── index.ts          # 预加载逻辑
│   └── index.d.ts        # 类型声明
└── renderer/             # 渲染进程（React）
    ├── index.html        # HTML 入口
    └── src/
        ├── App.tsx       # 主应用组件
        ├── main.tsx      # 入口文件
        ├── components/   # 组件目录
        │   ├── Button.tsx        # 按钮组件
        │   ├── Card.tsx          # 卡片组件
        │   ├── Badge.tsx         # 徽章组件
        │   ├── Input.tsx         # 输入框组件
        │   ├── Tabs.tsx          # 标签页组件
        │   ├── Sidebar.tsx       # 侧边栏组件
        │   ├── ScanPage.tsx      # 检测页面（左右分栏）
        │   ├── HistoryPage.tsx   # 历史记录页面
        │   ├── CompareResult.tsx # 对比结果页面
        │   ├── ConfigPage.tsx    # 配置页面
        │   ├── ResultItem.tsx    # 结果项组件
        │   ├── HistoryItem.tsx   # 历史项组件
        │   ├── Loading.tsx       # 加载组件
        │   ├── EmptyState.tsx    # 空状态组件
        │   └── ToggleSwitch.tsx  # 开关组件
        ├── types/         # 类型定义
        │   └── index.ts
        ├── utils/         # 工具函数
        │   ├── config-store.ts   # 配置存储（IndexedDB）
        │   └── db.ts             # 历史记录存储
        └── assets/        # 静态资源
            ├── base.css          # 基础样式 + CSS 变量
            └── main.css          # 组件样式 + 布局
```

## 🧩 插件开发

Aegis Sentinel 采用插件化架构，开发者可以轻松扩展检测能力。

### 插件接口

所有插件必须实现 `IScanPlugin` 接口：

```typescript
interface IScanPlugin {
  name: string // 插件名称
  enabled: boolean // 是否启用
  run: (projectPath: string) => IScanResult[] | Promise<IScanResult[]>
}
```

### 扫描结果

```typescript
interface IScanResult {
  plugin: string
  level: 'error' | 'info' | 'warning'
  message: string
}
```

### 创建插件示例

在 `src/main/plugins/` 目录下创建新插件文件：

```typescript
import { IScanPlugin } from '../types'

export const myPlugin: IScanPlugin = {
  name: '我的检测插件',
  enabled: true,

  async run(projectPath: string) {
    // 实现检测逻辑
    return [
      {
        plugin: this.name,
        level: 'warning',
        message: '检测到潜在问题'
      }
    ]
  }
}
```

然后在 `src/main/plugins/index.ts` 中注册插件。

## ✅ 当前检测能力

### 依赖审计插件

- ✅ 废弃包检测
- ✅ 高危漏洞检测（OSV API）
- ✅ 过期依赖检测
- ✅ 重复依赖检测

### 环境变量检测插件

- ✅ 明文密钥检测
- ✅ 必填变量检查

### 项目规范检测插件

- ✅ README.md 检查
- ✅ LICENSE 文件检查
- ✅ .editorconfig 检查
- ✅ .gitignore 检查

### TypeScript 配置检测插件

- ✅ strict 模式检查
- ✅ 编译目标版本检查
- ✅ 路径别名配置检查
- ✅ sourceMap 配置检查

### 构建产物检测插件

- ✅ .gitignore 构建产物配置检查
- ✅ dist 目录大小分析

### 浏览器兼容性检测插件

- ✅ browserslist 配置检查
- ✅ .browserslistrc 文件检查

### 包管理器一致性检测插件

- ✅ 锁文件唯一性检测

### Node 版本管理检测插件

- ✅ .nvmrc 文件检查
- ✅ engines.node 配置检查

### ESLint 配置检测插件

- ✅ ESLint 配置文件存在性检查
- ✅ ESLint 配置规范性验证

### Vite 配置检测插件

- ✅ Vite 配置文件存在性检查
- ✅ Vite 构建配置合理性验证

## 🗺️ 路线图

- [ ] **CLI 命令行工具**：支持 CI/CD 流水线集成
- [ ] **AST 代码级分析**：深度代码质量检测
- [ ] **性能检测**：构建性能、包体积分析
- [ ] **安全扫描**：敏感信息泄露检测

## 📄 License

MIT
