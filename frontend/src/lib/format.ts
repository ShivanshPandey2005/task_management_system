/** Parse a YYYY-MM-DD string as a local date (new Date('2026-10-05') would be UTC and can shift a day). */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDueDate(value: string | null): string {
  if (!value) return 'No due date'
  return parseDateOnly(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'completed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parseDateOnly(dueDate) < today
}

/** "Oct 17", with the year only when it isn't the current one. */
export function formatShortDate(value: string, dateOnly = false): string {
  const d = dateOnly ? parseDateOnly(value) : new Date(value)
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === new Date().getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }
  return d.toLocaleDateString(undefined, opts)
}

/** Short display id derived from the uuid, e.g. TSK-A1B2. */
export function shortId(id: string): string {
  return `TSK-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** "Fri, 16 Oct" */
export function formatWeekdayDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/**
 * Parse quick due-date input like Linear: "today", "tomorrow", "24h", "7 days", "2w",
 * "Feb 9", "9 Feb 2027" or "2026-10-30". Returns YYYY-MM-DD, or null if it can't be understood.
 */
export function parseDueInput(text: string): string | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  if (t === 'today') return addDaysISO(0)
  if (t === 'tomorrow' || t === 'tmr') return addDaysISO(1)

  let m = t.match(/^(\d+)\s*(h|hr|hrs|hours?)$/)
  if (m) return toISODate(new Date(Date.now() + Number(m[1]) * 3600_000))
  m = t.match(/^(\d+)\s*(d|days?)$/)
  if (m) return addDaysISO(Number(m[1]))
  m = t.match(/^(\d+)\s*(w|wks?|weeks?)$/)
  if (m) return addDaysISO(Number(m[1]) * 7)

  m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return validDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

  m = t.match(/^([a-z]{3,9})\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?$/)
  let mon: string | undefined, day: string | undefined, year: string | undefined
  if (m) [, mon, day, year] = m
  else {
    const m2 = t.match(/^(\d{1,2})\s+([a-z]{3,9})\.?(?:,?\s*(\d{4}))?$/)
    if (m2) [, day, mon, year] = m2
  }
  if (!mon || !day) return null
  const month = MONTHS.indexOf(mon.slice(0, 3))
  if (month < 0) return null
  if (year) return validDate(Number(year), month, Number(day))
  // No year given: use the next occurrence of that date.
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const thisYear = validDate(now.getFullYear(), month, Number(day))
  if (thisYear && parseDateOnly(thisYear) >= now) return thisYear
  return validDate(now.getFullYear() + 1, month, Number(day))
}

function validDate(y: number, m: number, d: number): string | null {
  const date = new Date(y, m, d)
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? toISODate(date) : null
}
