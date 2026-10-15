import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ApiError, errorMessage } from '../api/client'
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types/task'
import { isOverdue } from '../lib/format'
import { DueDatePicker } from './DueDatePicker'
import { RichTextEditor } from './LazyRichTextEditor'
import { PrioritySelect, StatusSelect } from './TaskProps'

const TITLE_MAX = 120
const DESCRIPTION_MAX = 10000

type Field = 'title' | 'description' | 'dueDate'
type Errors = Partial<Record<Field, string>>

interface Values {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
}

interface Props {
  /** Present when editing; omitted when creating. */
  task?: Task
  onSubmit: (input: TaskInput) => Promise<void>
  onCancel: () => void
}

function validate(v: Values): Errors {
  const errors: Errors = {}
  if (!v.title.trim()) errors.title = 'Title is required'
  else if (v.title.trim().length > TITLE_MAX) errors.title = `Title must be at most ${TITLE_MAX} characters`
  if (!v.description.trim()) errors.description = 'Description is required'
  else if (v.description.trim().length > DESCRIPTION_MAX) errors.description = `Description must be at most ${DESCRIPTION_MAX} characters`
  if (v.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(v.dueDate)) errors.dueDate = 'Enter a valid date'
  return errors
}

export function TaskForm({ task, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Values>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'pending',
    priority: task?.priority ?? 'medium',
    dueDate: task?.dueDate ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function submit() {
    const found = validate(values)
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
      })
    } catch (err) {
      // Map server-side validation errors back onto the fields they belong to.
      if (err instanceof ApiError && err.details.length > 0) {
        const mapped: Errors = {}
        for (const d of err.details) {
          if (d.field === 'title' || d.field === 'description' || d.field === 'dueDate') mapped[d.field] = d.message
        }
        setErrors(mapped)
        if (Object.keys(mapped).length === 0) setFormError(err.message)
      } else {
        setFormError(errorMessage(err))
      }
      setSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void submit()
  }

  // Cmd/Ctrl+Enter saves, like Linear.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} onKeyDown={onKeyDown} noValidate>
      <div className="px-4 pb-4">
        {formError && (
          <p role="alert" className="mb-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
            {formError}
          </p>
        )}

        <label htmlFor="title" className="sr-only">Title</label>
        <input
          id="title"
          className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-subtle"
          placeholder="Task title"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              formRef.current?.querySelector<HTMLElement>('.editor')?.focus()
            }
          }}
          autoFocus
        />
        {errors.title && <p id="title-error" className="mt-1 text-xs text-danger">{errors.title}</p>}

        <RichTextEditor
          className="mt-3 min-h-[120px] cursor-text"
          initialValue={values.description}
          onChange={(md) => set('description', md)}
          placeholder="Add description… (Markdown supported)"
          ariaLabel="Description"
        />
        {errors.description && <p id="description-error" className="mt-1 text-xs text-danger">{errors.description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusSelect variant="chip" value={values.status} onChange={(v) => set('status', v)} />
          <PrioritySelect variant="chip" value={values.priority} onChange={(v) => set('priority', v)} />
          <DueDatePicker
            value={values.dueDate || null}
            overdue={isOverdue(values.dueDate || null, values.status)}
            onChange={(v) => set('dueDate', v ?? '')}
          />
        </div>
        {errors.dueDate && <p className="mt-1 text-xs text-danger">{errors.dueDate}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  )
}
