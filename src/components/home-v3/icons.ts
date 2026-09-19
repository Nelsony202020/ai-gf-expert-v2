/**
 * Icon set for the v3 homepage — Lucide geometry (ISC), 24 grid, 1.5 stroke,
 * round caps, matching the AIGE Figma icon library.
 */
const PATHS: Record<string, string> = {
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-up-right': '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  trophy:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  image:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  video:
    '<path d="m16 13 5.2 3.1a1 1 0 0 0 1.5-.86V8.76a1 1 0 0 0-1.5-.86L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sliders:
    '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/>',
  sparkle:
    '<path d="M9.9 2.6 8.5 6.5l-3.9 1.4a1 1 0 0 0 0 1.9l3.9 1.4 1.4 3.9a1 1 0 0 0 1.9 0l1.4-3.9 3.9-1.4a1 1 0 0 0 0-1.9l-3.9-1.4-1.4-3.9a1 1 0 0 0-1.9 0Z"/><path d="M18 16v4"/><path d="M16 18h4"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.7 8.95a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1 1 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z"/>',
  crown:
    '<path d="M11.6 3.6a1 1 0 0 1 1.6 0l2.7 3.6a1 1 0 0 0 1.4.2l3-2a1 1 0 0 1 1.5 1.1L20 17a2 2 0 0 1-2 1.6H6A2 2 0 0 1 4 17L2.2 6.5a1 1 0 0 1 1.5-1.1l3 2a1 1 0 0 0 1.4-.2Z"/><path d="M5 21h14"/>',
  play: '<path d="M6 3.7a1 1 0 0 1 1.5-.85l12 8.3a1 1 0 0 1 0 1.7l-12 8.3A1 1 0 0 1 6 20.3Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  youtube:
    '<path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49 49 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49 49 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
  reddit:
    '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M9.5 15.5a4 4 0 0 0 5 0"/>',
};

export function icon(name: string, size = 20, stroke = 1.5): string {
  const d = PATHS[name] ?? '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}
