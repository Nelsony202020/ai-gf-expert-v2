import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';

function showBootError(message: string) {
  const root = document.getElementById('admin-root');
  if (!root) return;
  root.innerHTML = `
    <div class="mx-auto mt-16 max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 font-sans text-sm text-red-900">
      <p class="font-semibold">Admin failed to load</p>
      <p class="mt-2">${message.replace(/</g, '&lt;')}</p>
      <p class="mt-3 text-red-800">Restart <code>npm run dev</code>, then hard refresh (Cmd+Shift+R).</p>
    </div>`;
}

const rootEl = document.getElementById('admin-root');
const appId = rootEl?.dataset.appId?.trim();

if (!rootEl) {
  showBootError('Missing #admin-root mount point.');
} else if (!appId) {
  showBootError('PUBLIC_INSTANT_APP_ID is not set. Check your .env file and restart the dev server.');
} else {
  try {
    createRoot(rootEl).render(<AdminApp appId={appId} />);
  } catch (err) {
    showBootError(err instanceof Error ? err.message : String(err));
  }
}
