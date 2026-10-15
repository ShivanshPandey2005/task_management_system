"""Run the whole API suite against every storage backend.

- memory: always
- sqlite: always (exercises the SQL repository without needing a server)
- postgres: when TEST_DATABASE_URL is set, e.g.
    TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tasks_test pytest
"""
import os

import pytest

from app.repositories.memory import InMemoryTaskRepository
from app.repositories.sql import SqlTaskRepository
from app.services.task_service import task_service

BACKENDS = ["memory", "sqlite"] + (["postgres"] if os.getenv("TEST_DATABASE_URL") else [])


@pytest.fixture(autouse=True, params=BACKENDS)
def storage(request, tmp_path):
    original = task_service.repo
    if request.param == "memory":
        task_service.repo = InMemoryTaskRepository()
    elif request.param == "sqlite":
        task_service.repo = SqlTaskRepository(f"sqlite:///{tmp_path / 'tasks.db'}")
    else:
        task_service.repo = SqlTaskRepository(os.environ["TEST_DATABASE_URL"])
    task_service.reset()
    yield request.param
    task_service.reset()
    task_service.repo = original
