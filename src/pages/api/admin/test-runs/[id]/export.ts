export const prerender = false;

import type { APIRoute } from 'astro';
import { handler } from '../../../../../lib/api';
import { requireIdentity, roleHas, HttpError } from '../../../../../lib/db/auth';
import { buildTestReportData, reportFilename } from '../../../../../lib/testing/buildTestReport';
import { evidenceRowsToCsv } from '../../../../../lib/testing/evidenceExport';
import { buildTestReportPdf } from '../../../../../lib/testing/testReportPdf';

/** Export structured test evidence (CSV or PDF). Read-only; no verdict/editorial content. */
export const GET: APIRoute = handler(async ({ request, params }) => {
  const identity = await requireIdentity(request);
  if (!roleHas(identity.role, 'content.view') && !roleHas(identity.role, 'testing.edit')) {
    throw new HttpError(403, 'Missing permission: content.view or testing.edit');
  }

  const testRunId = params.id!;
  const url = new URL(request.url);
  const format = (url.searchParams.get('format') ?? 'csv').toLowerCase();
  const type = (url.searchParams.get('type') ?? 'reader').toLowerCase() as 'reader' | 'full';

  const report = await buildTestReportData(testRunId);

  if (format === 'pdf') {
    const pdf = await buildTestReportPdf(report, type === 'full' ? 'full' : 'reader');
    const filename = reportFilename(report, type === 'full' ? 'full' : 'reader', 'pdf');

    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (format !== 'csv') {
    throw new HttpError(400, 'Unsupported format — use csv or pdf');
  }

  const csv = evidenceRowsToCsv(report.evidence);
  const filename = reportFilename(report, 'reader', 'csv');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
});
