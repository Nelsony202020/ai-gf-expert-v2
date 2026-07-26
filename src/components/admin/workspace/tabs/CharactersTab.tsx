// Characters tab: Instagram-highlight style character manager. Each character
// has one profile image (circular highlight with story ring) plus ordered
// story slides stored in the characterStorySlides entity. Creation is a
// two-step flow: quick create (name + image) → full editor.

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../../api';
import { useCan } from '../../context';
import { MediaPickerModal } from '../../MediaPicker';
import { slugify } from '../../slugify';
import {
  Badge,
  Button,
  ErrorNote,
  Field,
  Icon,
  Modal,
  Select,
  TextArea,
  TextInput,
  Toggle,
  useAsync,
} from '../../ui';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';

const DEFAULT_SLIDE_MS = 5200; // matches the public story viewer

export function CharactersTab() {
  const ws = useWorkspace();
  const can = useCan();
  const canEdit = can('content.edit');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<EntityRow | null>(null);
  const [slideCounts, setSlideCounts] = useState<Map<string, number>>(new Map());
  const { error, setError } = useAsync();

  const characters = useMemo(
    () =>
      [...ws.related.characters].sort(
        (a, b) => (a.homepageOrder ?? 999) - (b.homepageOrder ?? 999) || String(a.name).localeCompare(String(b.name)),
      ),
    [ws.related.characters],
  );

  useEffect(() => {
    dataApi
      .list('characterStorySlides')
      .then((r) => {
        const counts = new Map<string, number>();
        for (const s of r.rows) {
          if (s.deletedAt || s.active === false || !s.character?.id) continue;
          counts.set(s.character.id, (counts.get(s.character.id) ?? 0) + 1);
        }
        setSlideCounts(counts);
      })
      .catch(() => {});
  }, [ws.related.characters, editingId]);

  async function patch(row: EntityRow, fields: Record<string, unknown>) {
    try {
      await dataApi.update('characters', row.id, fields);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function softDelete(row: EntityRow) {
    if (!confirm(`Delete "${row.name}"? (Soft delete — restorable.)`)) return;
    try {
      await dataApi.remove('characters', row.id);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function move(row: EntityRow, dir: -1 | 1) {
    const idx = characters.findIndex((c) => c.id === row.id);
    const other = characters[idx + dir];
    if (!other) return;
    try {
      await Promise.all(
        characters.map((c, i) => {
          let order = i;
          if (c.id === row.id) order = idx + dir;
          else if (c.id === other.id) order = idx;
          return dataApi.update('characters', c.id, { homepageOrder: order });
        }),
      );
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const editingCharacter = editingId ? characters.find((c) => c.id === editingId) ?? null : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_250px]">
      <div className="space-y-4">
        {error && <ErrorNote message={error} />}

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {characters.length} character{characters.length === 1 ? '' : 's'} · shown as story
            highlights on the review page.
          </p>
          {canEdit && (
            <Button onClick={() => setCreating(true)}>
              <Icon name="person_add" /> Add character
            </Button>
          )}
        </div>

        {characters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Icon name="group" className="!text-[36px] text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No characters yet
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Characters power the story highlights on the review page and homepage features.
            </p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setCreating(true)}>
                <Icon name="person_add" /> Add first character
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {characters.map((c, idx) => {
              const img = c.image?.url ?? ws.related.mediaAll.find((m) => m.id === c.image?.id)?.url;
              const slides = slideCounts.get(c.id) ?? 0;
              return (
                <div
                  key={c.id}
                  className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
                    c.active === false ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <StoryRingAvatar url={img} name={String(c.name)} slides={slides} size={72} />
                    <p className="mt-2 max-w-full truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {c.name}
                    </p>
                    <p className="text-xs capitalize text-slate-400">
                      {c.characterStyle ?? '—'} · {slides} slide{slides === 1 ? '' : 's'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                      <Badge tone={c.adult ? 'red' : 'green'}>{c.adult ? '18+' : 'Safe'}</Badge>
                      {c.featured && <Badge tone="pink">featured</Badge>}
                      {c.active === false && <Badge tone="gray">disabled</Badge>}
                      {!c.affiliateLink && <Badge tone="gray">default link</Badge>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
                      <div className="flex items-center gap-0.5">
                        <CardBtn name="edit" label="Edit" onClick={() => setEditingId(c.id)} />
                        <CardBtn name="content_copy" label="Duplicate" onClick={() => setDuplicating(c)} />
                        <CardBtn name="arrow_back" label="Move earlier" disabled={idx === 0} onClick={() => void move(c, -1)} />
                        <CardBtn
                          name="arrow_forward"
                          label="Move later"
                          disabled={idx === characters.length - 1}
                          onClick={() => void move(c, 1)}
                        />
                        <CardBtn name="delete" label="Delete" danger onClick={() => void softDelete(c)} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CardBtn
                          name={c.featured ? 'star' : 'star_outline'}
                          label={c.featured ? 'Unfeature' : 'Feature'}
                          active={Boolean(c.featured)}
                          onClick={() => void patch(c, { featured: !c.featured })}
                        />
                        <Toggle
                          checked={c.active !== false}
                          onChange={(v) => void patch(c, { active: v })}
                          aria-label="Active"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CompletionSidebar />

      {creating && (
        <QuickCreateModal
          onClose={() => setCreating(false)}
          onCreated={async (id) => {
            setCreating(false);
            await ws.refreshRelated();
            setEditingId(id); // open the full editor right away
          }}
        />
      )}
      {duplicating && (
        <QuickCreateModal
          template={duplicating}
          onClose={() => setDuplicating(null)}
          onCreated={async (id) => {
            setDuplicating(null);
            await ws.refreshRelated();
            setEditingId(id);
          }}
        />
      )}
      {editingCharacter && (
        <CharacterEditorModal
          character={editingCharacter}
          onClose={() => setEditingId(null)}
          onSaved={async () => {
            await ws.refreshRelated();
          }}
        />
      )}
    </div>
  );
}

/** Circular avatar with the pink story ring (segments hint at slide count). */
function StoryRingAvatar({
  url,
  name,
  slides,
  size = 64,
  focalPoint,
}: {
  url?: string | null;
  name: string;
  slides: number;
  size?: number;
  focalPoint?: { x: number; y: number } | null;
}) {
  const hasStory = slides > 0;
  const objectPosition = focalPoint
    ? `${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%`
    : '50% 50%';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full p-[3px] ${
        hasStory
          ? 'bg-gradient-to-tr from-pink-500 via-rose-400 to-fuchsia-500'
          : 'bg-slate-200 dark:bg-slate-700'
      }`}
      style={{ width: size + 10, height: size + 10 }}
    >
      <span
        className="overflow-hidden rounded-full border-2 border-white bg-slate-100 dark:border-slate-900 dark:bg-slate-800"
        style={{ width: size, height: size }}
      >
        {url ? (
          <img src={url} alt={name} className="h-full w-full object-cover" style={{ objectPosition }} />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon name="person" className="!text-[24px] text-slate-300" />
          </span>
        )}
      </span>
    </span>
  );
}

function CardBtn({
  name,
  label,
  onClick,
  disabled,
  danger,
  active,
}: {
  name: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded p-0.5 disabled:opacity-30 ${
        danger
          ? 'text-slate-400 hover:text-red-600'
          : active
            ? 'text-amber-500'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon name={name} className="!text-[16px]" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Quick create: name + profile image + active — the full editor opens after.
// ---------------------------------------------------------------------------

function QuickCreateModal({
  template,
  onClose,
  onCreated,
}: {
  template?: EntityRow | null;
  onClose: () => void;
  onCreated: (characterId: string) => void;
}) {
  const ws = useWorkspace();
  const [name, setName] = useState(template ? `${template.name} copy` : '');
  const [imageId, setImageId] = useState<string | null>(template?.image?.id ?? null);
  const [active, setActive] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, error, setError, run } = useAsync();

  const selectedImage = imageId ? ws.related.mediaAll.find((m) => m.id === imageId) : null;

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', '0');
      form.set('role', 'character');
      form.set('altText', `${name || 'Character'} profile image`);
      form.set('productId', ws.productId);
      const created = await api.upload<{ id: string }>('/api/admin/media/upload', form);
      await ws.refreshRelated();
      setImageId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const fields: Record<string, unknown> = {
      name: name.trim(),
      slug: slugify(name),
      active,
      ...(template
        ? {
            shortDescription: template.shortDescription ?? undefined,
            personalityTags: template.personalityTags ?? undefined,
            characterStyle: template.characterStyle ?? undefined,
            genderPresentation: template.genderPresentation ?? undefined,
            adult: template.adult ?? undefined,
          }
        : {}),
    };
    const created = await run(() =>
      dataApi.create('characters', fields, {
        product: ws.productId,
        image: imageId,
        affiliateLink: template?.affiliateLink?.id ?? null,
      }),
    );
    if (created) onCreated(created.id);
  }

  return (
    <Modal title={template ? 'Duplicate character' : 'New character'} onClose={onClose}>
      <form onSubmit={create} className="space-y-4">
        {error && <ErrorNote message={error} />}
        <div className="flex items-center gap-4">
          <StoryRingAvatar url={selectedImage?.url} name={name || 'Character'} slides={0} size={72} />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="text-xs" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Icon name="upload" className="!text-[14px]" /> {uploading ? 'Uploading…' : 'Upload image'}
              </Button>
              <Button type="button" variant="ghost" className="text-xs" onClick={() => setShowPicker(true)}>
                Choose from media
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Square image, at least 600×600&nbsp;px, face centered.
            </p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && void uploadImage(e.target.files[0])}
        />
        <Field label="Character name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="Luna" />
        </Field>
        <Toggle checked={active} onChange={setActive} label="Active (may appear on the product review)" />
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Creating…' : 'Create character'}
          </Button>
        </div>
      </form>
      {showPicker && (
        <MediaPickerModal
          productId={ws.productId}
          excludeIds={imageId ? [imageId] : []}
          onSelect={(id) => {
            setImageId(id);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Full character editor
// ---------------------------------------------------------------------------

function toDateInput(ms?: number | null): string {
  if (!ms) return '';
  return new Date(Number(ms)).toISOString().slice(0, 10);
}

function fromDateInput(v: string): number | undefined {
  if (!v) return undefined;
  const ms = new Date(`${v}T00:00:00`).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');

  function commit() {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-600 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700 dark:bg-pink-950/40 dark:text-pink-300"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-pink-400 hover:text-pink-700"
            >
              <Icon name="close" className="!text-[12px]" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={value.length === 0 ? 'Type a tag, press Enter' : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent p-0.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200"
          aria-label="Add personality tag"
        />
      </div>
    </div>
  );
}

/** Click-to-set focal point over the profile image. */
function FocalPointEditor({
  media,
  onSaved,
}: {
  media: EntityRow;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const focal = (media.focalPoint as { x: number; y: number } | undefined) ?? { x: 0.5, y: 0.5 };

  async function setFocal(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setSaving(true);
    try {
      await dataApi.update('media', media.id, { focalPoint: { x, y } });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
        Focal point — click where the face/subject is
      </p>
      <button
        type="button"
        onClick={setFocal}
        disabled={saving}
        className="relative block w-full max-w-[220px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
        aria-label="Set focal point by clicking on the image"
      >
        <img src={media.url} alt="" className="w-full" />
        <span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pink-500/70 shadow"
          style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
        />
      </button>
      <p className="mt-1 text-[11px] text-slate-400">
        The original image is never modified — the focal point only controls circular framing.
      </p>
    </div>
  );
}

function CharacterEditorModal({
  character,
  onClose,
  onSaved,
}: {
  character: EntityRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const ws = useWorkspace();

  const [name, setName] = useState(String(character.name ?? ''));
  const [slug, setSlug] = useState(String(character.slug ?? ''));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shortDescription, setShortDescription] = useState(String(character.shortDescription ?? ''));
  const [tags, setTags] = useState<string[]>(
    Array.isArray(character.personalityTags) ? character.personalityTags : [],
  );
  const [style, setStyle] = useState(String(character.characterStyle ?? ''));
  const [gender, setGender] = useState(String(character.genderPresentation ?? ''));
  const [adult, setAdult] = useState(Boolean(character.adult));
  const [active, setActive] = useState(character.active !== false);
  const [featured, setFeatured] = useState(Boolean(character.featured));
  const [featuredStartAt, setFeaturedStartAt] = useState(toDateInput(character.featuredStartAt));
  const [featuredEndAt, setFeaturedEndAt] = useState(toDateInput(character.featuredEndAt));
  const [homepageOrder, setHomepageOrder] = useState(
    character.homepageOrder != null ? String(character.homepageOrder) : '',
  );
  const [imageId, setImageId] = useState<string | null>(character.image?.id ?? null);
  const [affiliateLinkId, setAffiliateLinkId] = useState<string | null>(
    character.affiliateLink?.id ?? null,
  );
  const [slides, setSlides] = useState<EntityRow[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showSlidePicker, setShowSlidePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const slideFileRef = useRef<HTMLInputElement>(null);
  const { busy, error, setError, run } = useAsync();

  const selectedImage = imageId ? ws.related.mediaAll.find((m) => m.id === imageId) : null;
  const focal = (selectedImage?.focalPoint as { x: number; y: number } | undefined) ?? null;

  function touch<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function loadSlides() {
    try {
      const r = await dataApi.list('characterStorySlides');
      setSlides(
        r.rows
          .filter((s) => s.character?.id === character.id && !s.deletedAt)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void loadSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  // ---- profile image -------------------------------------------------------

  async function uploadProfileImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', adult ? '1' : '0');
      form.set('role', 'character');
      form.set('altText', `${name || 'Character'} profile image`);
      form.set('productId', ws.productId);
      const created = await api.upload<{ id: string }>('/api/admin/media/upload', form);
      await ws.refreshRelated();
      setImageId(created.id);
      setDirty(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (profileFileRef.current) profileFileRef.current.value = '';
    }
  }

  // ---- story slides --------------------------------------------------------

  async function addSlideFromMedia(mediaId: string) {
    setError(null);
    try {
      await dataApi.create(
        'characterStorySlides',
        { active: true, sortOrder: slides.length, adult },
        { character: character.id, media: mediaId },
      );
      await loadSlides();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function uploadSlide(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', adult ? '1' : '0');
      form.set('role', 'character');
      form.set('altText', `${name || 'Character'} story slide`);
      form.set('productId', ws.productId);
      const created = await api.upload<{ id: string }>('/api/admin/media/upload', form);
      await ws.refreshRelated();
      await addSlideFromMedia(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (slideFileRef.current) slideFileRef.current.value = '';
    }
  }

  async function patchSlide(slide: EntityRow, fields: Record<string, unknown>) {
    try {
      await dataApi.update('characterStorySlides', slide.id, fields);
      await loadSlides();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeSlide(slide: EntityRow) {
    if (!confirm('Remove this slide? (The media file stays in the library.)')) return;
    try {
      await dataApi.remove('characterStorySlides', slide.id);
      await loadSlides();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function moveSlide(slide: EntityRow, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === slide.id);
    const other = slides[idx + dir];
    if (!other) return;
    try {
      await Promise.all([
        dataApi.update('characterStorySlides', slide.id, { sortOrder: idx + dir }),
        dataApi.update('characterStorySlides', other.id, { sortOrder: idx }),
      ]);
      await loadSlides();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // ---- save -----------------------------------------------------------------

  async function save() {
    const fields: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      shortDescription: shortDescription || undefined,
      personalityTags: tags,
      characterStyle: style || undefined,
      genderPresentation: gender || undefined,
      adult,
      active,
      featured,
      featuredStartAt: fromDateInput(featuredStartAt),
      featuredEndAt: fromDateInput(featuredEndAt),
      homepageOrder: homepageOrder === '' ? undefined : Number(homepageOrder),
    };
    const done = await run(async () => {
      await dataApi.update('characters', character.id, fields, {
        product: ws.productId,
        image: imageId,
        affiliateLink: affiliateLinkId,
      });
      return true;
    });
    if (done) {
      setDirty(false);
      setLastSaved(Date.now());
      onSaved();
    }
  }

  function tryClose() {
    if (dirty && !confirm('You have unsaved character changes. Close anyway?')) return;
    onClose();
  }

  const activeSlides = slides.filter((s) => s.active !== false);
  const featureStatus = (() => {
    if (!featured) return null;
    const now = Date.now();
    const start = fromDateInput(featuredStartAt);
    const end = fromDateInput(featuredEndAt);
    if (start && now < start) return { label: 'Scheduled', tone: 'blue' as const };
    if (end && now > end) return { label: 'Expired', tone: 'amber' as const };
    return { label: 'Live on homepage', tone: 'green' as const };
  })();

  const completion: { label: string; value: string; ok: boolean }[] = [
    { label: 'Identity', value: name.trim() ? 'Complete' : 'Name missing', ok: Boolean(name.trim()) },
    { label: 'Profile image', value: imageId ? 'Complete' : 'Missing', ok: Boolean(imageId) },
    {
      label: 'Story slides',
      value: `${activeSlides.length} active`,
      ok: activeSlides.length > 0,
    },
    {
      label: 'Destination',
      value: affiliateLinkId ? 'Character-specific' : 'Product default',
      ok: true,
    },
    {
      label: 'Alt text',
      value: selectedImage?.altText ? 'Set' : 'Missing',
      ok: Boolean(selectedImage?.altText),
    },
  ];

  return (
    <Modal title={`Edit ${character.name}`} onClose={tryClose} wide>
      <div className="space-y-4">
        {error && <ErrorNote message={error} />}

        <div className="grid gap-5 md:grid-cols-[280px_1fr]">
          {/* Left: profile image + story slides */}
          <div className="space-y-4">
            <div className="flex flex-col items-center rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <StoryRingAvatar
                url={selectedImage?.url}
                name={name}
                slides={activeSlides.length}
                size={110}
                focalPoint={focal}
              />
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {name || 'Character'}
              </p>
              <p className="text-xs text-slate-400">{ws.fields.name}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="secondary" className="!py-1 text-xs" disabled={uploading} onClick={() => profileFileRef.current?.click()}>
                  <Icon name="upload" className="!text-[14px]" /> {imageId ? 'Replace' : 'Upload'}
                </Button>
                <Button type="button" variant="ghost" className="!py-1 text-xs" onClick={() => setShowImagePicker(true)}>
                  Choose from media
                </Button>
                {imageId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="!py-1 text-xs !text-red-500"
                    onClick={() => {
                      setImageId(null);
                      setDirty(true);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Square image, min 600×600&nbsp;px, subject centered.
              </p>
            </div>

            {selectedImage?.url && (
              <FocalPointEditor media={selectedImage} onSaved={() => void ws.refreshRelated()} />
            )}

            {/* Story slides */}
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Character story
                </p>
                {activeSlides.length > 0 && (
                  <Button type="button" variant="ghost" className="!py-0.5 text-xs" onClick={() => setShowPreview(true)}>
                    <Icon name="play_circle" className="!text-[15px]" /> Preview story
                  </Button>
                )}
              </div>
              {slides.length === 0 && (
                <p className="mb-2 text-xs text-slate-400">
                  No story slides yet — the ring stays inactive until the first slide is added.
                </p>
              )}
              <ul className="space-y-2">
                {slides.map((s, idx) => {
                  const m = s.media;
                  return (
                    <li
                      key={s.id}
                      className={`rounded-md border border-slate-200 p-2 dark:border-slate-700 ${s.active === false ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="h-14 w-10 shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                          {m?.url && m?.mediaType === 'image' ? (
                            <img src={m.url} alt="" className="h-full w-full object-cover" />
                          ) : m?.url && m?.mediaType === 'video' ? (
                            <video src={m.url} muted className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <Icon name="broken_image" className="!text-[16px] text-slate-300" />
                            </span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              Slide {idx + 1}
                            </span>
                            {m?.mediaType === 'video' && <Badge tone="blue">video</Badge>}
                            {s.adult && <Badge tone="red">18+</Badge>}
                          </div>
                          <TextInput
                            className="mt-1 !py-1 text-xs"
                            placeholder="Caption (optional)"
                            value={String(s.caption ?? '')}
                            onChange={(e) => {
                              setSlides((prev) =>
                                prev.map((p) => (p.id === s.id ? { ...p, caption: e.target.value } : p)),
                              );
                            }}
                            onBlur={(e) => void patchSlide(s, { caption: e.target.value || undefined })}
                          />
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          <CardBtn name="arrow_upward" label="Move up" disabled={idx === 0} onClick={() => void moveSlide(s, -1)} />
                          <CardBtn
                            name="arrow_downward"
                            label="Move down"
                            disabled={idx === slides.length - 1}
                            onClick={() => void moveSlide(s, 1)}
                          />
                          <CardBtn
                            name={s.adult ? 'explicit' : 'check_circle'}
                            label={s.adult ? 'Mark safe' : 'Mark 18+'}
                            active={Boolean(s.adult)}
                            onClick={() => void patchSlide(s, { adult: !s.adult })}
                          />
                          <CardBtn name="delete" label="Remove slide" danger onClick={() => void removeSlide(s)} />
                        </div>
                        <Toggle
                          checked={s.active !== false}
                          onChange={(v) => void patchSlide(s, { active: v })}
                          aria-label="Slide active"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="!py-1 text-xs" disabled={uploading} onClick={() => slideFileRef.current?.click()}>
                  <Icon name="add_photo_alternate" className="!text-[14px]" /> {uploading ? 'Uploading…' : 'Upload slide'}
                </Button>
                <Button type="button" variant="ghost" className="!py-1 text-xs" onClick={() => setShowSlidePicker(true)}>
                  Choose existing media
                </Button>
              </div>
            </div>
          </div>

          {/* Right: identity, visibility, destination, homepage */}
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Identity</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" required>
                  <TextInput
                    value={name}
                    onChange={(e) => {
                      touch(setName)(e.target.value);
                      if (!showAdvanced) setSlug(slugify(e.target.value));
                    }}
                    required
                  />
                </Field>
                <Field label="Character type">
                  <Select value={style} onChange={(e) => touch(setStyle)(e.target.value)}>
                    <option value="">— select —</option>
                    {['realistic', 'anime', 'fantasy', 'other'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Short description">
                <TextArea rows={2} value={shortDescription} onChange={(e) => touch(setShortDescription)(e.target.value)} />
              </Field>
              <Field label="Personality tags">
                <TagInput value={tags} onChange={touch(setTags)} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Gender presentation">
                  <TextInput value={gender} onChange={(e) => touch(setGender)(e.target.value)} placeholder="female, male, nb…" />
                </Field>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-pink-600"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
              >
                {showAdvanced ? '− Hide advanced' : '+ Advanced (slug)'}
              </button>
              {showAdvanced && (
                <Field label="Slug" hint="Auto-generated from the name. Changing it can break links.">
                  <TextInput
                    value={slug}
                    onChange={(e) => touch(setSlug)(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                </Field>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Visibility</p>
              <div className="flex flex-wrap items-center gap-6">
                <Toggle checked={active} onChange={touch(setActive)} label="Active (shown on review)" />
                <Toggle checked={adult} onChange={touch(setAdult)} label="18+ character" />
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Character destination
              </p>
              <Field
                label="Destination"
                hint="Where the story CTA sends visitors. Product default uses the product's active affiliate link."
              >
                <Select value={affiliateLinkId ?? ''} onChange={(e) => touch(setAffiliateLinkId)(e.target.value || null)}>
                  <option value="">Use product default</option>
                  {ws.related.affiliateLinks.map((l) => (
                    <option key={l.id} value={l.id}>
                      /go/{l.cloakedSlug}
                      {l.active === false ? ' (inactive)' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              {affiliateLinkId &&
                (() => {
                  const link = ws.related.affiliateLinks.find((l) => l.id === affiliateLinkId);
                  if (!link) return null;
                  return (
                    <p className="text-xs text-slate-500">
                      → {String(link.destinationUrl ?? '')}
                      {link.active === false && (
                        <span className="ml-1 font-medium text-red-600">This link is inactive.</span>
                      )}
                    </p>
                  );
                })()}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Homepage appearance
                </p>
                {featureStatus && <Badge tone={featureStatus.tone}>{featureStatus.label}</Badge>}
              </div>
              <Toggle checked={featured} onChange={touch(setFeatured)} label="Featured on homepage" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Featured from">
                  <TextInput
                    type="date"
                    value={featuredStartAt}
                    disabled={!featured}
                    onChange={(e) => touch(setFeaturedStartAt)(e.target.value)}
                  />
                </Field>
                <Field label="Featured until">
                  <TextInput
                    type="date"
                    value={featuredEndAt}
                    disabled={!featured}
                    onChange={(e) => touch(setFeaturedEndAt)(e.target.value)}
                  />
                </Field>
                <Field label="Display order">
                  <TextInput type="number" value={homepageOrder} onChange={(e) => touch(setHomepageOrder)(e.target.value)} />
                </Field>
              </div>
              {featured && featuredStartAt && featuredEndAt && featuredEndAt < featuredStartAt && (
                <p className="text-xs text-red-600">“Featured until” must be after “Featured from”.</p>
              )}
              <p className="text-[11px] text-slate-400">
                Active = may appear on the product review. Featured = appears in the homepage
                Featured Characters module (slot scheduling applies).
              </p>
            </div>

            {/* Completion summary */}
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Completion</p>
              <ul className="mt-1.5 space-y-0.5 text-xs">
                {completion.map((row) => (
                  <li key={row.label} className="flex items-center justify-between">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={row.ok ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-slate-100 bg-white pt-3 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400">
            {dirty
              ? 'Unsaved changes'
              : lastSaved
                ? `Saved ${new Date(lastSaved).toLocaleTimeString()}`
                : 'Slides save immediately; identity fields save with the button.'}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={tryClose}>
              Close
            </Button>
            <Button onClick={() => void save()} disabled={busy || !name.trim()}>
              {busy ? 'Saving…' : 'Save character'}
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={profileFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && void uploadProfileImage(e.target.files[0])}
      />
      <input
        ref={slideFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && void uploadSlide(e.target.files[0])}
      />

      {showImagePicker && (
        <MediaPickerModal
          productId={ws.productId}
          excludeIds={imageId ? [imageId] : []}
          onSelect={(id) => {
            setImageId(id);
            setDirty(true);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
      {showSlidePicker && (
        <MediaPickerModal
          productId={ws.productId}
          excludeIds={slides.map((s) => s.media?.id).filter(Boolean) as string[]}
          onSelect={(id) => {
            setShowSlidePicker(false);
            void addSlideFromMedia(id);
          }}
          onClose={() => setShowSlidePicker(false)}
        />
      )}
      {showPreview && (
        <StoryPreviewModal
          name={name}
          archetype={tags[0] ?? ''}
          avatar={selectedImage?.url ?? ''}
          slides={activeSlides}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Story preview: lightweight admin version of the public story viewer
// (progress bars, prev/next, portrait media).
// ---------------------------------------------------------------------------

function StoryPreviewModal({
  name,
  archetype,
  avatar,
  slides,
  onClose,
}: {
  name: string;
  archetype: string;
  avatar: string;
  slides: EntityRow[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const duration = Number(slide?.duration ?? DEFAULT_SLIDE_MS);

  useEffect(() => {
    if (slide?.media?.mediaType === 'video') return; // videos advance manually
    const t = setTimeout(() => {
      setIndex((i) => (i + 1 < slides.length ? i + 1 : i));
    }, duration);
    return () => clearTimeout(t);
  }, [index, duration, slides.length, slide?.media?.mediaType]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length, onClose]);

  if (!slide) return null;
  const media = slide.media;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
      <div className="relative h-[80vh] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900">
        {/* progress bars */}
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          {slides.map((s, i) => (
            <span key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <span className={`block h-full bg-white ${i < index ? 'w-full' : i === index ? 'w-1/2' : 'w-0'}`} />
            </span>
          ))}
        </div>
        {/* header */}
        <div className="absolute inset-x-0 top-4 z-10 flex items-center gap-2 px-3">
          {avatar && <img src={avatar} alt="" className="h-8 w-8 rounded-full border border-white/40 object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            {archetype && <p className="truncate text-xs text-white/70">{archetype}</p>}
          </div>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
          >
            <Icon name="close" className="!text-[18px]" />
          </button>
        </div>
        {/* media */}
        {media?.mediaType === 'video' && media?.url ? (
          <video
            key={slide.id}
            src={media.url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : media?.url ? (
          <img key={slide.id} src={media.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/50">
            <Icon name="broken_image" className="!text-[36px]" />
          </div>
        )}
        {/* caption */}
        {slide.caption && (
          <p className="absolute inset-x-0 bottom-10 z-10 px-4 text-center text-sm font-medium text-white drop-shadow">
            {String(slide.caption)}
          </p>
        )}
        {/* tap zones */}
        <button
          type="button"
          aria-label="Previous slide"
          className="absolute inset-y-0 left-0 z-[5] w-1/3"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        />
        <button
          type="button"
          aria-label="Next slide"
          className="absolute inset-y-0 right-0 z-[5] w-1/3"
          onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
        />
      </div>
    </div>
  );
}
