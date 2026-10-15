import type { PageMeta } from '../types/task'

export function Pagination({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  if (meta.pages <= 1) return null
  const from = (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.total)
  return (
    <nav className="flex h-11 shrink-0 items-center justify-between border-t border-line px-4 md:px-6" aria-label="Pagination">
      <span className="text-xs text-muted">
        {from}–{to} of {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <button className="btn btn-secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </button>
        <span className="text-xs text-muted">
          Page {meta.page} of {meta.pages}
        </span>
        <button className="btn btn-secondary" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>
          Next
        </button>
      </div>
    </nav>
  )
}
