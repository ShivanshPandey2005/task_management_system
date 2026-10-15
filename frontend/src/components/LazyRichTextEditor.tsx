import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'

// The editor (Tiptap + ProseMirror) is the heaviest dependency, so load it on demand.
const Editor = lazy(() => import('./RichTextEditor').then((m) => ({ default: m.RichTextEditor })))

export function RichTextEditor(props: ComponentProps<typeof Editor>) {
  return (
    <Suspense fallback={<div className={props.className} aria-busy="true" />}>
      <Editor {...props} />
    </Suspense>
  )
}
