// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import vercel from '@astrojs/vercel';
import { astroScriptTsPlugin } from './vite/astro-script-ts-plugin.mjs';
import { canonicalGuard } from './integrations/canonical-guard.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://aigirlfriend.expert',
  // 'ignore' so /admin and /admin/ both work in dev (trailingSlash: 'always' 404s bare /admin).
  trailingSlash: 'ignore',
  env: {
    schema: {
      PUBLIC_INSTANT_APP_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_CDN_URL: envField.string({ context: 'client', access: 'public', optional: true }),
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
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_INBOX: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },  // Public pages stay prerendered (static HTML for SEO). Server routes
  // (/admin, /api, /go) opt out with `export const prerender = false`.
  output: 'static',
  // Privacy scrape+analyze and other AI admin routes need longer than the
  // default ~10s hobby timeout (10 Candy policy pages + OpenAI easily exceed it).
  adapter: vercel({ maxDuration: 120 }),
  // Admin uses a Vite page script (admin-entry.tsx), not Astro React islands.
  // @astrojs/react forces broken Rolldown pre-bundling of React 19 in dev.
  integrations: [canonicalGuard()],
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
