import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import type { GlossaryTipTapDoc } from '../../../lib/glossary/types';
import { LinkDialog } from '../review/LinkDialog';
import {
  applyLink,
  createLinkShortcutExtension,
  createSharedTextExtensions,
  sharedEditorPasteProps,
} from '../tiptap/sharedTextExtensions';

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function asJsonContent(value: GlossaryTipTapDoc | null | undefined): JSONContent {
  if (value && typeof value === 'object' && value.type === 'doc') {
    return value as JSONContent;
  }
  return EMPTY_DOC;
}

export function GlossaryRichEditor({
  value,
  onChange,
  disabled,
}: {
  value: GlossaryTipTapDoc | null | undefined;
  onChange: (doc: GlossaryTipTapDoc) => void;
  disabled?: boolean;
}) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const openLinkDialogRef = useRef(() => setLinkDialogOpen(true));
  openLinkDialogRef.current = () => setLinkDialogOpen(true);

  const linkShortcutExtension = useMemo(
    () => createLinkShortcutExtension(() => () => openLinkDialogRef.current()),
    [],
  );

  const extensions = useMemo(
    () => [
      ...createSharedTextExtensions({
        placeholder: 'Write the full glossary explanation…',
        headingLevels: [3, 4],
      }),
      linkShortcutExtension,
    ],
    [linkShortcutExtension],
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions,
    content: asJsonContent(value),
    editorProps: sharedEditorPasteProps,
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as GlossaryTipTapDoc),
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || !value) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (current !== next) {
      editor.commands.setContent(asJsonContent(value));
    }
    // Only sync when parent replaces the document (e.g. load another entry).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value?.type]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-wrap gap-0.5 border-b border-slate-100 px-1.5 py-1 dark:border-slate-800">
        <ToolbarBtn
          label="B"
          title="Bold (⌘B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarBtn
          label="I"
          title="Italic (⌘I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarBtn
          label="H3"
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarBtn
          label="H4"
          title="Heading 4"
          active={editor.isActive('heading', { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        />
        <ToolbarBtn
          label="• List"
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarBtn
          label="1. List"
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarBtn
          label="🔗 Link"
          title="Link (⌘K)"
          active={editor.isActive('link')}
          onClick={() => setLinkDialogOpen(true)}
        />
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 dark:prose-invert [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:max-h-[350px] [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
      {linkDialogOpen && (
        <LinkDialog
          initialHref={(editor.getAttributes('link').href as string | undefined) ?? ''}
          onClose={() => setLinkDialogOpen(false)}
          onApply={(href) => {
            setLinkDialogOpen(false);
            applyLink(editor, href);
          }}
        />
      )}
    </div>
  );
}

function ToolbarBtn({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
        active
          ? 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );
}
