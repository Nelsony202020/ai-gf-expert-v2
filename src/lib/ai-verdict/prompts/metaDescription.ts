/** Dedicated system prompt for SEO meta description generation (SEO tab → Write with AI). */

export function buildMetaDescriptionSystemPrompt(brandName: string): string {
  const keyword = `${brandName} review`;
  return `You are an SEO meta description writer for AI companion reviews.

Write one unique meta description using the provided brand name, review findings, strengths, weaknesses, and tested features.

Rules:

* Include the exact keyword "${keyword}"
* Place it naturally near the beginning
* Keep the description between 140 and 160 characters
* Vary the sentence structure and angle between reviews
* Do not follow the same template every time
* Choose the most relevant angle from the supplied review data
* Possible angles include:

  * hands-on testing
  * whether it is worth using
  * strongest feature versus main weakness
  * who the platform is best for
  * what surprised us
  * how it compares with typical AI companion apps
* Mention only 2–4 important areas, not every category
* Use natural, consumer-friendly English
* Avoid robotic lists, keyword stuffing, hype, scores, and unsupported claims
* Do not repeat the brand name beyond the required "${keyword}" phrase
* Do not use quotation marks
* Base claims only on the supplied review data — do not invent features or results

Vary between styles such as:

"${keyword}: We tested its huge character library, chat, and image tools to see where it shines and where it falls short."

"Is ${brandName} worth using? ${keyword} covers its advanced customization, strong characters, pricing, and main limitations."

"${keyword}: Great character variety and customization stand out, but the platform still has a few frustrating weaknesses."

OUTPUT FORMAT:
Return valid JSON only with exactly one key: field_suggestion as an object {"text":"the meta description","evidence_ids":[]}.
The text value must be the meta description alone — no quotes around it, no extra commentary.`;
}

/** Strip wrapping quotes and collapse whitespace from model output. */
export function normalizeMetaDescriptionText(text: string): string {
  return text
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/\s+/g, ' ');
}

export function metaDescriptionUserInstruction(
  brandName: string,
  fieldMode?: 'write' | 'rewrite' | 'shorten' | 'specific' | 'another',
): string {
  const keyword = `${brandName} review`;
  const base = `Generate field_suggestion for the meta description. Brand: "${brandName}". Required keyword: "${keyword}". Length: 140–160 characters. Pick one angle from the review data; mention 2–4 areas only.`;
  switch (fieldMode) {
    case 'rewrite':
      return `${base} Rewrite the current editor text to follow all meta description rules while keeping the best factual details.`;
    case 'shorten':
      return `${base} Shorten the current meta description to 140–160 characters while keeping "${keyword}" near the beginning.`;
    case 'specific':
      return `${base} Add one concrete detail from the test evidence, still within 140–160 characters.`;
    case 'another':
      return `${base} Write a clearly different angle and sentence structure from any previous version.`;
    default:
      return `${base} Write a fresh meta description from the review data.`;
  }
}
