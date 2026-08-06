import { api } from '../api';

export const PROOF_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
] as const;

const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const SKIP_COMPRESS_BELOW_BYTES = 350_000;

/** Downscale large screenshots before upload — keeps proof readable, cuts transfer time. */
export async function prepareProofFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }
  if (file.size < SKIP_COMPRESS_BELOW_BYTES) return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale >= 1) {
    bitmap.close();
    return file;
  }

  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  const base = file.name.replace(/\.[^.]+$/, '') || 'proof';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

export interface ProofUploadPayload {
  file: File;
  evidenceResultId: string;
  productId?: string;
  caption?: string;
  altText?: string;
  adult?: boolean;
}

export async function uploadProofFile(payload: ProofUploadPayload): Promise<{ id: string; url?: string }> {
  const file = await prepareProofFile(payload.file);
  const form = new FormData();
  form.set('file', file);
  form.set('adult', payload.adult ? '1' : '0');
  form.set('role', 'proof');
  form.set('evidenceResultId', payload.evidenceResultId);
  if (payload.productId) form.set('productId', payload.productId);
  if (payload.caption) form.set('caption', payload.caption);
  if (payload.altText) form.set('altText', payload.altText);
  return api.upload<{ id: string; url?: string }>('/api/admin/media/upload', form);
}

/** Upload many proof files with bounded parallelism. */
export async function uploadProofFilesParallel(
  files: File[],
  evidenceResultId: string,
  productId?: string,
  options?: { adult?: boolean; concurrency?: number; altText?: string },
): Promise<{ id: string; url?: string }[]> {
  const adult = options?.adult ?? false;
  const altText = options?.altText?.trim();
  const concurrency = options?.concurrency ?? 3;
  const accepted = files.filter((f) =>
    (PROOF_ACCEPTED_TYPES as readonly string[]).includes(f.type),
  );
  if (accepted.length === 0) return [];

  const results: { id: string; url?: string }[] = new Array(accepted.length);
  let index = 0;

  async function worker() {
    while (index < accepted.length) {
      const i = index++;
      const file = accepted[i]!;
      results[i] = await uploadProofFile({ file, evidenceResultId, productId, adult, altText });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, accepted.length) }, () => worker()),
  );
  return results;
}
