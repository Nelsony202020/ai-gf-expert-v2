// Entity registry: one config per admin-managed namespace. The generic CRUD
// API (/api/admin/data/[entity]) is driven entirely by this table, so every
// entity gets the same validation, permission checks, uniqueness checks,
// audit logging, and soft-delete behavior.

import type { z } from 'zod';
import type { Permission } from './auth';
import {
  productSchema,
  reviewSchema,
  mediaSchema,
  paymentProfileSchema,
  subscriptionPlanSchema,
  creditPackageSchema,
  pricingSnapshotSchema,
  featureCostSchema,
  pricingPromotionSchema,
  characterSchema,
  characterStorySlideSchema,
  affiliateLinkSchema,
  methodologyVersionSchema,
  categorySchema,
  subscoreSchema,
  evidenceDefinitionSchema,
  testRunSchema,
  evidenceResultSchema,
  evidenceExplanationSchema,
  roundupSchema,
  roundupEntrySchema,
  homepageSlotSchema,
  redirectSchema,
  adminUserSchema,
  authorSchema,
  glossaryEntrySchema,
  siteSettingSchema,
} from '../validation/schemas';

export interface EntityConfig {
  /** InstantDB namespace */
  namespace: string;
  schema: z.ZodType;
  readPermission: Permission;
  writePermission: Permission;
  /** Attr names checked for uniqueness before create/update */
  uniqueFields?: string[];
  /** Allowed link labels (payload.links keys) -> linked namespace */
  links?: Record<string, string>;
  /** Adds deletedAt instead of hard delete */
  softDelete?: boolean;
  /** Auto-set timestamp fields that exist on the InstantDB entity */
  timestampFields?: ('createdAt' | 'updatedAt')[];
  /** Fields set only at creation */
  createDefaults?: () => Record<string, unknown>;
}

