# Guides Studio (Sanity)

Sanity Studio for guide content only. Product facts (names, scores, prices,
affiliate links, rankings) live in InstantDB and are resolved by slug at build
time — never stored here.

## One-time setup

1. Create the project (from this folder):

   ```bash
   cd studio
   npm install
   npx sanity init --bare        # creates a project + dataset, prints the projectId
   ```

2. Set env vars:
   - `studio/.env`: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET=production`,
     `SANITY_STUDIO_SITE_URL` (e.g. https://aigirlfriend.expert),
     `SANITY_STUDIO_PREVIEW_SECRET` (any random string).
   - Site root `.env`: `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`,
     `SANITY_API_READ_TOKEN` (viewer token, for draft previews),
     `SANITY_PREVIEW_SECRET` (same value as the studio's preview secret),
     `SANITY_WEBHOOK_SECRET`.

3. Roles (manage.sanity.io → project → Members):
   - **VA Writer** → Sanity "Editor" role scoped by a custom role (Growth plan) or,
     on the free plan, use the built-in "Editor" and rely on the review workflow:
     writers save drafts, only trusted members publish.
   - **Editor** → can publish and approve slug changes.
   - **Admin** → full project access.

4. Webhook (manage.sanity.io → API → Webhooks): POST to
   `https://<site>/api/webhooks/sanity`, dataset `production`, trigger on
   create/update/delete of `guide`, secret = `SANITY_WEBHOOK_SECRET`,
   projection:

   ```groq
   { "operation": delta::operation(), "documentId": _id, "slug": slug.current, "previousSlug": before().slug.current, "type": _type }
   ```

   The site endpoint creates a 301 redirect on slug changes and triggers a
   Vercel rebuild on publish/unpublish.

5. Run locally: `npm run dev` (studio on http://localhost:3333).

## Live preview

"Open preview" on a guide opens `/guides/preview?slug=…&secret=…` on the site,
which server-renders the current draft using `SANITY_API_READ_TOKEN`.
