from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .mock_data import midterm_code_comparison, midterm_project_log, midterm_project_result
from .sse import DEFAULT_STREAM_DURATION, sse_stream
from .acceptance import catalog, selected_cases, replay
from .preprocessing import preprocessing_catalog, validate, preprocess

app = FastAPI(title="HSGraph Acceptance Backend", version="2.0.0")


@app.get("/api/preprocessing/catalog")
async def preprocessing_options():
    return preprocessing_catalog()


@app.get("/api/preprocessing/execute")
async def preprocessing_execute(request: Request, dataset: str, system: str,
                                source_format: str | None = None, target_format: str | None = None,
                                delay: float = Query(default=0.4, ge=0, le=2)):
    try:
        validate(dataset, system, source_format, target_format)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return StreamingResponse(preprocess(request, dataset, system, source_format, target_format, delay),
                             media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/acceptance/catalog")
async def acceptance_catalog():
    return catalog()


@app.get("/api/acceptance/execute")
async def acceptance_execute(request: Request, category: str = "all", algorithm: str = "all",
                             dataset: str = "all", system: str = "all",
                             delay: float = Query(default=0.18, ge=0, le=2)):
    try:
        cases = selected_cases(category, algorithm, dataset, system)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return StreamingResponse(replay(cases, delay, request), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/midterm/{project}/execute/{algo}/{dataset}/")
async def midterm_project_execute(
    project: str,
    algo: str,
    dataset: str,
    scale: str | None = None,
    duration: float = DEFAULT_STREAM_DURATION,
) -> StreamingResponse:
    return StreamingResponse(
        sse_stream(midterm_project_log(project, algo, dataset, scale), duration=duration),
        media_type="text/event-stream",
    )


@app.get("/midterm/{project}/result/{algo}/{dataset}/")
async def midterm_project_get_result(project: str, algo: str, dataset: str, scale: str | None = None) -> dict[str, object]:
    return {"data": midterm_project_result(project, algo, dataset, scale)}


@app.get("/midterm/{project}/code/{algo}/")
async def midterm_project_get_code(project: str, algo: str) -> dict[str, object]:
    return {"data": midterm_code_comparison(project, algo)}
