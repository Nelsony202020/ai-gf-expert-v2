// Minimal PDF generator (no external deps) for structured text reports.

function toPdfSafe(text: string): string {
  return text
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u00b7]/g, '-')
    .replace(/\u203a/g, '>')
    .replace(/\u00bb/g, '>>')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7E\n\r\t]/g, '?');
}

function escapePdfText(text: string): string {
  return toPdfSafe(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(text: string, maxLen: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLen) {
      if (current) lines.push(current);
      if (word.length > maxLen) {
        for (let i = 0; i < word.length; i += maxLen) lines.push(word.slice(i, i + maxLen));
        current = '';
      } else {
        current = word;
      }
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

type DrawLine = { fontSize: number; x: number; y: number; text: string };

export function buildTextPdf(opts: {
  title: string;
  subtitle?: string;
  sections: { heading: string; lines: string[] }[];
}): Uint8Array {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const lineHeight = 14;
  const maxChars = 90;

  const pageLines: DrawLine[][] = [[]];
  let y = pageHeight - margin;

  function startPage() {
    pageLines.push([]);
    y = pageHeight - margin;
  }

  function ensureSpace(minFromBottom = margin + lineHeight) {
    if (y < minFromBottom) startPage();
  }

  function draw(fontSize: number, x: number, text: string, gapAfter = 0) {
    for (const line of wrapLine(text, maxChars)) {
      ensureSpace();
      y -= lineHeight;
      pageLines[pageLines.length - 1].push({ fontSize, x, y, text: line });
    }
    y -= gapAfter;
  }

  draw(16, margin, opts.title, 8);

  if (opts.subtitle) {
    draw(10, margin, opts.subtitle, 10);
  }

  for (const section of opts.sections) {
    ensureSpace(margin + lineHeight * 4);
    draw(11, margin, section.heading);
    for (const raw of section.lines) {
      draw(9, margin + 8, raw);
    }
    y -= 6;
  }

  const pageCount = pageLines.length;
  const objects: string[] = [];
  const pageObjNums: number[] = [];

  // 1: catalog, 2: pages, then alternating page + content streams, then font
  const fontObjNum = 3 + pageCount * 2;
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const kids = pageLines.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`);

  for (let p = 0; p < pageCount; p++) {
    const pageObjNum = 3 + p * 2;
    const contentObjNum = pageObjNum + 1;
    pageObjNums.push(pageObjNum);

    const cmds = pageLines[p]
      .map(
        (line) =>
          `BT /F1 ${line.fontSize} Tf ${line.x} ${line.y} Td (${escapePdfText(line.text)}) Tj ET`,
      )
      .join('\n');
    const streamLen = new TextEncoder().encode(cmds).length;

    objects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>\nendobj\n`,
    );
    objects.push(`${contentObjNum} 0 obj\n<< /Length ${streamLen} >>\nstream\n${cmds}\nendstream\nendobj\n`);
  }

  objects.push(`${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  return new TextEncoder().encode(pdf);
}
