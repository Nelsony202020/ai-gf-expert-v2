// ModuleConfig definitions for all standard (registry-driven) admin modules.
// Custom screens (products, test runs, roundups, homepage, dashboard) live in
// their own files.

import { Badge, statusTone, fmtDate } from './ui';
import type { ModuleConfig } from './EntityPage';
import { definitionGaps } from './testing/presentation';

export const authorsModule: ModuleConfig = {
  entity: 'authors',
  title: 'Authors',
  description: 'Content bylines (reviewers, fact-checkers) shown on the public site.',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'role', label: 'Role' },
    { key: 'active', label: 'Active' },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'slug', required: true },
    { name: 'role', label: 'Role', type: 'text' },
    { name: 'avatarUrl', label: 'Avatar URL', type: 'text' },
    { name: 'bio', label: 'Biography', type: 'textarea' },
    { name: 'verified', label: 'Verified badge', type: 'boolean' },
    { name: 'active', label: 'Active', type: 'boolean' },
    { name: 'sortOrder', label: 'Sort order', type: 'number' },
  ],
};

export const subscriptionPlansModule: ModuleConfig = {
  entity: 'subscriptionPlans',
  title: 'Subscription plans',
  description: 'Structured pricing — one row per plan per product.',
  columns: [
    { key: 'product', label: 'Product', render: (r) => r.product?.name ?? '—' },
    { key: 'name', label: 'Plan' },
    { key: 'billingInterval', label: 'Interval' },
    {
      key: 'price',
      label: 'Price',
      render: (r) => `${r.currency ?? 'USD'} ${Number(r.price).toFixed(2)}`,
    },
    { key: 'active', label: 'Active' },
    { key: 'lastVerifiedAt', label: 'Verified' },
  ],
  fields: [
    { name: 'name', label: 'Plan name', type: 'text', required: true },
    {
      name: 'billingInterval',
      label: 'Billing interval',
      type: 'select',
      required: true,
      options: ['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'].map((v) => ({
        value: v,
        label: v,
      })),
    },
    { name: 'price', label: 'Price', type: 'number', required: true },
    { name: 'currency', label: 'Currency (ISO)', type: 'text', required: true, placeholder: 'USD' },
    { name: 'introPrice', label: 'Introductory price', type: 'number' },
    { name: 'freeTrial', label: 'Free trial', type: 'boolean' },
    { name: 'trialNotes', label: 'Trial notes', type: 'text' },
    { name: 'includedFeatures', label: 'Included features (comma-separated)', type: 'tags' },
    { name: 'includedTokens', label: 'Included tokens', type: 'number' },
    { name: 'includedImages', label: 'Included images', type: 'number' },
    { name: 'includedVideos', label: 'Included videos', type: 'number' },
    { name: 'includedVoiceMinutes', label: 'Included voice minutes', type: 'number' },
    { name: 'active', label: 'Active', type: 'boolean' },
    { name: 'sortOrder', label: 'Sort order', type: 'number' },
    { name: 'lastVerifiedAt', label: 'Last verified', type: 'date' },
  ],
  linkPickers: [{ name: 'product', label: 'Product', entity: 'products', labelKey: 'name', required: true }],
};

export const creditPackagesModule: ModuleConfig = {
  entity: 'creditPackages',
  title: 'Token / credit packages',
  columns: [
    { key: 'product', label: 'Product', render: (r) => r.product?.name ?? '—' },
    { key: 'name', label: 'Package' },
    {
      key: 'price',
      label: 'Price',
      render: (r) => `${r.currency ?? 'USD'} ${Number(r.price).toFixed(2)}`,
    },
    { key: 'tokenAmount', label: 'Tokens' },
    { key: 'active', label: 'Active' },
    { key: 'lastVerifiedAt', label: 'Verified' },
  ],
  fields: [
    { name: 'name', label: 'Package name', type: 'text', required: true },
    { name: 'price', label: 'Price', type: 'number', required: true },
    { name: 'currency', label: 'Currency (ISO)', type: 'text', required: true, placeholder: 'USD' },
    { name: 'tokenAmount', label: 'Token amount', type: 'number' },
    { name: 'estImages', label: 'Est. image allowance', type: 'number' },
    { name: 'estVideos', label: 'Est. video allowance', type: 'number' },
    { name: 'estMessages', label: 'Est. message allowance', type: 'number' },
    { name: 'estCostPerImage', label: 'Est. cost per image', type: 'number' },
    { name: 'estCostPerVideo', label: 'Est. cost per video', type: 'number' },
    { name: 'active', label: 'Active', type: 'boolean' },
    { name: 'lastVerifiedAt', label: 'Last verified', type: 'date' },
  ],
  linkPickers: [{ name: 'product', label: 'Product', entity: 'products', labelKey: 'name', required: true }],
};

