// Reference links stored on an evidence result alongside screenshot attachments.

export type ProofLink = { url: string; label?: string };

export function parseProofLinks(raw: unknown): ProofLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const url = typeof (entry as ProofLink).url === 'string' ? (entry as ProofLink).url.trim() : '';
      if (!url) return null;
      const label =
        typeof (entry as ProofLink).label === 'string' ? (entry as ProofLink).label!.trim() : undefined;
      return { url, ...(label ? { label } : {}) };
    })
    .filter((x): x is ProofLink => x !== null);
}

/** Sessions where proof drawer supports reference URLs (privacy policy links, etc.). */
export const PROOF_LINK_SESSION_IDS = new Set([
  'policy-docs',
  'policy-review',
  'data-controls',
  'security-billing',
]);

export function allowsProofLinks(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  if (PROOF_LINK_SESSION_IDS.has(sessionId)) return true;
  return sessionId.endsWith('-other');
}
