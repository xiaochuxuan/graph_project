"""Report-backed acceptance cases; no graph execution is claimed by replay mode."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "data" / "hsgraph"


def catalog():
    return json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))


def selected_cases(category, algorithm, dataset, system):
    data = catalog()
    for key, value, allowed in [
        ("category", category, [x["id"] for x in data["categories"]]),
        ("algorithm", algorithm, [x["id"] for x in data["algorithms"]]),
        ("dataset", dataset, [x["id"] for x in data["datasets"]]),
        ("system", system, [x["id"] for x in data["systems"]]),
    ]:
        if value != "all" and value not in allowed:
            raise ValueError(f"未知{key}: {value}")
    cases = []
    for case in data["cases"]:
        if any(value != "all" and case[key] != value for key, value in
               [("category", category), ("algorithm", algorithm), ("dataset", dataset)]):
            continue
        rows = [row for row in case["rows"] if system == "all" or row["system"] in {"hsgraph", system}]
        if system not in {"all", "hsgraph"} and not any(row["system"] == system for row in rows):
            continue
        cases.append({**case, "rows": rows})
    if not cases:
        raise ValueError("报告未提供此组合的测试记录，请调整筛选条件")
    return cases


def event(name, payload):
    return f"event: {name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def replay(cases, delay, request):
    yield event("start", {"mode": "report-replay", "count": len(cases)})
    for index, case in enumerate(cases):
        lines = [
            f"[REPORT] {case['id']} | {case['title']}",
            "[MODE] 验收报告复现：以下为报告记录，未启动图计算程序。",
            f"[INPUT] 算法={case['algorithm'].upper()} 数据集={case['dataset']}",
        ]
        for row in case["rows"]:
            values = " | ".join(f"{k}={v}" for k, v in row.items())
            lines.append(f"[RECORD] {values}")
        lines.append(f"[RESULT] {case['conclusion']}")
        for line in lines:
            if await request.is_disconnected():
                return
            yield event("log", {"caseId": case["id"], "line": line})
            await asyncio.sleep(delay)
        yield event("result", case)
        yield event("progress", {"completed": index + 1, "total": len(cases)})
    yield event("done", {"completed": len(cases)})
