import { useEffect, useMemo, useRef, useState } from 'react'
import { errorMessage } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FilterBar } from '../components/FilterBar'
import { CalendarXIcon, MenuIcon, PlusIcon, SearchIcon } from '../components/icons'
import { Modal } from '../components/Modal'
import { Pagination } from '../components/Pagination'
import { Sidebar } from '../components/Sidebar'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { TaskDetailsDrawer } from '../components/TaskDetailsDrawer'
import { TaskForm } from '../components/TaskForm'
import { TaskList } from '../components/TaskList'
import { useToast } from '../components/Toast'
import { useDebounce } from '../hooks/useDebounce'
import { useHotkeys } from '../hooks/useHotkeys'
import { DEFAULT_QUERY, useTasks } from '../hooks/useTasks'
import { STATUS_LABEL } from '../types/task'
import type { Task, TaskInput } from '../types/task'

type FormTarget = Task | 'new' | null

export default function Dashboard() {
  const { query, updateQuery, overdueCount, data, loading, error, reload, create, update, remove } = useTasks()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  useEffect(() => updateQuery({ q: debouncedSearch.trim() }), [debouncedSearch, updateQuery])

  const [formTarget, setFormTarget] = useState<FormTarget>(null)
  const [viewing, setViewing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const hotkeys = useMemo(
    () => ({
      c: () => setFormTarget('new'),
      '/': () => searchRef.current?.focus(),
    }),
    [],
  )
  useHotkeys(hotkeys)

  const hasFilters = !!(query.q || query.status || query.priority || query.overdue)

  function clearFilters() {
    setSearch('')
    updateQuery({ q: '', status: '', priority: '', overdue: false, sortBy: DEFAULT_QUERY.sortBy, order: DEFAULT_QUERY.order })
  }

  async function handleSubmit(input: TaskInput) {
    if (formTarget === 'new') {
      await create(input)
      toast('success', 'Task created')
    } else if (formTarget) {
      await update(formTarget.id, input)
      toast('success', 'Task updated')
    }
    setFormTarget(null)
  }

  /** Quick property change (status, priority, due date) from a row or the details panel. */
  async function patchTask(task: Task, patch: Partial<TaskInput>): Promise<Task> {
    try {
      return await update(task.id, patch)
    } catch (err) {
      toast('error', errorMessage(err))
      throw err
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await remove(deleting.id)
    } catch (err) {
      toast('error', errorMessage(err))
      throw err
    }
    toast('success', 'Task deleted')
    setDeleting(null)
    setViewing(null)
  }

  const tasks = data?.data ?? []
  const showSkeleton = loading && !data
  const showError = !!error && tasks.length === 0
  const title = query.overdue ? 'Overdue' : query.status ? STATUS_LABEL[query.status] : 'All tasks'

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        query={query}
        overdueCount={overdueCount}
        onStatus={(status) => updateQuery({ status, overdue: false })}
        onOverdue={() => updateQuery({ overdue: true, status: '' })}
        onNewTask={() => setFormTarget('new')}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4 md:px-6">
          <button className="icon-btn md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <MenuIcon size={16} />
          </button>
          <h1 className="flex shrink-0 items-center gap-2 whitespace-nowrap font-medium">
            {title}
            <span className="font-normal text-muted" aria-live="polite">{data ? data.meta.total : ''}</span>
          </h1>
          {overdueCount > 0 && !query.overdue && (
            <button
              className="hidden h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-danger/10 px-2 text-xs font-medium text-danger transition-colors hover:bg-danger/20 sm:inline-flex"
              onClick={() => updateQuery({ overdue: true, status: '' })}
            >
              <CalendarXIcon size={12} /> {overdueCount} overdue
            </button>
          )}

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <SearchIcon size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-subtle" />
              <label htmlFor="search" className="sr-only">Search tasks</label>
              <input
                id="search"
                ref={searchRef}
                type="search"
                placeholder="Search…"
                className="h-7 w-full rounded-md border border-line-strong bg-transparent pl-7 pr-7 text-[13px] outline-none placeholder:text-subtle focus:border-accent sm:w-56 [&::-webkit-search-cancel-button]:hidden"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && (setSearch(''), e.currentTarget.blur())}
              />
              {!search && <span className="kbd pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex">/</span>}
            </div>
            <button className="btn btn-primary shrink-0" onClick={() => setFormTarget('new')} aria-label="New task">
              <PlusIcon size={14} />
              <span className="hidden sm:inline">New task</span>
              <span className="kbd hidden border-white/30 text-white/70 sm:inline-flex">C</span>
            </button>
          </div>
        </header>

        <FilterBar query={query} onChange={updateQuery} onClear={clearFilters} hasFilters={hasFilters} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          {showSkeleton ? (
            <LoadingState />
          ) : showError ? (
            <ErrorState message={error} onRetry={reload} />
          ) : tasks.length === 0 ? (
            <EmptyState filtered={hasFilters} onCreate={() => setFormTarget('new')} onClear={clearFilters} />
          ) : (
            <>
              {error && (
                <p role="alert" className="border-b border-line bg-danger/10 px-5 py-2 text-danger">
                  {error} <button className="underline" onClick={reload}>Retry</button>
                </p>
              )}
              <TaskList
                tasks={tasks}
                busy={loading}
                onOpen={setViewing}
                onEdit={setFormTarget}
                onDelete={setDeleting}
                onPatch={patchTask}
              />
            </>
          )}
        </main>

        {data && <Pagination meta={data.meta} onPage={(page) => updateQuery({ page })} />}
      </div>

      {formTarget && (
        <Modal title={formTarget === 'new' ? 'New task' : `Edit task`} onClose={() => setFormTarget(null)}>
          <TaskForm
            task={formTarget === 'new' ? undefined : formTarget}
            onSubmit={handleSubmit}
            onCancel={() => setFormTarget(null)}
          />
        </Modal>
      )}

      {viewing && !formTarget && !deleting && (
        <TaskDetailsDrawer
          initial={viewing}
          onClose={() => setViewing(null)}
          onDelete={setDeleting}
          onPatch={patchTask}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete “${deleting.title}”? This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
