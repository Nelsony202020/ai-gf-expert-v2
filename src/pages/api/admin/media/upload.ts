export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requireIdentity, roleHas, HttpError } from '../../../../lib/db/auth';
import { getDb, id as newId } from '../../../../lib/db/server';
import { auditTx } from '../../../../lib/db/audit';
import { inferImageMimeType } from '../../../../lib/media/mime';
import { heroSortOrderUpdates, parseMediaTags } from '../../../../lib/media/catalog';
import { isBunnyConfigured, uploadToBunny } from '../../../../lib/media/cdn';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]);

function omitUndefined(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
}

function isSchemaMismatchError(error: unknown): boolean {
  const parts: string[] = [];
  if (error instanceof Error) parts.push(error.message);
  if (error && typeof error === 'object') {
    const body = (error as { body?: { message?: string } }).body?.message;
    if (body) parts.push(body);
  }
  parts.push(String(error));
  const msg = parts.join(' ');
  return msg.includes('missing in your schema') || msg.includes('Attributes are missing');
}

async function transactChunks(db: ReturnType<typeof getDb>, chunks: unknown[]) {
  await db.transact(chunks as any);
}

/**
 * Multipart upload. The original file is stored untouched in InstantDB
 * storage; crops/focal points live on the media record as metadata.
 *
 * Form fields: file (File, required), altText, caption, credit,
 * adult ("1"/"0", required), role, productId, evidenceResultId
 */
export const POST: APIRoute = handler(async ({ request }) => {
  // Editors upload any media; testers may also upload (their uploads are the
  // proof attachments created from evidence test cards).
  const identity = await requireIdentity(request);
  if (!roleHas(identity.role, 'content.edit') && !roleHas(identity.role, 'testing.edit')) {
    throw new HttpError(403, 'Missing permission: content.edit or testing.edit');
  }

  const form = await request.formData().catch(() => {
    throw new HttpError(400, 'Expected multipart/form-data');
  });

  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'Missing "file"');
  if (file.size > MAX_BYTES) throw new HttpError(413, 'File exceeds 50 MB limit');
  const contentType = inferImageMimeType(file);
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    throw new HttpError(415, `Unsupported type: ${file.type || file.name.split('.').pop() || 'unknown'}`);
  }

  const adultRaw = form.get('adult');
  if (adultRaw !== '0' && adultRaw !== '1') {
    throw new HttpError(400, 'Field "adult" is required ("0" safe, "1" adult)');
  }

  const db = getDb();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `media/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const useBunny = isBunnyConfigured();
  let fileUrl: string | undefined;
  let instantFileId: string | undefined;

  if (useBunny) {
    fileUrl = await uploadToBunny(path, buffer, contentType);
  } else {
    const uploaded = await db.storage.uploadFile(path, buffer, { contentType });
    instantFileId = uploaded.data.id;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { $files } = await db.query({
        $files: { $: { where: { id: uploaded.data.id } } },
      });
      fileUrl = $files[0]?.url as string | undefined;
      if (fileUrl) break;
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }

  const featuresTagged = form.get('features') === '1' || form.get('features') === 'true';
  const uploadRole = (form.get('role') as string) || 'gallery';
  const mediaTagsRaw = form.get('mediaTags');
  let mediaTags: string[] | undefined;
  if (typeof mediaTagsRaw === 'string' && mediaTagsRaw.trim()) {
    try {
      mediaTags = parseMediaTags(JSON.parse(mediaTagsRaw));
    } catch {
      mediaTags = [];
    }
  }
  if (featuresTagged) {
    mediaTags = ['features', 'hero'];
  } else if (uploadRole === 'featured') {
    mediaTags = ['hero'];
  }

  const isHeroUpload = mediaTags?.includes('hero') ?? false;

  const mediaId = newId();
  const productId = form.get('productId') as string | null;
  const evidenceResultId = form.get('evidenceResultId') as string | null;

  const fullFields = omitUndefined({
    url: fileUrl,
    mediaType: contentType.startsWith('video/') ? 'video' : 'image',
    fileSize: file.size,
    altText: (form.get('altText') as string) || undefined,
    caption: (form.get('caption') as string) || undefined,
    credit: (form.get('credit') as string) || undefined,
    adult: adultRaw === '1',
    ageGated: adultRaw === '1',
    role: uploadRole,
    testCategory: (form.get('testCategory') as string) || undefined,
    mediaTags: mediaTags?.length ? mediaTags : undefined,
    heroSortOrder: isHeroUpload ? 0 : undefined,
    uploadedBy: identity.email,
    approved: isHeroUpload ? true : undefined,
    createdAt: Date.now(),
    width: form.get('width') ? Number(form.get('width')) : undefined,
    height: form.get('height') ? Number(form.get('height')) : undefined,
  });

  const legacyFields = omitUndefined({
    url: fileUrl,
    mediaType: contentType.startsWith('video/') ? 'video' : 'image',
    fileSize: file.size,
    altText: (form.get('altText') as string) || undefined,
    caption: (form.get('caption') as string) || undefined,
    credit: (form.get('credit') as string) || undefined,
    adult: adultRaw === '1',
    ageGated: adultRaw === '1',
    role: uploadRole,
    testCategory: (form.get('testCategory') as string) || undefined,
    uploadedBy: identity.email,
    approved: isHeroUpload ? true : undefined,
    createdAt: Date.now(),
    width: form.get('width') ? Number(form.get('width')) : undefined,
    height: form.get('height') ? Number(form.get('height')) : undefined,
  });

  function mediaChunk(fields: Record<string, unknown>) {
    let chunk = db.tx.media[mediaId].update(fields);
    if (instantFileId) chunk = chunk.link({ file: instantFileId });
    if (productId) chunk = chunk.link({ product: productId });
    if (evidenceResultId) chunk = chunk.link({ evidenceResult: evidenceResultId });
    return chunk;
  }

  const audit = auditTx({
    actorEmail: identity.email,
    action: 'upload',
    recordType: 'media',
    recordId: mediaId,
    newValue: { path, size: file.size, type: contentType },
  });

  try {
    await transactChunks(db, [mediaChunk(fullFields), audit]);
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      try {
        await transactChunks(db, [mediaChunk(legacyFields), audit]);
      } catch {
        throw new HttpError(
          400,
          'Database schema is out of date. Run `npm run db:push` in the project root, confirm the push, then try again.',
        );
      }
    } else {
      throw error;
    }
  }

  if (productId && isHeroUpload && fullFields.heroSortOrder != null) {
    try {
      const { media: productMedia } = await (db.query as any)({
        media: { $: { where: { 'product.id': productId } } },
      });
      const updates = heroSortOrderUpdates(productMedia ?? [], mediaId).filter((u) => u.id !== mediaId);
      if (updates.length > 0) {
        await transactChunks(
          db,
          updates.map((u) => db.tx.media[u.id].update({ heroSortOrder: u.heroSortOrder })),
        );
      }
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error;
    }
  }

  return json({ id: mediaId, url: fileUrl }, 201);
});
