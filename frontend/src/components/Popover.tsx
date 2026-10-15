import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  ariaLabel: string
  /** Contents of the trigger button. */
  button: ReactNode
  buttonClassName?: string
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}

/** Trigger button + floating menu. The menu is portaled and fixed-positioned so scroll containers can't clip it. */
export function Popover({ ariaLabel, button, buttonClassName = 'chip', align = 'left', children }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const h = menuRef.current?.offsetHeight ?? 0
    const top = r.bottom + 4 + h > window.innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4
    setPos(align === 'right' ? { top, right: window.innerWidth - r.right } : { top, left: r.left })
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close()
    }
    // Capture + stopPropagation so Escape closes only the menu, not a dialog underneath it.
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        btnRef.current?.focus()
      }
    }
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', onScroll, true)
    ;(menuRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? menuRef.current?.querySelector<HTMLElement>('button'))?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  function onMenuKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    // Arrow keys edit the segments of a native date input.
    if (e.target instanceof HTMLInputElement && e.target.type === 'date') return
    e.preventDefault()
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('button') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
    items[next]?.focus()
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={buttonClassName}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        {button}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onKeyDown={onMenuKey}
            // Portaled events still bubble through React parents (e.g. a clickable row), so stop them here.
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', ...(pos ?? { top: -9999, left: -9999 }) }}
            className="z-[60] min-w-44 rounded-lg border border-line-strong bg-surface p-1 shadow-pop"
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </>
  )
}
