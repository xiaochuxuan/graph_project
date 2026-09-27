'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';

import { BASE_URL } from '@/lib/request/request';
import TerminalLog from '@/components/midterm/terminal-log';

export default function PreprocessingPage() {
  const [data, setData] = React.useState(null);
  const [selection, setSelection] = React.useState({
    dataset: 'twitter',
    system: 'hsgraph',
  });
  const [logs, setLogs] = React.useState([]);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [completed, setCompleted] = React.useState(0);
  const connection = React.useRef(null);
  const load = React.useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/api/preprocessing/catalog`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData(await response.json());
    } catch (e) {
      setError(`数据处理服务连接失败：${e.message}`);
    }
  }, []);
  React.useEffect(() => {
    load();
    return () => connection.current?.close();
  }, [load]);
  const run = () => {
    if (running) return;
    connection.current?.close();
    setRunning(true);
    setResult(null);
    setLogs([]);
    setCompleted(0);
    setError('');
    const source = new EventSource(`${BASE_URL}/api/preprocessing/execute?${new URLSearchParams(selection)}`);
    connection.current = source;
    source.addEventListener('log', (e) => setLogs((prev) => [...prev, JSON.parse(e.data).line]));
    source.addEventListener('progress', (e) => setCompleted(JSON.parse(e.data).completed));
    source.addEventListener('result', (e) => setResult(JSON.parse(e.data)));
    source.addEventListener('done', () => {
      source.close();
      connection.current = null;
      setRunning(false);
    });
    source.onerror = () => {
      source.close();
      connection.current = null;
      setRunning(false);
      setError('数据处理日志连接中断，请重试。');
    };
  };
  const stop = () => {
    connection.current?.close();
    connection.current = null;
    setRunning(false);
    setLogs((prev) => [...prev, '[STOP] 已停止处理流程演示。']);
  };
  const exportRecord = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ ...result, logs }, null, 2)], { type: 'application/json' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'preprocessing-demo.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const label = (group, id) => data[group].find((item) => item.id === id)?.label || id;
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#f0f4f8', border: '1px solid #e0e0e0' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>数据预处理</Typography>
        <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          选择目标系统后自动使用对应输出格式，查看数据整理、格式转换和结构检查的处理流程。
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          当前为流程演示。实际格式以各系统加载器为准，转换脚本接入后可执行真实文件处理。
        </Typography>
      </Paper>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} action={!data ? <Button onClick={load}>重新连接</Button> : undefined}>
          {error}
        </Alert>
      ) : null}
      {!data ? (
        <Typography>正在等待数据处理服务…</Typography>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px minmax(0, 1fr)' }, gap: 3 }}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'secondary.main' }}>
                处理配置
              </Typography>
              {[
                ['dataset', 'datasets', '数据集'],
                ['system', 'systems', '目标系统'],
              ].map(([key, group, title]) => (
                <FormControl fullWidth size="small" key={key} sx={{ mb: 3 }}>
                  <InputLabel id={`${key}-label`}>{title}</InputLabel>
                  <Select
                    labelId={`${key}-label`}
                    label={title}
                    value={selection[key]}
                    disabled={running}
                    onChange={(e) => {
                      setSelection((prev) => ({ ...prev, [key]: e.target.value }));
                      setResult(null);
                      setLogs([]);
                      setCompleted(0);
                    }}
                  >
                    {data[group].map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
              <Box sx={{ p: 2, mb: 3, bgcolor: '#f0f4f8', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  系统数据格式（自动设置，不可修改）
                </Typography>
                <Typography sx={{ mt: 1, fontWeight: 600 }}>
                  {label('formats', data.systemFormats[selection.system])}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.profileNote}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" disabled={running} onClick={run}>
                  开始预处理
                </Button>
                {running ? <Button onClick={stop}>停止</Button> : null}
              </Box>
            </Paper>
            <Box sx={{ minWidth: 0 }}>
              <LinearProgress variant="determinate" value={(completed / data.steps.length) * 100} sx={{ mb: 2 }} />
              <Box sx={{ height: 410 }}>
                <TerminalLog lines={logs} title="数据处理日志" />
              </Box>
            </Box>
          </Box>
          <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: 3, overflowX: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'secondary.main' }}>
              处理步骤
            </Typography>
            <Stepper activeStep={completed} alternativeLabel sx={{ minWidth: 600 }}>
              {data.steps.map((step) => (
                <Step key={step}>
                  <StepLabel>{step}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
          {result ? (
            <Paper elevation={3} sx={{ p: 2, mt: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                {result.status}
              </Typography>
              <Typography>
                数据集：{label('datasets', result.dataset)}；目标系统：{label('systems', result.system)}
              </Typography>
              <Typography>
                格式：{label('formats', result.sourceFormat)} → {label('formats', result.targetFormat)}
              </Typography>
              <Typography color="text.secondary">未生成转换文件；系统转换脚本待接入。</Typography>
              {result.preview ? (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'secondary.main' }}>
                    处理后数据格式预览
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.preview.description}
                  </Typography>
                  <Typography sx={{ mt: 2, mb: 1, fontWeight: 600 }}>示例文件：{result.preview.filename}</Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      bgcolor: '#f0f4f8',
                      borderRadius: 2,
                      overflowX: 'auto',
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.7,
                    }}
                  >
                    {result.preview.content}
                  </Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>字段说明</Typography>
                  {result.preview.fields.map((field) => (
                    <Typography key={field} variant="body2" sx={{ mb: 0.5 }}>
                      {field}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Paper>
          ) : null}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 2, px: 1 }}>
            <Button variant="outlined" disabled={!result} onClick={exportRecord}>
              导出处理记录
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
