import type { ReactNode } from 'react'
import { AlertIcon, ListIcon, PlusIcon, SearchIcon } from './icons'

export function LoadingState() {
  return (
    <div role="status" aria-label="Loading tasks">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex h-11 animate-pulse items-center gap-3 border-b border-line px-5">
          <div className="size-3.5 rounded bg-active" />
          <div className="hidden h-2.5 w-14 rounded bg-active sm:block" />
          <div className="size-3.5 rounded-full bg-active" />
          <div className="h-2.5 rounded bg-active" style={{ width: `${30 + ((i * 17) % 40)}%` }} />
        </div>
      ))}
    </div>
  )
}

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-24 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg border border-line-strong text-muted">{icon}</div>
      <h2 className="mt-4 text-sm font-medium">{title}</h2>
      {children}
    </div>
  )
}

export function EmptyState({ filtered, onCreate, onClear }: { filtered: boolean; onCreate: () => void; onClear: () => void }) {
  return filtered ? (
    <Panel icon={<SearchIcon size={18} />} title="No tasks match your filters">
      <p className="mt-1 max-w-xs text-muted">Try a different search term or clear the filters.</p>
      <button className="btn btn-secondary mt-5" onClick={onClear}>Clear filters</button>
    </Panel>
  ) : (
    <Panel icon={<ListIcon size={18} />} title="No tasks yet">
      <p className="mt-1 max-w-xs text-muted">Tasks you create will show up here. Press <span className="kbd">C</span> to add one.</p>
      <button className="btn btn-primary mt-5" onClick={onCreate}><PlusIcon size={14} /> New task</button>
    </Panel>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <Panel icon={<AlertIcon size={18} />} title="Couldn't load tasks">
        <p className="mt-1 max-w-xs text-muted">{message}</p>
        <button className="btn btn-secondary mt-5" onClick={onRetry}>Try again</button>
      </Panel>
    </div>
  )
}
