/** Parallel's mark: two parallel strokes on an accent tile. Mirrors public/favicon.svg. */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="8" fill="#5e6ad2" />
      <path d="M11 23 17 9M17 23l6-14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
