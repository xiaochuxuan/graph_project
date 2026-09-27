'use client';

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { BASE_URL } from '@/lib/request/request';
import TerminalLog from '@/components/midterm/terminal-log';

import styles from './acceptance.module.css';

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Chart({ rows, series, unit, target }) {
  return (
    <div className={styles.chart} role="img" aria-label={`${series.map((s) => s.label).join('、')}柱状图，单位${unit}`}>
      <ResponsiveContainer width="100%" height={270}>
        <BarChart data={rows} margin={{ top: 20, right: 16, bottom: 8, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eaf0" />
          <XAxis dataKey="name" tick={{ fontSize: 14 }} interval={0} />
          <YAxis unit={unit} tick={{ fontSize: 14 }} width={65} />
          <Tooltip formatter={(value) => `${value} ${unit}`} />
          <Legend />
          {target ? <ReferenceLine y={target} stroke="#d18a26" strokeDasharray="5 5" label="任务目标" /> : null}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={58} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricCards({ metrics }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2, my: 2 }}>
      {metrics.map((metric) => (
        <Box key={metric.label} sx={{ p: 2, bgcolor: '#f0f4f8', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {metric.label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, my: 1 }}>
            {metric.value}
          </Typography>
          {metric.detail ? (
            <Typography variant="body2" color="text.secondary">
              {metric.detail}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

function CaseResult({ item, label }) {
  const rows = item.rows.map((row) => ({ ...row, name: label('systems', row.system) }));
  const single = rows.length === 1;
  const row = rows[0];
  const performanceColumns = [
    ['name', '系统'],
    ['repetitions', '执行次数'],
    ['totalSeconds', '总耗时 (s)'],
    ['seconds', '单次耗时 (s)'],
    ['speedup', 'HSGraph 加速比'],
  ];
  const columns =
    item.category === 'resource'
      ? [
          ['name', '系统'],
          ['cpu', 'CPU 平均利用率'],
          ['gpu', 'GPU 平均利用率'],
        ]
      : performanceColumns;
  const value = (r, key) => {
    if (key === 'speedup') return r.system === 'hsgraph' ? '基准' : `${r.speedup.toFixed(1)}×`;
    if (key === 'seconds') return r.seconds.toFixed(3);
    if (key === 'totalSeconds') return r.totalSeconds.toFixed(2);
    if (key === 'cpu' || key === 'gpu') return `${r[key]}%`;
    return r[key];
  };
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'secondary.main' }}>
        {label('datasets', item.dataset)} · {item.algorithm.toUpperCase()}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {item.id} · 报告记录{single ? ` · ${row.name}` : ''}
      </Typography>
      {item.category === 'performance' && single ? (
        <MetricCards
          metrics={[
            { label: '单次执行耗时', value: `${row.seconds.toFixed(3)} s` },
            { label: '执行次数', value: `${row.repetitions} 次` },
            { label: '总执行耗时', value: `${row.totalSeconds.toFixed(2)} s` },
          ]}
        />
      ) : null}
      {item.category === 'performance' && !single ? (
        <>
          <div className={styles.chartGrid}>
            <section>
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
                单次执行耗时 · 越低越好
              </Typography>
              <Chart rows={rows} series={[{ key: 'seconds', label: '单次耗时', color: '#3273c9' }]} unit="s" />
            </section>
            <section>
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
                HSGraph 相对陪测系统加速比 · 越高越好
              </Typography>
              <Chart
                rows={rows.filter((r) => r.system !== 'hsgraph')}
                series={[{ key: 'speedup', label: '加速比', color: '#16a394' }]}
                unit="×"
                target={2}
              />
            </section>
          </div>
        </>
      ) : null}
      {item.category === 'resource' && single ? (
        <Box sx={{ my: 2 }}>
          {['cpu', 'gpu'].map((key) => (
            <Box key={key} sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {key.toUpperCase()} 平均利用率：{row[key]}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={row[key]}
                aria-label={`${key.toUpperCase()} 平均利用率`}
                sx={{ height: 12, borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>
      ) : null}
      {item.category === 'resource' && !single ? (
        <Chart
          rows={rows}
          series={[
            { key: 'cpu', label: 'CPU 平均利用率', color: '#3273c9' },
            { key: 'gpu', label: 'GPU 平均利用率', color: '#16a394' },
          ]}
          unit="%"
        />
      ) : null}
      {!single && ['performance', 'resource'].includes(item.category) ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map(([key, title]) => (
                  <TableCell key={key} align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.system}>
                  {columns.map(([key]) => (
                    <TableCell key={key} align="center">
                      {value(r, key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {item.category === 'capacity' ? (
        <>
          <MetricCards
            metrics={[
              { label: '图顶点规模', value: `${row.vertices / 100000000} 亿`, detail: '任务要求：不少于 1 亿个顶点' },
              { label: '图边规模', value: `${row.edges / 100000000} 亿`, detail: '任务要求：不少于 10 亿条边' },
              {
                label: '容量验证',
                value: row.vertices >= 100000000 && row.edges >= 1000000000 ? '已达标' : '未达标',
                detail: row.status,
              },
            ]}
          />
        </>
      ) : null}
      {item.category === 'function' ? (
        <MetricCards
          metrics={[
            { label: '功能验证', value: '通过', detail: row.status },
            { label: '图顶点规模', value: '3400 万' },
            { label: '图边规模', value: '5.28 亿' },
          ]}
        />
      ) : null}
      {!single ? (
        <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
          {item.conclusion}
        </Typography>
      ) : null}
    </Paper>
  );
}

export default function AcceptancePage({ task }) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [selection, setSelection] = React.useState({ algorithm: 'all', dataset: 'all', system: 'all' });
  const filters = { category: task.id, ...selection };
  const [logs, setLogs] = React.useState([]);
  const [activeSystem, setActiveSystem] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [status, setStatus] = React.useState('idle');
  const [progress, setProgress] = React.useState({ completed: 0, total: 0 });
  const stream = React.useRef(null);
  const load = React.useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/api/acceptance/catalog`);
      if (!response.ok) throw new Error(`后端返回 ${response.status}`);
      setData(await response.json());
    } catch (e) {
      setError(`无法加载验收数据：${e.message}。请检查后端服务。`);
    }
  }, []);
  React.useEffect(() => {
    load();
    return () => stream.current?.close();
  }, [load]);
  const label = (group, id) => data?.[group].find((x) => x.id === id)?.label || id;
  const categoryCases = data?.cases.filter((item) => item.category === task.id) || [];
  const matches = categoryCases.filter((item) =>
    Object.entries(selection).every(
      ([key, value]) =>
        value === 'all' || (key === 'system' ? item.rows.some((row) => row.system === value) : item[key] === value)
    )
  );
  const optionsFor = (key, group) =>
    data[group].filter((option) =>
      categoryCases.some((item) =>
        key === 'system' ? item.rows.some((row) => row.system === option.id) : item[key] === option.id
      )
    );
  const changeSelection = (key, value) => {
    setSelection((prev) => ({ ...prev, [key]: value }));
    setLogs([]);
    setActiveSystem('');
    setResults([]);
    setStatus('idle');
    setProgress({ completed: 0, total: 0 });
    setError('');
  };
  const logSystems =
    data?.systems.filter(
      (system) =>
        matches.some((item) => item.rows.some((row) => row.system === system.id)) &&
        (selection.system === 'all' || selection.system === system.id)
    ) || [];
  const visibleSystem = logSystems.some((system) => system.id === activeSystem) ? activeSystem : logSystems[0]?.id;
  const visibleLogs = logs
    .filter((entry) => !entry.system || entry.system === visibleSystem)
    .map((entry) => entry.line);
  const running = status === 'running';
  const stop = () => {
    stream.current?.close();
    stream.current = null;
    setStatus('stopped');
    setLogs((prev) => [...prev, { line: '[STOP] 已停止报告复现；保留已完成结果。' }]);
  };
  const run = () => {
    if (running || !matches.length) return;
    stream.current?.close();
    setLogs([]);
    setActiveSystem('');
    setResults([]);
    setError('');
    setStatus('running');
    setProgress({ completed: 0, total: matches.length });
    const source = new EventSource(`${BASE_URL}/api/acceptance/execute?${new URLSearchParams(filters)}`);
    stream.current = source;
    source.addEventListener('log', (e) => setLogs((prev) => [...prev, JSON.parse(e.data)]));
    source.addEventListener('result', (e) => setResults((prev) => [...prev, JSON.parse(e.data)]));
    source.addEventListener('progress', (e) => setProgress(JSON.parse(e.data)));
    source.addEventListener('done', () => {
      source.close();
      stream.current = null;
      setStatus('done');
      setLogs((prev) => [...prev, { line: '[DONE] 所选报告记录复现完成。' }]);
    });
    source.onerror = () => {
      source.close();
      stream.current = null;
      setStatus('error');
      setError('日志连接中断，请检查后端后重新运行。');
      setLogs((prev) => [...prev, { line: '[ERROR] 日志连接中断。' }]);
    };
  };

  return (
    <div className={styles.page}>
      {error ? (
        <div className={styles.error} role="alert">
          {error} {!data ? <button onClick={load}>重新连接</button> : null}
        </div>
      ) : null}
      {!data ? (
        <p aria-live="polite">{error ? '等待后端连接' : '正在加载验收任务…'}</p>
      ) : (
        <>
          <section className={styles.requirements} aria-label="考核指标说明">
            <strong>考核指标：</strong>
            <p>
              指标1：相比 Gunrock、Tigr、Groute 等典型图计算系统，计算性能提升不低于 <em>1 倍</em>（加速比不低于{' '}
              <em>2 倍</em>）。
            </p>
            <p>
              指标2：处理的图数据规模不低于 <em>1 亿个顶点、10 亿条边</em>。
            </p>
            <p>
              指标3：研制 <em>1 套</em>面向图数据的智能计算系统软件，系统支持不少于 <em>2 种编程模型</em>。
            </p>
            <strong>完成情况：</strong>
            <p>
              指标1：HSGraph 1.5 在 Twitter-2010、Friendster 数据集上执行 BFS、SSSP，相对报告中对应陪测系统的加速比为{' '}
              <em>2.1–14.6 倍</em>。
            </p>
            <p>
              指标2：在 <em>1.34 亿个顶点、21.48 亿条边</em>的图数据上运行
              BFS、SSSP，运行正常，无中断异常，并输出处理结果。
            </p>
            <p>指标3：已研制 HSGraph 1.5 系统；不少于 2 种编程模型的验证材料待补充。</p>
            <strong>考核方式：</strong>
            <p>
              采用 BFS、SSSP 进行功能、执行时间和容量测试，以陪测系统单次执行时间与 HSGraph 1.5
              单次执行时间之比计算加速比；在 Friendster 数据集上运行 BFS，统计 CPU、GPU 平均利用率。
            </p>
            <p>
              对比系统采用 Gunrock 2.0.0、Tigr（commit a9b7c08）、Groute 1.0，测试结果依据 HSGraph 1.5
              测试报告（RJ102512787）。
            </p>
            <strong>数据集来源：</strong>
            <p>
              委托方提供 Twitter-2010、Friendster、3400 万顶点 / 5.28 亿条边功能测试图，以及 1.34 亿顶点 / 21.48
              亿条边大规模测试图。
            </p>
          </section>
          <section className={styles.requirements} aria-label="系统与测试环境">
            <strong>系统与测试环境：</strong>
            <p>验收系统：{data.systems.find((s) => s.id === 'hsgraph')?.label}。</p>
            <p>
              对比系统：
              {data.systems
                .filter((s) => s.id !== 'hsgraph')
                .map((s) => s.label)
                .join('、')}
              。
            </p>
            <p>测试环境：{data.environment.join('；')}。</p>
          </section>
          <div className={styles.workspace}>
            <section className={styles.panel}>
              <h2>{task.title}</h2>
              {[
                ['algorithm', 'algorithms', '选择算法'],
                ['dataset', 'datasets', '选择数据集'],
                ['system', 'systems', '选择系统'],
              ].map(([key, group, title]) => (
                <FormControl key={key} fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id={`${key}-label`}>{title}</InputLabel>
                  <Select
                    labelId={`${key}-label`}
                    label={title}
                    value={selection[key]}
                    disabled={running}
                    onChange={(event) => changeSelection(key, event.target.value)}
                  >
                    <MenuItem value="all">全部{title.replace('选择', '')}</MenuItem>
                    {optionsFor(key, group).map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
              <p className={styles.note}>
                {selection.dataset === 'all'
                  ? '运行当前指标下所选组合的报告记录。'
                  : data.datasets.find((d) => d.id === selection.dataset)?.description}
              </p>
              <p className={styles.note}>选择单个系统仅展示该系统结果；选择全部系统时展示对比结果。</p>
              <div className={styles.actions}>
                <button className={styles.primary} disabled={running || !matches.length} onClick={run}>
                  {running ? '正在复现…' : `运行所选任务 (${matches.length})`}
                </button>
                {running ? <button onClick={stop}>停止</button> : null}
              </div>
              {!matches.length ? <p className={styles.pending}>报告未记录此组合，请调整选择。</p> : null}
            </section>
            <section className={styles.logPanel}>
              <div className={styles.logHeading}>
                <span>02 / 日志过程</span>
                <span aria-live="polite">
                  {{ idle: '待运行', running: '复现中', done: '已完成', stopped: '已停止', error: '连接异常' }[status]}{' '}
                  · {progress.completed}/{progress.total}
                </span>
              </div>
              <progress max={progress.total || 1} value={progress.completed} />
              {selection.system === 'all' && logSystems.length > 1 ? (
                <Tabs
                  value={visibleSystem}
                  onChange={(_, value) => setActiveSystem(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="系统日志"
                >
                  {logSystems.map((system) => (
                    <Tab key={system.id} value={system.id} label={system.label} />
                  ))}
                </Tabs>
              ) : null}
              <div className={styles.terminal}>
                <TerminalLog lines={visibleLogs} title={`${label('systems', visibleSystem) || '系统'} 运行日志`} />
              </div>
              <button
                disabled={!visibleLogs.length}
                onClick={() =>
                  download('hsgraph-report-replay.log', visibleLogs.join('\n'), 'text/plain;charset=utf-8')
                }
              >
                下载当前日志
              </button>
            </section>
          </div>
          <section>
            <div className={styles.cardHeading}>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                  测试结果
                </Typography>
              </div>
            </div>
            {!results.length ? (
              <div className={styles.empty}>运行任务后，在这里查看报告结果与对比柱状图。</div>
            ) : (
              results.map((item) => <CaseResult key={item.id} item={item} label={label} />)
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 2, px: 1 }}>
              <button
                disabled={!results.length}
                onClick={() =>
                  download(
                    'hsgraph-results.json',
                    JSON.stringify({ mode: 'report-replay', report: data.project.report, results }, null, 2),
                    'application/json'
                  )
                }
              >
                导出结果
              </button>
            </Box>
          </section>
        </>
      )}
    </div>
  );
}
