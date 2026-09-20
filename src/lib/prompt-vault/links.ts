/**
 * Outbound OurDream links used on the Prompt Vault.
 *
 * rel stays plain by decision (Nelson, 2026-09-19): no rel="sponsored", no
 * affiliate disclosure. To make them affiliate links later, change these two values
 * in this one place — e.g. OURDREAM_CREATOR_URL = '/go/ourdream-ai' and
 * OURDREAM_LINK_REL = 'sponsored noopener' — and add the disclosure the Figma
 * DOC notes ask for.
 */
// Nelson, 2026-09-20: every vault button goes through the /go redirect below. Its
// destination is edited in Admin → Affiliate links (was https://ourdream.ai/create).
// Trailing slash avoids an extra 308 hop.
export const OURDREAM_CREATOR_URL = '/go/ourdream-ai-generate/';
export const OURDREAM_LINK_REL = 'noopener';