export const paymentProfilesModule: ModuleConfig = {
  entity: 'paymentProfiles',
  title: 'Payment methods',
  description: 'Accepted payment methods and billing privacy, one profile per product.',
  columns: [
    { key: 'product', label: 'Product', render: (r) => r.product?.name ?? '—' },
    { key: 'creditCard', label: 'Card' },
    { key: 'paypal', label: 'PayPal' },
    { key: 'crypto', label: 'Crypto' },
    {
      key: 'cryptoOnly',
      label: 'Crypto only',
      render: (r) => (r.cryptoOnly ? <Badge tone="amber">crypto only</Badge> : '—'),
    },
    { key: 'discreetBilling', label: 'Discreet' },
    { key: 'billingDescriptor', label: 'Descriptor' },
  ],
  fields: [
    { name: 'creditCard', label: 'Credit card', type: 'boolean' },
    { name: 'debitCard', label: 'Debit card', type: 'boolean' },
    { name: 'paypal', label: 'PayPal', type: 'boolean' },
    { name: 'crypto', label: 'Cryptocurrency', type: 'boolean' },
    {
      name: 'cryptoOnly',
      label: 'Crypto ONLY (restriction)',
      type: 'boolean',
      help: 'Stored separately from accepting crypto — it is an important restriction.',
    },
    { name: 'applePay', label: 'Apple Pay', type: 'boolean' },
    { name: 'googlePay', label: 'Google Pay', type: 'boolean' },
    { name: 'discreetBilling', label: 'Discreet billing', type: 'boolean' },
    { name: 'billingDescriptor', label: 'Billing descriptor', type: 'text' },
    { name: 'notes', label: 'Payment notes', type: 'textarea' },
    { name: 'lastVerifiedAt', label: 'Last verified', type: 'date' },
  ],
  linkPickers: [{ name: 'product', label: 'Product', entity: 'products', labelKey: 'name', required: true }],
};

export const charactersModule: ModuleConfig = {
  entity: 'characters',
  title: 'Characters',
  description: 'Unlimited characters per product. Homepage limits are presentation rules.',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'product', label: 'Product', render: (r) => r.product?.name ?? '—' },
    { key: 'characterStyle', label: 'Style' },
    {
      key: 'adult',
      label: '18+',
      render: (r) => (r.adult ? <Badge tone="red">18+</Badge> : <Badge tone="green">Safe</Badge>),
    },
    { key: 'featured', label: 'Featured' },
    { key: 'active', label: 'Active' },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'slug', required: true },
    { name: 'shortDescription', label: 'Short description', type: 'textarea' },
    { name: 'personalityTags', label: 'Personality tags (comma-separated)', type: 'tags' },
    {
      name: 'characterStyle',
      label: 'Style',
      type: 'select',
      options: ['realistic', 'anime', 'fantasy', 'other'].map((v) => ({ value: v, label: v })),
    },
    { name: 'genderPresentation', label: 'Gender presentation', type: 'text' },
    { name: 'adult', label: '18+ character', type: 'boolean' },
    { name: 'active', label: 'Active', type: 'boolean' },
    { name: 'featured', label: 'Featured', type: 'boolean' },
    { name: 'featuredStartAt', label: 'Featured from', type: 'date' },
    { name: 'featuredEndAt', label: 'Featured until', type: 'date' },
    { name: 'homepageOrder', label: 'Homepage display order', type: 'number' },
  ],
  linkPickers: [
    { name: 'product', label: 'Product', entity: 'products', labelKey: 'name', required: true },
    { name: 'image', label: 'Profile image', entity: 'media', labelKey: 'altText' },
    { name: 'affiliateLink', label: 'Affiliate link', entity: 'affiliateLinks', labelKey: 'cloakedSlug' },
  ],
};

