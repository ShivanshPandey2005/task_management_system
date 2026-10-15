from app.core.config import Settings
from app.repositories.base import TaskRepository
from app.repositories.memory import InMemoryTaskRepository


def create_repository(settings: Settings) -> TaskRepository:
    """In-memory by default; Postgres only when DATABASE_URL is set."""
    if settings.database_url:
        from app.repositories.sql import SqlTaskRepository  # imported lazily: the SQL stack is optional

        return SqlTaskRepository(settings.database_url)
    return InMemoryTaskRepository()
