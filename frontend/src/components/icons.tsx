import type { ReactNode, SVGProps } from 'react'
import type { TaskPriority, TaskStatus } from '../types/task'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 16, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M8 3v10M3 8h10" /></Svg>
export const SearchIcon = (p: IconProps) => <Svg {...p}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></Svg>
export const CalendarIcon = (p: IconProps) => <Svg {...p}><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 7h12M5 1.5v3M11 1.5v3" /></Svg>
export const CalendarXIcon = (p: IconProps) => <Svg {...p}><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 7h12M5 1.5v3M11 1.5v3M6.5 9.5l3 3M9.5 9.5l-3 3" /></Svg>
export const PencilIcon = (p: IconProps) => <Svg {...p}><path d="m10.5 2.5 3 3L5 14H2v-3z" /></Svg>
export const TrashIcon = (p: IconProps) => <Svg {...p}><path d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.5 8.5h6l.5-8.5" /></Svg>
export const MenuIcon = (p: IconProps) => <Svg {...p}><path d="M2 4h12M2 8h12M2 12h12" /></Svg>
export const XIcon = (p: IconProps) => <Svg {...p}><path d="m4 4 8 8M12 4l-8 8" /></Svg>
export const ChevronDownIcon = (p: IconProps) => <Svg {...p}><path d="m4 6 4 4 4-4" /></Svg>
export const CheckIcon = (p: IconProps) => <Svg {...p}><path d="m3.5 8.5 3 3 6-7" /></Svg>
export const ListIcon = (p: IconProps) => <Svg {...p}><path d="M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01" /></Svg>
export const SortIcon = (p: IconProps) => <Svg {...p}><path d="M5 3v10m0 0L2.5 10.5M5 13l2.5-2.5M11 13V3m0 0L8.5 5.5M11 3l2.5 2.5" /></Svg>
export const SunIcon = (p: IconProps) => <Svg {...p}><circle cx="8" cy="8" r="2.8" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" /></Svg>
export const MoonIcon = (p: IconProps) => <Svg {...p}><path d="M13.5 9.5A6 6 0 1 1 6.5 2.5a5 5 0 0 0 7 7z" /></Svg>
export const AlertIcon = (p: IconProps) => <Svg {...p}><circle cx="8" cy="8" r="6" /><path d="M8 5v3.5M8 11h.01" /></Svg>

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending: '#9a9ea6',
  in_progress: '#f2c94c',
  completed: '#5e6ad2',
}

/** Linear-style status glyphs: empty circle, half-filled circle, filled check. */
export function StatusIcon({ status, size = 14 }: { status: TaskStatus; size?: number }) {
  const color = STATUS_COLOR[status]
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
      {status === 'completed' ? (
        <>
          <circle cx="7" cy="7" r="6.25" fill={color} />
          <path d="m4.3 7.2 1.9 1.9 3.5-3.9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="7" cy="7" r="5.75" stroke={color} strokeWidth="1.5" />
          {status === 'in_progress' && <path d="M7 3.6a3.4 3.4 0 0 1 0 6.8z" fill={color} />}
        </>
      )}
    </svg>
  )
}

const LEVEL: Record<TaskPriority, number> = { low: 1, medium: 2, high: 3 }

/** Three signal bars; the number lit shows the priority. */
export function PriorityIcon({ priority, size = 14 }: { priority: TaskPriority; size?: number }) {
  const lit = LEVEL[priority]
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className="shrink-0 text-fg">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1.5 + i * 4.2}
          y={11 - (i + 1) * 3}
          width="2.6"
          height={(i + 1) * 3}
          rx="0.8"
          fill="currentColor"
          opacity={i < lit ? 1 : 0.25}
        />
      ))}
    </svg>
  )
}
