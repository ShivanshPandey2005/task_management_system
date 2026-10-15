import threading
from datetime import date
from typing import Dict, List, Optional, Tuple

from app.schemas.task import SortField, SortOrder, TaskOut, TaskPriority, TaskStatus

_PRIORITY_RANK = {TaskPriority.low: 1, TaskPriority.medium: 2, TaskPriority.high: 3}


class InMemoryTaskRepository:
    """Default storage: a dict in process memory. Data resets when the server restarts."""

    def __init__(self) -> None:
        self._tasks: Dict[str, TaskOut] = {}
        self._lock = threading.Lock()

    def list(
        self,
        q: Optional[str],
        status: Optional[TaskStatus],
        priority: Optional[TaskPriority],
        overdue: Optional[bool],
        sort_by: SortField,
        order: SortOrder,
        page: int,
        limit: int,
    ) -> Tuple[List[TaskOut], int]:
        with self._lock:
            items = list(self._tasks.values())

        if q:
            needle = q.strip().lower()
            items = [t for t in items if needle in t.title.lower() or needle in t.description.lower()]
        if status:
            items = [t for t in items if t.status == status]
        if priority:
            items = [t for t in items if t.priority == priority]

        if overdue:
            today = date.today()
            items = [t for t in items if t.due_date and t.due_date < today and t.status != TaskStatus.completed]

        reverse = order == SortOrder.desc
        if sort_by == SortField.due_date:
            # Tasks without a due date always sort last, in either direction.
            dated = sorted((t for t in items if t.due_date), key=lambda t: t.due_date, reverse=reverse)
            items = dated + [t for t in items if not t.due_date]
        elif sort_by == SortField.priority:
            items = sorted(items, key=lambda t: _PRIORITY_RANK[t.priority], reverse=reverse)
        else:
            items = sorted(items, key=lambda t: t.created_at, reverse=reverse)

        start = (page - 1) * limit
        return items[start:start + limit], len(items)

    def get(self, task_id: str) -> Optional[TaskOut]:
        with self._lock:
            return self._tasks.get(task_id)

    def add(self, task: TaskOut) -> None:
        with self._lock:
            self._tasks[task.id] = task

    def save(self, task: TaskOut) -> None:
        self.add(task)

    def delete(self, task_id: str) -> bool:
        with self._lock:
            return self._tasks.pop(task_id, None) is not None

    def count(self) -> int:
        with self._lock:
            return len(self._tasks)

    def clear(self) -> None:
        with self._lock:
            self._tasks.clear()
