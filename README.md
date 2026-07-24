# Aegis Sentinel

面向前端工程化的本地智能巡检工具，打造前端项目的「工程质量哨兵」。

## 🌟 项目简介

Aegis Sentinel 是一套基于 **微内核 + 插件化架构** 的本地前端工程检测工具，面向前端开发者，当前已实现依赖风险检测，可通过插件机制扩展至配置规范、代码级分析等多维度项目体检能力。

**核心特性：**

- 🔒 **本地运行**：所有检测逻辑在本地执行，保障代码隐私安全
- 🧩 **插件化架构**：通过插件机制无限扩展检测能力
- 🤖 **AI 优化建议**：结合 AI 大模型输出结构化优化建议
- 📊 **多维度检测**：依赖风险、配置规范、代码质量等全方位扫描
- 📝 **报告导出**：支持 Markdown 格式检测报告导出

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
│   │   ├── scanner.ts    # 扫描器
│   │   └── context.ts    # 扫描上下文
│   ├── plugins/          # 插件目录
│   │   ├── dep-count.ts  # 依赖风险检测插件
│   │   └── index.ts      # 插件注册
│   ├── ipc/              # IPC 通信
│   │   └── scan-handlers.ts
│   ├── types/            # 类型定义
│   └── index.ts          # 入口文件
├── preload/              # 预加载脚本
└── renderer/             # 渲染进程（React）
    └── src/
        ├── App.tsx       # 主应用组件
        └── main.tsx      # 入口文件
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

### 依赖风险检测插件

- ✅ 废弃包检测
- ✅ 高危漏洞检测（CVE 数据库）
- ✅ 过期依赖检测
- ✅ 重复依赖检测

## 🗺️ 路线图

- [ ] **CLI 命令行工具**：支持 CI/CD 流水线集成
- [ ] **AST 代码级分析**：深度代码质量检测
- [ ] **配置规范检测**：ESLint、Prettier、Git 配置等
- [ ] **性能检测**：构建性能、包体积分析
- [ ] **安全扫描**：敏感信息泄露检测

## 📄 License

MIT
