# OpenClaw 控制台

基于 `React + Vite + TypeScript` 和 `Fastify + TypeScript` 的 OpenClaw 控制台 v1。

## 目录

- `apps/web`: 控制台前端
- `apps/server`: BFF / Mock OpenClaw 适配层
- `packages/shared`: 共享类型与协议定义

## 本地启动

1. 安装 Node.js 20+
2. 在仓库根目录执行 `npm install`
3. 启动服务端：`npm run dev:server`
4. 启动前端：`npm run dev:web`

默认地址：

- 前端：`http://localhost:5173`
- 服务端：`http://localhost:8787`

## 当前实现

- 概览、模型配置、消息渠道、运行日志四个页面
- Mock OpenClaw 适配器，支持本地 JSON 持久化
- REST API + SSE 实时日志流
- 为真实 OpenClaw Gateway / CLI 适配预留统一接口

