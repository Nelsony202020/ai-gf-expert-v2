import { env } from '../env';

const DEFAULT_INBOX = 'hermanjcarter@gmail.com';
const DEFAULT_FROM = 'onboarding@resend.dev';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type ContactEmailPayload =
  | {
      kind: 'contact';
      name: string;
      email: string;
      subject: string;
      message: string;
    }
  | {
      kind: 'feedback';
      category: string;
      email: string;
      message: string;
      pageUrl: string;
      pageTitle: string;
    };

function buildEmail(payload: ContactEmailPayload): { subject: string; html: string; replyTo: string } {
  if (payload.kind === 'contact') {
    return {
      subject: `[Contact] ${payload.subject}`,
      replyTo: payload.email,
      html: `
        <h2>New contact form message</h2>
        <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
      `.trim(),
    };
  }

  return {
    subject: `[Feedback] ${payload.category} — ${payload.pageTitle}`,
    replyTo: payload.email,
    html: `
      <h2>Article feedback</h2>
      <p><strong>Category:</strong> ${escapeHtml(payload.category)}</p>
      <p><strong>From:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Page:</strong> <a href="${escapeHtml(payload.pageUrl)}">${escapeHtml(payload.pageTitle)}</a></p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
    `.trim(),
  };
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const apiKey = env('RESEND_API_KEY')?.trim();
  if (!apiKey) {
    throw new Error(
      'Email is not configured yet. Add RESEND_API_KEY in Vercel Environment Variables, then redeploy.',
    );
  }

  const to = env('CONTACT_INBOX')?.trim() || DEFAULT_INBOX;
  const from = env('RESEND_FROM')?.trim() || DEFAULT_FROM;
  const { subject, html, replyTo } = buildEmail(payload);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[contact] Resend error', res.status, detail);
    // Keep user-facing message short; Resend often rejects unverified from-domains.
    if (res.status === 403 || /not verified|domain/i.test(detail)) {
      throw new Error('Email sender is not verified yet. Check RESEND_FROM in Resend.');
    }
    throw new Error('Could not send email right now. Please try again in a moment.');
  }
}
