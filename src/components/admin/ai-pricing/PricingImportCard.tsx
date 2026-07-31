// Dropzone for AI pricing import: the editor drops any mix of pricing
// screenshots (plans, token packages, feature costs, promotions), we upload
// them as proof media, then one AI call classifies + extracts everything.

import { useRef, useState } from 'react';
import { api, dataApi } from '../api';
import { Button, ErrorNote, Icon } from '../ui';
import { ImageHoverThumb } from '../testing/ProofThumb';
import { MediaRoleFields } from '../workspace/tabs/MediaRoleFields';
import { galleryTagsFromRoleState, PRICING_PROOF_CAPTION, type MediaRoleState } from '../../../lib/media/catalog';
import type { PricingDraftClient } from './PricingReviewModal';

interface UploadedShot {
  mediaId: string;
  url: string;
  name: string;
}

export function PricingImportCard({
  productId,
  onDraft,
  onGalleryUpdated,
}: {
  productId: string;
  onDraft: (draft: PricingDraftClient) => void;
  /** Called after screenshots are approved into the public gallery. */
  onGalleryUpdated?: () => void;
}) {
  const [shots, setShots] = useState<UploadedShot[]>([]);
  const [uploading, setUploading] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [addToGallery, setAddToGallery] = useState(false);
  const [galleryRoleState, setGalleryRoleState] = useState<MediaRoleState>({
    character: false,
    contextTag: '',
    hero: false,
  });
  const fileInput = useRef<HTMLInputElement>(null);

  async function addFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    setError(null);
    setUploading((n) => n + images.length);
    for (const file of images) {
      try {
        const form = new FormData();
        form.set('file', file);
        form.set('adult', '0');
        form.set('role', addToGallery ? 'gallery' : 'proof');
        form.set('altText', 'Pricing screenshot');
        form.set('caption', PRICING_PROOF_CAPTION);
        form.set('testCategory', 'pricing');
        form.set('productId', productId);
        if (addToGallery) {
          form.set('mediaTags', JSON.stringify(galleryTagsFromRoleState(galleryRoleState)));
        }
        const created = await api.upload<{ id: string; url?: string }>('/api/admin/media/upload', form);
        if (addToGallery) {
          await dataApi.update('media', created.id, {
            approved: true,
            role: 'gallery',
            mediaTags: galleryTagsFromRoleState(galleryRoleState),
            caption: PRICING_PROOF_CAPTION,
            testCategory: 'pricing',
          });
          onGalleryUpdated?.();
        }
        setShots((prev) => [
          ...prev,
          { mediaId: created.id, url: created.url ?? URL.createObjectURL(file), name: file.name },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function extract() {
    if (shots.length === 0) return;
    setError(null);
    setExtracting(true);
    try {
      const { draft } = await api.post<{ draft: PricingDraftClient }>('/api/admin/ai-pricing/extract', {
        productId,
        mediaIds: shots.map((s) => s.mediaId),
      });
      onDraft(draft);
      setShots([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {error && (
        <div className="mb-2">
          <ErrorNote message={error} />
        </div>
      )}
      <div
        className={`rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors ${
          dragOver
            ? 'border-pink-400 bg-pink-50/60 dark:border-pink-600 dark:bg-pink-950/30'
            : 'border-slate-200 dark:border-slate-700'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <Icon name="auto_awesome" className="!text-[22px] text-pink-400" />
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Drop pricing screenshots here
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          Plans, token packages, feature costs, promotions — AI sorts it out. Or{' '}
          <button
            type="button"
            className="font-medium text-pink-600 hover:underline"
            onClick={() => fileInput.current?.click()}
          >
            browse files
          </button>
          .
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={addToGallery}
            onChange={(e) => setAddToGallery(e.target.checked)}
            className="rounded border-slate-300"
          />
          Also add screenshots to the public Photos &amp; Videos gallery
        </label>
        {addToGallery && (
          <div className="mt-3 text-left">
            <MediaRoleFields
              value={galleryRoleState}
              onChange={setGalleryRoleState}
              showHero={false}
              radioName="pricing-gallery-context"
            />
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
      </div>

      {(shots.length > 0 || uploading > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {shots.map((s) => (
            <ImageHoverThumb
              key={s.mediaId}
              url={s.url}
              title={s.name}
              onRemove={() => setShots((prev) => prev.filter((x) => x.mediaId !== s.mediaId))}
            />
          ))}
          {uploading > 0 && (
            <span className="inline-flex h-12 w-12 animate-pulse items-center justify-center rounded border border-dashed border-slate-300 dark:border-slate-600">
              <Icon name="hourglass_empty" className="!text-[16px] text-slate-400" />
            </span>
          )}
          <span className="flex-1" />
          <Button disabled={extracting || uploading > 0 || shots.length === 0} onClick={() => void extract()}>
            <Icon name="auto_awesome" className="!text-[14px]" />
            {extracting
              ? `Reading ${shots.length} screenshot${shots.length === 1 ? '' : 's'}…`
              : 'Extract with AI'}
          </Button>
        </div>
      )}
    </section>
  );
}