export const methodologyVersionsModule: ModuleConfig = {
  entity: 'methodologyVersions',
  title: 'Methodology versions',
  writePermission: 'methodology.edit',
  columns: [
    { key: 'version', label: 'Version' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'activatedAt', label: 'Activated' },
  ],
  fields: [
    { name: 'version', label: 'Version', type: 'text', required: true, placeholder: 'v3.1' },
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: ['draft', 'active', 'retired'].map((v) => ({ value: v, label: v })),
    },
  ],
};

export const categoriesModule: ModuleConfig = {
  entity: 'categories',
  title: 'Rating categories',
  description: 'The eight weighted main categories. Weights must sum to 100.',
  writePermission: 'methodology.edit',
  columns: [
    { key: 'displayOrder', label: '#' },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'weight', label: 'Weight %' },
    { key: 'active', label: 'Active' },
    {
      key: 'methodologyVersion',
      label: 'Methodology',
      render: (r) => r.methodologyVersion?.version ?? '—',
    },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'slug', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'weight', label: 'Weight (% of overall)', type: 'number', required: true },
    { name: 'displayOrder', label: 'Display order', type: 'number', required: true },
    { name: 'methodologyUrl', label: 'Methodology page URL', type: 'text', placeholder: '/test/chat/' },
    { name: 'active', label: 'Active', type: 'boolean' },
  ],
  linkPickers: [
    {
      name: 'methodologyVersion',
      label: 'Methodology version',
      entity: 'methodologyVersions',
      labelKey: 'version',
      required: true,
    },
  ],
};

export const subscoresModule: ModuleConfig = {
  entity: 'subscores',
  title: 'Subscores',
  description: 'Three per category; weights sum to 100 within each category.',
  writePermission: 'methodology.edit',
  columns: [
    { key: 'category', label: 'Category', render: (r) => r.category?.name ?? '—' },
    { key: 'displayOrder', label: '#' },
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'weight', label: 'Weight %' },
    { key: 'active', label: 'Active' },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'slug', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'weight', label: 'Weight (% within category)', type: 'number', required: true },
    { name: 'displayOrder', label: 'Display order', type: 'number', required: true },
    { name: 'methodologyUrl', label: 'Methodology page URL', type: 'text' },
    { name: 'active', label: 'Active', type: 'boolean' },
  ],
  linkPickers: [
    { name: 'category', label: 'Category', entity: 'categories', labelKey: 'name', required: true },
  ],
};

