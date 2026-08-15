// Simple upload dialog for the review editor — no media library browsing.

import { useRef, useState } from 'react';
import { Button, ErrorNote, Modal, Toggle } from '../ui';
import { MediaRoleFields } from '../workspace/tabs/MediaRoleFields';
import { galleryTagsFromRoleState, type MediaRoleState } from '../../../lib/media/catalog';
import { isImageFile, uploadReviewMedia } from './uploadReviewMedia';

export interface PickedMedia {
  id: string;
  url: string;
  altText: string;
  caption?: string;
}

export function MediaPickerModal({
  productId,
  onClose,
  onSelect,
}: {
  productId: string;
  onClose: () => void;
  onSelect: (media: PickedMedia) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadAdult, setUploadAdult] = useState(false);
  const [roleState, setRoleState] = useState<MediaRoleState>({
    character: false,
    contextTag: '',
    hero: false,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);

  async function upload() {
    const file = pendingFile ?? fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose an image to upload.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const created = await uploadReviewMedia(file, productId, {
        adult: uploadAdult,
        mediaTags: galleryTagsFromRoleState(roleState),
      });
      onSelect({
        id: created.id,
        url: created.url,
        altText: '',
        caption: '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal title="Upload image" onClose={onClose}>
      <div className="space-y-4">
        {error && <ErrorNote message={error} />}

        <div
          className={`rounded-md border border-dashed px-3 py-5 text-center text-xs transition-colors ${
            dropActive
              ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40'
              : 'border-slate-300 text-slate-500 dark:border-slate-600'
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDropActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) return;
            setDropActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDropActive(false);
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            if (!isImageFile(file)) {
              setError('Drop an image file (JPEG, PNG, WebP, GIF).');
              return;
            }
            setPendingFile(file);
            setError(null);
          }}
        >
          <p className="font-medium text-slate-600 dark:text-slate-300">
            {pendingFile ? pendingFile.name : 'Drop an image here'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">or choose a file</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <MediaRoleFields value={roleState} onChange={setRoleState} showHero={false} radioName="review-media-context" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Toggle checked={uploadAdult} onChange={setUploadAdult} label="Adult content (18+)" />
          <Button onClick={() => void upload()} disabled={uploading || !pendingFile} className="text-xs">
            {uploading ? 'Uploading…' : 'Upload and insert'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
