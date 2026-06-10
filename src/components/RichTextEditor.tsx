import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, List, ListOrdered,
  Heading2, Heading3, Minus, Undo, Redo
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Tulis konten di sini...',
  minHeight = '160px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-md text-sm transition-colors ${
      active
        ? 'bg-agri-green text-white'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`

  return (
    <div className="rounded-lg border border-input overflow-hidden focus-within:border-agri-green focus-within:ring-2 focus-within:ring-agri-green/20 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap border-b border-border bg-muted/40 px-2 py-1.5">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
          <Bold className="size-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
          <Italic className="size-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
          <Heading2 className="size-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3">
          <Heading3 className="size-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
          <List className="size-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Numbered List">
          <ListOrdered className="size-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Garis Pemisah">
          <Minus className="size-3.5" />
        </button>
        <div className="flex-1" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnClass(false) + ' disabled:opacity-40'} title="Undo">
          <Undo className="size-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnClass(false) + ' disabled:opacity-40'} title="Redo">
          <Redo className="size-3.5" />
        </button>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 text-sm text-foreground focus:outline-none"
        style={{ minHeight }}
      />
    </div>
  )
}

/**
 * Render HTML konten library dengan aman menggunakan DOMPurify
 */
import DOMPurify from 'dompurify'

interface RichContentProps {
  html: string
  className?: string
}

export function RichContent({ html, className = '' }: RichContentProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','br','strong','em','h2','h3','ul','ol','li','hr','a','blockquote'],
    ALLOWED_ATTR: ['href','target','rel'],
  })

  return (
    <div
      className={`prose prose-sm max-w-none text-foreground ${
        className
      } [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
