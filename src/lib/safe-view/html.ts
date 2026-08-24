import { getAuthor } from '../../data/authors';
import { cdnAsset } from '../media/cdn';
import { SAFE_ENTRY_STORAGE_KEY } from './params';

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const HERMAN_AVATAR = cdnAsset(getAuthor('herman-carter')?.avatar ?? '/brand/herman-main-icon.webp');

export function renderSafeViewHtml(opts: {
  canonical: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  continueHref: string;
}): string {
  const canonical = escapeAttr(opts.canonical);
  const ogImage = escapeAttr(opts.ogImage);
  const ogTitle = escapeAttr(opts.ogTitle);
  const ogDescription = escapeAttr(opts.ogDescription);
  const herman = escapeAttr(HERMAN_AVATAR);
  const continueHref = escapeAttr(opts.continueHref);
  const storageKey = JSON.stringify(SAFE_ENTRY_STORAGE_KEY);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f9f9f9">
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="icon" type="image/svg+xml" href="${herman}">
  <link rel="preload" as="image" href="${herman}">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      display: grid;
      place-items: center;
      padding: 24px 16px;
      background: #f9f9f9;
      color: #111;
      font: 400 16px/1.5 Inter, "Hanken Grotesk", ui-sans-serif, system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      width: min(460px, 100%);
      padding: 36px 32px 28px;
      border: 1px solid #e7e5e4;
      border-radius: 24px;
      background: #fff;
      box-shadow: 0 12px 40px rgb(26 36 24 / 6%);
      text-align: center;
    }
    .from {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin: 0 0 20px;
      color: #6b7280;
      font-size: 13px;
      font-weight: 500;
    }
    .from svg { display: block; flex-shrink: 0; }
    .avatar {
      width: 88px;
      height: 88px;
      margin: 0 auto 20px;
      border-radius: 999px;
      overflow: hidden;
      background: #f3f4f6;
    }
    .avatar img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .lead {
      margin: 0 0 28px;
      font-size: 16px;
      color: #444;
    }
    .actions {
      display: flex;
      gap: 12px;
    }
    .btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 10px 14px;
      border-radius: 12px;
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-back {
      border: 1.5px solid #d6d3d1;
      background: #fff;
      color: #444;
    }
    .btn-go {
      border: 1.5px solid #db2777;
      background: #db2777;
      color: #fff;
    }
    @media (hover: hover) {
      .btn-back:hover {
        border-color: #a8a29e;
        background: #fafaf9;
        transform: translateY(-1px);
      }
      .btn-go:hover {
        background: #be185d;
        border-color: #be185d;
        transform: translateY(-1px);
      }
    }
    .btn:active { transform: translateY(0); }
    .btn:focus-visible {
      outline: 3px solid #111;
      outline-offset: 2px;
    }
    @media (max-width: 420px) {
      .card { padding: 28px 20px 22px; }
      .actions { flex-direction: column-reverse; }
    }
  </style>
</head>
<body>
  <main class="card" role="dialog" aria-modal="true" aria-labelledby="gate-title" aria-describedby="gate-desc">
    <p class="from">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1.5" y="5.5" width="21" height="13" rx="4" fill="#ff0000"/>
        <path d="M10 9.2v5.6l5.2-2.8z" fill="#fff"/>
      </svg>
      Opened from YouTube
    </p>
    <div class="avatar" aria-hidden="true">
      <img src="${herman}" alt="" width="88" height="88" decoding="async">
    </div>
    <h1 id="gate-title">18+ only</h1>
    <p id="gate-desc" class="lead">This destination is for visitors aged 18 or older.</p>
    <div class="actions">
      <a class="btn btn-back" id="back" href="/">Go back</a>
      <a class="btn btn-go" id="go" href="${continueHref}">I'm 18+ — Continue</a>
    </div>
  </main>
  <script>
    (function () {
      var back = document.getElementById('back');
      var go = document.getElementById('go');
      if (back && history.length > 1) {
        back.addEventListener('click', function (e) {
          e.preventDefault();
          history.back();
        });
      }
      if (!go) return;
      go.addEventListener('click', function (e) {
        e.preventDefault();
        try { sessionStorage.setItem(${storageKey}, 'true'); } catch (err) {}
        var url = new URL(location.href);
        url.searchParams.delete('safe');
        location.replace(url.pathname + url.search + url.hash);
      });
    })();
  </script>
</body>
</html>`;
}
