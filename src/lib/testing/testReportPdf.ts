// Professional test evidence PDF (pdf-lib) — reader and full modes.

import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  type RGB,
} from 'pdf-lib';
import type { TestReportData, ReportMode } from './buildTestReport';
import type { EvidenceExportRow } from './evidenceExport';

const PINK: RGB = rgb(0.859, 0.153, 0.467);
const DARK: RGB = rgb(0.118, 0.161, 0.231);
const GREY: RGB = rgb(0.42, 0.447, 0.502);
const LIGHT: RGB = rgb(0.96, 0.97, 0.98);
const GREEN: RGB = rgb(0.133, 0.545, 0.133);
const WHITE: RGB = rgb(1, 1, 1);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const FOOTER_Y = 28;

interface Layout {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  fontBold: PDFFont;
  meta: TestReportData['meta'];
  pageNum: number;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function buildTestReportPdf(
  data: TestReportData,
  mode: ReportMode = 'reader',
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${data.meta.productName} Test Evidence Report — ${data.meta.testRunName}`);
  doc.setAuthor('AI Girlfriend Expert');
  doc.setSubject(`Hands-on testing results for ${data.meta.productName}`);
  doc.setKeywords([
    data.meta.productName,
    'AI girlfriend review',
    'test results',
    data.meta.methodologyVersion,
  ]);
  doc.setCreationDate(new Date());

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let ctx: Layout = {
    doc,
    page: doc.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - MARGIN,
    font,
    fontBold,
    meta: data.meta,
    pageNum: 1,
  };

  ctx = drawCover(ctx, data);
  ctx = newPage(ctx);
  ctx = drawExecutiveSummary(ctx, data);
  ctx = newPage(ctx);
  ctx = drawTestDetails(ctx, data);
  ctx = ensureSpace(ctx, 120);
  ctx = drawScoreOverview(ctx, data);

  for (const cat of data.scores.categories) {
    ctx = newPage(ctx);
    ctx = drawCategorySection(ctx, data, cat.slug, mode);
  }

  ctx = newPage(ctx);
  ctx = drawLimitations(ctx, data);

  if (mode === 'full') {
    ctx = newPage(ctx);
    drawAppendix(ctx, data);
  }

  stampFooters(doc, data.meta, font);
  return doc.save();
}

function newPage(ctx: Layout): Layout {
  const page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  return { ...ctx, page, y: PAGE_H - MARGIN - 20, pageNum: ctx.pageNum + 1 };
}

function ensureSpace(ctx: Layout, needed: number): Layout {
  if (ctx.y - needed < MARGIN + 40) return newPage(ctx);
  return ctx;
}

function drawRunningHeader(ctx: Layout): Layout {
  ctx.page.drawText(`${ctx.meta.productName} — ${ctx.meta.testRunName}`, {
    x: MARGIN,
    y: PAGE_H - 32,
    size: 8,
    font: ctx.font,
    color: GREY,
  });
  ctx.page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 36 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - 36 },
    thickness: 0.5,
    color: LIGHT,
  });
  ctx.y = PAGE_H - MARGIN - 8;
  return ctx;
}

function heading(ctx: Layout, text: string, size = 16): Layout {
  let c = ensureSpace(ctx, size + 20);
  c.page.drawText(text, { x: MARGIN, y: c.y, size, font: c.fontBold, color: DARK });
  c.y -= size + 8;
  return c;
}

function subheading(ctx: Layout, text: string): Layout {
  let c = ensureSpace(ctx, 20);
  c.page.drawText(text, { x: MARGIN, y: c.y, size: 12, font: c.fontBold, color: DARK });
  c.y -= 18;
  return c;
}

function body(ctx: Layout, text: string, size = 10, indent = 0): Layout {
  const maxW = PAGE_W - MARGIN * 2 - indent;
  const lines = wrapText(text, ctx.font, size, maxW);
  for (const line of lines) {
    ctx = ensureSpace(ctx, size + 4);
    ctx.page.drawText(line, {
      x: MARGIN + indent,
      y: ctx.y,
      size,
      font: ctx.font,
      color: DARK,
    });
    ctx.y -= size + 4;
  }
  return ctx;
}

function drawCover(ctx: Layout, data: TestReportData): Layout {
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 120, width: PAGE_W, height: 120, color: PINK });
  ctx.page.drawText('Test Evidence Report', {
    x: MARGIN,
    y: PAGE_H - 70,
    size: 28,
    font: ctx.fontBold,
    color: WHITE,
  });
  ctx.y = PAGE_H - 160;
  ctx = body(ctx, data.meta.productName, 22);
  ctx = body(ctx, data.meta.testRunName, 14);
  ctx.y -= 8;
  if (data.scores.overall != null) {
    ctx = body(ctx, `Overall score: ${data.scores.overall.toFixed(1)}`, 16);
  }
  ctx = body(ctx, `Methodology ${data.meta.methodologyVersion}`, 11);
  ctx.y -= 12;
  if (data.meta.testerName) ctx = body(ctx, `Tested by ${data.meta.testerName}`, 11);
  if (data.meta.factCheckerName) ctx = body(ctx, `Fact-checked by ${data.meta.factCheckerName}`, 11);
  ctx.y -= 8;
  ctx = body(ctx, `Report status: ${data.meta.statusLabel}`, 11);
  ctx = body(ctx, `Exported ${data.meta.exportedAt}`, 10);
  return ctx;
}

function drawExecutiveSummary(ctx: Layout, data: TestReportData): Layout {
  ctx = drawRunningHeader(ctx);
  ctx = heading(ctx, 'Executive summary');

  if (data.scores.overall != null) {
    ctx = body(ctx, `Overall score: ${data.scores.overall.toFixed(1)}`, 14);
    ctx.y -= 6;
  }

  const scored = data.scores.categories
    .filter((c) => c.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (scored.length > 0) {
    ctx = subheading(ctx, 'Category scores');
    for (const c of scored) {
      ctx = body(ctx, `${c.name}: ${c.score!.toFixed(1)} (${c.weight}% weight)`, 10);
    }
    ctx.y -= 8;
  }

  ctx = subheading(ctx, 'Testing scope');
  ctx = body(ctx, `${data.stats.answered} of ${data.stats.totalEvidence} evidence points recorded`, 10);
  ctx = body(ctx, `${data.stats.screenshots} proof attachments`, 10);
  if (data.stats.unknown > 0) ctx = body(ctx, `${data.stats.unknown} results marked unknown`, 10);
  if (data.stats.missing > 0) ctx = body(ctx, `${data.stats.missing} evidence points without answers`, 10);
  return ctx;
}

function drawTestDetails(ctx: Layout, data: TestReportData): Layout {
  ctx = drawRunningHeader(ctx);
  ctx = heading(ctx, 'Test details');

  const rows: [string, string][] = [
    ['Product', data.meta.productName],
    ['Test run', data.meta.testRunName],
    ['Methodology', data.meta.methodologyVersion],
    ['Status', data.meta.statusLabel],
    ['Testing started', data.meta.startedAt || '—'],
    ['Testing completed', data.meta.completedAt || '—'],
    ['Published', data.meta.publishedAt || '—'],
    ['Tester', data.meta.testerName || '—'],
    ['Fact checker', data.meta.factCheckerName || '—'],
    ['Review page', `${data.meta.siteUrl}/reviews/${data.meta.productSlug}`],
  ];

  for (const [label, value] of rows) {
    ctx = ensureSpace(ctx, 16);
    ctx.page.drawText(label, { x: MARGIN, y: ctx.y, size: 9, font: ctx.fontBold, color: GREY });
    const valLines = wrapText(value, ctx.font, 10, PAGE_W - MARGIN - 130);
    ctx.page.drawText(valLines[0], { x: MARGIN + 120, y: ctx.y, size: 10, font: ctx.font, color: DARK });
    ctx.y -= 16;
  }
  return ctx;
}

function drawScoreOverview(ctx: Layout, data: TestReportData): Layout {
  ctx = subheading(ctx, 'Score overview');
  return drawScoreTable(ctx, data);
}

function drawScoreTable(ctx: Layout, data: TestReportData): Layout {
  const colX = [MARGIN, MARGIN + 200, MARGIN + 280];
  ctx = ensureSpace(ctx, 20);
  ctx.page.drawText('Category', { x: colX[0], y: ctx.y, size: 9, font: ctx.fontBold, color: GREY });
  ctx.page.drawText('Score', { x: colX[1], y: ctx.y, size: 9, font: ctx.fontBold, color: GREY });
  ctx.page.drawText('Weight', { x: colX[2], y: ctx.y, size: 9, font: ctx.fontBold, color: GREY });
  ctx.y -= 14;

  for (const cat of data.scores.categories) {
    ctx = ensureSpace(ctx, 14);
    ctx.page.drawText(cat.name, { x: colX[0], y: ctx.y, size: 10, font: ctx.font, color: DARK });
    ctx.page.drawText(cat.score != null ? cat.score.toFixed(1) : '—', {
      x: colX[1],
      y: ctx.y,
      size: 10,
      font: ctx.fontBold,
      color: cat.score != null && cat.score >= 8 ? GREEN : DARK,
    });
    ctx.page.drawText(`${cat.weight}%`, { x: colX[2], y: ctx.y, size: 10, font: ctx.font, color: DARK });
    ctx.y -= 14;
  }
  ctx.y -= 8;
  return ctx;
}

function drawCategorySection(
  ctx: Layout,
  data: TestReportData,
  categorySlug: string,
  mode: ReportMode,
): Layout {
  const cat = data.scores.categories.find((c) => c.slug === categorySlug);
  if (!cat) return ctx;

  ctx = drawRunningHeader(ctx);
  ctx = heading(ctx, `${cat.name}${cat.score != null ? ` — ${cat.score.toFixed(1)}` : ''}`, 18);
  ctx = body(ctx, `Weight: ${cat.weight}% of overall score`, 9);

  for (const sub of cat.subscores) {
    ctx = ensureSpace(ctx, 40);
    ctx = subheading(ctx, `${sub.name}${sub.score != null ? ` — ${sub.score.toFixed(1)}` : ''}`);

    const rows = data.evidence.filter(
      (r) => r.category_slug === categorySlug && r.subscore_slug === sub.slug,
    );
    const displayRows =
      mode === 'full' ? rows : rows.filter((r) => r.answer || r.not_applicable || r.is_unknown);

    if (displayRows.length === 0) {
      ctx = body(ctx, 'No evidence recorded for this subscore.', 9);
      continue;
    }

    ctx = drawEvidenceTable(ctx, displayRows.slice(0, mode === 'reader' ? 12 : 999));
  }
  return ctx;
}

function drawEvidenceTable(ctx: Layout, rows: EvidenceExportRow[]): Layout {
  const colX = [MARGIN, MARGIN + 220, MARGIN + 340, MARGIN + 400];
  ctx = ensureSpace(ctx, 16);
  ctx.page.drawText('Metric', { x: colX[0], y: ctx.y, size: 8, font: ctx.fontBold, color: GREY });
  ctx.page.drawText('Result', { x: colX[1], y: ctx.y, size: 8, font: ctx.fontBold, color: GREY });
  ctx.page.drawText('Score', { x: colX[2], y: ctx.y, size: 8, font: ctx.fontBold, color: GREY });
  ctx.page.drawText('Status', { x: colX[3], y: ctx.y, size: 8, font: ctx.fontBold, color: GREY });
  ctx.y -= 12;

  for (const row of rows) {
    ctx = ensureSpace(ctx, 14);
    const qLines = wrapText(row.question, ctx.font, 8.5, 210);
    const result = row.not_applicable
      ? 'N/A'
      : row.is_unknown
        ? 'Unknown'
        : row.public_result || row.answer || '—';
    const status = row.not_applicable
      ? 'N/A'
      : row.is_unknown
        ? 'Unknown'
        : row.answer
          ? 'Verified'
          : 'Missing';
    const score = row.normalized_score || '—';

    ctx.page.drawText(qLines[0], { x: colX[0], y: ctx.y, size: 8.5, font: ctx.font, color: DARK });
    ctx.page.drawText(String(result).slice(0, 28), {
      x: colX[1],
      y: ctx.y,
      size: 8.5,
      font: ctx.font,
      color: DARK,
    });
    ctx.page.drawText(String(score), { x: colX[2], y: ctx.y, size: 8.5, font: ctx.font, color: DARK });
    ctx.page.drawText(status, { x: colX[3], y: ctx.y, size: 8.5, font: ctx.font, color: GREY });
    if (row.proof_count > 0) {
      ctx.page.drawText(`${row.proof_count} proof`, {
        x: colX[3],
        y: ctx.y - 10,
        size: 7,
        font: ctx.font,
        color: GREY,
      });
    }
    ctx.y -= row.proof_count > 0 ? 22 : 14;
  }
  ctx.y -= 6;
  return ctx;
}

function drawLimitations(ctx: Layout, data: TestReportData): Layout {
  ctx = drawRunningHeader(ctx);
  ctx = heading(ctx, 'Limitations and unverified results');

  const issues = data.evidence.filter((r) => r.is_unknown || r.not_applicable || !r.answer);
  if (issues.length === 0) {
    return body(ctx, 'All evidence points were verified during this test run.', 10);
  }

  for (const row of issues.slice(0, 40)) {
    const label = row.is_unknown
      ? 'Unknown'
      : row.not_applicable
        ? 'Not applicable'
        : 'Not completed';
    ctx = body(ctx, `${row.category} / ${row.subscore} / ${row.question}: ${label}`, 9);
  }
  return ctx;
}

function drawAppendix(ctx: Layout, data: TestReportData): Layout {
  ctx = drawRunningHeader(ctx);
  ctx = heading(ctx, 'Appendix — technical reference');
  ctx = body(ctx, 'Internal metric IDs and evidence record IDs for audit purposes.', 9);
  ctx.y -= 8;

  for (const row of data.evidence.slice(0, 80)) {
    ctx = ensureSpace(ctx, 12);
    ctx.page.drawText(`${row.question_slug} · ${row.evidence_result_id || 'no result'}`, {
      x: MARGIN,
      y: ctx.y,
      size: 7.5,
      font: ctx.font,
      color: GREY,
    });
    ctx.y -= 10;
  }
  return ctx;
}

function stampFooters(doc: PDFDocument, meta: TestReportData['meta'], font: PDFFont) {
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const footer = `${meta.productName} · Methodology ${meta.methodologyVersion}`;
    page.drawText(footer, { x: MARGIN, y: FOOTER_Y, size: 7, font, color: GREY });
    const pageLabel = `Page ${i + 1} of ${pages.length}`;
    const w = font.widthOfTextAtSize(pageLabel, 7);
    page.drawText(pageLabel, { x: PAGE_W - MARGIN - w, y: FOOTER_Y, size: 7, font, color: GREY });
  });
}
