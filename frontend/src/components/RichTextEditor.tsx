import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskItem, TaskList } from '@tiptap/extension-list'

interface Props {
  /** Markdown to start with. The editor owns its content afterwards (uncontrolled). */
  initialValue: string
  onChange: (markdown: string) => void
  onBlur?: () => void
  placeholder?: string
  autoFocus?: boolean
  ariaLabel: string
  className?: string
}

/**
 * Notion/Linear-style editor: markdown shortcuts render as you type
 * (`# `, `- `, `1. `, `[] `, `> `, ``` , **bold**, `code`) and the value round-trips as Markdown.
 */
export function RichTextEditor({ initialValue, onChange, onBlur, placeholder, autoFocus, ariaLabel, className }: Props) {
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  useEffect(() => {
    onChangeRef.current = onChange
    onBlurRef.current = onBlur
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: initialValue,
    contentType: 'markdown',
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: { class: 'editor', role: 'textbox', 'aria-multiline': 'true', 'aria-label': ariaLabel },
    },
    // Trailing empty paragraphs serialize as `&nbsp;`; drop them so the stored text stays clean.
    onUpdate: ({ editor }) => onChangeRef.current(editor.getMarkdown().replace(/(\s*&nbsp;)+\s*$/, '')),
    onBlur: () => onBlurRef.current?.(),
  })

  return <EditorContent editor={editor} className={className} />
}
