from typing import List, Optional, Protocol, Tuple

from app.schemas.task import SortField, SortOrder, TaskOut, TaskPriority, TaskStatus


class TaskRepository(Protocol):
    """Storage boundary. The service talks only to this, so memory and Postgres are interchangeable."""

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
    ) -> Tuple[List[TaskOut], int]: ...

    def get(self, task_id: str) -> Optional[TaskOut]: ...

    def add(self, task: TaskOut) -> None: ...

    def save(self, task: TaskOut) -> None: ...

    def delete(self, task_id: str) -> bool: ...

    def count(self) -> int: ...

    def clear(self) -> None: ...
