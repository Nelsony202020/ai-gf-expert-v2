// TipTap paste handler: clipboard image files and Google Docs HTML with <img>.

import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { api } from '../api';
import { fileWithInferredMime } from '../../../lib/media/mime';

export interface PastedImageResult {
  id: string;
  url: string;
  altText: string;
}

export interface ClipboardPasteOptions {
  productId: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onError?: (message: string) => void;
}

async function uploadPastedFile(
  file: File,
  productId: string,
  altText: string,
): Promise<PastedImageResult> {
  const normalized = fileWithInferredMime(file);
  const form = new FormData();
  form.set('file', normalized);
  form.set('adult', '0');
  form.set('altText', altText);
  form.set('role', 'gallery');
  form.set('mediaTags', '[]');
  form.set('productId', productId);
  const created = await api.upload<{ id: string; url?: string }>('/api/admin/media/upload', form);
  return { id: created.id, url: created.url ?? '', altText };
}

function altFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
}

async function srcToFile(src: string, index: number): Promise<File | null> {
  try {
    if (src.startsWith('data:')) {
      const res = await fetch(src);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'png';
      return fileWithInferredMime(new File([blob], `pasted-image-${index}.${ext}`, { type: blob.type || 'image/png' }));
    }
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return null;
      const ext = blob.type.split('/')[1] || 'png';
      return fileWithInferredMime(new File([blob], `pasted-image-${index}.${ext}`, { type: blob.type }));
    }
  } catch {
    return null;
  }
  return null;
}

function imageFilesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  const fromFiles = Array.from(data.files ?? []).filter((f) => f.type.startsWith('image/'));
  if (fromFiles.length > 0) return fromFiles;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile();
      if (f) fromFiles.push(f);
    }
  }
  return fromFiles;
}

function imgsInHtml(html: string): HTMLImageElement[] {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.body.querySelectorAll('img'));
  } catch {
    return [];
  }
}

function needsImageUpload(src: string): boolean {
  return src.startsWith('data:') || /^https?:\/\//i.test(src);
}

/** Factory: pass a getter so productId / callbacks stay current without recreating the editor. */
export function createClipboardImagePaste(getOptions: () => ClipboardPasteOptions) {
  return Extension.create({
    name: 'clipboardImagePaste',

    addProseMirrorPlugins() {
      const extension = this;
      return [
        new Plugin({
          props: {
            handlePaste(_view, event) {
              const editor = extension.editor;
              if (!editor?.isEditable) return false;

              const clipboard = event.clipboardData;
              if (!clipboard) return false;

              const imageFiles = imageFilesFromClipboard(clipboard);
              const html = clipboard.getData('text/html') ?? '';
              const htmlImgs = html ? imgsInHtml(html) : [];

              // Direct image paste (screenshot, file copy).
              if (imageFiles.length > 0 && htmlImgs.length === 0) {
                event.preventDefault();
                const { productId, onUploadStart, onUploadEnd, onError } = getOptions();
                onUploadStart?.();
                void (async () => {
                  try {
                    for (const file of imageFiles) {
                      const altText = altFromFilename(file.name);
                      const uploaded = await uploadPastedFile(file, productId, altText);
                      editor
                        .chain()
                        .focus()
                        .insertContent({
                          type: 'image',
                          attrs: {
                            src: uploaded.url,
                            alt: uploaded.altText,
                            mediaId: uploaded.id,
                            caption: '',
                          },
                        })
                        .run();
                    }
                  } catch (e) {
                    onError?.(e instanceof Error ? e.message : 'Image upload failed');
                  } finally {
                    onUploadEnd?.();
                  }
                })();
                return true;
              }

              // Google Docs / rich HTML with embedded images.
              if (htmlImgs.length === 0) return false;

              const uploadable = htmlImgs.filter((img) => {
                const src = img.getAttribute('src') ?? '';
                return src && needsImageUpload(src);
              });
              if (uploadable.length === 0) return false;

              event.preventDefault();
              const { productId, onUploadStart, onUploadEnd, onError } = getOptions();
              onUploadStart?.();

              void (async () => {
                try {
                  const doc = new DOMParser().parseFromString(html, 'text/html');
                  const imgs = Array.from(doc.body.querySelectorAll('img'));
                  let idx = 0;
                  for (const img of imgs) {
                    const src = img.getAttribute('src') ?? '';
                    if (!src || !needsImageUpload(src)) continue;
                    const file = await srcToFile(src, idx++);
                    if (!file) continue;
                    const altText = img.getAttribute('alt')?.trim() || altFromFilename(file.name);
                    const uploaded = await uploadPastedFile(file, productId, altText);
                    img.setAttribute('src', uploaded.url);
                    img.setAttribute('data-media-id', uploaded.id);
                    if (!img.getAttribute('alt')) img.setAttribute('alt', uploaded.altText);
                  }

                  editor.chain().focus().insertContent(doc.body.innerHTML).run();

                  const { state } = editor;
                  const tr = state.tr;
                  let changed = false;
                  state.doc.descendants((node, pos) => {
                    if (node.type.name !== 'image') return;
                    const src = String(node.attrs.src ?? '');
                    const stamped = imgs.find((img) => img.getAttribute('src') === src);
                    const mediaId = stamped?.getAttribute('data-media-id');
                    if (mediaId && node.attrs.mediaId !== mediaId) {
                      tr.setNodeMarkup(pos, undefined, { ...node.attrs, mediaId });
                      changed = true;
                    }
                  });
                  if (changed) editor.view.dispatch(tr);
                } catch (e) {
                  onError?.(e instanceof Error ? e.message : 'Image upload failed');
                } finally {
                  onUploadEnd?.();
                }
              })();

              return true;
            },
          },
        }),
      ];
    },
  });
}
