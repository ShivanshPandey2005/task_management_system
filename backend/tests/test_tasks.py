import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)  # no `with`: lifespan (seeding) is not run


def make(**overrides):
    body = {
        "title": "Complete assignment",
        "description": "Build the full-stack task manager",
        "status": "pending",
        "priority": "high",
        "dueDate": "2026-10-05",
    }
    body.update(overrides)
    res = client.post("/api/tasks", json=body)
    assert res.status_code == 201, res.text
    return res.json()


def test_create_returns_201_and_camel_case():
    task = make()
    assert task["id"]
    assert task["dueDate"] == "2026-10-05"
    assert task["createdAt"] and task["updatedAt"]
    assert task["status"] == "pending" and task["priority"] == "high"


def test_create_applies_defaults():
    res = client.post("/api/tasks", json={"title": "t", "description": "d"})
    assert res.status_code == 201
    assert res.json()["status"] == "pending"
    assert res.json()["priority"] == "medium"
    assert res.json()["dueDate"] is None


@pytest.mark.parametrize(
    "body,field",
    [
        ({"description": "d"}, "title"),
        ({"title": "t"}, "description"),
        ({"title": "   ", "description": "d"}, "title"),
        ({"title": "t", "description": "d", "status": "nope"}, "status"),
        ({"title": "t", "description": "d", "priority": "urgent"}, "priority"),
        ({"title": "t", "description": "d", "dueDate": "not-a-date"}, "dueDate"),
        ({"title": "x" * 121, "description": "d"}, "title"),
    ],
)
def test_create_validation_returns_400(body, field):
    res = client.post("/api/tasks", json=body)
    assert res.status_code == 400
    err = res.json()["error"]
    assert err["code"] == "validation_error"
    assert field in [d["field"] for d in err["details"]]


def test_get_task_and_404():
    task = make()
    assert client.get(f"/api/tasks/{task['id']}").json()["id"] == task["id"]
    res = client.get("/api/tasks/missing")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "not_found"


def test_update_partial_bumps_updated_at_and_keeps_rest():
    task = make()
    res = client.put(f"/api/tasks/{task['id']}", json={"status": "completed", "title": "New"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "completed" and body["title"] == "New"
    assert body["description"] == task["description"]
    assert body["createdAt"] == task["createdAt"]
    assert body["updatedAt"] >= task["updatedAt"]


def test_update_can_clear_due_date():
    task = make()
    res = client.put(f"/api/tasks/{task['id']}", json={"dueDate": None})
    assert res.status_code == 200 and res.json()["dueDate"] is None


def test_update_rejects_null_title_and_missing_task():
    task = make()
    assert client.put(f"/api/tasks/{task['id']}", json={"title": None}).status_code == 400
    assert client.put(f"/api/tasks/{task['id']}", json={"title": ""}).status_code == 400
    assert client.put("/api/tasks/missing", json={"title": "x"}).status_code == 404


def test_delete():
    task = make()
    res = client.delete(f"/api/tasks/{task['id']}")
    assert res.status_code == 200 and res.json()["id"] == task["id"]
    assert client.get(f"/api/tasks/{task['id']}").status_code == 404
    assert client.delete(f"/api/tasks/{task['id']}").status_code == 404


def test_list_search_filter_sort_paginate():
    make(title="Alpha", description="write docs", status="pending", priority="low", dueDate="2026-10-03")
    make(title="Beta", description="ship it", status="completed", priority="high", dueDate="2026-10-01")
    make(title="Gamma", description="DOCS review", status="pending", priority="medium", dueDate=None)

    titles = lambda r: [t["title"] for t in r.json()["data"]]

    # default: newest first
    assert titles(client.get("/api/tasks")) == ["Gamma", "Beta", "Alpha"]
    # search is case-insensitive over title + description
    assert sorted(titles(client.get("/api/tasks?q=docs"))) == ["Alpha", "Gamma"]
    # filters
    assert titles(client.get("/api/tasks?status=completed")) == ["Beta"]
    assert titles(client.get("/api/tasks?priority=low")) == ["Alpha"]
    # sort by priority / dueDate (null due dates always last)
    assert titles(client.get("/api/tasks?sortBy=priority&order=desc")) == ["Beta", "Gamma", "Alpha"]
    assert titles(client.get("/api/tasks?sortBy=dueDate&order=asc")) == ["Beta", "Alpha", "Gamma"]
    assert titles(client.get("/api/tasks?sortBy=dueDate&order=desc")) == ["Alpha", "Beta", "Gamma"]

    # pagination
    res = client.get("/api/tasks?limit=2&page=2")
    assert titles(res) == ["Alpha"]
    assert res.json()["meta"] == {"total": 3, "page": 2, "limit": 2, "pages": 2}


def test_list_empty_has_one_page():
    assert client.get("/api/tasks").json()["meta"] == {"total": 0, "page": 1, "limit": 10, "pages": 1}


def test_list_invalid_query_is_400():
    assert client.get("/api/tasks?page=0").status_code == 400
    assert client.get("/api/tasks?limit=1000").status_code == 400
    assert client.get("/api/tasks?status=bogus").status_code == 400


def test_cors_header_for_allowed_origin():
    res = client.get("/api/tasks", headers={"Origin": "http://localhost:5173"})
    assert res.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_overdue_filter_and_not_for_completed_or_undated():
    from datetime import date, timedelta

    past = (date.today() - timedelta(days=2)).isoformat()
    future = (date.today() + timedelta(days=2)).isoformat()
    make(title="Late", dueDate=past, status="pending")
    make(title="Late but started", dueDate=past, status="in_progress")
    make(title="Late but done", dueDate=past, status="completed")
    make(title="On time", dueDate=future)
    make(title="No date", dueDate=None)

    res = client.get("/api/tasks?overdue=true")
    assert sorted(t["title"] for t in res.json()["data"]) == ["Late", "Late but started"]
    assert res.json()["meta"]["total"] == 2
    # overdue=false / absent means no filtering
    assert client.get("/api/tasks?overdue=false").json()["meta"]["total"] == 5
    # combines with other filters
    res = client.get("/api/tasks?overdue=true&status=in_progress")
    assert [t["title"] for t in res.json()["data"]] == ["Late but started"]
