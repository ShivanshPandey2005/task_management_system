from typing import Optional

from app.middleware.error_handler import NotFoundError
from app.schemas.task import (
    DeleteOut,
    PageMeta,
    SortField,
    SortOrder,
    TaskCreate,
    TaskListOut,
    TaskOut,
    TaskPriority,
    TaskStatus,
    TaskUpdate,
)
from app.services.task_service import TaskService, task_service


class TaskController:
    """HTTP-level concerns: 404 mapping and response shaping. Storage lives in the service."""

    def __init__(self, service: TaskService) -> None:
        self.service = service

    def list_tasks(
        self,
        q: Optional[str],
        status: Optional[TaskStatus],
        priority: Optional[TaskPriority],
        overdue: Optional[bool],
        sort_by: SortField,
        order: SortOrder,
        page: int,
        limit: int,
    ) -> TaskListOut:
        items, total = self.service.list(q, status, priority, overdue, sort_by, order, page, limit)
        pages = max(1, -(-total // limit))
        return TaskListOut(
            data=items,
            meta=PageMeta(total=total, page=page, limit=limit, pages=pages),
        )

    def get_task(self, task_id: str) -> TaskOut:
        task = self.service.get(task_id)
        if task is None:
            raise NotFoundError(task_id)
        return task

    def create_task(self, payload: TaskCreate) -> TaskOut:
        return self.service.create(payload)

    def update_task(self, task_id: str, payload: TaskUpdate) -> TaskOut:
        task = self.service.update(task_id, payload)
        if task is None:
            raise NotFoundError(task_id)
        return task

    def delete_task(self, task_id: str) -> DeleteOut:
        if not self.service.delete(task_id):
            raise NotFoundError(task_id)
        return DeleteOut(message="Task deleted", id=task_id)


task_controller = TaskController(task_service)
