# HSGraph 验收后端

新入口为 `/dashboard/acceptance`，默认首页已切换到该入口。旧 FPGA 页面及 `/midterm` 接口保留用于兼容，不属于 HSGraph 验收数据。

## 启动

使用 Python 3.10 或以上版本，在仓库根目录执行：

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

另一个终端执行 `npm install`、`npm run dev`，访问 http://localhost:3000/dashboard/acceptance 。前端默认连接当前主机的 8000 端口；可通过 `.env.local` 的 `NEXT_PUBLIC_API_BASE_URL` 指定后端，修改后重启前端。

## 数据与运行方式

`backend/data/hsgraph/catalog.json` 为前后端共用数据源。`build_catalog.py` 根据报告 RJ102512787 的测试内容表生成此文件。报告共 8 个用例编号，容量用例按 BFS、SSSP 分为两次展示，共 9 个任务。

当前是报告复现模式。系统未包含 HSGraph、Gunrock、Tigr、Groute 可执行程序及图数据文件。日志中的 RECORD 是报告原始记录，不是本机实时图计算；演示延迟与报告执行时间无关。接入实际执行需要提供运行环境、可执行程序、图数据路径和各系统运行命令，再替换 `acceptance.replay` 数据生产逻辑。

只保留报告明确提供的组合。Twitter-2010 BFS 对比 3 个系统，Friendster BFS 对比 2 个系统，SSSP 仅对比 Groute。单次耗时、加速比均保留报告舍入值。容量使用正文、结论及表格一致的 21.48 亿条边；表下注释的“21.48条边”视为漏字。任务书“提升不低于 1 倍”按加速比至少 2 倍展示。

任务书还要求至少两种编程模型，现有报告只验证两种算法，不能据此认定编程模型指标完成。该项明确显示待补充。经济效益、专利论文等指标不属于本测试报告的软件测试范围。

## API

- `GET /health`：健康检查。
- `GET /api/acceptance/catalog`：项目、系统、算法、数据集、任务书要求和报告用例。
- `GET /api/acceptance/execute?category=all&algorithm=all&dataset=all&system=all&delay=0.18`：SSE 日志。

事件依次为 `start`、`log`、`result`、`progress`、`done`，data 为 JSON。筛选值见 catalog，all 表示全部。system 指定陪测系统时同时保留 HSGraph。未知筛选值或无报告证据的组合返回 HTTP 422。delay 为每条日志演示间隔，范围 0–2 秒。浏览器停止或页面卸载时关闭流，后端检测断开并结束复现。

## 验证

```powershell
python -m pip install httpx
python -m unittest discover -s backend/tests
npm run build
```