export const ENTITIES: Record<string, EntityConfig> = {
  products: {
    namespace: 'products',
    schema: productSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    uniqueFields: ['slug'],
    links: {
      author: 'authors',
      factChecker: 'authors',
      logo: 'media',
      featuredImage: 'media',
      secondaryLogo: 'media',
      featuredIcon: 'media',
    },
    softDelete: true,
    timestampFields: ['createdAt', 'updatedAt'],
    createDefaults: () => ({ dateAdded: Date.now(), status: 'draft' }),
  },
  reviews: {
    namespace: 'reviews',
    schema: reviewSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products', author: 'authors', factChecker: 'authors' },
    timestampFields: ['updatedAt'],
  },
  media: {
    namespace: 'media',
    schema: mediaSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products', evidenceResult: 'evidenceResults' },
    softDelete: true,
    timestampFields: ['createdAt'],
  },
  paymentProfiles: {
    namespace: 'paymentProfiles',
    schema: paymentProfileSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products' },
  },
  subscriptionPlans: {
    namespace: 'subscriptionPlans',
    schema: subscriptionPlanSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products', snapshot: 'pricingSnapshots' },
  },
  creditPackages: {
    namespace: 'creditPackages',
    schema: creditPackageSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products', snapshot: 'pricingSnapshots' },
  },
  pricingSnapshots: {
    namespace: 'pricingSnapshots',
    schema: pricingSnapshotSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products' },
    softDelete: true,
    timestampFields: ['createdAt', 'updatedAt'],
  },
  featureCosts: {
    namespace: 'featureCosts',
    schema: featureCostSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products', snapshot: 'pricingSnapshots' },
    softDelete: true,
    timestampFields: ['createdAt', 'updatedAt'],
  },
  pricingPromotions: {
    namespace: 'pricingPromotions',
    schema: pricingPromotionSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products', snapshot: 'pricingSnapshots' },
    softDelete: true,
    timestampFields: ['createdAt', 'updatedAt'],
  },
  characters: {
    namespace: 'characters',
    schema: characterSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { product: 'products', image: 'media', affiliateLink: 'affiliateLinks' },
    softDelete: true,
    timestampFields: ['createdAt', 'updatedAt'],
  },
  characterStorySlides: {
    namespace: 'characterStorySlides',
    schema: characterStorySlideSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: { character: 'characters', media: 'media', affiliateLink: 'affiliateLinks' },
    softDelete: true,
    timestampFields: ['createdAt', 'updatedAt'],
  },
  affiliateLinks: {
    namespace: 'affiliateLinks',
    schema: affiliateLinkSchema,
    readPermission: 'content.view',
    writePermission: 'affiliates.edit',
    uniqueFields: ['cloakedSlug'],
    links: { product: 'products' },
    timestampFields: ['createdAt'],
  },
  methodologyVersions: {
    namespace: 'methodologyVersions',
    schema: methodologyVersionSchema,
    readPermission: 'content.view',
    writePermission: 'methodology.edit',
    uniqueFields: ['version'],
    timestampFields: ['createdAt'],
  },
  categories: {
    namespace: 'categories',
    schema: categorySchema,
    readPermission: 'content.view',
    writePermission: 'methodology.edit',
    links: { methodologyVersion: 'methodologyVersions' },
  },
  subscores: {
    namespace: 'subscores',
    schema: subscoreSchema,
    readPermission: 'content.view',
    writePermission: 'methodology.edit',
    links: { category: 'categories' },
  },
  evidenceDefinitions: {
    namespace: 'evidenceDefinitions',
    schema: evidenceDefinitionSchema,
    readPermission: 'content.view',
    writePermission: 'methodology.edit',
    links: { subscore: 'subscores' },
  },
  testRuns: {
    namespace: 'testRuns',
    schema: testRunSchema,
    readPermission: 'content.view',
    writePermission: 'testing.edit',
    links: {
      product: 'products',
      methodologyVersion: 'methodologyVersions',
      previousRun: 'testRuns',
    },
    timestampFields: ['createdAt', 'updatedAt'],
    createDefaults: () => ({ isCurrentPublished: false, status: 'not_started' }),
  },
  evidenceResults: {
    namespace: 'evidenceResults',
    schema: evidenceResultSchema,
    readPermission: 'content.view',
    writePermission: 'testing.edit',
    links: {
      testRun: 'testRuns',
      evidenceDefinition: 'evidenceDefinitions',
      product: 'products',
    },
    timestampFields: ['updatedAt'],
  },
  evidenceExplanations: {
    namespace: 'evidenceExplanations',
    schema: evidenceExplanationSchema,
    readPermission: 'content.view',
    writePermission: 'testing.edit',
    links: { product: 'products' },
    timestampFields: ['updatedAt'],
  },
  roundups: {
    namespace: 'roundups',
    schema: roundupSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    uniqueFields: ['slug'],
    links: { heroImage: 'media', author: 'authors', factChecker: 'authors' },
    softDelete: true,
    timestampFields: ['createdAt', 'updatedAt'],
  },
  roundupEntries: {
    namespace: 'roundupEntries',
    schema: roundupEntrySchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    links: {
      roundup: 'roundups',
      product: 'products',
      affiliateOverride: 'affiliateLinks',
    },
    timestampFields: ['updatedAt'],
  },
  homepageSlots: {
    namespace: 'homepageSlots',
    schema: homepageSlotSchema,
    readPermission: 'content.view',
    writePermission: 'homepage.edit',
    links: { product: 'products', character: 'characters' },
    timestampFields: ['updatedAt'],
  },
  redirects: {
    namespace: 'redirects',
    schema: redirectSchema,
    readPermission: 'content.view',
    writePermission: 'redirects.edit',
    uniqueFields: ['sourcePath'],
    timestampFields: ['createdAt'],
  },
  adminUsers: {
    namespace: 'adminUsers',
    schema: adminUserSchema,
    readPermission: 'users.manage',
    writePermission: 'users.manage',
    uniqueFields: ['email'],
    timestampFields: ['createdAt'],
  },
  authors: {
    namespace: 'authors',
    schema: authorSchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    uniqueFields: ['slug'],
  },
  glossaryEntries: {
    namespace: 'glossaryEntries',
    schema: glossaryEntrySchema,
    readPermission: 'content.view',
    writePermission: 'content.edit',
    uniqueFields: ['anchor'],
    timestampFields: ['createdAt', 'updatedAt'],
    createDefaults: () => ({
      status: 'draft',
      autoTooltip: true,
      scope: 'site',
      aliases: [],
      displayAliases: [],
      tooltipDefinition: '',
      ctaLabel: '',
      fullDefinition: { type: 'doc', content: [{ type: 'paragraph' }] },
      category: 'General',
    }),
  },
  siteSettings: {
    namespace: 'siteSettings',
    schema: siteSettingSchema,
    readPermission: 'content.view',
    writePermission: 'settings.manage',
    uniqueFields: ['key'],
  },
};

export function getEntityConfig(entity: string): EntityConfig | null {
  return ENTITIES[entity] ?? null;
}
