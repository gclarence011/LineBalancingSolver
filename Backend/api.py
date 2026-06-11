from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os

from Solver import format_solution, solve_assembly_line_balancing

app = FastAPI(title="Assembly Line Balancing API")


def _allowed_origins() -> list[str]:
  origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]
  extra = os.getenv("ALLOWED_ORIGINS", "")
  if extra:
    origins.extend(origin.strip() for origin in extra.split(",") if origin.strip())
  return origins


app.add_middleware(
  CORSMiddleware,
  allow_origins=_allowed_origins(),
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


class SolveRequest(BaseModel):
  cycle_time: float = Field(gt=0)
  task_times: dict[int, float]
  precedence: list[tuple[int, int]] = Field(default_factory=list)
  compatible_sets: list[list[int]] | None = None


class StationResult(BaseModel):
  station_id: int
  tasks: list[int]
  load: float
  machine_qty: int


class SolveResponse(BaseModel):
  status: str
  cycle_time: float
  max_cycle_time: float
  stations_used: int
  stations: list[StationResult]


def _validate_task_times(task_times: dict[int, float]) -> dict[int, float]:
  if not task_times:
    raise HTTPException(status_code=400, detail="At least one task is required.")

  keys = sorted(task_times.keys())
  expected = list(range(1, len(keys) + 1))
  if keys != expected:
    raise HTTPException(
      status_code=400,
      detail="Task IDs must be contiguous integers starting at 1.",
    )

  for task_id, duration in task_times.items():
    if duration <= 0:
      raise HTTPException(
        status_code=400,
        detail=f"Task {task_id} must have a positive duration.",
      )

  return task_times


def _validate_precedence(
  precedence: list[tuple[int, int]], task_ids: set[int]
) -> list[tuple[int, int]]:
  for before, after in precedence:
    if before not in task_ids:
      raise HTTPException(
        status_code=400,
        detail=f"Precedence references unknown task {before}.",
      )
    if after not in task_ids:
      raise HTTPException(
        status_code=400,
        detail=f"Precedence references unknown task {after}.",
      )
    if before == after:
      raise HTTPException(
        status_code=400,
        detail="A task cannot precede itself.",
      )
  return precedence


def _validate_compatible_sets(
  compatible_sets: list[list[int]] | None, task_ids: set[int]
) -> list[list[int]] | None:
  if compatible_sets is None:
    return None

  for group_index, group in enumerate(compatible_sets):
    if not group:
      raise HTTPException(
        status_code=400,
        detail=f"Compatible set {group_index + 1} cannot be empty.",
      )
    for task_id in group:
      if task_id not in task_ids:
        raise HTTPException(
          status_code=400,
          detail=f"Compatible set references unknown task {task_id}.",
        )
  return compatible_sets


@app.get("/api/health")
def health():
  return {"status": "ok"}


@app.post("/api/solve", response_model=SolveResponse)
def solve(request: SolveRequest):
  task_times = _validate_task_times(request.task_times)
  task_ids = set(task_times.keys())
  precedence = _validate_precedence(request.precedence, task_ids)
  compatible_sets = _validate_compatible_sets(request.compatible_sets, task_ids)

  status, X, Y = solve_assembly_line_balancing(
    task_times,
    precedence,
    request.cycle_time,
    compatible_sets,
  )

  result = format_solution(
    status, X, Y, task_times, request.cycle_time
  )
  return SolveResponse(**result)
