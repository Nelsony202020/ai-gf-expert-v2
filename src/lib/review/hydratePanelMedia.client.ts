/** Force review-tab media to load after its panel becomes visible (lazy imgs in hidden tabs often never load). */
export function hydratePanelMedia(panel: HTMLElement | null | undefined): void {
  if (!panel) return;

  panel.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (img.loading === 'lazy') img.loading = 'eager';
    if (!img.complete || img.naturalWidth === 0) {
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (src) img.src = src;
    }
  });

  panel.querySelectorAll<HTMLVideoElement>('video.review-video-native--preview').forEach((video) => {
    const src = video.getAttribute('src');
    if (src && (!video.currentSrc || video.readyState < 1)) {
      video.load();
    }
  });
}
