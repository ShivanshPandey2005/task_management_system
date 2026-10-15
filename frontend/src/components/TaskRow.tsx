import { formatShortDate, isOverdue, shortId } from '../lib/format'
import type { Task, TaskInput } from '../types/task'
import { CalendarIcon, CalendarXIcon, PencilIcon, TrashIcon } from './icons'
import { PrioritySelect, StatusSelect } from './TaskProps'

interface Props {
  task: Task
  onOpen: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onPatch: (task: Task, patch: Partial<TaskInput>) => Promise<unknown>
}

export function TaskRow({ task, onOpen, onEdit, onDelete, onPatch }: Props) {
  const overdue = isOverdue(task.dueDate, task.status)
  // Changes are surfaced by the parent (toast); swallow the rethrow here.
  const patch = (p: Partial<TaskInput>) => onPatch(task, p).catch(() => {})

  return (
    <div
      className="group flex h-11 cursor-pointer items-center gap-2 border-b border-line px-3 transition-colors hover:bg-hover md:px-5"
      onClick={() => onOpen(task)}
    >
      <PrioritySelect value={task.priority} onChange={(priority) => patch({ priority })} />
      <span className="hidden w-[68px] shrink-0 text-xs text-muted tabular-nums sm:block">{shortId(task.id)}</span>
      <StatusSelect value={task.status} onChange={(status) => patch({ status })} />

      <button className="min-w-0 flex-1 cursor-pointer truncate pl-1 text-left font-medium focus-visible:outline-2 focus-visible:outline-accent">
        <span className={task.status === 'completed' ? 'text-muted' : ''}>{task.title}</span>
      </button>

      {task.dueDate && (
        <span
          className={`hidden shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs sm:inline-flex ${
            overdue ? 'border-danger/40 bg-danger/10 font-medium text-danger' : 'border-line-strong text-muted'
          }`}
          title={overdue ? 'Overdue' : 'Due date'}
        >
          {overdue ? <CalendarXIcon size={12} /> : <CalendarIcon size={12} />}
          {formatShortDate(task.dueDate, true)}
        </span>
      )}
      <span className="hidden w-14 shrink-0 text-right text-xs text-muted md:block" title="Created">
        {formatShortDate(task.createdAt)}
      </span>

      <div className="hidden shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 md:flex">
        <button className="icon-btn" aria-label={`Edit ${task.title}`} onClick={(e) => { e.stopPropagation(); onEdit(task) }}>
          <PencilIcon size={14} />
        </button>
        <button className="icon-btn hover:text-danger" aria-label={`Delete ${task.title}`} onClick={(e) => { e.stopPropagation(); onDelete(task) }}>
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  )
}
