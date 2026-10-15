import { PRIORITY_LABEL, STATUS_LABEL } from '../types/task'
import type { SortBy, SortOrder, TaskPriority, TaskQuery, TaskStatus } from '../types/task'
import { CalendarXIcon, ChevronDownIcon, SortIcon, XIcon } from './icons'
import { SelectMenu } from './SelectMenu'
import type { Option } from './SelectMenu'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from './TaskProps'

const SORT_OPTIONS: Option<string>[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'dueDate:asc', label: 'Due soonest' },
  { value: 'dueDate:desc', label: 'Due latest' },
  { value: 'priority:desc', label: 'Priority: high → low' },
  { value: 'priority:asc', label: 'Priority: low → high' },
]

const withAny = <T extends string>(label: string, opts: Option<T>[]): Option<T | ''>[] => [{ value: '', label }, ...opts]

interface Props {
  query: TaskQuery
  onChange: (patch: Partial<TaskQuery>) => void
  onClear: () => void
  hasFilters: boolean
}

export function FilterBar({ query, onChange, onClear, hasFilters }: Props) {
  const sortValue = `${query.sortBy}:${query.order}`
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortValue)?.label

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-line px-4 md:px-6">
      <SelectMenu<TaskStatus | ''>
        value={query.status}
        options={withAny('Any status', STATUS_OPTIONS)}
        onChange={(status) => onChange({ status })}
        ariaLabel="Filter by status"
        buttonClassName={`chip ${query.status ? 'chip-active' : ''}`}
        button={<>{query.status ? `Status: ${STATUS_LABEL[query.status]}` : 'Status'}<ChevronDownIcon size={12} /></>}
      />
      <SelectMenu<TaskPriority | ''>
        value={query.priority}
        options={withAny('Any priority', PRIORITY_OPTIONS)}
        onChange={(priority) => onChange({ priority })}
        ariaLabel="Filter by priority"
        buttonClassName={`chip ${query.priority ? 'chip-active' : ''}`}
        button={<>{query.priority ? `Priority: ${PRIORITY_LABEL[query.priority]}` : 'Priority'}<ChevronDownIcon size={12} /></>}
      />
      <button
        className={`chip ${query.overdue ? 'border-danger/50 bg-danger/10 !text-danger' : ''}`}
        aria-pressed={query.overdue}
        onClick={() => onChange({ overdue: !query.overdue })}
      >
        <CalendarXIcon size={13} /> Overdue
      </button>
      {hasFilters && (
        <button className="btn btn-ghost h-7 px-2 text-xs" onClick={onClear}>
          <XIcon size={12} /> Clear
        </button>
      )}

      <div className="ml-auto">
        <SelectMenu<string>
          value={sortValue}
          options={SORT_OPTIONS}
          onChange={(v) => {
            const [sortBy, order] = v.split(':') as [SortBy, SortOrder]
            onChange({ sortBy, order })
          }}
          ariaLabel="Sort tasks"
          align="right"
          buttonClassName="chip"
          button={<><SortIcon size={13} />{sortLabel}</>}
        />
      </div>
    </div>
  )
}
