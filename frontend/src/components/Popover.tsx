import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const menuEl = menuRef.current
    const h = menuEl?.offsetHeight ?? 0
    const w = menuEl?.offsetWidth ?? 200

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const viewportTop = window.visualViewport?.offsetTop ?? 0
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth

    let top: number
    if (r.bottom + 4 + h > viewportTop + viewportHeight) {
      top = Math.max(viewportTop + 8, r.top - h - 4)
    } else {
      top = r.bottom + 4
    }

    if (align === 'right') {
      const rightDist = window.innerWidth - r.right
      const right = Math.max(8, Math.min(rightDist, viewportWidth - w - 8))
      setPos({ top, right })
    } else {
      const left = Math.max(8, Math.min(r.left, viewportWidth - w - 8))
      setPos({ top, left })
    }
  }, [align])

  useLayoutEffect(() => {
    if (open) updatePos()
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close()
    }

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        btnRef.current?.focus()
      }
    }

    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return
      // When keyboard appears or user is typing, browser may scroll viewport; don't close
      if (menuRef.current?.contains(document.activeElement)) {
        updatePos()
        return
      }
      close()
    }

    const onResize = () => {
      // Reposition instead of closing when viewport dimensions change (e.g. mobile keyboard opens)
      updatePos()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('scroll', onResize)
    window.addEventListener('scroll', onScroll, true)

    // Autofocus input/button on desktop, but avoid forcing virtual keyboard open on touch mobile
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (!isTouch) {
      ;(menuRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? menuRef.current?.querySelector<HTMLElement>('button'))?.focus()
    }

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('scroll', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, align, updatePos])

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