export const evidenceDefinitionsModule: ModuleConfig = {
  entity: 'evidenceDefinitions',
  title: 'Evidence definitions',
  description: 'What is measured, how, and how raw results convert to 0-10 scores.',
  writePermission: 'methodology.edit',
  columns: [
    { key: 'subscore', label: 'Subscore', render: (r) => r.subscore?.name ?? '—' },
    { key: 'displayOrder', label: '#' },
    { key: 'name', label: 'Name' },
    { key: 'measurementType', label: 'Type' },
    { key: 'weight', label: 'Weight %' },
    { key: 'required', label: 'Required' },
    {
      key: 'testerReady',
      label: 'Tester UX',
      render: (r) => {
        const gaps = definitionGaps(r);
        return gaps.length === 0 ? (
          <Badge tone="green">ready</Badge>
        ) : (
          <span title={gaps.join('\n')}>
            <Badge tone="amber">{gaps.length} gap{gaps.length === 1 ? '' : 's'}</Badge>
          </span>
        );
      },
    },
    { key: 'active', label: 'Active' },
  ],
  searchKeys: ['name', 'slug', 'measurementType'],
  fields: [
    { name: 'name', label: 'Internal name', type: 'text', required: true, section: 'Internal methodology' },
    { name: 'slug', label: 'Slug', type: 'slug', required: true, section: 'Internal methodology' },
    { name: 'publicDescription', label: 'Public description', type: 'textarea', section: 'Internal methodology' },
    { name: 'resultFormat', label: 'Result format', type: 'text', placeholder: 'Result — Median reply time in seconds.', section: 'Internal methodology' },
    {
      name: 'measurementType',
      label: 'Measurement type',
      type: 'select',
      required: true,
      section: 'Internal methodology',
      options: [
        'boolean',
        'yes_limited_no',
        'count',
        'percentage',
        'seconds',
        'currency',
        'scale',
        'enum',
        'structured',
      ].map((v) => ({ value: v, label: v })),
    },
    { name: 'unit', label: 'Unit', type: 'text', placeholder: 'seconds, %, USD…', section: 'Internal methodology' },
    {
      name: 'scoringRule',
      label: 'Scoring rule (JSON)',
      type: 'json',
      required: true,
      section: 'Internal methodology',
      help: 'e.g. {"kind":"linear","min":0,"max":100} or {"kind":"ynl","yes":10,"limited":5,"no":0,"unknown":0}',
    },
    { name: 'thresholds', label: 'Thresholds (JSON, optional)', type: 'json', section: 'Internal methodology' },
    { name: 'weight', label: 'Weight (% within subscore)', type: 'number', required: true, section: 'Internal methodology' },
    { name: 'required', label: 'Required for publishing', type: 'boolean', section: 'Internal methodology' },
    { name: 'displayOrder', label: 'Display order', type: 'number', required: true, section: 'Internal methodology' },
    { name: 'methodologyUrl', label: 'Methodology page URL', type: 'text', section: 'Internal methodology' },
    { name: 'active', label: 'Active', type: 'boolean', section: 'Internal methodology' },
    // --- Tester-facing fields (drive the guided testing experience) ---------
    {
      name: 'questionLabel',
      label: 'Tester question',
      type: 'text',
      section: 'Tester experience',
      placeholder: 'How many ready-made characters are available?',
      help: 'Plain-English question shown to testers instead of the internal name.',
    },
    {
      name: 'shortDescription',
      label: 'What to test',
      type: 'textarea',
      section: 'Tester experience',
      placeholder: 'Count the total number of publicly available characters in the full library.',
    },
    { name: 'whyItMatters', label: 'Why this matters', type: 'textarea', section: 'Tester experience' },
    {
      name: 'testInstructions',
      label: 'Step-by-step instructions (one step per line)',
      type: 'textarea',
      section: 'Tester experience',
      help: 'Falls back to the internal testing instructions when empty.',
    },
    { name: 'internalInstructions', label: 'Internal testing instructions (legacy fallback)', type: 'textarea', section: 'Tester experience' },
    {
      name: 'inputType',
      label: 'Input control override',
      type: 'select',
      section: 'Tester experience',
      options: [
        { value: '', label: 'Automatic (from measurement type)' },
        { value: 'ratio', label: 'Ratio — numerator / denominator with auto %' },
        { value: 'checklist', label: 'Checklist — checks passed with auto %' },
        { value: 'rubric', label: 'Rubric — structured levels with descriptions' },
        { value: 'multi_select', label: 'Multiple selection' },
      ],
    },
    {
      name: 'options',
      label: 'Choice options (JSON)',
      type: 'json',
      section: 'Tester experience',
      help: 'For enum/rubric: [{"value":"excellent","label":"Excellent","description":"…"}]',
    },
    {
      name: 'calculationMethod',
      label: 'Calculation method (JSON)',
      type: 'json',
      section: 'Tester experience',
      help: '{"kind":"ratio","numeratorLabel":"Clearly explained","denominatorLabel":"Pricing elements checked"} or {"kind":"checklist","items":["Monthly price is visible","Renewal terms are visible"]}',
    },
    { name: 'sampleSize', label: 'Sample size', type: 'number', section: 'Tester experience' },
    {
      name: 'evidenceRequirements',
      label: 'Required evidence (JSON)',
      type: 'json',
      section: 'Tester experience',
      help: '[{"type":"screenshot","description":"Full pricing page"}] — types: screenshot, recording, video, document',
    },
    { name: 'exampleAnswer', label: 'Example answer', type: 'text', section: 'Tester experience', placeholder: 'e.g. 138 characters' },
    { name: 'helpText', label: 'Extra help text', type: 'textarea', section: 'Tester experience' },
    {
      name: 'publicResultTemplate',
      label: 'Public result template',
      type: 'text',
      section: 'Tester experience',
      placeholder: '{value} seconds',
      help: 'Pre-fills the public result display; {value} is replaced with the entered result.',
    },
    { name: 'allowUnableToVerify', label: 'Allow "Unable to verify"', type: 'boolean', section: 'Tester experience' },
  ],
  linkPickers: [
    { name: 'subscore', label: 'Subscore', entity: 'subscores', labelKey: 'name', required: true },
  ],
};

