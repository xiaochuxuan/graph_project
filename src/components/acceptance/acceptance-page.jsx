'use client';

import React from 'react';
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

const initialFilters = { category: 'all', algorithm: 'all', dataset: 'all', system: 'all' };

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
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
          <YAxis unit={unit} tick={{ fontSize: 11 }} width={65} />
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

function CaseResult({ item, label }) {
  const rows = item.rows.map((row) => ({ ...row, name: label('systems', row.system) }));
  return (
    <article className={styles.result}>
      <div className={styles.cardHeading}>
        <div>
          <span className={styles.eyebrow}>{item.id}</span>
          <h3>
            {label('datasets', item.dataset)} · {item.algorithm.toUpperCase()}
          </h3>
        </div>
        <span className={styles.badge}>报告记录</span>
      </div>
      {item.category === 'performance' ? (
        <>
          <div className={styles.chartGrid}>
            <section>
              <h4>单次执行耗时 · 越低越好</h4>
              <Chart rows={rows} series={[{ key: 'seconds', label: '单次耗时', color: '#3273c9' }]} unit="s" />
            </section>
            <section>
              <h4>HSGraph 相对陪测系统加速比 · 越高越好</h4>
              <Chart
                rows={rows.filter((r) => r.system !== 'hsgraph')}
                series={[{ key: 'speedup', label: '加速比', color: '#16a394' }]}
                unit="×"
                target={2}
              />
            </section>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>系统</th>
                  <th>执行次数</th>
                  <th>总耗时 (s)</th>
                  <th>单次耗时 (s)</th>
                  <th>HSGraph 加速比</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.system}>
                    <td>{r.name}</td>
                    <td>{r.repetitions}</td>
                    <td>{r.totalSeconds.toFixed(2)}</td>
                    <td>{r.seconds.toFixed(3)}</td>
                    <td>{r.system === 'hsgraph' ? '基准' : `${r.speedup.toFixed(1)}×`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.note}>
            加速比 = 陪测系统单次耗时 / HSGraph 单次耗时。保留报告舍入值；“性能提升 1 倍”对应加速比 2×。
          </p>
        </>
      ) : null}
      {item.category === 'resource' ? (
        <>
          <Chart
            rows={rows}
            series={[
              { key: 'cpu', label: 'CPU 平均利用率', color: '#3273c9' },
              { key: 'gpu', label: 'GPU 平均利用率', color: '#16a394' },
            ]}
            unit="%"
          />
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>系统</th>
                  <th>CPU</th>
                  <th>GPU</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.system}>
                    <td>{r.name}</td>
                    <td>{r.cpu}%</td>
                    <td>{r.gpu}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      {item.category === 'capacity' ? (
        <>
          <Chart
            rows={[
              { name: '顶点', measured: 1.34, target: 1 },
              { name: '边', measured: 21.48, target: 10 },
            ]}
            series={[
              { key: 'measured', label: '报告验证规模', color: '#3273c9' },
              { key: 'target', label: '任务书要求', color: '#b9cadf' },
            ]}
            unit="亿"
          />
          <p>HSGraph：1.34 亿顶点 / 21.48 亿条边，运行正常并输出结果。</p>
        </>
      ) : null}
      {item.category === 'function' ? (
        <div className={styles.functionResult}>
          <strong>✓ {item.algorithm.toUpperCase()} 功能验证通过</strong>
          <p>3400 万顶点 / 5.28 亿条边</p>
          <p>{rows[0].status}</p>
        </div>
      ) : null}
      <p className={styles.conclusion}>{item.conclusion}</p>
    </article>
  );
}

