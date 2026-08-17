const importedScripts = new Set<string>();

function isRunnableScript(script: HTMLScriptElement): boolean {
  const type = (script.type || 'text/javascript').toLowerCase();
  return type === '' || type === 'module' || type === 'text/javascript' || type === 'text/js';
}

function adoptFragmentStyles(doc: Document) {
  const existingHrefs = new Set(
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map((link) => link.href),
  );

  doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => {
    if (!link.href || existingHrefs.has(link.href)) return;
    existingHrefs.add(link.href);
    const next = document.createElement('link');
    next.rel = 'stylesheet';
    next.href = link.href;
    document.head.appendChild(next);
  });

  doc.querySelectorAll('style').forEach((style) => {
    const text = style.textContent ?? '';
    if (!text.trim()) return;
    const clone = document.createElement('style');
    clone.textContent = text;
    document.head.appendChild(clone);
  });
}

async function runFragmentScripts(doc: Document) {
  const scripts = Array.from(doc.querySelectorAll('script')).filter(isRunnableScript);
  for (const script of scripts) {
    if (script.src) {
      if (importedScripts.has(script.src)) continue;
      importedScripts.add(script.src);
      await new Promise<void>((resolve, reject) => {
        const el = document.createElement('script');
        el.type = script.type || 'module';
        el.src = script.src;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error(`ratings script failed: ${script.src}`));
        document.body.appendChild(el);
      });
      continue;
    }
    const body = script.textContent?.trim();
    if (!body) continue;
    const key = `inline:${body.slice(0, 120)}:${body.length}`;
    if (importedScripts.has(key)) continue;
    importedScripts.add(key);
    const injected = document.createElement('script');
    injected.type = script.type || 'module';
    injected.textContent = body;
    document.body.appendChild(injected);
  }
}

export async function loadRatingsPanel(panel: HTMLElement | null | undefined): Promise<void> {
  if (!panel) return;
  if (panel.dataset.ratingsReady === 'true') return;

  const existing = (panel as HTMLElement & { _ratingsLoad?: Promise<void> })._ratingsLoad;
  if (existing) {
    await existing;
    return;
  }

  const src = panel.dataset.ratingsSrc;
  if (!src) return;

  const load = (async () => {
    panel.dataset.ratingsLoading = 'true';
    const response = await fetch(src, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`ratings panel ${response.status}`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const root = doc.querySelector('[data-ratings-root]');
    if (!root) throw new Error('ratings root missing');

    adoptFragmentStyles(doc);
    panel.replaceChildren(document.importNode(root, true));
    await runFragmentScripts(doc);
    document.dispatchEvent(new Event('astro:page-load'));
    panel.dataset.ratingsReady = 'true';
    delete panel.dataset.ratingsLoading;
    // #region agent log
    fetch('http://127.0.0.1:7312/ingest/3642bd41-13da-4f13-9a24-64f7a557b0e1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5c7f40' },
      body: JSON.stringify({
        sessionId: '5c7f40',
        runId: 'post-fix',
        hypothesisId: 'B',
        location: 'loadRatingsPanel.client.ts',
        message: 'ratings panel lazy-loaded',
        data: {
          path: location.pathname,
          src,
          fragmentBytes: html.length,
          injectedBytes: panel.innerHTML.length,
          pageHtmlBytes: document.documentElement.outerHTML.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  })();

  (panel as HTMLElement & { _ratingsLoad?: Promise<void> })._ratingsLoad = load;
  try {
    await load;
  } catch (error) {
    delete (panel as HTMLElement & { _ratingsLoad?: Promise<void> })._ratingsLoad;
    delete panel.dataset.ratingsLoading;
    throw error;
  }
}
