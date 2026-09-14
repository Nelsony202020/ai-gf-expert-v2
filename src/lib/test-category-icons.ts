const stroke = `fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;

export const TEST_CATEGORY_ICONS: Record<string, string> = {
  characters: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.333 6.627c1.473 0 2.667-1.194 2.667-2.667S11.806 1.293 10.333 1.293 7.666 2.487 7.666 3.96s1.194 2.667 2.667 2.667Z" ${stroke}/><path d="M3.333 14.96v-1.333A2.667 2.667 0 0 1 6 10.96h2.667" ${stroke}/></svg>`,
  customization: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.667 2.667h2.666v2.666M13.333 2.667 8.667 7.333M6.667 3.333H4a1.333 1.333 0 0 0-1.333 1.334v7.333A1.333 1.333 0 0 0 4 13.333h7.333A1.333 1.333 0 0 0 12.667 12V9.333" ${stroke}/></svg>`,
  chat: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.333 10.667c0 .353-.141.693-.391.943s-.59.39-.942.39H3.219a1.333 1.333 0 0 0-.943.39L.808 13.859a.667.667 0 0 1-1.141-.334V2.667c0-.707.573-1.28 1.28-1.28H12c.707 0 1.28.573 1.28 1.28v8Z" ${stroke}/></svg>`,
  "chat-features": `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8.22 1.454a1.333 1.333 0 0 0-1.107 0L1.4 4.054a.667.667 0 0 0 0 1.22l5.72 2.607a1.333 1.333 0 0 0 1.107 0l5.72-2.6a.667.667 0 0 0 0-1.22L8.22 1.454ZM1 11.334l5.733 2.607a1.333 1.333 0 0 0 1.1 0L13.553 11.334" ${stroke}/></svg>`,
  images: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.333" y="1.333" width="13.334" height="13.334" rx="1.333" ${stroke}/><circle cx="5.333" cy="5.333" r="1.333" ${stroke}/><path d="M14.667 9.333 12.61 7.276a1.333 1.333 0 0 0-1.886 0L3.333 14.667" ${stroke}/></svg>`,
  video: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.333" y="3.333" width="9.334" height="9.334" rx="1.333" ${stroke}/><path d="M10.667 6.667 14.667 4v8l-4-2.667V6.667Z" ${stroke}/></svg>`,
  privacy: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.333 9.333c0 3.334-2.333 5-5.107 5.967a.667.667 0 0 1-.446-.007C5 14.333 2.667 12.667 2.667 9.333V4.667c0-.177.07-.347.195-.472.126-.125.296-.195.472-.195 1.334 0 3-.8 4.16-1.813A.667.667 0 0 1 8 2c.186 0 .365.066.507.187C9.673 3.207 11.333 4 12.667 4c.177 0 .347.07.472.195.125.125.194.295.194.472v4.666Z" ${stroke}/></svg>`,
  pricing: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.333" y="3.333" width="13.334" height="9.334" rx="1.333" ${stroke}/><path d="M4 9.333h1.333M8 9.333h4" ${stroke}/></svg>`,
};

export function testCategoryIconHtml(slug: string): string {
  return TEST_CATEGORY_ICONS[slug] ?? TEST_CATEGORY_ICONS.characters;
}
