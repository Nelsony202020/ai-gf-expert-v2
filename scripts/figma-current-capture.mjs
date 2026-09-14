import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.FIGMA_SYNC_BASE || 'http://127.0.0.1:4321';
const OUT = path.resolve('/workspace/docs/figma-sync-current/screenshots');

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage'],
});

async function settle(page, ms = 500) {
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, ms));
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme', t);
  }, theme);
  await settle(page, 350);
}

async function shot(page, name, opts = {}) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: 'png', ...opts });
  return name;
}

async function scrollSel(page, sel) {
  await page.waitForSelector(sel, { timeout: 20000 }).catch(() => null);
  await page.$eval(sel, (el) => el.scrollIntoView({ block: 'start', behavior: 'instant' })).catch(() => null);
  await settle(page, 400);
}

async function captureHome(page, vp, prefix, theme) {
  await page.setViewport(vp);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await setTheme(page, theme);
  await settle(page, 900);

  const shots = [];
  shots.push(await shot(page, `${prefix}-hero.png`));
  if (vp.width >= 1200) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[data-home-drop-btn]')].find((b) =>
        (b.textContent || '').includes('Brands'),
      );
      btn?.click();
    });
    await settle(page, 300);
    shots.push(await shot(page, `${prefix}-brands-dropdown.png`));
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      document.querySelectorAll('[data-home-drop-panel]').forEach((p) => p.setAttribute('hidden', ''));
    });
    await page.click('[data-home-badge-toggle]').catch(() => null);
    await settle(page, 650);
    shots.push(await shot(page, `${prefix}-herman-flipped.png`));
    await page.mouse.move(4, 4);
    await settle(page, 500);
  }
  for (const [id, suffix] of [
    ['#home-ranked', 'rankings'],
    ['#home-choose', 'selector'],
    ['#home-method', 'methodology'],
    ['#home-score', 'score'],
    ['#home-latest', 'latest'],
    ['#home-tester', 'tester'],
    ['#home-cta', 'cta'],
  ]) {
    await scrollSel(page, id);
    shots.push(await shot(page, `${prefix}-${suffix}.png`));
  }
  const footer = await page.$('.site-footer');
  if (footer) shots.push(await shot(page, `${prefix}-footer.png`, { clip: await footer.boundingBox() }));
  if (vp.width < 500) {
    shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  } else {
    shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  }
  return shots;
}

