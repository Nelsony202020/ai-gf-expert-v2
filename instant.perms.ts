// InstantDB permission rules.
//
// Security model: ALL reads and writes of structured data go through the
// server-side data layer (src/lib/db/*) using the admin SDK, which bypasses
// these rules and enforces role-based permissions in code. Browser clients
// are only used for magic-code authentication, so every namespace denies
// client access outright. Do not loosen these without updating the RBAC
// checks in src/lib/db/auth.ts.
//
// Push with: npx instant-cli@latest push perms

import type { InstantRules } from '@instantdb/react';

const denyAll = {
  allow: {
    view: 'false',
    create: 'false',
    update: 'false',
    delete: 'false',
  },
};

const rules = {
  $default: denyAll,
  attrs: {
    allow: {
      $default: 'false',
    },
  },
  $files: {
    allow: {
      // Public site renders published media via URLs resolved server-side.
      view: 'true',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },
  $users: {
    allow: {
      view: 'auth.id == data.id',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },
} satisfies InstantRules;

export default rules;
