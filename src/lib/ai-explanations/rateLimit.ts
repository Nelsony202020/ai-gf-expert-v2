import { HttpError } from '../db/auth';
import { aiExplanationsConfig } from './config';

interface Bucket {
  timestamps: number[];
  lastProductAt: Map<string, number>;
}

/** Separate from AI Verdict — batch explanation runs need a higher ceiling. */
const buckets = new Map<string, Bucket>();

function bucketFor(userKey: string): Bucket {
  let b = buckets.get(userKey);
  if (!b) {
    b = { timestamps: [], lastProductAt: new Map() };
    buckets.set(userKey, b);
  }
  return b;
}

export function assertExplanationRateLimit(
  userEmail: string,
  productId: string,
  opts?: { skip?: boolean },
): void {
  if (opts?.skip) return;

  const cfg = aiExplanationsConfig();
  const now = Date.now();
  const b = bucketFor(`explanations:${userEmail}`);

  b.timestamps = b.timestamps.filter((t) => now - t < cfg.userWindowMs);
  if (b.timestamps.length >= cfg.userMaxRequests) {
    throw new HttpError(
      429,
      `Too many explanation generations (${cfg.userMaxRequests} per ${Math.round(cfg.userWindowMs / 60000)} min) — wait a few minutes or raise AI_EXPLANATIONS_USER_MAX_REQUESTS.`,
    );
  }

  const last = b.lastProductAt.get(productId) ?? 0;
  if (now - last < cfg.productCooldownMs) {
    throw new HttpError(429, 'Please wait a moment before generating another explanation.');
  }

  b.timestamps.push(now);
  b.lastProductAt.set(productId, now);
}
