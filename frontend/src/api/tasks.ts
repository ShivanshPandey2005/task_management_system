import type { Task, TaskInput, TaskList, TaskQuery } from '../types/task'
import { request } from './client'

export function listTasks(query: TaskQuery, signal?: AbortSignal): Promise<TaskList> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== '' && value !== undefined && value !== false) params.set(key, String(value))
  }
  return request<TaskList>(`/api/tasks?${params}`, { signal })
}

export const getTask = (id: string, signal?: AbortSignal) =>
  request<Task>(`/api/tasks/${encodeURIComponent(id)}`, { signal })

export const createTask = (input: TaskInput) =>
  request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) })

/** PUT with only the fields to change; the API leaves omitted fields untouched. */
export const updateTask = (id: string, input: Partial<TaskInput>) =>
  request<Task>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })

export const deleteTask = (id: string) =>
  request<{ message: string; id: string }>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
