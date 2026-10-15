"""Sample tasks for a full-stack engineer's backlog. Bodies are Markdown."""
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional

from app.schemas.task import TaskPriority, TaskStatus

P, I, D = TaskStatus.pending, TaskStatus.in_progress, TaskStatus.completed
LOW, MED, HIGH = TaskPriority.low, TaskPriority.medium, TaskPriority.high

# (title, status, priority, due in days from today or None, created N hours ago, body)
_TASKS = [
    (
        "Fix N+1 queries on the orders list endpoint",
        I, HIGH, 1, 6,
        """## Problem

`GET /api/orders` takes **2.8s** at p95. Tracing shows one query per order to load its line items.

## Plan

- [x] Reproduce locally with the 10k-order fixture
- [x] Add query logging to confirm the N+1
- [ ] Batch-load line items with a single `IN` query
- [ ] Add a regression test that asserts the query count
- [ ] Re-run the load test and record before/after numbers

## Notes

> Target: p95 under **300ms** with 50 concurrent users.

```python
items = db.query(LineItem).filter(LineItem.order_id.in_(order_ids)).all()
by_order = defaultdict(list)
for item in items:
    by_order[item.order_id].append(item)
```""",
    ),
    (
        "Add JWT refresh-token rotation",
        I, HIGH, 3, 30,
        """## Context

Access tokens currently live for 24h and can't be revoked. Move to **short-lived access tokens (15 min)** plus **rotating refresh tokens**.

## Requirements

1. Access token TTL of 15 minutes
2. Refresh token is single-use; every refresh issues a new pair
3. Reusing an old refresh token revokes the whole token family
4. Refresh token stored in an `HttpOnly`, `SameSite=Strict` cookie

## Checklist

- [x] Design the token table and rotation flow
- [x] `POST /auth/refresh` endpoint
- [ ] Reuse detection and family revocation
- [ ] Frontend: silent refresh on `401` with a single in-flight request
- [ ] Update API docs""",
    ),
    (
        "Build the responsive dashboard layout",
        I, MED, 4, 52,
        """Implement the new dashboard shell from the design file.

### Scope

- Collapsible sidebar (persisted in `localStorage`)
- Top bar with search and user menu
- Content area with a **12-column grid** and breakpoints at 640 / 1024 / 1280

### Acceptance criteria

- [x] Works at 375px with no horizontal scroll
- [ ] Sidebar becomes a slide-over under 768px
- [ ] Keyboard navigable, visible focus rings
- [ ] Lighthouse accessibility score **95+**""",
    ),
    (
        "Set up CI pipeline with GitHub Actions",
        P, HIGH, -2, 20,
        """## Goal

Every pull request runs lint, type-check, tests and a build before it can merge.

## Jobs

1. **backend**: `ruff`, `mypy`, `pytest` with coverage
2. **frontend**: `eslint`, `tsc --noEmit`, `vitest`, `vite build`
3. **e2e**: Playwright against a preview environment (main only)

## Requirements

- Cache `pip` and `npm` dependencies keyed on the lockfiles
- Fail the PR if coverage drops below **80%**
- Post the coverage summary as a PR comment

```yaml
on:
  pull_request:
  push:
    branches: [main]
```""",
    ),
    (
        "Write integration tests for the payments flow",
        P, HIGH, -1, 40,
        """The checkout flow has no automated coverage and broke twice last month.

## Cases to cover

- [ ] Successful card payment creates an order and sends the receipt email
- [ ] Declined card shows an inline error and does **not** create an order
- [ ] Webhook retries are idempotent (same event id processed once)
- [ ] Refund updates order status and inventory
- [ ] Network timeout during capture leaves the order in `pending`

## Approach

Use the payment provider's **test mode** and recorded webhook fixtures. Run against an ephemeral Postgres via `docker compose`.""",
    ),
    (
        "Migrate the users table to add soft deletes",
        P, MED, 7, 70,
        """## Why

Hard deletes break audit history and make GDPR export requests hard to answer.

## Steps

1. Add nullable `deleted_at timestamptz` column with an index
2. Backfill: nothing to do, all existing rows are active
3. Update repositories to filter `deleted_at IS NULL` by default
4. Add an admin-only `include_deleted` option
5. Nightly job purges rows deleted more than **30 days** ago

> Run the migration during the low-traffic window and keep it reversible.""",
    ),
    (
        "Add rate limiting to public API endpoints",
        P, MED, 9, 90,
        """Protect unauthenticated endpoints from abuse.

- **Login / signup:** 5 requests per minute per IP
- **Public search:** 60 requests per minute per IP
- Return `429` with a `Retry-After` header
- Use a Redis sliding window so limits hold across instances

### Open question

Do we rate limit by IP only, or also by API key for partner traffic?""",
    ),
    (
        "Implement optimistic UI updates for task actions",
        P, LOW, 12, 110,
        """Right now the list waits for the server before reflecting changes, which feels slow on mobile networks.

### Do

- [ ] Update status/priority immediately, roll back on error
- [ ] Show an error toast when a rollback happens
- [ ] Keep a pending indicator on the row until the request settles

### Don't

- Don't optimistically **delete** without an undo affordance""",
    ),
    (
        "Add Sentry error tracking to frontend and backend",
        P, LOW, None, 130,
        """Get real visibility into production errors.

- [ ] Create projects and DSNs for `web` and `api`
- [ ] Upload source maps in the CI build
- [ ] Tag events with release and environment
- [ ] Scrub emails and tokens from breadcrumbs
- [ ] Alert the on-call channel for new issues with more than 10 events/hour""",
    ),
    (
        "Containerize the app with Docker Compose",
        D, MED, -3, 200,
        """## Done

- [x] Multi-stage `Dockerfile` for the API (final image **~120MB**)
- [x] Nginx container serving the built frontend and proxying `/api`
- [x] `docker compose up` brings up app, Postgres and Redis
- [x] Healthchecks and `depends_on` conditions

## Run it

```bash
docker compose up --build
```

Frontend is on port **8080**, API docs at `/docs`.""",
    ),
    (
        "Design the REST API for task management",
        D, HIGH, -6, 260,
        """Defined the resource model and endpoints and reviewed them with the team.

### Endpoints

- `GET /api/tasks` with search, filter, sort and pagination
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}` (partial updates allowed)
- `DELETE /api/tasks/{id}`

### Decisions

- Validation errors return **400** with a field-level `details` array
- All JSON uses **camelCase**
- IDs are UUIDs""",
    ),
    (
        "Fix mobile Safari scroll bug in the modal",
        D, MED, -2, 150,
        """## Symptom

On iOS Safari the page behind the modal scrolled when the user swiped inside it.

## Cause

`overflow: hidden` on `body` is ignored by iOS when the content is taller than the viewport.

## Fix

Lock scroll with `position: fixed` on the body and restore the scroll offset on close. Verified on iOS 17 and 18 and Android Chrome.""",
    ),
    (
        "Upgrade React to 19 and fix deprecations",
        D, LOW, -9, 300,
        """- [x] Bump `react` and `react-dom`
- [x] Replace `forwardRef` usage with `ref` as a prop
- [x] Remove legacy `defaultProps` on function components
- [x] Fix strict-mode double-effect issues in the data hooks
- [x] Full regression pass on the main flows

No user-facing changes expected.""",
    ),
    (
        "Add database indexes for slow search queries",
        D, HIGH, -1, 100,
        """Search was doing a sequential scan on `tasks`.

### Changes

- Added a **GIN** index on `to_tsvector('english', title || ' ' || description)`
- Added a composite index on `(status, priority, created_at DESC)`

### Result

Search p95 dropped from **1.4s** to **38ms** on the staging dataset (250k rows).""",
    ),
]


def build_seed() -> List[Dict]:
    now = datetime.now(timezone.utc)
    today = date.today()
    out = []
    for title, status, priority, due_in, hours_ago, body in _TASKS:
        created = now - timedelta(hours=hours_ago)
        out.append({
            "title": title,
            "description": body,
            "status": status,
            "priority": priority,
            "due_date": today + timedelta(days=due_in) if due_in is not None else None,
            "created_at": created,
            # Anything finished or in flight was touched after creation.
            "updated_at": created + timedelta(hours=min(hours_ago, 4)) if status != P else created,
        })
    return out
