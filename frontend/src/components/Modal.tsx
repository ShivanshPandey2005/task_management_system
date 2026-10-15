import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { XIcon } from './icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** "center" dialog, or a "drawer" that slides in from the right. */
  variant?: 'center' | 'drawer'
  /** Max width class for the centered dialog. */
  widthClass?: string
}

export function Modal({ title, onClose, children, variant = 'center', widthClass = 'max-w-xl' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const isDrawer = variant === 'drawer'

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/60 ${isDrawer ? 'justify-end' : 'items-start justify-center p-4 pt-[12vh]'}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex flex-col bg-surface shadow-pop ${
          isDrawer
            ? 'h-full w-full max-w-[520px] border-l border-line-strong'
            : `max-h-[80vh] w-full ${widthClass} rounded-xl border border-line-strong`
        }`}
      >
        <div className="flex h-11 shrink-0 items-center justify-between px-4">
          <h2 className="text-xs font-medium text-muted">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
