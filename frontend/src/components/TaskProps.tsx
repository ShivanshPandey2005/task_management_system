import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL } from '../types/task'
import type { TaskPriority, TaskStatus } from '../types/task'
import { PriorityIcon, StatusIcon } from './icons'
import { SelectMenu } from './SelectMenu'
import type { Option } from './SelectMenu'

export const STATUS_OPTIONS: Option<TaskStatus>[] = STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
  icon: <StatusIcon status={s} />,
}))

export const PRIORITY_OPTIONS: Option<TaskPriority>[] = PRIORITIES.map((p) => ({
  value: p,
  label: PRIORITY_LABEL[p],
  icon: <PriorityIcon priority={p} />,
}))

interface Props<T> {
  value: T
  onChange: (value: T) => void
  /** "icon" = glyph only (list rows); "full" = glyph + label. */
  variant?: 'icon' | 'full' | 'chip'
}

export function StatusSelect({ value, onChange, variant = 'icon' }: Props<TaskStatus>) {
  return (
    <SelectMenu
      value={value}
      options={STATUS_OPTIONS}
      onChange={onChange}
      ariaLabel={`Status: ${STATUS_LABEL[value]}`}
      buttonClassName={variant === 'icon' ? 'icon-btn' : variant === 'chip' ? 'chip' : 'prop-btn'}
      button={
        <>
          <StatusIcon status={value} />
          {variant !== 'icon' && STATUS_LABEL[value]}
        </>
      }
    />
  )
}

export function PrioritySelect({ value, onChange, variant = 'icon' }: Props<TaskPriority>) {
  return (
    <SelectMenu
      value={value}
      options={PRIORITY_OPTIONS}
      onChange={onChange}
      ariaLabel={`Priority: ${PRIORITY_LABEL[value]}`}
      buttonClassName={variant === 'icon' ? 'icon-btn' : variant === 'chip' ? 'chip' : 'prop-btn'}
      button={
        <>
          <PriorityIcon priority={value} />
          {variant !== 'icon' && PRIORITY_LABEL[value]}
        </>
      }
    />
  )
}
