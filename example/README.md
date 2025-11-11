# 示例说明

- backend: 简单的 Express 服务，提供 /api/ping、/api/users、/api/echo、/api/error 等路由。
- frontend: Vite 静态站点，调用父项目中的请求库源码（通过 vite.config.ts 的 alias 指向 ../../src）。

## 运行方式

在仓库根目录：

1. 安装依赖（后端/前端都需要）：

```sh
pnpm -C example/backend install
pnpm -C example/frontend install
```

2. 启动后端：

```sh
pnpm -C example/backend dev
```

3. 启动前端（另开一个终端）：

```sh
pnpm -C example/frontend dev
```

- 访问 http://localhost:5173 并操作页面四个按钮观察请求链路与错误处理。