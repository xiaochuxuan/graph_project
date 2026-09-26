# HSGraph 项目验收工作台

默认入口：`/dashboard/acceptance`。按 2023BAB078 任务书及 HSGraph 1.5 测试报告展示功能、性能、容量和资源利用率，支持 SSE 日志、任务筛选、停止、结果柱状图、日志及结果导出。

当前为报告数据复现模式，未接入实际图计算程序。新后端接口、数据说明和启动方法见 [backend/ACCEPTANCE.md](backend/ACCEPTANCE.md)。旧 FPGA 演示代码保留用于兼容，以下为其原有说明。

## 原有 Middle Check Demo

中期验收展示网页，包含 Next.js 前端和本地 Python 模拟后端。

## 环境

- Node.js 16.15.1
- npm 8+
- Python 3.10+

## 安装

```powershell
npm install
npm run backend:install
```

## 本地运行

启动后端：

```powershell
npm run dev:backend
```

启动前端：

```powershell
npm run dev:frontend
```

访问：

```text
http://localhost:3000
```

前端默认请求 `http://<当前访问主机>:8000`。如需自定义后端地址，可设置：

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
npm run dev:frontend
```

## 说明

`backend/` 提供本地 mock 后端，复刻前端原有接口路径和流式日志行为，验收展示时不再依赖公网或内网后端服务。
