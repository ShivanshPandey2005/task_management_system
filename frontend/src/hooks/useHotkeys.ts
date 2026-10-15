import { useEffect } from 'react'

/** Single-key shortcuts (like Linear's "c"). Ignored while typing or while a dialog is open. */
export function useHotkeys(map: Record<string, () => void>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target instanceof Element ? e.target : document.body
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[role="dialog"], [role="menu"]')) return
      const handler = map[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [map])
}
