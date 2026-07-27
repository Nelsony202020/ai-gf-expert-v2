// AI alt text: sends one or more media images (by id) to an OpenAI vision
// model and returns a concise alt text per image. Read-only — the client
// decides whether to save the suggestions.

import { z } from 'zod';
import { env } from '../env';
import { getDb } from '../db/server';
import { HttpError, type AdminIdentity } from '../db/auth';
import { getOpenAIClient } from '../ai-verdict/openaiClient';
import { assertRateLimit } from '../ai-verdict/rateLimit';

export function aiAltTextConfig() {
  return {
    enabled: env('AI_ALT_TEXT_ENABLED') !== 'false',
    model: env('OPENAI_ALT_TEXT_MODEL') ?? env('OPENAI_VERDICT_MODEL') ?? 'gpt-4o-mini',
    maxImages: Number(env('AI_ALT_TEXT_MAX_IMAGES') ?? 20),
  };
}

export const altTextRequestSchema = z.object({
  productId: z.string().min(1),
  mediaIds: z.array(z.string().min(1)).min(1).max(20),
});

export type AltTextRequest = z.infer<typeof altTextRequestSchema>;

const outputSchema = z.object({
  altTexts: z
    .array(
      z.object({
        /** 1-based index of the image in the order provided. */
        index: z.number().int().positive(),
        altText: z.string().min(1).max(300),
      }),
    )
    .default([]),
});

interface MediaImage {
  id: string;
  url: string;
}

async function loadImages(productId: string, mediaIds: string[]): Promise<MediaImage[]> {
  const db = getDb();
  const { media } = await (db.query as any)({
    media: {
      $: { where: { id: { $in: mediaIds } } },
      product: {},
      file: {},
    },
  });
  const rows = (media ?? []) as any[];
  const byId = new Map(rows.map((r) => [r.id, r]));

  const images: MediaImage[] = [];
  for (const mid of mediaIds) {
    const row = byId.get(mid);
    if (!row) throw new HttpError(404, `Media ${mid} not found`);
    if (row.product?.id && row.product.id !== productId) {
      throw new HttpError(400, `Media ${mid} belongs to a different product`);
    }
    if (row.mediaType && row.mediaType !== 'image') {
      throw new HttpError(400, `Media ${mid} is not an image — alt text AI only supports images`);
    }
    const url = (row.file?.url as string | undefined) ?? (row.url as string | undefined);
    if (!url) throw new HttpError(422, `Media ${mid} has no accessible file URL`);
    images.push({ id: mid, url });
  }
  return images;
}

async function loadProductName(productId: string): Promise<string> {
  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { id: productId } } },
  });
  return String((products?.[0] as any)?.name ?? 'an AI companion app');
}

export async function generateAltTexts(
  body: AltTextRequest,
  identity: AdminIdentity,
): Promise<Array<{ mediaId: string; altText: string }>> {
  const cfg = aiAltTextConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI alt text is disabled.');
  if (body.mediaIds.length > cfg.maxImages) {
    throw new HttpError(400, `Too many images — max ${cfg.maxImages} per request.`);
  }

  assertRateLimit(identity.email, `alt-text:${body.productId}`);

  const [images, productName] = await Promise.all([
    loadImages(body.productId, body.mediaIds),
    loadProductName(body.productId),
  ]);

  const systemPrompt = `You write alt text for images on a review site that documents AI companion apps. The images are screenshots or generated images from the app "${productName}".
For EACH image (1-based index, in the order provided) write one concise, descriptive alt text:
- Describe what is actually visible; never invent details.
- Max ~125 characters. No "image of" / "screenshot of" prefixes. No quotes.
- Mention "${productName}" only when it helps (e.g. UI screenshots).
Respond with a single JSON object: {"altTexts":[{"index":1,"altText":"..."}]}`;

  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'low' } }
  > = [{ type: 'text', text: `Write alt text for these ${images.length} image(s).` }];
  images.forEach((img, i) => {
    userContent.push({ type: 'text', text: `Image ${i + 1}:` });
    userContent.push({ type: 'image_url', image_url: { url: img.url, detail: 'low' } });
  });

  const client = getOpenAIClient();
  let completion;
  try {
    completion = await client.chat.completions.create({
      model: cfg.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 100 * images.length + 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OpenAI request failed';
    throw new HttpError(502, `AI alt text failed: ${msg}`);
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new HttpError(502, 'Empty AI response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(502, 'AI returned invalid JSON');
  }

  const result = outputSchema.safeParse(parsed);
  if (!result.success) throw new HttpError(422, 'AI output failed validation');

  const out: Array<{ mediaId: string; altText: string }> = [];
  for (const item of result.data.altTexts) {
    const img = images[item.index - 1];
    if (img) out.push({ mediaId: img.id, altText: item.altText.trim() });
  }
  if (out.length === 0) throw new HttpError(422, 'AI returned no alt texts');
  return out;
}
