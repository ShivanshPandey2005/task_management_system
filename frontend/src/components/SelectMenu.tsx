import type { ReactNode } from 'react'
import { CheckIcon } from './icons'
import { Popover } from './Popover'

export interface Option<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface Props<T extends string> {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  button: ReactNode
  buttonClassName?: string
  align?: 'left' | 'right'
}

export function SelectMenu<T extends string>({ value, options, onChange, ariaLabel, button, buttonClassName, align }: Props<T>) {
  return (
    <Popover ariaLabel={ariaLabel} button={button} buttonClassName={buttonClassName} align={align}>
      {(close) =>
        options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="menuitemradio"
            aria-checked={o.value === value}
            className="flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
            onClick={() => {
              close()
              if (o.value !== value) onChange(o.value)
            }}
          >
            {o.icon && <span className="flex w-4 justify-center">{o.icon}</span>}
            <span className="flex-1">{o.label}</span>
            {o.value === value && <CheckIcon size={14} className="text-muted" />}
          </button>
        ))
      }
    </Popover>
  )
}
