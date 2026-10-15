from typing import Optional

from fastapi import APIRouter, Query, status

from app.controllers.task_controller import task_controller as ctrl
from app.schemas.task import (
    DeleteOut,
    SortField,
    SortOrder,
    TaskCreate,
    TaskListOut,
    TaskOut,
    TaskPriority,
    TaskStatus,
    TaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=TaskListOut, summary="List tasks (search, filter, sort, paginate)")
def list_tasks(
    q: Optional[str] = Query(None, description="Search title and description"),
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    overdue: Optional[bool] = Query(None, description="Only tasks past their due date that aren't completed"),
    sort_by: SortField = Query(SortField.created_at, alias="sortBy"),
    order: SortOrder = SortOrder.desc,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    return ctrl.list_tasks(q, status, priority, overdue, sort_by, order, page, limit)


@router.get("/{task_id}", response_model=TaskOut, summary="Get a task")
def get_task(task_id: str):
    return ctrl.get_task(task_id)


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED, summary="Create a task")
def create_task(payload: TaskCreate):
    return ctrl.create_task(payload)


@router.put("/{task_id}", response_model=TaskOut, summary="Update a task")
def update_task(task_id: str, payload: TaskUpdate):
    return ctrl.update_task(task_id, payload)


@router.delete("/{task_id}", response_model=DeleteOut, summary="Delete a task")
def delete_task(task_id: str):
    return ctrl.delete_task(task_id)
