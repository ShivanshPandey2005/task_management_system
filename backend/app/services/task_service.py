import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from app.core.config import get_settings
from app.repositories.base import TaskRepository
from app.repositories.factory import create_repository
from app.schemas.task import (
    SortField,
    SortOrder,
    TaskCreate,
    TaskOut,
    TaskPriority,
    TaskStatus,
    TaskUpdate,
)
from app.services.seed_data import build_seed


def _now() -> datetime:
    return datetime.now(timezone.utc)


class TaskService:
    """Business rules (ids, timestamps, partial updates). Persistence is delegated to a repository."""

    def __init__(self, repo: TaskRepository) -> None:
        self.repo = repo

    def list(
        self,
        q: Optional[str] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        overdue: Optional[bool] = None,
        sort_by: SortField = SortField.created_at,
        order: SortOrder = SortOrder.desc,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[TaskOut], int]:
        return self.repo.list(q, status, priority, overdue, sort_by, order, page, limit)

    def get(self, task_id: str) -> Optional[TaskOut]:
        return self.repo.get(task_id)

    def create(self, payload: TaskCreate) -> TaskOut:
        now = _now()
        task = TaskOut(id=str(uuid.uuid4()), created_at=now, updated_at=now, **payload.model_dump())
        self.repo.add(task)
        return task

    def update(self, task_id: str, payload: TaskUpdate) -> Optional[TaskOut]:
        current = self.repo.get(task_id)
        if current is None:
            return None
        changes = payload.model_dump(exclude_unset=True)
        updated = current.model_copy(update={**changes, "updated_at": _now()})
        self.repo.save(updated)
        return updated

    def delete(self, task_id: str) -> bool:
        return self.repo.delete(task_id)

    def reset(self) -> None:
        self.repo.clear()

    def seed(self) -> None:
        """Load the sample backlog, but never on top of existing data (matters for Postgres)."""
        if self.repo.count() > 0:
            return
        tasks = [TaskOut(id=str(uuid.uuid4()), **item) for item in build_seed()]
        add_many = getattr(self.repo, "add_many", None)
        if add_many:
            add_many(tasks)
        else:
            for t in tasks:
                self.repo.add(t)


task_service = TaskService(create_repository(get_settings()))
