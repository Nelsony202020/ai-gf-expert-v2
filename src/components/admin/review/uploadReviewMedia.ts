/** Shared media upload helper for the review editor (images + videos). */

import { api } from '../api';
import { fileWithInferredMime } from '../../../lib/media/mime';

export interface UploadedReviewMedia {
  id: string;
  url: string;
  altText: string;
  mediaType: 'image' | 'video';
}

export async function uploadReviewMedia(
  file: File,
  productId: string,
  opts?: { adult?: boolean; mediaTags?: string[] },
): Promise<UploadedReviewMedia> {
  const normalized = fileWithInferredMime(file);
  const form = new FormData();
  form.set('file', normalized);
  form.set('adult', opts?.adult ? '1' : '0');
  form.set('role', 'gallery');
  form.set('mediaTags', JSON.stringify(opts?.mediaTags ?? []));
  form.set('productId', productId);
  const created = await api.upload<{ id: string; url?: string; mediaType?: string }>(
    '/api/admin/media/upload',
    form,
  );
  const mediaType =
    created.mediaType === 'video' || normalized.type.startsWith('video/') ? 'video' : 'image';
  return {
    id: created.id,
    url: created.url ?? '',
    altText: '',
    mediaType,
  };
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg)$/i.test(file.name);
}
