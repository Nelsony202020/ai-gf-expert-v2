// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import vercel from '@astrojs/vercel';
import { astroScriptTsPlugin } from './vite/astro-script-ts-plugin.mjs';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://aigirlfriend.expert',
  env: {
    schema: {
      PUBLIC_INSTANT_APP_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SANITY_PROJECT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SANITY_DATASET: envField.string({ context: 'client', access: 'public', optional: true }),
      INSTANT_APP_ADMIN_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      ADMIN_OWNER_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      VERCEL_DEPLOY_HOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CRON_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_API_READ_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_PREVIEW_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      OPENAI_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      OPENAI_VERDICT_MODEL: envField.string({ context: 'server', access: 'secret', optional: true }),
      OPENAI_PRICING_MODEL: envField.string({ context: 'server', access: 'secret', optional: true }),
      OPENAI_ALT_TEXT_MODEL: envField.string({ context: 'server', access: 'secret', optional: true }),
      AI_VERDICT_ENABLED: envField.string({ context: 'server', access: 'secret', optional: true }),
      AI_PRICING_ENABLED: envField.string({ context: 'server', access: 'secret', optional: true }),
      AI_ALT_TEXT_ENABLED: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  // Public pages stay prerendered (static HTML for SEO). Server routes
  // (/admin, /api, /go) opt out with `export const prerender = false`.
  output: 'static',
  adapter: vercel(),
  // Admin uses a Vite page script (admin-entry.tsx), not Astro React islands.
  // @astrojs/react forces broken Rolldown pre-bundling of React 19 in dev.
  integrations: [],
  redirects: {
    '/terms-of-service': '/legal/terms',
    '/terms-of-service/privacy-policy': '/legal/privacy',
    '/terms-of-service/affiliate-disclosure': '/legal/affiliate-disclosure',
    '/terms-of-service/accessibility': '/legal/accessibility',
    '/guides/how-to-choos-an-ai-girlfriend-app': '/guides/how-to-choose-an-ai-girlfriend-app',
    '/faq': '/',
    '/editorial-process': '/editorial-guidelines',
  },
  vite: {
    plugins: [astroScriptTsPlugin(), tailwindcss(), react()],
    ssr: {
      noExternal: ['@instantdb/admin', '@instantdb/core', '@instantdb/version'],
    },
    server: {
      port: 4321,
      strictPort: true,
      watch: {
        // Ignore build output — watching .vercel/ triggers thousands of HMR reloads
        // and breaks admin module loading in dev.
        ignored: ['**/.vercel/**', '**/dist/**'],
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    },
  },
});
