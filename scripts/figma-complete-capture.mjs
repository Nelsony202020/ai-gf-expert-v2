import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.FIGMA_SYNC_BASE || 'http://127.0.0.1:4321';
const OUT = path.resolve('/workspace/docs/figma-sync-current/screenshots');
const INDEX = path.resolve('/workspace/docs/figma-sync-current/SCREENSHOT-INDEX.generated.md');

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage'],
});

const rows = [];

async function settle(page, ms = 450) {
  await page.evaluate(() => document.fonts?.ready).catch(() => null);
  await new Promise((r) => setTimeout(r, ms));
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme', t);
  }, theme);
  await settle(page, 280);
}

async function goto(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('body', { timeout: 30000 });
  await settle(page, 700);
}

async function shot(page, name, meta, opts = {}) {
  const file = path.join(OUT, name);
  try {
    await page.screenshot({ path: file, type: 'png', ...opts });
    rows.push({ file: name, ...meta });
    console.log('  ok', name);
  } catch (err) {
    console.error('  FAIL', name, err.message);
  }
  return name;
}

async function scrollSel(page, sel) {
  await page.waitForSelector(sel, { timeout: 8000 }).catch(() => null);
  await page.$eval(sel, (el) => el.scrollIntoView({ block: 'start', behavior: 'instant' })).catch(() => null);
  await settle(page, 320);
}

async function footerShot(page, name, meta) {
  const footer = await page.$('.site-footer');
  if (!footer) return;
  const box = await footer.boundingBox();
  if (!box || box.height < 8) return;
  const vp = page.viewport();
  const clip = {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width: Math.min(box.width, vp.width),
    height: Math.min(box.height, 2400),
  };
  await shot(page, name, { ...meta, section: 'footer', state: 'default' }, { clip });
}

async function hasOverlay(page) {
  return page.evaluate(() => {
    const t = document.body?.innerText || '';
    return t.includes('Cannot read properties of undefined') || !!document.querySelector('vite-error-overlay, astro-dev-toolbar-shadow');
  });
}

async function dumpTokens(page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const pick = [
      '--color-background',
      '--color-on-surface',
      '--color-on-surface-variant',
      '--color-accent',
      '--color-surface-container-lowest',
      '--color-surface-container',
      '--color-header-surface',
      '--color-footer',
      '--site-header-height',
    ];
    const tokens = {};
    for (const k of pick) tokens[k] = cs.getPropertyValue(k).trim();
    return {
      theme: document.documentElement.dataset.theme,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      tokens,
    };
  });
}

async function captureRoute(page, { route, prefix, theme, vp, sections = [], extras = async () => {} }) {
  await page.setViewport(vp);
  await goto(page, route);
  await setTheme(page, theme);
  const overlay = await hasOverlay(page);
  const meta = {
    route,
    viewport: `${vp.width}px`,
    device: vp.width < 500 ? 'mobile' : 'desktop',
    theme,
  };
  await shot(page, `${prefix}-default.png`, { ...meta, state: overlay ? 'dev-overlay' : 'default', section: 'default' });
  for (const [sel, suffix] of sections) {
    await scrollSel(page, sel);
    await shot(page, `${prefix}-${suffix}.png`, { ...meta, state: 'default', section: suffix });
  }
  await extras(page, prefix, meta);
  await footerShot(page, `${prefix}-footer.png`, meta);
  await shot(page, `${prefix}-full.png`, { ...meta, state: overlay ? 'dev-overlay' : 'default', section: 'full' }, { fullPage: true });
  return overlay;
}

const desktop = { width: 1440, height: 1000, deviceScaleFactor: 1 };
const mobile = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

fs.mkdirSync(OUT, { recursive: true });

