# HSGraph 验收后端

新入口为 `/dashboard/acceptance`，默认首页已切换到该入口。旧 FPGA 页面及 `/midterm` 接口保留用于兼容，不属于 HSGraph 验收数据。

验收入口自动跳转到功能验证。左侧菜单仅列功能、性能、容量和资源利用率四项指标，页面地址为 `/dashboard/acceptance/function|performance|capacity|resource`。页内通过下拉框选择算法、数据集与系统，支持全部选项；切换指标关闭原日志连接。旧用例地址自动跳转至对应指标页面。

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

数据预处理演示入口为 `/dashboard/preprocessing`。支持选择数据集、目标系统、源格式与目标格式，通过日志及步骤进度演示读取、记录检查、邻接整理、格式组织和输出检查。格式选项为流程配置，不表示已确认各系统兼容性；不读取或生成图文件。处理记录导出明确包含 `mode=demo` 和 `fileGenerated=false`。

- `GET /api/preprocessing/catalog`：预处理选项与步骤。
- `GET /api/preprocessing/execute?dataset=twitter&system=hsgraph&`：预处理演示 SSE，事件为 log、progress、result、done；delay 可选，范围 0–2 秒。

目标格式由后端 `SYSTEM_FORMATS` 自动绑定，前端不提供选择。演示配置为 HSGraph/CSR、Gunrock/Matrix Market、Tigr/边列表、Groute/CSR；这是可调整的演示配置，不是已核验的产品加载器契约。旧参数 target_format 仅在与绑定一致时接受，否则返回 422。结果的 preview 包含示例文件名、内容和字段说明，使用同一张 4 顶点 5 边示例图，不代表所选数据集的真实记录，也不会生成数据文件。

- `GET /health`：健康检查。
- `GET /api/acceptance/catalog`：项目、系统、算法、数据集、任务书要求和报告用例。
- `GET /api/acceptance/execute?category=all&algorithm=all&dataset=all&system=all&delay=0.18`：SSE 日志。

事件依次为 `start`、`log`、`result`、`progress`、`done`，data 为 JSON。筛选值见 catalog，all 表示全部。system 指定单个系统时仅返回该系统，并移除加速比和跨系统结论。全部系统模式的 log 事件包含 system 字段，前端按系统 Tab 展示、下载。未知筛选值或无报告证据的组合返回 HTTP 422。delay 为每条日志演示间隔，范围 0–2 秒。浏览器停止或页面卸载时关闭流，后端检测断开并结束复现。

## 验证

```powershell
python -m pip install httpx
python -m unittest discover -s backend/tests
npm run build
```

预处理页面不再提供任何格式选择。格式由系统自动设置，source_format 和 target_format 均可省略；传入不同于系统绑定的格式会返回 422。
