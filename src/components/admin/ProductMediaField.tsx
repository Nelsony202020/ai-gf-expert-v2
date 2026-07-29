// Compact image picker with drag-and-drop, thumbnail preview, and choose-file action.

import { useRef, useState } from 'react';
import { api, type EntityRow } from './api';
import { resolveMediaUrl } from '../../lib/media/url';
import { Button, Icon, ErrorNote } from './ui';
import { FieldHint } from './FieldHint';

interface ProductMediaFieldProps {
  label: string;
  hint?: string;
  supportedText: string;
  role: 'logo' | 'featured';
  accept: string;
  productId?: string;
  productName?: string;
  value: string | null;
  mediaRows: EntityRow[];
  linkedMedia?: { url?: string | null } | null;
  onChange: (mediaId: string | null) => void;
  onUploaded: () => void;
}

export function ProductMediaField({
  label,
  hint,
  supportedText,
  role,
  accept,
  productId,
  productName,
  value,
  mediaRows,
  linkedMedia,
  onChange,
  onUploaded,
}: ProductMediaFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const selected = value ? mediaRows.find((m) => m.id === value) : null;
  const linkedPreview = linkedMedia?.url ? String(linkedMedia.url) : '';
  const previewUrl =
    localPreview ??
    (resolveMediaUrl(selected as { url?: unknown; file?: { url?: unknown } }) || linkedPreview || null);
  const uploadTitle = label.toLowerCase().startsWith('upload') ? label : `Upload ${label.toLowerCase()}`;

  async function handleFile(file: File) {
    setUploadError(null);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', '0');
      form.set('role', role);
      form.set(
        'altText',
        role === 'featured' && productName?.trim()
          ? `${productName.trim()} review featured image`
          : `${label} for product`,
      );
      if (productId) form.set('productId', productId);
      if (file.type.startsWith('image/')) {
        const dims = await imageDimensions(file).catch(() => null);
        if (dims) {
          form.set('width', String(dims.width));
          form.set('height', String(dims.height));
        }
      }
      const created = await api.upload<{ id: string; url?: string }>('/api/admin/media/upload', form);
      onChange(created.id);
      onUploaded();
      if (created.url) {
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
      }
    } catch (e) {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div>
      <p className="mb-1 flex items-center text-xs font-medium text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        {hint ? <FieldHint text={hint} /> : null}
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed transition-colors ${
          dragOver
            ? 'border-pink-400 bg-pink-50/60 dark:border-pink-700 dark:bg-pink-950/20'
            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900/40'
        }`}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="image" className="!text-[20px] text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {dragOver ? 'Drop image here' : uploadTitle}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{supportedText}</p>
            {uploading && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-pink-600" />
                Uploading…
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {previewUrl && !uploading ? (
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-red-600"
                onClick={() => {
                  onChange(null);
                  setLocalPreview(null);
                }}
              >
                Remove
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
          </div>
        </div>
      </div>
      {uploadError && (
        <div className="mt-1.5">
          <ErrorNote message={uploadError} />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}

function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions'));
    };
    img.src = url;
  });
}