async function captureRoundup(page, vp, prefix, theme) {
  await page.setViewport(vp);
  await page.goto(`${BASE}/best/ai-girlfriend/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await setTheme(page, theme);
  await settle(page, 800);
  const shots = [await shot(page, `${prefix}-hero-intro.png`)];
  await scrollSel(page, '.roundup-selection, .roundup-pick, [class*="roundup"]');
  await settle(page, 300);
  shots.push(await shot(page, `${prefix}-viewport-mid.png`));
  await scrollSel(page, '.roundup-compare, .roundup-faq, .roundup-conclusion');
  await settle(page, 300);
  shots.push(await shot(page, `${prefix}-lower.png`));
  const footer = await page.$('.site-footer');
  if (footer) shots.push(await shot(page, `${prefix}-footer.png`, { clip: await footer.boundingBox() }));
  shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  return shots;
}

async function captureReview(page, vp, prefix, theme) {
  await page.setViewport(vp);
  await page.goto(`${BASE}/reviews/ourdream-ai/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await setTheme(page, theme);
  await settle(page, 900);
  const shots = [await shot(page, `${prefix}-hero-overview.png`)];
  await page.click('[data-tab="pricing"]').catch(() => null);
  await settle(page, 1200);
  shots.push(await shot(page, `${prefix}-tab-pricing.png`));
  await scrollSel(page, '[data-pt-plans], #pricing-plans');
  shots.push(await shot(page, `${prefix}-pricing-plans.png`));
  const planCol = await page.$('[data-pt-overview-plan]:not([data-pt-overview-plan="free"])');
  if (planCol) {
    await planCol.click();
    await settle(page, 800);
    shots.push(await shot(page, `${prefix}-pricing-plan-selected.png`));
  }
  await scrollSel(page, '[data-pt-real-world], #pricing-real-world-cost, .pt-mixer');
  await settle(page, 400);
  shots.push(await shot(page, `${prefix}-pricing-calculator.png`));
  await page.click('[data-tab="overview"]').catch(() => null);
  await settle(page, 400);
  const footer = await page.$('.site-footer');
  if (footer) shots.push(await shot(page, `${prefix}-footer.png`, { clip: await footer.boundingBox() }));
  shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  return shots;
}

async function captureHub(page, vp, prefix, theme) {
  await page.setViewport(vp);
  await page.goto(`${BASE}/guides/ourdream-ai/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await setTheme(page, theme);
  await settle(page, 800);
  const shots = [await shot(page, `${prefix}-hero-default.png`)];
  await page.click('[data-hub-guide-input]').catch(() => null);
  await page.type('[data-hub-guide-input]', 'prompt', { delay: 25 });
  await settle(page, 500);
  shots.push(await shot(page, `${prefix}-search-results.png`));
  await page.click('[data-hub-guide-input]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('[data-hub-guide-input]', 'zzzznotaguide', { delay: 15 });
  await settle(page, 400);
  shots.push(await shot(page, `${prefix}-search-empty.png`));
  await page.evaluate(() => {
    const input = document.querySelector('[data-hub-guide-input]');
    if (input) input.value = '';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await scrollSel(page, '.guide-hub__start');
  shots.push(await shot(page, `${prefix}-start-here.png`));
  await scrollSel(page, '.guide-hub__topics');
  await page.evaluate(() => {
    const t = document.querySelector('.guide-hub__topic');
    if (t && !t.open) t.setAttribute('open', '');
  });
  await settle(page, 400);
  shots.push(await shot(page, `${prefix}-topics-open.png`));
  const footer = await page.$('.site-footer');
  if (footer) shots.push(await shot(page, `${prefix}-footer.png`, { clip: await footer.boundingBox() }));
  shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  return shots;
}

async function captureGlossary(page, vp, prefix, theme) {
  await page.setViewport(vp);
  await page.goto(`${BASE}/glossary/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await setTheme(page, theme);
  await settle(page, 700);
  const shots = [await shot(page, `${prefix}-default.png`)];
  await page.type('#glossary-search, [data-glossary-search]', 'token', { delay: 30 });
  await settle(page, 400);
  shots.push(await shot(page, `${prefix}-search.png`));
  await page.evaluate(() => {
    const input = document.querySelector('#glossary-search, [data-glossary-search]');
    if (input) input.value = 'zzzznomatch';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle(page, 300);
  shots.push(await shot(page, `${prefix}-no-results.png`));
  const footer = await page.$('.site-footer');
  if (footer) shots.push(await shot(page, `${prefix}-footer.png`, { clip: await footer.boundingBox() }));
  shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  return shots;
}

async function captureSitemap(page, vp, prefix, theme) {
  await page.setViewport(vp);
  await page.goto(`${BASE}/sitemap/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await setTheme(page, theme);
  await settle(page, 700);
  const shots = [await shot(page, `${prefix}-default.png`)];
  const footer = await page.$('.site-footer');
  if (footer) shots.push(await shot(page, `${prefix}-footer.png`, { clip: await footer.boundingBox() }));
  shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  return shots;
}

async function captureTest(page, vp, prefix, theme) {
  await page.setViewport(vp);
  await page.goto(`${BASE}/test/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await setTheme(page, theme);
  await settle(page, 800);
  const shots = [await shot(page, `${prefix}-hero.png`)];
  await scrollSel(page, '.test-hub-category, [class*="test-hub"]');
  shots.push(await shot(page, `${prefix}-mid.png`));
  shots.push(await shot(page, `${prefix}-full.png`, { fullPage: true }));
  return shots;
}

const index = [];

try {
  fs.mkdirSync(OUT, { recursive: true });
  const desktop = { width: 1440, height: 1000, deviceScaleFactor: 1 };
  const mobile = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

  const page = await browser.newPage();

  for (const [prefix, fn] of [
    ['homepage-desktop-1440-light', (p) => captureHome(p, desktop, 'homepage-desktop-1440-light', 'light')],
    ['homepage-desktop-1440-dark', (p) => captureHome(p, desktop, 'homepage-desktop-1440-dark', 'dark')],
    ['homepage-mobile-390-light', (p) => captureHome(p, mobile, 'homepage-mobile-390-light', 'light')],
    ['roundup-desktop-1440-light', (p) => captureRoundup(p, desktop, 'roundup-desktop-1440-light', 'light')],
    ['roundup-mobile-390-light', (p) => captureRoundup(p, mobile, 'roundup-mobile-390-light', 'light')],
    ['review-desktop-1440-light', (p) => captureReview(p, desktop, 'review-desktop-1440-light', 'light')],
    ['review-mobile-390-light', (p) => captureReview(p, mobile, 'review-mobile-390-light', 'light')],
    ['ourdream-hub-desktop-1440-light', (p) => captureHub(p, desktop, 'ourdream-hub-desktop-1440-light', 'light')],
    ['ourdream-hub-mobile-390-light', (p) => captureHub(p, mobile, 'ourdream-hub-mobile-390-light', 'light')],
    ['glossary-desktop-1440-light', (p) => captureGlossary(p, desktop, 'glossary-desktop-1440-light', 'light')],
    ['glossary-mobile-390-light', (p) => captureGlossary(p, mobile, 'glossary-mobile-390-light', 'light')],
    ['sitemap-desktop-1440-light', (p) => captureSitemap(p, desktop, 'sitemap-desktop-1440-light', 'light')],
    ['sitemap-mobile-390-light', (p) => captureSitemap(p, mobile, 'sitemap-mobile-390-light', 'light')],
    ['test-desktop-1440-light', (p) => captureTest(p, desktop, 'test-desktop-1440-light', 'light')],
    ['test-mobile-390-light', (p) => captureTest(p, mobile, 'test-mobile-390-light', 'light')],
  ]) {
    console.log('CAPTURE', prefix);
    const files = await fn(page);
    for (const f of files) index.push(f);
  }

  fs.writeFileSync(path.join(OUT, '_capture-manifest.json'), JSON.stringify(index, null, 2));
  console.log('DONE', index.length, 'files');
} finally {
  await browser.close();
}
