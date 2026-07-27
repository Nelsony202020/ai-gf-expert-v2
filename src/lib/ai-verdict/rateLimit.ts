import { HttpError } from '../db/auth';
import { aiVerdictConfig } from './config';

interface Bucket {
  timestamps: number[];
  lastProductAt: Map<string, number>;
}

const buckets = new Map<string, Bucket>();

function bucketFor(userKey: string): Bucket {
  let b = buckets.get(userKey);
  if (!b) {
    b = { timestamps: [], lastProductAt: new Map() };
    buckets.set(userKey, b);
  }
  return b;
}

export function assertRateLimit(userEmail: string, productId: string): void {
  const cfg = aiVerdictConfig();
  const now = Date.now();
  const b = bucketFor(userEmail);

  b.timestamps = b.timestamps.filter((t) => now - t < cfg.userWindowMs);
  if (b.timestamps.length >= cfg.userMaxRequests) {
    throw new HttpError(429, 'Too many AI requests — try again in a few minutes.');
  }

  const last = b.lastProductAt.get(productId) ?? 0;
  if (now - last < cfg.productCooldownMs) {
    throw new HttpError(429, 'Please wait before generating another suggestion for this product.');
  }

  b.timestamps.push(now);
  b.lastProductAt.set(productId, now);
}
