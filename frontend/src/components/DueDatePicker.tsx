import { useState } from 'react'
import { addDaysISO, formatShortDate, formatWeekdayDate, parseDueInput } from '../lib/format'
import { CalendarIcon, CalendarXIcon } from './icons'
import { Popover } from './Popover'

interface Props {
  value: string | null
  /** Past due and not completed: renders red, like Linear. */
  overdue: boolean
  onChange: (value: string | null) => void
  /** "chip" for forms, "prop" for the details panel. */
  variant?: 'chip' | 'prop'
}

const itemClass =
  'flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-hover focus-visible:bg-hover focus-visible:outline-none'

export function DueDatePicker({ value, overdue, onChange, variant = 'chip' }: Props) {
  const label = value ? `${formatShortDate(value, true)}${overdue ? ' · Overdue' : ''}` : 'Due date'
  const base = variant === 'chip' ? 'chip' : 'prop-btn'
  const tone = overdue
    ? variant === 'chip'
      ? 'border-danger/40 bg-danger/10 !text-danger hover:bg-danger/15'
      : '!text-danger'
    : value && variant === 'chip'
      ? '!text-fg'
      : variant === 'prop' && !value
        ? '!text-muted'
        : ''

  return (
    <Popover
      ariaLabel={value ? `Due date: ${label}` : 'Set due date'}
      buttonClassName={`${base} ${tone}`}
      button={
        <>
          {overdue ? <CalendarXIcon size={13} /> : <CalendarIcon size={13} />}
          {label}
        </>
      }
    >
      {(close) => <Menu value={value} onPick={(v) => { close(); onChange(v) }} />}
    </Popover>
  )
}

function Menu({ value, onPick }: { value: string | null; onPick: (value: string | null) => void }) {
  const [text, setText] = useState('')
  const [custom, setCustom] = useState(false)
  const parsed = parseDueInput(text)
  const invalid = text.trim() !== '' && !parsed

  const quick = [
    { label: 'Today', date: addDaysISO(0) },
    { label: 'Tomorrow', date: addDaysISO(1) },
    { label: 'In one week', date: addDaysISO(7) },
  ]

  return (
    <div className="w-64">
      <div className="px-1 pb-1">
        <input
          data-autofocus
          className={`h-7 w-full rounded-md bg-transparent px-2 text-[13px] outline-none placeholder:text-subtle ${invalid ? 'text-danger' : ''}`}
          placeholder="Try: 24h, 7 days, Feb 9"
          aria-label="Type a due date"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && parsed) {
              e.preventDefault()
              onPick(parsed)
            }
          }}
        />
        {parsed && (
          <button className={`${itemClass} mt-0.5 bg-hover`} onClick={() => onPick(parsed)}>
            <CalendarIcon size={14} className="text-muted" />
            <span className="flex-1">{formatWeekdayDate(parsed)}</span>
            <span className="kbd">↵</span>
          </button>
        )}
      </div>
      <div className="border-t border-line pt-1">
        {value && (
          <button className={itemClass} onClick={() => onPick(null)}>
            <CalendarXIcon size={14} className="text-muted" />
            <span className="flex-1">Remove due date</span>
            <span className="text-xs text-subtle">{formatWeekdayDate(value)}</span>
          </button>
        )}
        {quick.map((q) => (
          <button key={q.label} className={itemClass} onClick={() => onPick(q.date)}>
            <CalendarIcon size={14} className="text-muted" />
            <span className="flex-1">{q.label}</span>
            <span className="text-xs text-subtle">{formatWeekdayDate(q.date)}</span>
          </button>
        ))}
        {custom ? (
          <div className="px-2 py-1">
            <input
              type="date"
              data-autofocus
              aria-label="Custom due date"
              className="h-7 w-full rounded-md border border-line-strong bg-transparent px-2 text-[13px] outline-none focus:border-accent"
              value={value ?? ''}
              onChange={(e) => e.target.value && onPick(e.target.value)}
            />
          </div>
        ) : (
          <button className={itemClass} onClick={() => setCustom(true)}>
            <CalendarIcon size={14} className="text-muted" />
            Custom…
          </button>
        )}
      </div>
    </div>
  )
}
