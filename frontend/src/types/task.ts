export const STATUSES = ['pending', 'in_progress', 'completed'] as const
export type TaskStatus = (typeof STATUSES)[number]

export const PRIORITIES = ['low', 'medium', 'high'] as const
export type TaskPriority = (typeof PRIORITIES)[number]

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

/** Payload for create and update. */
export interface TaskInput {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
}

export type SortBy = 'createdAt' | 'priority' | 'dueDate'
export type SortOrder = 'asc' | 'desc'

export interface TaskQuery {
  q: string
  status: TaskStatus | ''
  priority: TaskPriority | ''
  /** Past due and not completed. */
  overdue: boolean
  sortBy: SortBy
  order: SortOrder
  page: number
  limit: number
}

export interface PageMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface TaskList {
  data: Task[]
  meta: PageMeta
}
