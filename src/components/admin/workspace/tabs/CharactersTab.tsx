// Characters tab: story highlights with a simple two-step create/edit flow.

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../../api';
import { AvatarDropzone } from '../../character/AvatarDropzone';
import { StorySlideDropzone } from '../../character/StorySlideDropzone';
import { ConfirmDialog } from '../../ConfirmDialog';
import { ImageCropModal } from '../../ImageCropModal';
import { useCan } from '../../context';
import { slugify } from '../../slugify';
import { useAsyncToast } from '../../Toast';
import { DEFAULT_AFFILIATE_REL } from '../../../../lib/affiliate/rel';
import { resolveCharacterDestination } from '../../../../lib/characters/destinationUrl';
import { MAX_CHARACTER_STORY_SLIDES } from '../../../../lib/characters/limits';
import { fileWithInferredMime } from '../../../../lib/media/mime';
import { resolveMediaUrl } from '../../../../lib/media/url';
import { Badge, Button, Field, Icon, Modal, TextInput, Toggle } from '../../ui';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';

const DEFAULT_SLIDE_MS = 5200;

export function CharactersTab() {
  const ws = useWorkspace();
  const can = useCan();
  const canEdit = can('content.edit');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<EntityRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntityRow | null>(null);
  const [slideCounts, setSlideCounts] = useState<Map<string, number>>(new Map());
  const { error, setError } = useAsyncToast();

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
    try {
      await dataApi.remove('characters', row.id);
      await ws.refreshRelated();
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const editingCharacter = editingId ? characters.find((c) => c.id === editingId) ?? null : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {characters.length} character{characters.length === 1 ? '' : 's'} · story highlights on the review page.
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
            <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">No characters yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Add characters with a profile picture and story slides for the review page highlights.
            </p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setCreating(true)}>
                <Icon name="person_add" /> Add first character
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {characters.map((c) => {
              const img =
                resolveMediaUrl(c.image) ||
                resolveMediaUrl(ws.related.mediaAll.find((m) => m.id === c.image?.id)) ||
                undefined;
              const slides = slideCounts.get(c.id) ?? 0;
              return (
                <CharacterCard
                  key={c.id}
                  character={c}
                  avatarUrl={img}
                  slideCount={slides}
                  canEdit={canEdit}
                  onToggleActive={(v) => void patch(c, { active: v })}
                  onEdit={() => setEditingId(c.id)}
                  onDuplicate={() => setDuplicating(c)}
                  onDelete={() => setDeleteTarget(c)}
                />
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
            setEditingId(id);
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
          onSaved={() => void ws.refreshRelated()}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete character?"
          message="This soft-deletes the character. You can restore it from the database if needed."
          confirmLabel="Delete character"
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void softDelete(deleteTarget)}
        >
          <div className="flex items-center gap-3">
            <StoryRingAvatar
              url={deleteTarget.image?.url}
              name={String(deleteTarget.name)}
              slides={slideCounts.get(deleteTarget.id) ?? 0}
              size={56}
            />
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{deleteTarget.name}</p>
              <p className="text-xs text-slate-500">
                {slideCounts.get(deleteTarget.id) ?? 0} story slide
                {(slideCounts.get(deleteTarget.id) ?? 0) === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

function StoryRingAvatar({
  url,
  name,
  slides,
  size = 64,
}: {
  url?: string | null;
  name: string;
  slides: number;
  size?: number;
}) {
  const hasStory = slides > 0;
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
          <img src={url} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon name="person" className="!text-[24px] text-slate-300" />
          </span>
        )}
      </span>
    </span>
  );
}

function CharacterCard({
  character,
  avatarUrl,
  slideCount,
  canEdit,
  onToggleActive,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  character: EntityRow;
  avatarUrl?: string | null;
  slideCount: number;
  canEdit: boolean;
  onToggleActive: (v: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        character.active === false ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <StoryRingAvatar url={avatarUrl} name={String(character.name)} slides={slideCount} size={72} />
        <p className="mt-2 max-w-full truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
          {character.name}
        </p>
        <p className="text-xs text-slate-400">
          {slideCount} slide{slideCount === 1 ? '' : 's'}
        </p>
        {character.featured && <Badge tone="pink">featured</Badge>}
      </div>
      {canEdit && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
          <Toggle
            checked={character.active !== false}
            onChange={onToggleActive}
            aria-label={`${character.name} active`}
          />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Character actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <Icon name="more_vert" className="!text-[20px]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <MenuItem icon="edit" label="Edit" onClick={() => { setMenuOpen(false); onEdit(); }} />
                <MenuItem icon="content_copy" label="Duplicate" onClick={() => { setMenuOpen(false); onDuplicate(); }} />
                <MenuItem icon="delete" label="Delete" danger onClick={() => { setMenuOpen(false); onDelete(); }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
        danger
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      <Icon name={icon} className="!text-[18px]" />
      {label}
    </button>
  );
}

async function uploadCharacterImage(
  productId: string,
  file: File | Blob,
  name: string,
  filename = 'avatar.jpg',
): Promise<string> {
  const form = new FormData();
  const payload = file instanceof File ? fileWithInferredMime(file) : file;
  form.set('file', payload instanceof File ? payload : new File([payload], filename, { type: 'image/jpeg' }));
  form.set('adult', '1');
  form.set('role', 'character');
  form.set('altText', `${name || 'Character'} profile image`);
  form.set('productId', productId);
  const created = await api.upload<{ id: string }>('/api/admin/media/upload', form);
  return created.id;
}

// Step 1: name + destination URL + avatar (crop before upload)
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
  const [destinationUrl, setDestinationUrl] = useState(String(template?.destinationUrl ?? ''));
  const [imageId, setImageId] = useState<string | null>(template?.image?.id ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(template?.image?.url ?? null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { busy, error, setError, run } = useAsyncToast();

  const trackedUrl = resolveCharacterDestination(destinationUrl, ws.fields.referralSuffix);

  async function onCropped(blob: Blob) {
    setCropFile(null);
    setUploadingAvatar(true);
    setError(null);
    try {
      const id = await uploadCharacterImage(ws.productId, blob, name);
      await ws.refreshRelated();
      const refreshed = await dataApi.list('media');
      const media = refreshed.rows.find((m) => m.id === id);
      setImageId(id);
      setPreviewUrl(media?.url ?? URL.createObjectURL(blob));

      // Auto-advance to the editor when name + link are already filled.
      if (name.trim() && destinationUrl.trim()) {
        const fields: Record<string, unknown> = {
          name: name.trim(),
          slug: slugify(name),
          active: true,
          adult: true,
          destinationUrl: destinationUrl.trim(),
          ...(template?.featured ? { featured: template.featured } : {}),
        };
        const created = await dataApi.create('characters', fields, {
          product: ws.productId,
          image: id,
        });
        onCreated(created.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const fields: Record<string, unknown> = {
      name: name.trim(),
      slug: slugify(name),
      active: true,
      adult: true,
      destinationUrl: destinationUrl.trim() || undefined,
      ...(template?.featured ? { featured: template.featured } : {}),
    };
    const created = await run(() =>
      dataApi.create('characters', fields, {
        product: ws.productId,
        ...(imageId ? { image: imageId } : {}),
      }),
    );
    if (created) onCreated(created.id);
  }

  return (
    <>
      <Modal title={template ? 'Duplicate character' : 'New character'} onClose={onClose}>
        <form onSubmit={create} className="space-y-4">
          <Field label="Character name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="Luna" />
          </Field>
          <Field
            label="Character link"
            required
            hint="Direct URL to this character on the platform (referral suffix from Setup is appended automatically)."
          >
            <TextInput
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              required
              placeholder="https://candy.ai/character/luna"
            />
            {trackedUrl && (
              <p className="mt-1 break-all text-[11px] leading-snug text-slate-400">{trackedUrl}</p>
            )}
          </Field>
          <div className="flex justify-center pt-1">
            <AvatarDropzone
              variant="profile"
              previewUrl={previewUrl}
              uploading={uploadingAvatar}
              onFileSelected={(file) => setCropFile(file)}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !name.trim() || !destinationUrl.trim() || !imageId}>
              {busy ? 'Creating…' : 'Continue'}
            </Button>
          </div>
        </form>
      </Modal>
      {cropFile && (
        <ImageCropModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={(blob) => void onCropped(blob)} />
      )}
    </>
  );
}

// Step 2: simplified editor
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
  const [featured, setFeatured] = useState(Boolean(character.featured));
  const [destinationUrl, setDestinationUrl] = useState(String(character.destinationUrl ?? ''));
  const [imageId, setImageId] = useState<string | null>(character.image?.id ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(character.image?.url ?? null);
  const [slides, setSlides] = useState<EntityRow[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingSlides, setUploadingSlides] = useState(false);
  const [dragSlideId, setDragSlideId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [removeSlideTarget, setRemoveSlideTarget] = useState<EntityRow | null>(null);
  const { busy, error, setError, run } = useAsyncToast();

  const trackedUrl = resolveCharacterDestination(destinationUrl, ws.fields.referralSuffix);
  const activeSlides = slides.filter((s) => s.active !== false);

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

  async function onAvatarCropped(blob: Blob) {
    setCropFile(null);
    setUploadingAvatar(true);
    try {
      const id = await uploadCharacterImage(ws.productId, blob, name);
      await ws.refreshRelated();
      const media = ws.related.mediaAll.find((m) => m.id === id);
      setImageId(id);
      setPreviewUrl(media?.url ?? URL.createObjectURL(blob));
      setDirty(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function uploadSlides(files: File[]) {
    const currentCount = slides.filter((s) => s.active !== false && !s.deletedAt).length;
    const remaining = MAX_CHARACTER_STORY_SLIDES - currentCount;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_CHARACTER_STORY_SLIDES} story slides per character.`);
      return;
    }
    const batch = files.slice(0, remaining);
    if (batch.length < files.length) {
      setError(`Only ${remaining} more slide${remaining === 1 ? '' : 's'} can be added (max ${MAX_CHARACTER_STORY_SLIDES}).`);
    } else {
      setError(null);
    }
    setUploadingSlides(true);
    try {
      let order = slides.length;
      for (const file of batch) {
        const form = new FormData();
        form.set('file', fileWithInferredMime(file));
        form.set('adult', '1');
        form.set('role', 'character');
        form.set('altText', `${name || 'Character'} story slide`);
        form.set('productId', ws.productId);
        const created = await api.upload<{ id: string }>('/api/admin/media/upload', form);
        await dataApi.create(
          'characterStorySlides',
          { active: true, sortOrder: order, adult: true },
          { character: character.id, media: created.id },
        );
        order++;
      }
      await loadSlides();
      setDirty(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingSlides(false);
    }
  }

  async function persistSlideOrder(next: EntityRow[]) {
    setSlides(next);
    setDirty(true);
    try {
      await Promise.all(
        next.map((s, i) => dataApi.update('characterStorySlides', s.id, { sortOrder: i, active: s.active !== false })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder slides');
      await loadSlides();
    }
  }

  function reorderSlides(fromId: string, toId: string) {
    if (fromId === toId) return;
    const fromIdx = slides.findIndex((s) => s.id === fromId);
    const toIdx = slides.findIndex((s) => s.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...slides];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    void persistSlideOrder(next);
  }

  async function removeSlide(slide: EntityRow) {
    try {
      await dataApi.remove('characterStorySlides', slide.id);
      await loadSlides();
      setRemoveSlideTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function save() {
    const done = await run(async () => {
      await dataApi.update(
        'characters',
        character.id,
        {
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          featured,
          adult: true,
          active: true,
          destinationUrl: destinationUrl.trim() || undefined,
        },
        { product: ws.productId, image: imageId },
      );
      return true;
    });
    if (done) {
      setDirty(false);
      onSaved();
      onClose();
    }
  }

  function tryClose() {
    if (dirty) setCloseConfirm(true);
    else onClose();
  }

  return (
    <>
      <Modal title={name || 'Edit character'} onClose={tryClose} wide>
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-3 flex justify-center">
                <StoryRingAvatar url={previewUrl} name={name} slides={activeSlides.length} size={100} />
              </div>
              <AvatarDropzone
                previewUrl={null}
                variant="iconOnly"
                uploading={uploadingAvatar}
                onFileSelected={(file) => setCropFile(file)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Name" required>
              <TextInput
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!showAdvanced) setSlug(slugify(e.target.value));
                  setDirty(true);
                }}
                required
              />
            </Field>

            <Field label="Character link" required>
              <TextInput
                value={destinationUrl}
                onChange={(e) => {
                  setDestinationUrl(e.target.value);
                  setDirty(true);
                }}
                placeholder="https://candy.ai/character/luna"
              />
              {trackedUrl && (
                <p className="mt-1 break-all text-[11px] leading-snug text-slate-400">{trackedUrl}</p>
              )}
            </Field>

            <Toggle
              checked={featured}
              onChange={(v) => {
                setFeatured(v);
                setDirty(true);
              }}
              label="Featured on homepage"
            />
            <p className="text-[11px] leading-snug text-slate-400">
              Adds this character to Homepage → Featured characters and the live homepage carousel.
            </p>

            <button
              type="button"
              className="block text-left text-xs font-medium text-slate-500 hover:text-pink-600"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? '− Hide advanced' : '+ Advanced (slug)'}
            </button>
            {showAdvanced && (
              <Field label="Slug">
                <TextInput
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setDirty(true);
                  }}
                />
              </Field>
            )}

            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Character story · {activeSlides.length}/{MAX_CHARACTER_STORY_SLIDES}
                </p>
                {activeSlides.length > 0 && (
                  <Button type="button" variant="ghost" className="!py-0.5 text-xs" onClick={() => setShowPreview(true)}>
                    <Icon name="play_circle" className="!text-[15px]" /> Preview
                  </Button>
                )}
              </div>
              {slides.length > 0 && (
                <ul className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {slides.map((s) => (
                    <li
                      key={s.id}
                      draggable
                      onDragStart={() => setDragSlideId(s.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragSlideId) reorderSlides(dragSlideId, s.id);
                        setDragSlideId(null);
                      }}
                      onDragEnd={() => setDragSlideId(null)}
                      className={`group relative aspect-[9/16] cursor-grab overflow-hidden rounded-md bg-slate-100 active:cursor-grabbing dark:bg-slate-800 ${
                        dragSlideId === s.id ? 'opacity-50 ring-2 ring-pink-400' : ''
                      }`}
                    >
                      <span className="absolute left-1 top-1 z-10 rounded bg-black/45 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <Icon name="drag_indicator" className="!text-[14px]" />
                      </span>
                      {s.media?.url && s.media.mediaType === 'video' ? (
                        <video src={s.media.url} muted className="h-full w-full object-cover" />
                      ) : s.media?.url ? (
                        <img src={s.media.url} alt="" className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          <Icon name="broken_image" className="text-slate-300" />
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="Remove slide"
                        onClick={() => setRemoveSlideTarget(s)}
                        className="absolute right-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Icon name="close" className="!text-[14px]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <StorySlideDropzone
                uploading={uploadingSlides}
                disabled={activeSlides.length >= MAX_CHARACTER_STORY_SLIDES}
                onFiles={(files) => void uploadSlides(files)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="secondary" onClick={tryClose}>
            Close
          </Button>
          <Button onClick={() => void save()} disabled={busy || !name.trim() || !destinationUrl.trim()}>
            {busy ? 'Saving…' : 'Save character'}
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </Modal>

      {cropFile && (
        <ImageCropModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={(blob) => void onAvatarCropped(blob)} />
      )}
      {showPreview && (
        <StoryPreviewModal
          name={name}
          avatar={previewUrl ?? ''}
          slides={activeSlides}
          onClose={() => setShowPreview(false)}
        />
      )}
      {closeConfirm && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          message="You have unsaved character changes."
          confirmLabel="Close anyway"
          danger
          onCancel={() => setCloseConfirm(false)}
          onConfirm={() => {
            setCloseConfirm(false);
            onClose();
          }}
        />
      )}
      {removeSlideTarget && (
        <ConfirmDialog
          title="Remove story slide?"
          message="The media file stays in the library."
          confirmLabel="Remove slide"
          danger
          onCancel={() => setRemoveSlideTarget(null)}
          onConfirm={() => void removeSlide(removeSlideTarget)}
        />
      )}
    </>
  );
}

function StoryPreviewModal({
  name,
  avatar,
  slides,
  onClose,
}: {
  name: string;
  avatar: string;
  slides: EntityRow[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const duration = Number(slide?.duration ?? DEFAULT_SLIDE_MS);

  useEffect(() => {
    if (slide?.media?.mediaType === 'video') return;
    const t = setTimeout(() => setIndex((i) => (i + 1 < slides.length ? i + 1 : i)), duration);
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
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          {slides.map((s, i) => (
            <span key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <span className={`block h-full bg-white ${i < index ? 'w-full' : i === index ? 'w-1/2' : 'w-0'}`} />
            </span>
          ))}
        </div>
        <div className="absolute inset-x-0 top-4 z-10 flex items-center gap-2 px-3">
          {avatar && <img src={avatar} alt="" className="h-8 w-8 rounded-full border border-white/40 object-cover" />}
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{name}</p>
          <button type="button" aria-label="Close preview" onClick={onClose} className="rounded-full bg-black/40 p-1 text-white">
            <Icon name="close" className="!text-[18px]" />
          </button>
        </div>
        {media?.mediaType === 'video' && media?.url ? (
          <video key={slide.id} src={media.url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
        ) : media?.url ? (
          <img key={slide.id} src={media.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/50">
            <Icon name="broken_image" className="!text-[36px]" />
          </div>
        )}
        <button type="button" aria-label="Previous" className="absolute inset-y-0 left-0 z-[5] w-1/3" onClick={() => setIndex((i) => Math.max(0, i - 1))} />
        <button type="button" aria-label="Next" className="absolute inset-y-0 right-0 z-[5] w-1/3" onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))} />
      </div>
    </div>
  );
}