const tokenDump = [];

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  // Recapture hub + brands (current implementation after hover/z-index/view-all fixes)
  for (const [vp, prefix] of [
    [desktop, 'ourdream-hub-desktop-1440-light'],
    [mobile, 'ourdream-hub-mobile-390-light'],
  ]) {
    console.log('CAPTURE hub', prefix);
    await page.setViewport(vp);
    await goto(page, '/guides/ourdream-ai/');
    await setTheme(page, 'light');
    const meta = { route: '/guides/ourdream-ai/', viewport: `${vp.width}px`, device: vp.width < 500 ? 'mobile' : 'desktop', theme: 'light' };
    await shot(page, `${prefix}-hero-default.png`, { ...meta, state: 'default', section: 'hero-default' });
    await page.click('[data-hub-guide-input]').catch(() => null);
    await page.type('[data-hub-guide-input]', 'prompt', { delay: 18 });
    await settle(page, 450);
    await shot(page, `${prefix}-search-results.png`, { ...meta, state: 'interaction', section: 'search-results' });
    await page.evaluate(() => {
      const input = document.querySelector('[data-hub-guide-input]');
      if (input) {
        input.value = 'zzzznotaguide';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await settle(page, 350);
    await shot(page, `${prefix}-search-empty.png`, { ...meta, state: 'interaction', section: 'search-empty' });
    await page.evaluate(() => {
      const input = document.querySelector('[data-hub-guide-input]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await scrollSel(page, '.guide-hub__start');
    await shot(page, `${prefix}-start-here.png`, { ...meta, state: 'default', section: 'start-here' });
    await scrollSel(page, '.guide-hub__topics');
    await page.evaluate(() => {
      document.querySelectorAll('.guide-hub__topic').forEach((t) => t.setAttribute('open', ''));
    });
    await settle(page, 350);
    await shot(page, `${prefix}-topics-open.png`, { ...meta, state: 'interaction', section: 'topics-open' });
    if (vp.width >= 1200) {
      const row = await page.$('.guide-hub__article-row');
      if (row) {
        const box = await row.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await settle(page, 250);
          await shot(page, `${prefix}-topic-row-hover.png`, { ...meta, state: 'interaction', section: 'topic-row-hover' });
        }
      }
    }
    await footerShot(page, `${prefix}-footer.png`, meta);
    await shot(page, `${prefix}-full.png`, { ...meta, state: 'default', section: 'full' }, { fullPage: true });
  }

  // Marketing header: Brands dropdown without View all
  console.log('CAPTURE homepage brands + header search');
  await page.setViewport(desktop);
  await goto(page, '/');
  await setTheme(page, 'light');
  tokenDump.push({ route: '/', ...(await dumpTokens(page)) });
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('[data-home-drop-btn]')].find((b) =>
      (b.textContent || '').includes('Brands'),
    );
    btn?.click();
  });
  await settle(page, 280);
  await shot(page, 'homepage-desktop-1440-light-brands-dropdown.png', {
    route: '/',
    viewport: '1440px',
    device: 'desktop',
    theme: 'light',
    state: 'interaction',
    section: 'brands-dropdown',
  });
  await page.keyboard.press('Escape');
  await page.click('[data-search-toggle]').catch(() => null);
  await settle(page, 250);
  await page.type('[data-search-input]', 'ourdream', { delay: 20 }).catch(() => null);
  await settle(page, 400);
  await shot(page, 'homepage-desktop-1440-light-header-search.png', {
    route: '/',
    viewport: '1440px',
    device: 'desktop',
    theme: 'light',
    state: 'interaction',
    section: 'header-search',
  });

  // Content header search + brands on About
  await goto(page, '/about/');
  await setTheme(page, 'light');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-header-drop-btn]');
    btn?.click();
  });
  await settle(page, 280);
  await shot(page, 'about-desktop-1440-light-brands-dropdown.png', {
    route: '/about/',
    viewport: '1440px',
    device: 'desktop',
    theme: 'light',
    state: 'interaction',
    section: 'brands-dropdown',
  });
  await page.keyboard.press('Escape');
  await page.click('[data-search-toggle]').catch(() => null);
  await settle(page, 250);
  await page.type('[data-search-input]', 'prompt', { delay: 20 }).catch(() => null);
  await settle(page, 400);
  await shot(page, 'about-desktop-1440-light-header-search.png', {
    route: '/about/',
    viewport: '1440px',
    device: 'desktop',
    theme: 'light',
    state: 'interaction',
    section: 'header-search',
  });
  await page.click('[data-theme-toggle], .theme-toggle, [data-theme-switch]').catch(() => null);
  await settle(page, 400);
  await shot(page, 'about-desktop-1440-theme-toggle.png', {
    route: '/about/',
    viewport: '1440px',
    device: 'desktop',
    theme: 'toggled',
    state: 'interaction',
    section: 'theme-toggle',
  });

  const editorial = [
    {
      route: '/guides/ourdream-ai-prompt/',
      slug: 'prompt-guide',
      sections: [
        ['h2', 'h2'],
        ['#video-prompts, h3#video-prompts', 'video-prompts'],
      ],
    },
    {
      route: '/guides/ourdream-ai-image-prompt/',
      slug: 'image-prompt-guide',
      sections: [['h2', 'h2']],
    },
    {
      route: '/guides/how-to-use-ourdream-ai-image-generator/',
      slug: 'image-generator-guide',
      sections: [['h2', 'h2']],
    },
    {
      route: '/guides/ourdream-ai-comics/',
      slug: 'comics-guide',
      sections: [['h2', 'h2']],
    },
    { route: '/guides/', slug: 'guides-index', sections: [] },
    { route: '/about/', slug: 'about', sections: [['.about-section', 'body']] },
    { route: '/glossary/', slug: 'glossary', sections: [] },
    { route: '/sitemap/', slug: 'sitemap', sections: [] },
    { route: '/reviews/', slug: 'reviews-index', sections: [] },
    { route: '/ai-girlfriend-apps/', slug: 'app-directory', sections: [] },
    { route: '/test/', slug: 'test-hub', sections: [['#how-scores-work', 'scores'], ['.test-hub-category-cards, .test-hub__section', 'mid']] },
    { route: '/test/chat/', slug: 'test-chat', sections: [['h2', 'h2']] },
    { route: '/test/market-data/', slug: 'test-market-data', sections: [['h2', 'h2']] },
    { route: '/test/all/', slug: 'test-all', sections: [] },
    { route: '/editorial-guidelines/', slug: 'editorial', sections: [] },
  ];

  for (const item of editorial) {
    for (const [vp, device] of [
      [desktop, 'desktop-1440-light'],
      [mobile, 'mobile-390-light'],
    ]) {
      const prefix = `${item.slug}-${device}`;
      console.log('CAPTURE', prefix);
      const overlay = await captureRoute(page, {
        route: item.route,
        prefix,
        theme: 'light',
        vp,
        sections: item.sections,
      });
      if (item.route === '/about/' && vp.width >= 1200) {
        tokenDump.push({ route: '/about/', overlay, ...(await dumpTokens(page)) });
      }
    }
  }

  // Roundup comparison table
  console.log('CAPTURE roundup compare');
  await captureRoute(page, {
    route: '/best/ai-girlfriend/',
    prefix: 'roundup-desktop-1440-light',
    theme: 'light',
    vp: desktop,
    sections: [
      ['.roundup-compare, #compare, [class*="compare"]', 'compare'],
      ['.roundup-affiliate-bar', 'affiliate-bar'],
    ],
  });
  await captureRoute(page, {
    route: '/best/ai-girlfriend/',
    prefix: 'roundup-mobile-390-light',
    theme: 'light',
    vp: mobile,
    sections: [['.roundup-compare, #compare, [class*="compare"]', 'compare']],
  });

  // Review + ratings panel + alternatives
  console.log('CAPTURE review');
  for (const [vp, prefix] of [
    [desktop, 'review-desktop-1440-light'],
    [mobile, 'review-mobile-390-light'],
  ]) {
    await page.setViewport(vp);
    await goto(page, '/reviews/ourdream-ai/');
    await setTheme(page, 'light');
    const overlay = await hasOverlay(page);
    const meta = {
      route: '/reviews/ourdream-ai/',
      viewport: `${vp.width}px`,
      device: vp.width < 500 ? 'mobile' : 'desktop',
      theme: 'light',
    };
    await shot(page, `${prefix}-hero-overview.png`, {
      ...meta,
      state: overlay ? 'dev-overlay' : 'default',
      section: 'hero-overview',
    });
    await page.click('[data-tab="ratings"]').catch(() => null);
    await settle(page, 2200);
    await shot(page, `${prefix}-tab-ratings.png`, { ...meta, state: overlay ? 'dev-overlay' : 'interaction', section: 'tab-ratings' });
    await page.click('[data-tab="pricing"]').catch(() => null);
    await settle(page, 1400);
    await shot(page, `${prefix}-tab-pricing.png`, { ...meta, state: overlay ? 'dev-overlay' : 'interaction', section: 'tab-pricing' });
    await page.click('[data-tab="alternatives"]').catch(() => null);
    await settle(page, 1400);
    await shot(page, `${prefix}-tab-alternatives.png`, { ...meta, state: overlay ? 'dev-overlay' : 'interaction', section: 'tab-alternatives' });
    await footerShot(page, `${prefix}-footer.png`, meta);
    await shot(page, `${prefix}-full.png`, { ...meta, state: overlay ? 'dev-overlay' : 'default', section: 'full' }, { fullPage: true });
  }

  await captureRoute(page, {
    route: '/reviews/ratings-panel/ourdream-ai/',
    prefix: 'ratings-panel-desktop-1440-light',
    theme: 'light',
    vp: desktop,
    sections: [['[data-ratings-root], h2', 'body']],
  });
  await captureRoute(page, {
    route: '/reviews/ratings-panel/ourdream-ai/',
    prefix: 'ratings-panel-mobile-390-light',
    theme: 'light',
    vp: mobile,
    sections: [],
  });

  // Dark samples for content + hub
  await captureRoute(page, {
    route: '/guides/ourdream-ai-prompt/',
    prefix: 'prompt-guide-desktop-1440-dark',
    theme: 'dark',
    vp: desktop,
    sections: [],
  });
  await captureRoute(page, {
    route: '/guides/ourdream-ai/',
    prefix: 'ourdream-hub-desktop-1440-dark',
    theme: 'dark',
    vp: desktop,
    sections: [['.guide-hub__topics', 'topics']],
  });
  await captureRoute(page, {
    route: '/about/',
    prefix: 'about-desktop-1440-dark',
    theme: 'dark',
    vp: desktop,
    sections: [],
  });
  await captureRoute(page, {
    route: '/test/',
    prefix: 'test-hub-desktop-1440-dark',
    theme: 'dark',
    vp: desktop,
    sections: [],
  });

  fs.writeFileSync(
    path.join(OUT, '_capture-manifest.json'),
    JSON.stringify({ capturedAt: new Date().toISOString(), rows, tokenDump }, null, 2),
  );

  const lines = [
    '| File | Route | Viewport | Device | Theme | State | Section |',
    '|---|---|---:|---|---|---|---|',
  ];
  const all = fs
    .readdirSync(OUT)
    .filter((f) => f.endsWith('.png'))
    .sort();
  const byFile = new Map(rows.map((r) => [r.file, r]));
  for (const f of all) {
    const r = byFile.get(f) || {};
    lines.push(
      `| \`${f}\` | ${r.route || ''} | ${r.viewport || ''} | ${r.device || ''} | ${r.theme || ''} | ${r.state || ''} | ${r.section || ''} |`,
    );
  }
  fs.writeFileSync(INDEX, lines.join('\n') + '\n');
  console.log('DONE rows', rows.length, 'pngs', all.length);
} finally {
  await browser.close();
}
