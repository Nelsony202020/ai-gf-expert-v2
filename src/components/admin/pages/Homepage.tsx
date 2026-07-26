// Homepage editor: ordered brands (top picks), featured characters, and topics.
// Drag to reorder locally, then save — max 3 brands, 12 characters, 12 topics.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { dataApi, type EntityRow } from '../api';
import { useCan } from '../context';
import {
  Button,
  ErrorNote,
  Field,
  Icon,
  Modal,
  Spinner,
  TextInput,
  Toggle,
  useAsync,
} from '../ui';

const MAX_BRANDS = 3;
const MAX_CHARACTERS = 12;
const MAX_TOPICS = 12;

type SlotKind = 'top_pick' | 'featured_character' | 'topic';
type EditTarget =
  | { kind: SlotKind; slot: EntityRow | null }
  | null;

function reorderList<T extends { id: string }>(items: T[], fromId: string, toId: string): T[] {
  const fromIdx = items.findIndex((i) => i.id === fromId);
  const toIdx = items.findIndex((i) => i.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return items;
  const next = [...items];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

function productLogoUrl(product: EntityRow | null | undefined): string | null {
  return product?.logo?.url ?? null;
}

function characterAvatarUrl(character: EntityRow | null | undefined): string | null {
  return character?.image?.url ?? null;
}

function characterPlatform(character: EntityRow | null | undefined): string {
  return character?.product?.name ?? 'Unknown platform';
}

// ---------------------------------------------------------------------------
// Searchable picker (products or characters)
// ---------------------------------------------------------------------------

function SearchablePicker({
  options,
  value,
  onChange,
  placeholder,
  renderOption,
  renderValue,
}: {
  options: EntityRow[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  renderOption: (row: EntityRow) => ReactNode;
  renderValue?: (row: EntityRow) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options
      .filter((o) => {
        const name = String(o.name ?? '').toLowerCase();
        const platform = String(o.product?.name ?? '').toLowerCase();
        return name.includes(q) || platform.includes(q);
      })
      .slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        {selected && renderValue ? (
          renderValue(selected)
        ) : selected ? (
          <span className="font-medium text-slate-800 dark:text-slate-200">{selected.name}</span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <Icon name="expand_more" className="ml-auto !text-[20px] text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-800">
            <TextInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="!py-1.5 text-sm"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-pink-50 dark:hover:bg-pink-950/30 ${
                      row.id === value ? 'bg-pink-50 dark:bg-pink-950/20' : ''
                    }`}
                    onClick={() => {
                      onChange(row.id);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    {renderOption(row)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable slot row
// ---------------------------------------------------------------------------

function SlotAvatar({
  url,
  fallbackIcon,
  alt,
}: {
  url: string | null;
  fallbackIcon: string;
  alt: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
      <Icon name={fallbackIcon} className="!text-[22px] text-slate-300" />
    </div>
  );
}

function DraggableSlotRow({
  slot,
  position,
  kind,
  product,
  character,
  canEdit,
  onEdit,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
}: {
  slot: EntityRow;
  position: number;
  kind: SlotKind;
  product?: EntityRow | null;
  character?: EntityRow | null;
  canEdit: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  dragging: boolean;
}) {
  const isBrand = kind === 'top_pick';
  const isCharacter = kind === 'featured_character';
  const title = isBrand
    ? product?.name ?? slot.product?.name ?? 'Unknown product'
    : isCharacter
      ? character?.name ?? slot.character?.name ?? 'Unknown character'
      : slot.label ?? 'Untitled topic';
  const subtitle =
    isCharacter && character
      ? characterPlatform(character)
      : isBrand
        ? 'Brand'
        : 'Topic';

  const avatarUrl = isBrand
    ? productLogoUrl(product ?? slot.product)
    : isCharacter
      ? characterAvatarUrl(character ?? slot.character)
      : null;

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition-opacity dark:bg-slate-900 ${
        dragging ? 'opacity-40' : ''
      } border-slate-200 dark:border-slate-700`}
    >
      {canEdit && (
        <span
          className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-hidden="true"
        >
          <Icon name="drag_indicator" className="!text-[22px]" />
        </span>
      )}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {position}
      </span>
      {kind === 'topic' ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 dark:bg-pink-950/40">
          <Icon name="tag" className="!text-[20px] text-pink-600" />
        </div>
      ) : (
        <SlotAvatar
          url={avatarUrl}
          fallbackIcon={isBrand ? 'storefront' : 'person'}
          alt=""
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{title}</p>
        {isCharacter && (
          <p className="truncate text-xs text-slate-500">({subtitle})</p>
        )}
        {isBrand && <p className="truncate text-xs text-slate-400">Top pick</p>}
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-pink-600 dark:hover:bg-slate-800"
            onClick={onEdit}
            aria-label="Edit"
          >
            <Icon name="edit" className="!text-[18px]" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
            onClick={onRemove}
            aria-label="Remove"
          >
            <Icon name="delete" className="!text-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section with drag-drop + save
// ---------------------------------------------------------------------------

function HomepageSection({
  title,
  description,
  kind,
  maxItems,
  draftSlots,
  dirty,
  canEdit,
  productMap,
  characterMap,
  onDraftChange,
  onSave,
  onAdd,
  onEdit,
  onRemove,
  saving,
}: {
  title: string;
  description: string;
  kind: SlotKind;
  maxItems: number;
  draftSlots: EntityRow[];
  dirty: boolean;
  canEdit: boolean;
  productMap: Map<string, EntityRow>;
  characterMap: Map<string, EntityRow>;
  onDraftChange: (next: EntityRow[]) => void;
  onSave: () => void;
  onAdd: () => void;
  onEdit: (slot: EntityRow) => void;
  onRemove: (slot: EntityRow) => void;
  saving: boolean;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(toId: string) {
    if (!dragId) return;
    onDraftChange(reorderList(draftSlots, dragId, toId));
    setDragId(null);
  }

  const canAdd = draftSlots.length < maxItems;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          <p className="mt-1 text-xs text-slate-400">
            {draftSlots.length} of {maxItems} · positions 1–{draftSlots.length || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && canEdit && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save order'}
            </Button>
          )}
          {canEdit && canAdd && (
            <Button variant="secondary" onClick={onAdd}>
              <Icon name="add" /> Add
            </Button>
          )}
        </div>
      </div>

      {draftSlots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Nothing here yet.</p>
          {canEdit && canAdd && (
            <Button className="mt-3" variant="secondary" onClick={onAdd}>
              Add first item
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {draftSlots.map((slot, index) => {
            const productId = slot.product?.id;
            const characterId = slot.character?.id;
            return (
              <DraggableSlotRow
                key={slot.id}
                slot={slot}
                position={index + 1}
                kind={kind}
                product={productId ? productMap.get(productId) : null}
                character={characterId ? characterMap.get(characterId) : null}
                canEdit={canEdit}
                dragging={dragId === slot.id}
                onEdit={() => onEdit(slot)}
                onRemove={() => onRemove(slot)}
                onDragStart={() => setDragId(slot.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(slot.id)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Edit / create modal
// ---------------------------------------------------------------------------

function SlotModal({
  target,
  products,
  characters,
  nextPosition,
  onClose,
  onDone,
}: {
  target: NonNullable<EditTarget>;
  products: EntityRow[];
  characters: EntityRow[];
  nextPosition: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const { kind, slot } = target;
  const [productId, setProductId] = useState(slot?.product?.id ?? '');
  const [characterId, setCharacterId] = useState(slot?.character?.id ?? '');
  const [topicLabel, setTopicLabel] = useState(slot?.label ?? '');
  const [active, setActive] = useState(slot ? Boolean(slot.active) : true);
  const { busy, error, run } = useAsync();

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [products],
  );
  const sortedCharacters = useMemo(
    () =>
      [...characters].sort((a, b) => {
        const pa = String(a.product?.name ?? '');
        const pb = String(b.product?.name ?? '');
        return pa.localeCompare(pb) || String(a.name).localeCompare(String(b.name));
      }),
    [characters],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fields: Record<string, unknown> = {
      kind,
      position: slot?.position ?? nextPosition,
      active,
    };
    if (kind === 'topic') {
      fields.label = topicLabel.trim();
    }
    const links = {
      product: kind === 'top_pick' ? productId || null : null,
      character: kind === 'featured_character' ? characterId || null : null,
    };
    const done = await run(async () => {
      if (slot) await dataApi.update('homepageSlots', slot.id, fields, links);
      else await dataApi.create('homepageSlots', fields, links);
      return true;
    });
    if (done) onDone();
  }

  const title =
    kind === 'top_pick'
      ? slot
        ? 'Edit brand slot'
        : 'Add brand'
      : kind === 'featured_character'
        ? slot
          ? 'Edit character slot'
          : 'Add character'
        : slot
          ? 'Edit topic'
          : 'Add topic';

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {error && <ErrorNote message={error} />}

        {kind === 'top_pick' && (
          <Field label="Product (brand)" required>
            <SearchablePicker
              options={sortedProducts}
              value={productId}
              onChange={setProductId}
              placeholder="Search products…"
              renderOption={(p) => (
                <>
                  <SlotAvatar url={productLogoUrl(p)} fallbackIcon="storefront" alt="" />
                  <span className="font-medium">{p.name}</span>
                </>
              )}
              renderValue={(p) => (
                <>
                  <SlotAvatar url={productLogoUrl(p)} fallbackIcon="storefront" alt="" />
                  <span className="font-medium">{p.name}</span>
                </>
              )}
            />
          </Field>
        )}

        {kind === 'featured_character' && (
          <Field label="Character" required>
            <SearchablePicker
              options={sortedCharacters}
              value={characterId}
              onChange={setCharacterId}
              placeholder="Search characters…"
              renderOption={(c) => (
                <>
                  <SlotAvatar url={characterAvatarUrl(c)} fallbackIcon="person" alt="" />
                  <span>
                    <span className="font-medium">{c.name}</span>{' '}
                    <span className="text-slate-400">({characterPlatform(c)})</span>
                  </span>
                </>
              )}
              renderValue={(c) => (
                <>
                  <SlotAvatar url={characterAvatarUrl(c)} fallbackIcon="person" alt="" />
                  <span>
                    <span className="font-medium">{c.name}</span>{' '}
                    <span className="text-slate-400">({characterPlatform(c)})</span>
                  </span>
                </>
              )}
            />
          </Field>
        )}

        {kind === 'topic' && (
          <Field label="Topic label" required>
            <TextInput
              value={topicLabel}
              onChange={(e) => setTopicLabel(e.target.value)}
              placeholder="e.g. Realism & conversations"
              required
            />
          </Field>
        )}

        <Toggle checked={active} onChange={setActive} label="Show on homepage" />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              busy ||
              (kind === 'top_pick' && !productId) ||
              (kind === 'featured_character' && !characterId) ||
              (kind === 'topic' && !topicLabel.trim())
            }
          >
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function HomepagePage() {
  const can = useCan();
  const canEdit = can('homepage.edit');
  const [slots, setSlots] = useState<EntityRow[] | null>(null);
  const [products, setProducts] = useState<EntityRow[]>([]);
  const [characters, setCharacters] = useState<EntityRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [draftPicks, setDraftPicks] = useState<EntityRow[]>([]);
  const [draftCharacters, setDraftCharacters] = useState<EntityRow[]>([]);
  const [draftTopics, setDraftTopics] = useState<EntityRow[]>([]);
  const [dirtyPicks, setDirtyPicks] = useState(false);
  const [dirtyCharacters, setDirtyCharacters] = useState(false);
  const [dirtyTopics, setDirtyTopics] = useState(false);
  const { busy: saving, run: saveRun } = useAsync();

  const reload = useCallback(() => {
    dataApi
      .list('homepageSlots')
      .then((r) => setSlots(r.rows.sort((a, b) => a.position - b.position)))
      .catch((e) => setError(e.message));
    dataApi
      .list('products')
      .then((r) => setProducts(r.rows.filter((p) => !p.deletedAt)))
      .catch(() => {});
    dataApi
      .list('characters')
      .then((r) => setCharacters(r.rows.filter((c) => !c.deletedAt)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const picks = useMemo(() => (slots ?? []).filter((s) => s.kind === 'top_pick'), [slots]);
  const featured = useMemo(
    () => (slots ?? []).filter((s) => s.kind === 'featured_character'),
    [slots],
  );
  const topics = useMemo(() => (slots ?? []).filter((s) => s.kind === 'topic'), [slots]);

  useEffect(() => {
    if (!slots) return;
    setDraftPicks(picks);
    setDraftCharacters(featured);
    setDraftTopics(topics);
    setDirtyPicks(false);
    setDirtyCharacters(false);
    setDirtyTopics(false);
  }, [slots, picks, featured, topics]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const characterMap = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);

  async function saveOrder(kind: SlotKind, draft: EntityRow[], setDirty: (v: boolean) => void) {
    await saveRun(async () => {
      await Promise.all(
        draft.map((slot, index) =>
          dataApi.update('homepageSlots', slot.id, { position: index + 1, kind }),
        ),
      );
      return true;
    });
    setDirty(false);
    reload();
  }

  async function removeSlot(slot: EntityRow) {
    if (!confirm('Remove this item from the homepage?')) return;
    try {
      await dataApi.remove('homepageSlots', slot.id);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function nextPositionFor(kind: SlotKind): number {
    const list =
      kind === 'top_pick' ? draftPicks : kind === 'featured_character' ? draftCharacters : draftTopics;
    return list.length + 1;
  }

  if (!slots) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Homepage</h2>
        <p className="mt-1 text-sm text-slate-500">
          Drag items to reorder, then click Save order. Up to {MAX_BRANDS} brands, {MAX_CHARACTERS}{' '}
          characters, and {MAX_TOPICS} topics.
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <HomepageSection
        title="Top brands"
        description="The three apps shown in “Our top picks” — position 1 is featured largest."
        kind="top_pick"
        maxItems={MAX_BRANDS}
        draftSlots={draftPicks}
        dirty={dirtyPicks}
        canEdit={canEdit}
        productMap={productMap}
        characterMap={characterMap}
        onDraftChange={(next) => {
          setDraftPicks(next);
          setDirtyPicks(true);
        }}
        onSave={() => saveOrder('top_pick', draftPicks, setDirtyPicks)}
        onAdd={() => setEditTarget({ kind: 'top_pick', slot: null })}
        onEdit={(slot) => setEditTarget({ kind: 'top_pick', slot })}
        onRemove={removeSlot}
        saving={saving}
      />

      <HomepageSection
        title="Featured characters"
        description="Character carousel on the homepage — show avatar, name, and platform."
        kind="featured_character"
        maxItems={MAX_CHARACTERS}
        draftSlots={draftCharacters}
        dirty={dirtyCharacters}
        canEdit={canEdit}
        productMap={productMap}
        characterMap={characterMap}
        onDraftChange={(next) => {
          setDraftCharacters(next);
          setDirtyCharacters(true);
        }}
        onSave={() => saveOrder('featured_character', draftCharacters, setDirtyCharacters)}
        onAdd={() => setEditTarget({ kind: 'featured_character', slot: null })}
        onEdit={(slot) => setEditTarget({ kind: 'featured_character', slot })}
        onRemove={removeSlot}
        saving={saving}
      />

      <HomepageSection
        title="Topics"
        description="Short topic chips in the “Find your perfect match” section."
        kind="topic"
        maxItems={MAX_TOPICS}
        draftSlots={draftTopics}
        dirty={dirtyTopics}
        canEdit={canEdit}
        productMap={productMap}
        characterMap={characterMap}
        onDraftChange={(next) => {
          setDraftTopics(next);
          setDirtyTopics(true);
        }}
        onSave={() => saveOrder('topic', draftTopics, setDirtyTopics)}
        onAdd={() => setEditTarget({ kind: 'topic', slot: null })}
        onEdit={(slot) => setEditTarget({ kind: 'topic', slot })}
        onRemove={removeSlot}
        saving={saving}
      />

      {editTarget && (
        <SlotModal
          target={editTarget}
          products={products}
          characters={characters}
          nextPosition={nextPositionFor(editTarget.kind)}
          onClose={() => setEditTarget(null)}
          onDone={() => {
            setEditTarget(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
