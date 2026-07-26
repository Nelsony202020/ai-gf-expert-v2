// Media library: upload originals (never destroyed), manage metadata,
// crops/focal points stored as metadata only.

import { useEffect, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import {
  Button,
  Badge,
  Card,
  Field,
  TextInput,
  Select,
  Toggle,
  Spinner,
  ErrorNote,
  EmptyState,
  Modal,
  useAsync,
  Icon,
} from '../ui';

export function MediaPage() {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [products, setProducts] = useState<EntityRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<EntityRow | null>(null);
  const [filterAdult, setFilterAdult] = useState<'all' | 'safe' | 'adult'>('all');

  function reload() {
    dataApi
      .list('media')
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
    dataApi
      .list('products')
      .then((r) => setProducts(r.rows))
      .catch(() => {});
  }
  useEffect(reload, []);

  const filtered = rows?.filter((r) =>
    filterAdult === 'all' ? true : filterAdult === 'adult' ? r.adult : !r.adult,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Media</h2>
          <p className="text-sm text-slate-500">
            Originals are preserved; crops and focal points are stored as metadata.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filterAdult}
            onChange={(e) => setFilterAdult(e.target.value as any)}
            className="w-32"
          >
            <option value="all">All</option>
            <option value="safe">Safe</option>
            <option value="adult">18+</option>
          </Select>
          <Button onClick={() => setUploading(true)}>
            <Icon name="upload" /> Upload
          </Button>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {!filtered ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState message="No media yet. Upload originals here — pages render crops from metadata." />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setEditing(m)}
              className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm hover:border-pink-300"
            >
              <div className="relative aspect-video bg-slate-100">
                {m.url && m.mediaType === 'image' ? (
                  <img src={m.url} alt={m.altText ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Icon name={m.mediaType === 'video' ? 'movie' : 'image'} />
                  </div>
                )}
                <div className="absolute left-1 top-1 flex gap-1">
                  {m.adult && <Badge tone="red">18+</Badge>}
                  {!m.approved && <Badge tone="amber">unapproved</Badge>}
                </div>
              </div>
              <div className="p-2">
                <div className="truncate text-xs font-medium">{m.altText || '(no alt text)'}</div>
                <div className="truncate text-xs text-slate-400">
                  {m.product?.name ?? 'Unattached'} · {m.role ?? 'gallery'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {uploading && (
        <UploadModal
          products={products}
          onClose={() => setUploading(false)}
          onDone={() => {
            setUploading(false);
            reload();
          }}
        />
      )}

      {editing && (
        <EditMediaModal
          media={editing}
          products={products}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function UploadModal({
  products,
  onClose,
  onDone,
}: {
  products: EntityRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [adult, setAdult] = useState(false);
  const [role, setRole] = useState('gallery');
  const [productId, setProductId] = useState('');
  const { busy, error, run } = useAsync();

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const done = await run(async () => {
      const form = new FormData();
      form.set('file', file);
      form.set('altText', altText);
      form.set('adult', adult ? '1' : '0');
      form.set('role', role);
      if (productId) form.set('productId', productId);
      // Record intrinsic dimensions for images.
      if (file.type.startsWith('image/')) {
        const dims = await imageDimensions(file).catch(() => null);
        if (dims) {
          form.set('width', String(dims.width));
          form.set('height', String(dims.height));
        }
      }
      await api.upload('/api/admin/media/upload', form);
      return true;
    });
    if (done) onDone();
  }

  return (
    <Modal title="Upload media" onClose={onClose}>
      <form onSubmit={upload} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <Field label="File" required>
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </Field>
        <Field label="Alt text" required help="Required before the file can be approved.">
          <TextInput value={altText} onChange={(e) => setAltText(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {['gallery', 'logo', 'featured', 'proof', 'character', 'hero'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Product">
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— none —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Classification" required>
          <Toggle checked={adult} onChange={setAdult} label={adult ? '18+ content' : 'Safe content'} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !file}>
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditMediaModal({
  media,
  products,
  onClose,
  onDone,
}: {
  media: EntityRow;
  products: EntityRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [fields, setFields] = useState({
    altText: media.altText ?? '',
    caption: media.caption ?? '',
    credit: media.credit ?? '',
    adult: Boolean(media.adult),
    approved: Boolean(media.approved),
    role: media.role ?? 'gallery',
    sortOrder: media.sortOrder ?? 0,
    focalX: media.focalPoint?.x ?? 0.5,
    focalY: media.focalPoint?.y ?? 0.5,
  });
  const [productId, setProductId] = useState(media.product?.id ?? '');
  const { busy, error, run } = useAsync();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await dataApi.update(
        'media',
        media.id,
        {
          altText: fields.altText || undefined,
          caption: fields.caption || undefined,
          credit: fields.credit || undefined,
          adult: fields.adult,
          ageGated: fields.adult,
          approved: fields.approved,
          role: fields.role,
          sortOrder: Number(fields.sortOrder),
          focalPoint: { x: Number(fields.focalX), y: Number(fields.focalY) },
        },
        { product: productId || null },
      );
      return true;
    });
    if (done) onDone();
  }

  async function remove() {
    if (!confirm('Soft-delete this media record? The original file is preserved.')) return;
    const done = await run(async () => {
      await dataApi.remove('media', media.id);
      return true;
    });
    if (done) onDone();
  }

  return (
    <Modal title="Edit media" onClose={onClose} wide>
      <form onSubmit={save} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {media.url && media.mediaType === 'image' ? (
              <img src={media.url} alt="" className="w-full rounded-md border border-slate-200" />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-md bg-slate-100 text-slate-300">
                <Icon name="movie" />
              </div>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {media.width && media.height ? `${media.width}×${media.height} · ` : ''}
              {media.fileSize ? `${Math.round(media.fileSize / 1024)} KB · ` : ''}
              uploaded by {media.uploadedBy ?? '—'}
            </p>
          </div>
          <div className="space-y-3">
            <Field label="Alt text" required>
              <TextInput
                value={fields.altText}
                onChange={(e) => setFields({ ...fields, altText: e.target.value })}
                required
              />
            </Field>
            <Field label="Caption">
              <TextInput
                value={fields.caption}
                onChange={(e) => setFields({ ...fields, caption: e.target.value })}
              />
            </Field>
            <Field label="Credit / source">
              <TextInput
                value={fields.credit}
                onChange={(e) => setFields({ ...fields, credit: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <Select
                  value={fields.role}
                  onChange={(e) => setFields({ ...fields, role: e.target.value })}
                >
                  {['gallery', 'logo', 'featured', 'proof', 'character', 'hero'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Product">
                <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                  <option value="">— none —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sort order">
                <TextInput
                  type="number"
                  value={String(fields.sortOrder)}
                  onChange={(e) => setFields({ ...fields, sortOrder: Number(e.target.value) })}
                />
              </Field>
              <Field label="Focal point (x / y, 0-1)">
                <div className="flex gap-2">
                  <TextInput
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    value={String(fields.focalX)}
                    onChange={(e) => setFields({ ...fields, focalX: Number(e.target.value) })}
                  />
                  <TextInput
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    value={String(fields.focalY)}
                    onChange={(e) => setFields({ ...fields, focalY: Number(e.target.value) })}
                  />
                </div>
              </Field>
            </div>
            <div className="flex gap-6">
              <Toggle
                checked={fields.adult}
                onChange={(v) => setFields({ ...fields, adult: v })}
                label={fields.adult ? '18+ (age-gated)' : 'Safe'}
              />
              <Toggle
                checked={fields.approved}
                onChange={(v) => setFields({ ...fields, approved: v })}
                label="Approved for publication"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3">
          <Button variant="danger" onClick={remove} disabled={busy}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}
