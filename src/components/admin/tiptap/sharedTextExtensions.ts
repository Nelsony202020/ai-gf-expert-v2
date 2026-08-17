/** Shared TipTap text helpers for Review + Glossary editorial surfaces. */

import { Extension, type Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { sanitizePastedHtml } from './sanitizePastedHtml';

export function createSharedTextExtensions(opts?: {
  placeholder?: string;
  headingLevels?: (2 | 3 | 4)[];
}) {
  const levels = opts?.headingLevels ?? ([3, 4] as (3 | 4)[]);
  return [
    StarterKit.configure({
      heading: { levels },
      code: false,
      codeBlock: false,
      strike: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener noreferrer' },
    }),
    Placeholder.configure({
      placeholder: opts?.placeholder ?? 'Write…',
    }),
  ];
}

/** Prefer on useEditor — TipTap reads transformPastedHTML from editorProps. */
export function createSharedEditorPasteProps(opts?: {
  preserveImages?: boolean;
  minHeading?: 2 | 3;
  maxHeading?: 3 | 4;
}) {
  return {
    transformPastedHTML(html: string) {
      return sanitizePastedHtml(html, opts);
    },
  };
}

export const sharedEditorPasteProps = createSharedEditorPasteProps({
  minHeading: 3,
  maxHeading: 4,
});

export const reviewEditorPasteProps = createSharedEditorPasteProps({
  minHeading: 2,
  maxHeading: 4,
});

export function applyLink(editor: Editor, href: string | null) {
  if (!href) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
}

/** ⌘/Ctrl+K opens the shared link dialog via callback. */
export function createLinkShortcutExtension(getOpenDialog: () => () => void) {
  return Extension.create({
    name: 'linkShortcut',
    addKeyboardShortcuts() {
      return {
        'Mod-k': () => {
          getOpenDialog()();
          return true;
        },
      };
    },
  });
}
