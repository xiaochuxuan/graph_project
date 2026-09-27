"""Transcription of report RJ102512787, test cases GN0001–XL0008."""
import json
from pathlib import Path

data = {
    "project": {"id": "2023BAB078", "name": "面向异构体系结构的大规模图数据智能处理技术研究", "product": "HSGraph 1.5", "report": "RJ102512787", "date": "2025-12-31", "mode": "report-replay"},
    "categories": [{"id": k, "label": v} for k, v in [("function", "功能验证"), ("performance", "性能对比"), ("capacity", "容量验证"), ("resource", "资源利用率")]],
    "systems": [{"id": k, "label": v, "role": role} for k, v, role in [("hsgraph", "HSGraph 1.5", "验收系统"), ("gunrock", "Gunrock 2.0.0", "对比系统"), ("tigr", "Tigr · a9b7c08", "对比系统"), ("groute", "Groute 1.0", "对比系统")]],
    "algorithms": [{"id": "bfs", "label": "BFS", "description": "广度优先搜索，逐层遍历图中的可达顶点。"}, {"id": "sssp", "label": "SSSP", "description": "单源最短路径，求解源点到其他顶点的最短距离。"}],
    "datasets": [{"id": "twitter", "label": "Twitter-2010", "description": "委托方提供；用于 BFS / SSSP 性能对比，报告未列明顶点数及边数。"}, {"id": "friendster", "label": "Friendster", "description": "委托方提供；用于性能对比与 CPU / GPU 平均利用率测试。"}, {"id": "functional", "label": "功能测试图", "vertices": 34000000, "edges": 528000000, "description": "委托方提供；3400 万顶点、5.28 亿条边。"}, {"id": "large", "label": "大规模测试图", "vertices": 134000000, "edges": 2148000000, "description": "委托方提供；1.34 亿顶点、21.48 亿条边。"}],
    "requirements": [{"title": "计算性能提升不低于 1 倍", "target": "加速比 ≥ 2.0×", "evidence": "报告 7 组对比加速比为 2.1×–14.6×", "status": "报告支持"}, {"title": "不少于 1 亿顶点、10 亿条边", "target": "顶点 ≥ 1 亿；边 ≥ 10 亿", "evidence": "容量用例：1.34 亿顶点、21.48 亿条边", "status": "报告支持"}, {"title": "研制 1 套系统，支持至少 2 种编程模型", "target": "1 套系统 / ≥ 2 种编程模型", "evidence": "已列 HSGraph 1.5；报告的 BFS、SSSP 是算法，编程模型证据待补充", "status": "待补充"}],
    "environment": ["Intel Xeon Gold 5117 · 2.00 GHz", "256 GB 内存 / 6 TB 硬盘", "Ubuntu 18.04.2 LTS", "GCC 12.1.0 / CUDA Toolkit 12.1"],
    "sourceNote": "数据摘录自 HSGraph 1.5 测试报告的测试内容表；日志为报告记录复现。单次耗时和加速比保留报告原始舍入值，不用总耗时重新覆盖。",
    "cases": [],
}

def add(id, category, algorithm, dataset, title, rows, conclusion):
    data["cases"].append(dict(id=id, category=category, algorithm=algorithm, dataset=dataset, title=title, rows=rows, conclusion=conclusion))

for n, algo in enumerate(["bfs", "sssp"], 1):
    add(f"HSGR_GN000{n}", "function", algo, "functional", f"{algo.upper()} 功能验证", [{"system": "hsgraph", "status": "正常处理图数据并输出结果"}], "报告记录：功能验证通过")

for id, dataset, algo, measurements in [
    ("HSGR_XL0003", "twitter", "bfs", [("hsgraph",150,5.83,.039,1), ("gunrock",10,5.69,.569,14.6), ("tigr",40,6.04,.151,3.9), ("groute",20,9.43,.472,12.1)]),
    ("HSGR_XL0004", "twitter", "sssp", [("hsgraph",50,6.98,.140,1), ("groute",20,10.09,.505,3.6)]),
    ("HSGR_XL0005", "friendster", "bfs", [("hsgraph",50,5.55,.111,1), ("tigr",20,9.57,.479,4.3), ("groute",10,8.89,.889,8)]),
    ("HSGR_XL0006", "friendster", "sssp", [("hsgraph",20,8.57,.429,1), ("groute",10,9.04,.904,2.1)]),
]:
    add(id, "performance", algo, dataset, f"{dataset.title()} · {algo.upper()} 性能对比", [dict(system=s,repetitions=n,totalSeconds=t,seconds=v,speedup=r) for s,n,t,v,r in measurements], "报告记录：相对各陪测系统的加速比均达到 2.0×")

for algo in ["bfs", "sssp"]:
    add(f"HSGR_XL0007-{algo.upper()}", "capacity", algo, "large", f"{algo.upper()} 大规模图处理", [{"system":"hsgraph", "vertices":134000000, "edges":2148000000, "status":"运行正常，无中断异常，可以输出处理结果"}], "报告记录：顶点规模、边规模均达到任务书要求")
add("HSGR_XL0008", "resource", "bfs", "friendster", "异构硬件资源利用率", [{"system":"hsgraph", "cpu":78.6,"gpu":59.7}, {"system":"tigr", "cpu":1.8,"gpu":46.4}], "报告记录：HSGraph 的 CPU / GPU 平均利用率分别为 78.6% / 59.7%")

if __name__ == "__main__":
    Path(__file__).with_name("catalog.json").write_text(json.dumps(data, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
