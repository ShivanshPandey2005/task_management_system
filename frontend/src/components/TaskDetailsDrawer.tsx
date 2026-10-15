import { useEffect, useRef, useState } from 'react'
import { getTask } from '../api/tasks'
import { errorMessage } from '../api/client'
import { formatDateTime, isOverdue, shortId } from '../lib/format'
import type { Task, TaskInput } from '../types/task'
import { TrashIcon } from './icons'
import { DueDatePicker } from './DueDatePicker'
import { Modal } from './Modal'
import { RichTextEditor } from './LazyRichTextEditor'
import { PrioritySelect, StatusSelect } from './TaskProps'

interface Props {
  /** The list's copy, shown immediately while the fresh copy loads. */
  initial: Task
  onClose: () => void
  onDelete: (task: Task) => void
  onPatch: (task: Task, patch: Partial<TaskInput>) => Promise<Task>
}

export function TaskDetailsDrawer({ initial, onClose, onDelete, onPatch }: Props) {
  const [task, setTask] = useState<Task>(initial)
  const [error, setError] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState(initial.title)
  const [fieldError, setFieldError] = useState<string | null>(null)

  // Handlers read the latest task through a ref so debounced/unmount saves never use a stale copy.
  const taskRef = useRef(task)
  useEffect(() => {
    taskRef.current = task
  })

  useEffect(() => {
    const controller = new AbortController()
    getTask(initial.id, controller.signal)
      .then(setTask)
      .catch((err) => !controller.signal.aborted && setError(errorMessage(err)))
    return () => controller.abort()
  }, [initial.id])

  /** Optimistic property change; rolls back if the API rejects it. */
  async function patch(p: Partial<TaskInput>) {
    const before = taskRef.current
    setTask({ ...before, ...p })
    try {
      setTask(await onPatch(before, p))
    } catch {
      setTask(before)
    }
  }

  // Description autosaves shortly after typing stops, and on blur/close, like Linear.
  const pendingDescription = useRef<string | null>(null)
  const descTimer = useRef<number | undefined>(undefined)

  function flushDescription() {
    window.clearTimeout(descTimer.current)
    const md = pendingDescription.current
    pendingDescription.current = null
    if (md === null) return
    if (!md.trim()) {
      setFieldError("Description can't be empty")
      return
    }
    setFieldError(null)
    if (md.trim() !== taskRef.current.description.trim()) void patch({ description: md.trim() })
  }

  function queueDescription(md: string) {
    pendingDescription.current = md
    window.clearTimeout(descTimer.current)
    descTimer.current = window.setTimeout(flushDescription, 700)
  }

  function commitTitle() {
    const next = titleDraft.trim()
    if (!next) {
      setTitleDraft(taskRef.current.title)
    } else if (next !== taskRef.current.title) {
      void patch({ title: next })
    }
  }

  // Save anything still pending when the panel closes.
  const flushRef = useRef<() => void>(() => {})
  useEffect(() => {
    flushRef.current = () => {
      flushDescription()
      commitTitle()
    }
  })
  useEffect(() => () => flushRef.current(), [])

  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <Modal title={shortId(task.id)} variant="drawer" onClose={onClose}>
      <div className="px-5 pb-6">
        {error && (
          <p role="alert" className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
            {error}
          </p>
        )}

        <label htmlFor="drawer-title" className="sr-only">Title</label>
        <input
          id="drawer-title"
          className="w-full rounded-md bg-transparent text-xl font-semibold leading-snug outline-none"
          value={titleDraft}
          maxLength={120}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />

        <RichTextEditor
          className="mt-3 min-h-[96px] cursor-text"
          initialValue={initial.description}
          onChange={queueDescription}
          onBlur={flushDescription}
          placeholder="Add description…"
          ariaLabel="Description"
        />
        {fieldError && <p role="alert" className="mt-1 text-xs text-danger">{fieldError}</p>}

        <h4 className="mb-2 mt-8 text-xs font-medium text-subtle">Properties</h4>
        <dl className="space-y-1">
          <Row label="Status">
            <StatusSelect variant="full" value={task.status} onChange={(status) => patch({ status })} />
          </Row>
          <Row label="Priority">
            <PrioritySelect variant="full" value={task.priority} onChange={(priority) => patch({ priority })} />
          </Row>
          <Row label="Due date">
            <DueDatePicker variant="prop" value={task.dueDate} overdue={overdue} onChange={(dueDate) => patch({ dueDate })} />
          </Row>
        </dl>

        <h4 className="mb-2 mt-8 text-xs font-medium text-subtle">Activity</h4>
        <dl className="space-y-1.5 text-muted">
          <div className="flex gap-3"><dt className="w-24 shrink-0">Created</dt><dd>{formatDateTime(task.createdAt)}</dd></div>
          <div className="flex gap-3"><dt className="w-24 shrink-0">Updated</dt><dd>{formatDateTime(task.updatedAt)}</dd></div>
          <div className="flex gap-3"><dt className="w-24 shrink-0">ID</dt><dd className="break-all font-mono text-xs">{task.id}</dd></div>
        </dl>

        <div className="mt-8 flex gap-2">
          <button className="btn btn-ghost hover:text-danger" onClick={() => onDelete(task)}><TrashIcon size={14} /> Delete</button>
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="flex items-center gap-1">{children}</dd>
    </div>
  )
}
