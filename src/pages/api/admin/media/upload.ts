export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../lib/api';
import { requireIdentity, roleHas, HttpError } from '../../../../lib/db/auth';
import { getDb, id as newId } from '../../../../lib/db/server';
import { auditTx } from '../../../../lib/db/audit';
import { inferImageMimeType } from '../../../../lib/media/mime';

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

  const uploaded = await db.storage.uploadFile(path, buffer, { contentType });

  // Resolve the stored file's URL for caching on the media record.
  const { $files } = await db.query({
    $files: { $: { where: { id: uploaded.data.id } } },
  });
  const fileUrl = $files[0]?.url as string | undefined;

  const mediaId = newId();
  let chunk = db.tx.media[mediaId]
    .update({
      url: fileUrl,
      mediaType: contentType.startsWith('video/') ? 'video' : 'image',
      fileSize: file.size,
      altText: (form.get('altText') as string) || undefined,
      caption: (form.get('caption') as string) || undefined,
      credit: (form.get('credit') as string) || undefined,
      adult: adultRaw === '1',
      ageGated: adultRaw === '1',
      role: (form.get('role') as string) || 'gallery',
      uploadedBy: identity.email,
      approved: false,
      createdAt: Date.now(),
      width: form.get('width') ? Number(form.get('width')) : undefined,
      height: form.get('height') ? Number(form.get('height')) : undefined,
    })
    .link({ file: uploaded.data.id });

  const productId = form.get('productId') as string | null;
  const evidenceResultId = form.get('evidenceResultId') as string | null;
  if (productId) chunk = chunk.link({ product: productId });
  if (evidenceResultId) chunk = chunk.link({ evidenceResult: evidenceResultId });

  await db.transact([
    chunk,
    auditTx({
      actorEmail: identity.email,
      action: 'upload',
      recordType: 'media',
      recordId: mediaId,
      newValue: { path, size: file.size, type: contentType },
    }),
  ]);

  return json({ id: mediaId, url: fileUrl }, 201);
});