export default function AcceptancePage() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState('');
  const [filters, setFilters] = React.useState(initialFilters);
  const [logs, setLogs] = React.useState([]);
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
  const matches =
    data?.cases.filter((c) =>
      Object.entries(filters).every(
        ([key, value]) =>
          value === 'all' || (key === 'system' ? c.rows.some((r) => r.system === value) : c[key] === value)
      )
    ) || [];
  const running = status === 'running';
  const stop = () => {
    stream.current?.close();
    stream.current = null;
    setStatus('stopped');
    setLogs((prev) => [...prev, '[STOP] 已停止报告复现；保留已完成结果。']);
  };
  const run = () => {
    if (running || !matches.length) return;
    stream.current?.close();
    setLogs([]);
    setResults([]);
    setError('');
    setStatus('running');
    setProgress({ completed: 0, total: matches.length });
    const source = new EventSource(`${BASE_URL}/api/acceptance/execute?${new URLSearchParams(filters)}`);
    stream.current = source;
    source.addEventListener('log', (e) => setLogs((prev) => [...prev, JSON.parse(e.data).line]));
    source.addEventListener('result', (e) => setResults((prev) => [...prev, JSON.parse(e.data)]));
    source.addEventListener('progress', (e) => setProgress(JSON.parse(e.data)));
    source.addEventListener('done', () => {
      source.close();
      stream.current = null;
      setStatus('done');
      setLogs((prev) => [...prev, '[DONE] 所选报告记录复现完成。']);
    });
    source.onerror = () => {
      source.close();
      stream.current = null;
      setStatus('error');
      setError('日志连接中断，请检查后端后重新运行。');
      setLogs((prev) => [...prev, '[ERROR] 日志连接中断。']);
    };
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>2023BAB078 / 项目验收工作台</span>
          <h1>
            HSGraph <span>1.5</span>
          </h1>
          <p>面向异构体系结构的大规模图数据智能处理技术研究</p>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.badge}>验收报告复现</span>
          <p>
            报告 RJ102512787
            <br />
            2025 年 12 月 31 日
          </p>
        </div>
      </header>
      {error ? (
        <div className={styles.error} role="alert">
          {error} {!data ? <button onClick={load}>重新连接</button> : null}
        </div>
      ) : null}
      {!data ? (
        <p aria-live="polite">{error ? '等待后端连接' : '正在加载验收任务…'}</p>
      ) : (
        <>
          <section className={styles.requirements}>
            {data.requirements.map((r) => (
              <article key={r.title}>
                <span className={r.status === '待补充' ? styles.pending : styles.verified}>{r.status}</span>
                <h3>{r.target}</h3>
                <p>{r.title}</p>
                <small>{r.evidence}</small>
              </article>
            ))}
          </section>
          <section className={styles.panel}>
            <div className={styles.cardHeading}>
              <h2>系统与测试环境</h2>
              <span className={styles.note}>数据来源：任务书 / 第三方测试报告</span>
            </div>
            <div className={styles.systems}>
              {data.systems.map((s) => (
                <div key={s.id}>
                  <span>{s.role}</span>
                  <strong>{s.label}</strong>
                </div>
              ))}
            </div>
            <p className={styles.note}>{data.environment.join('　·　')}</p>
          </section>
          <div className={styles.workspace}>
            <section className={styles.panel}>
              <span className={styles.eyebrow}>01 / 配置测试</span>
              <h2>验收任务</h2>
              {[
                ['category', 'categories', '验收类别'],
                ['algorithm', 'algorithms', '算法'],
                ['dataset', 'datasets', '数据集'],
                ['system', 'systems', '对比系统'],
              ].map(([key, group, title]) => (
                <label className={styles.field} key={key}>
                  {title}
                  <select
                    value={filters[key]}
                    disabled={running}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                  >
                    <option value="all">全部{title}</option>
                    {data[group].map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <p className={styles.note}>
                {filters.dataset === 'all'
                  ? '覆盖报告内 4 类测试数据；仅复现有记录的组合。'
                  : data.datasets.find((d) => d.id === filters.dataset)?.description}
              </p>
              <p className={styles.note}>
                {filters.algorithm === 'all'
                  ? 'BFS 广度优先搜索 / SSSP 单源最短路径'
                  : data.algorithms.find((a) => a.id === filters.algorithm)?.description}
              </p>
              <div className={styles.actions}>
                <button className={styles.primary} disabled={running || !matches.length} onClick={run}>
                  {running ? '正在复现…' : `运行所选任务 (${matches.length})`}
                </button>
                {running ? <button onClick={stop}>停止</button> : null}
              </div>
              {!matches.length ? <p className={styles.pending}>报告未记录此组合，请调整筛选。</p> : null}
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
              <div className={styles.terminal}>
                <TerminalLog lines={logs} title="HSGraph 验收日志" />
              </div>
              <button
                disabled={!logs.length}
                onClick={() => download('hsgraph-report-replay.log', logs.join('\n'), 'text/plain;charset=utf-8')}
              >
                下载日志
              </button>
            </section>
          </div>
          <section>
            <div className={styles.cardHeading}>
              <div>
                <span className={styles.eyebrow}>03 / 验收结果</span>
                <h2>结果与对比分析</h2>
              </div>
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
            </div>
            {!results.length ? (
              <div className={styles.empty}>运行任务后，在这里查看报告结果与对比柱状图。</div>
            ) : (
              results.map((item) => <CaseResult key={item.id} item={item} label={label} />)
            )}
          </section>
          <footer className={styles.note}>{data.sourceNote}</footer>
        </>
      )}
    </div>
  );
}
