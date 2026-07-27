export function AiStaleBanner({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
      <p className="font-medium">Testing data may have changed since this suggestion was generated.</p>
      <button type="button" className="mt-1 font-semibold text-amber-800 underline dark:text-amber-300" onClick={onRegenerate}>
        Regenerate from current evidence
      </button>
    </div>
  );
}
