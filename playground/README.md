# 🎯 Gvray Request Playground

这是 `@gvray/request` 的完整示例应用，展示了所有拦截器功能和用法。

## 🚀 快速开始

```bash
# 从根目录启动
pnpm play

# 或直接在 playground 目录
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看所有演示页面。

## 📋 功能演示

### 🔐 认证拦截器

- **Bearer Token 认证** (`/auth`) - 自动注入 Authorization 头
- **自动 Token 刷新** (`/auth-refresh`) - 401 错误自动刷新 token

### 🔄 重试拦截器

- **智能重试** (`/retry`) - 网络错误和 5xx 自动重试
- **指数退避** - 避免服务器过载

### ⏱️ 超时拦截器

- **请求超时** (`/timeout`) - 防止请求无限等待

### 💾 缓存拦截器

- **响应缓存** (`/cache`) - TTL 缓存提升性能

### 📝 日志拦截器

- **请求日志** (`/logging`) - 完整的请求/响应日志

### 🔧 基础功能

- **基础请求** (`/basic`) - 简单的 GET/POST 演示
- **Fetch 引擎** (`/fetch`) - 展示引擎切换

## 🛠 技术栈

- **Next.js 16** - React 全栈框架
- **React 19** - 最新 React 版本
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS
- **@gvray/request** - 本项目的 HTTP 客户端

## 📁 项目结构

```
playground/
├── app/                 # Next.js App Router 页面
│   ├── api/            # 模拟 API 路由
│   ├── auth/           # 认证演示
│   ├── auth-refresh/   # Token 刷新演示
│   ├── retry/          # 重试演示
│   ├── timeout/        # 超时演示
│   ├── cache/          # 缓存演示
│   ├── logging/        # 日志演示
│   └── basic/          # 基础演示
├── lib/
│   └── clients.ts      # 各种请求实例配置
└── components/
    └── ui.tsx         # 共享 UI 组件
```

## 💡 使用说明

1. **全局模式** - 使用 `createClient` + `request`
2. **独立模式** - 使用 `createRequest` 创建独立实例
3. **拦截器组合** - 查看各种拦截器的组合使用
4. **错误处理** - 演示统一的错误处理机制

## 🔗 相关链接

- [@gvray/request 文档](../../README.md)
- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
