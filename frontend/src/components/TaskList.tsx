import { STATUSES, STATUS_LABEL } from '../types/task'
import type { Task, TaskInput } from '../types/task'
import { StatusIcon } from './icons'
import { TaskRow } from './TaskRow'

interface Props {
  tasks: Task[]
  /** Dim the list while a refetch is in flight. */
  busy: boolean
  onOpen: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onPatch: (task: Task, patch: Partial<TaskInput>) => Promise<unknown>
}

// Linear lists work in progress first, finished work last.
const GROUP_ORDER = ['in_progress', 'pending', 'completed'] as const satisfies readonly (typeof STATUSES)[number][]

/** Groups the current page by status; the server-side sort still applies within each group. */
export function TaskList({ tasks, busy, ...handlers }: Props) {
  return (
    <div className={`transition-opacity ${busy ? 'opacity-60' : ''}`} aria-busy={busy}>
      {GROUP_ORDER.map((status) => {
        const group = tasks.filter((t) => t.status === status)
        if (group.length === 0) return null
        return (
          <section key={status} aria-label={STATUS_LABEL[status]}>
            <div className="flex h-9 items-center gap-2 border-b border-line bg-sidebar/60 px-3 font-medium md:px-5">
              <StatusIcon status={status} />
              {STATUS_LABEL[status]}
              <span className="font-normal text-muted">{group.length}</span>
            </div>
            {group.map((task) => (
              <TaskRow key={task.id} task={task} {...handlers} />
            ))}
          </section>
        )
      })}
    </div>
  )
}
