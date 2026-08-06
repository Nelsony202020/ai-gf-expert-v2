// Simple upload dialog for the review editor — no media library browsing.

import { useRef, useState } from 'react';
import { api } from '../api';
import { Button, ErrorNote, Modal, Toggle } from '../ui';
import { MediaRoleFields } from '../workspace/tabs/MediaRoleFields';
import { galleryTagsFromRoleState, type MediaRoleState } from '../../../lib/media/catalog';

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

  async function upload() {
    const file = pendingFile ?? fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose an image to upload.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', uploadAdult ? '1' : '0');
      form.set('role', 'gallery');
      form.set('mediaTags', JSON.stringify(galleryTagsFromRoleState(roleState)));
      form.set('productId', productId);
      const created = await api.upload<{ id: string; url?: string }>('/api/admin/media/upload', form);
      onSelect({
        id: created.id,
        url: created.url ?? '',
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

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
        />

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
