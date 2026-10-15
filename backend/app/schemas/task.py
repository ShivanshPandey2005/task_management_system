from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Snake_case in Python, camelCase on the wire."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class SortField(str, Enum):
    created_at = "createdAt"
    priority = "priority"
    due_date = "dueDate"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


class TaskCreate(CamelModel):
    """`description` is Markdown."""


    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=10000)
    status: TaskStatus = TaskStatus.pending
    priority: TaskPriority = TaskPriority.medium
    due_date: Optional[date] = None


class TaskUpdate(CamelModel):
    """PUT body. Omitted fields keep their current value; `dueDate: null` clears it."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None

    @field_validator("title", "description", "status", "priority")
    @classmethod
    def not_null_when_present(cls, v):
        # Optional only means "may be omitted"; an explicit null is rejected.
        if v is None:
            raise ValueError("must not be null")
        return v


class TaskOut(CamelModel):
    id: str
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime


class PageMeta(CamelModel):
    total: int
    page: int
    limit: int
    pages: int


class TaskListOut(CamelModel):
    data: List[TaskOut]
    meta: PageMeta


class DeleteOut(CamelModel):
    message: str
    id: str