export const reviewsModule: ModuleConfig = {
  entity: 'reviews',
  title: 'Reviews',
  description:
    'Editorial review content. Scores, prices, and specs come from structured records — not from here.',
  columns: [
    { key: 'product', label: 'Product', render: (r) => r.product?.name ?? '—' },
    { key: 'author', label: 'Author', render: (r) => r.author?.name ?? '—' },
    { key: 'factChecker', label: 'Fact checker', render: (r) => r.factChecker?.name ?? '—' },
    { key: 'updatedAt', label: 'Updated' },
  ],
  fields: [
    { name: 'intro', label: 'Review introduction', type: 'textarea' },
    { name: 'ourTake', label: 'Our take', type: 'textarea' },
    {
      name: 'sections',
      label: 'Editorial sections (JSON array of {id, heading, body, level})',
      type: 'json',
    },
    { name: 'testingSummary', label: 'Testing summary', type: 'textarea' },
    { name: 'versionChangeSummary', label: 'Version change summary', type: 'textarea' },
    { name: 'pricingExplanation', label: 'Pricing explanation', type: 'textarea' },
  ],
  linkPickers: [
    { name: 'product', label: 'Product', entity: 'products', labelKey: 'name', required: true },
    { name: 'author', label: 'Author', entity: 'authors', labelKey: 'name' },
    { name: 'factChecker', label: 'Fact checker', entity: 'authors', labelKey: 'name' },
  ],
};

export const adminUsersModule: ModuleConfig = {
  entity: 'adminUsers',
  title: 'Users',
  description: 'Admin panel accounts. Roles control server-enforced permissions.',
  writePermission: 'users.manage',
  columns: [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    {
      key: 'role',
      label: 'Role',
      render: (r) => <Badge tone={r.role === 'owner' ? 'pink' : 'blue'}>{r.role}</Badge>,
    },
    { key: 'active', label: 'Active' },
    { key: 'createdAt', label: 'Created' },
  ],
  fields: [
    { name: 'email', label: 'Email', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: ['owner', 'admin', 'editor', 'contributor', 'tester', 'fact_checker', 'viewer'].map((v) => ({
        value: v,
        label: v,
      })),
    },
    { name: 'active', label: 'Active', type: 'boolean' },
  ],
};

export const siteSettingsModule: ModuleConfig = {
  entity: 'siteSettings',
  title: 'Site settings',
  writePermission: 'settings.manage',
  columns: [
    { key: 'key', label: 'Key' },
    { key: 'value', label: 'Value', render: (r) => JSON.stringify(r.value)?.slice(0, 80) },
    { key: 'updatedAt', label: 'Updated' },
  ],
  fields: [
    { name: 'key', label: 'Key', type: 'text', required: true },
    { name: 'value', label: 'Value (JSON)', type: 'json', required: true },
  ],
};
