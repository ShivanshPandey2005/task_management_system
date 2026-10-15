import type { ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'
import { STATUSES, STATUS_LABEL } from '../types/task'
import type { TaskQuery, TaskStatus } from '../types/task'
import { Logo } from './Logo'
import { CalendarXIcon, ListIcon, MoonIcon, PlusIcon, StatusIcon, SunIcon } from './icons'

interface Props {
  query: TaskQuery
  overdueCount: number
  onStatus: (status: TaskStatus | '') => void
  onOverdue: () => void
  onNewTask: () => void
  open: boolean
  onClose: () => void
}

function NavItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent ${
        active ? 'bg-active text-fg' : 'text-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}

export function Sidebar({ query, overdueCount, onStatus, onOverdue, onNewTask, open, onClose }: Props) {
  const { theme, toggle } = useTheme()
  const select = (s: TaskStatus | '') => {
    onStatus(s)
    onClose()
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-line bg-sidebar px-2 py-3 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-7 items-center gap-2 px-2">
          <Logo />
          <span className="flex-1 truncate font-medium">Parallel</span>
          <button className="icon-btn" onClick={() => { onNewTask(); onClose() }} aria-label="New task" title="New task (C)">
            <PlusIcon size={15} />
          </button>
        </div>

        <nav className="mt-4 space-y-0.5" aria-label="Views">
          <NavItem active={!query.status && !query.overdue} onClick={() => select('')}>
            <ListIcon size={14} className="shrink-0" /> All tasks
          </NavItem>
          <NavItem active={query.overdue} onClick={() => { onOverdue(); onClose() }}>
            <CalendarXIcon size={14} className="shrink-0 text-danger" /> Overdue
            {overdueCount > 0 && (
              <span className="ml-auto rounded-full bg-danger/15 px-1.5 text-xs font-medium text-danger" aria-label={`${overdueCount} overdue`}>
                {overdueCount}
              </span>
            )}
          </NavItem>
        </nav>

        <h2 className="mt-5 px-2 pb-1 text-xs font-medium text-subtle">Status</h2>
        <nav className="space-y-0.5" aria-label="Status views">
          {STATUSES.map((s) => (
            <NavItem key={s} active={query.status === s && !query.overdue} onClick={() => select(s)}>
              <StatusIcon status={s} /> {STATUS_LABEL[s]}
            </NavItem>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-2 px-2 text-xs text-subtle">
            <span className="kbd">C</span> new task <span className="kbd ml-1">/</span> search
          </div>
          <button
            onClick={toggle}
            className="flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-muted transition-colors hover:bg-hover hover:text-fg"
          >
            {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>
    </>
  )
}
