from datetime import date, datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import Date, DateTime, String, Text, case, create_engine, delete, func, or_, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.schemas.task import SortField, SortOrder, TaskOut, TaskPriority, TaskStatus


class Base(DeclarativeBase):
    pass


class TaskRow(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), index=True)
    priority: Mapped[str] = mapped_column(String(10), index=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


def normalize_url(url: str) -> str:
    """Accept the URL forms hosting providers hand out and select the psycopg 3 driver."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def _utc(value: datetime) -> datetime:
    # Postgres returns aware datetimes in the session time zone; SQLite (tests) returns naive ones.
    # Always emit UTC so the API shows the same string no matter the backend.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _to_out(row: TaskRow) -> TaskOut:
    return TaskOut(
        id=row.id,
        title=row.title,
        description=row.description,
        status=TaskStatus(row.status),
        priority=TaskPriority(row.priority),
        due_date=row.due_date,
        created_at=_utc(row.created_at),
        updated_at=_utc(row.updated_at),
    )


def _to_row(task: TaskOut) -> TaskRow:
    return TaskRow(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status.value,
        priority=task.priority.value,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


class SqlTaskRepository:
    """Postgres storage (any SQLAlchemy URL works). Search/filter/sort/paginate all run in SQL."""

    def __init__(self, url: str) -> None:
        self.engine = create_engine(normalize_url(url), pool_pre_ping=True)
        self._session = sessionmaker(self.engine, expire_on_commit=False)
        Base.metadata.create_all(self.engine)

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
        where = []
        if q and q.strip():
            escaped = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{escaped}%"
            where.append(or_(
                TaskRow.title.ilike(pattern, escape="\\"),
                TaskRow.description.ilike(pattern, escape="\\"),
            ))
        if status:
            where.append(TaskRow.status == status.value)
        if priority:
            where.append(TaskRow.priority == priority.value)

        if overdue:
            # Past due and not finished. NULL due dates never match the comparison.
            where.append(TaskRow.due_date < date.today())
            where.append(TaskRow.status != TaskStatus.completed.value)

        desc = order == SortOrder.desc
        if sort_by == SortField.due_date:
            # Tasks without a due date always sort last, in either direction.
            primary = TaskRow.due_date.desc().nulls_last() if desc else TaskRow.due_date.asc().nulls_last()
        elif sort_by == SortField.priority:
            rank = case({"low": 1, "medium": 2, "high": 3}, value=TaskRow.priority)
            primary = rank.desc() if desc else rank.asc()
        else:
            primary = TaskRow.created_at.desc() if desc else TaskRow.created_at.asc()

        with self._session() as s:
            total = s.scalar(select(func.count()).select_from(TaskRow).where(*where)) or 0
            rows = s.scalars(
                select(TaskRow)
                .where(*where)
                .order_by(primary, TaskRow.created_at.desc(), TaskRow.id)
                .offset((page - 1) * limit)
                .limit(limit)
            ).all()
            return [_to_out(r) for r in rows], total

    def get(self, task_id: str) -> Optional[TaskOut]:
        with self._session() as s:
            row = s.get(TaskRow, task_id)
            return _to_out(row) if row else None

    def add(self, task: TaskOut) -> None:
        with self._session.begin() as s:
            s.add(_to_row(task))

    def add_many(self, tasks: List[TaskOut]) -> None:
        with self._session.begin() as s:
            s.add_all(_to_row(t) for t in tasks)

    def save(self, task: TaskOut) -> None:
        with self._session.begin() as s:
            s.merge(_to_row(task))

    def delete(self, task_id: str) -> bool:
        with self._session.begin() as s:
            return s.execute(delete(TaskRow).where(TaskRow.id == task_id)).rowcount > 0

    def count(self) -> int:
        with self._session() as s:
            return s.scalar(select(func.count()).select_from(TaskRow)) or 0

    def clear(self) -> None:
        with self._session.begin() as s:
            s.execute(delete(TaskRow))
