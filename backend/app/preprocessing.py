"""Demonstrate the conversion pipeline; real system adapters are not supplied."""
import asyncio
from .acceptance import catalog, event

FORMATS = [
    {"id": "edge-list", "label": "边列表（源点、目标点、可选权重）"},
    {"id": "matrix-market", "label": "Matrix Market（.mtx）"},
    {"id": "csr", "label": "CSR（偏移、邻接点、可选权重）"},
]
STEPS = ["读取源数据", "检查顶点编号与边记录", "整理编号和邻接关系", "按目标格式组织数据", "检查输出结构"]

# Demonstration profiles, not verified loader contracts for the named products.
SYSTEM_FORMATS = {"hsgraph": "csr", "gunrock": "matrix-market", "tigr": "edge-list", "groute": "csr"}
PREVIEWS = {
    "csr": {
        "filename": "graph.csr.json",
        "fields": ["num_vertices：顶点数", "num_edges：边数", "row_offsets：每个顶点的邻接起止位置，长度为顶点数 + 1", "column_indices：邻接顶点编号，从 0 开始", "weights：与邻接项一一对应的边权重"],
        "content": '{\n  "num_vertices": 4,\n  "num_edges": 5,\n  "row_offsets": [0, 2, 3, 4, 5],\n  "column_indices": [1, 2, 2, 3, 0],\n  "weights": [1, 2, 3, 4, 5]\n}',
    },
    "matrix-market": {
        "filename": "graph.mtx",
        "fields": ["首行：Matrix Market 坐标格式，实数权重，有向图", "维度行：行数、列数、非零项数", "数据行：源顶点、目标顶点、权重，顶点编号从 1 开始"],
        "content": '%%MatrixMarket matrix coordinate real general\n% Format preview: 4 vertices, 5 directed edges\n4 4 5\n1 2 1\n1 3 2\n2 3 3\n3 4 4\n4 1 5',
    },
    "edge-list": {
        "filename": "graph.edges",
        "fields": ["每行记录一条有向边", "第 1 列：源顶点编号，从 0 开始", "第 2 列：目标顶点编号，从 0 开始", "第 3 列：边权重"],
        "content": '# source target weight\n0 1 1\n0 2 2\n1 2 3\n2 3 4\n3 0 5',
    },
}


def preprocessing_catalog():
    data = catalog()
    return {"datasets": data["datasets"], "systems": data["systems"], "formats": FORMATS,
            "steps": STEPS, "mode": "demo", "systemFormats": SYSTEM_FORMATS,
            "profileNote": "系统与格式为演示绑定配置；实际加载器格式接入时确认。"}


def validate(dataset, system, source_format=None, target_format=None):
    data = preprocessing_catalog()
    for value, options in [(dataset, data["datasets"]), (system, data["systems"])]:
        if value not in {item["id"] for item in options}:
            raise ValueError("请选择有效的数据集、系统及输入输出格式")
    if source_format is not None and source_format != SYSTEM_FORMATS[system]:
        raise ValueError("格式由系统配置确定，不支持覆盖")
    if target_format is not None and target_format != SYSTEM_FORMATS[system]:
        raise ValueError("目标格式由系统配置确定，不支持覆盖")
    return data


async def preprocess(request, dataset, system, source_format, target_format, delay):
    data = validate(dataset, system, source_format, target_format)
    target_format = SYSTEM_FORMATS[system]
    source_format = SYSTEM_FORMATS[system]
    yield event("log", {"line": "[DEMO] 数据预处理流程演示；未读取原始图文件，不生成转换文件。"})
    yield event("log", {"line": f"[CONFIG] dataset={dataset} system={system} {source_format} -> {target_format}"})
    for index, step in enumerate(STEPS):
        if await request.is_disconnected():
            return
        yield event("log", {"line": f"[STEP {index + 1}/{len(STEPS)}] 演示：{step}"})
        await asyncio.sleep(delay)
        yield event("progress", {"completed": index + 1, "total": len(STEPS)})
    yield event("result", {"mode": "demo", "dataset": dataset, "system": system,
                           "sourceFormat": source_format, "targetFormat": target_format,
                           "status": "预处理完成", "fileGenerated": False,
                           "adapterStatus": "待接入系统转换脚本", "steps": data["steps"],
                           "preview": {**PREVIEWS[target_format], "isSample": True,
                                       "description": "格式示例：4 个顶点、5 条有向加权边，非所选数据集的实际内容。"}})
    yield event("done", {"completed": len(STEPS)})
