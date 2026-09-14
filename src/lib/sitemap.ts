import { htmlSitemapAuthors } from "@/data/authors";
import { htmlSitemapLegal } from "@/data/legal";
import { TESTING_CATEGORIES } from "@/lib/testing-categories";
import type {
  HtmlSitemapExploreColumn,
  HtmlSitemapFullPage,
  HtmlSitemapLink,
  HtmlSitemapSearchHit,
  HtmlSitemapTestCategory,
} from "@/types/sitemap";

const htmlSitemapReviews: HtmlSitemapLink[] = [
  { href: "/reviews/", label: "All Reviews" },
  { href: "/reviews/aura/", label: "Aura AI Review" },
];

const htmlSitemapRoundups: HtmlSitemapLink[] = [
  { href: "/best/", label: "Best AI Girlfriend Apps" },
];

const htmlSitemapGuides: HtmlSitemapLink[] = [
  { href: "/guides/", label: "All Guides" },
  { href: "/guides/ourdream-ai/", label: "OurDream AI Guides" },
  { href: "/guides/how-to-choose/", label: "How to Choose an AI Girlfriend App" },
  { href: "/guides/ourdream-ai-comics/", label: "OurDream AI Comics" },
  { href: "/guides/ourdream-ai-image-generator/", label: "How to Use OurDream AI Image Generator" },
  { href: "/guides/ourdream-ai-image-prompt-guide/", label: "OurDream AI Image Prompt Guide" },
  { href: "/guides/ourdream-ai-prompt-guide/", label: "OurDream AI Prompt Guide" },
];

const htmlSitemapMainMethodology: HtmlSitemapLink[] = [
  { href: "/how-we-test/", label: "How We Test AI Girlfriend Apps" },
  { href: "/how-we-test/scoring/", label: "Scoring System" },
  { href: "/how-we-test/process/", label: "Testing Process Overview" },
];

const htmlSitemapMethodologyDescriptions: Record<string, string> = {
  "/how-we-test/": "The full testing process, category by category.",
  "/how-we-test/scoring/": "How the 1–10 score and the eight categories are built.",
  "/how-we-test/process/": "What happens from signing up to the final score.",
};

const htmlSitemapSupportingMethodology: HtmlSitemapLink[] = [
  { href: "/how-we-test/tests/", label: "All Tests Directory" },
  { href: "/how-we-test/tooltips/", label: "How Score Tooltips Work" },
  { href: "/how-we-test/market-data/", label: "Market Data Methodology" },
  { href: "/editorial-guidelines/", label: "Editorial Guidelines" },
];

const htmlSitemapResources: HtmlSitemapLink[] = [
  { href: "/how-we-test/", label: "How We Test" },
  { href: "/how-we-test/tooltips/", label: "How Score Tooltips Work" },
  { href: "/apps/", label: "App Directory" },
  { href: "/glossary/", label: "AI Girlfriend Glossary" },
];

const htmlSitemapCompany: HtmlSitemapLink[] = [
  { href: "/about/", label: "About Us" },
  { href: "/contact/", label: "Contact Us" },
];

function withHeading(heading: string, links: HtmlSitemapLink[]): HtmlSitemapExploreColumn {
  return { heading, count: links.length, links };
}

function buildTestCategories(): HtmlSitemapTestCategory[] {
  return TESTING_CATEGORIES.map((category) => {
    const subcategories = category.subcategories.map((sub) => ({
      href: sub.href,
      slug: sub.slug,
      label: sub.label,
      testCount: sub.tests.length,
      tests: sub.tests.map((test) => ({
        href: test.href,
        label: test.label,
      })),
    }));

    return {
      slug: category.slug,
      href: category.href,
      label: category.label,
      icon: category.icon,
      testCount: subcategories.reduce((sum, sub) => sum + sub.testCount, 0),
      subcategories,
    };
  });
}

function extraSearchHits(): HtmlSitemapSearchHit[] {
  return [
    { href: "/sitemap/", title: "Site Index", kind: "PAGE", location: "PAGE" },
    { href: "/apps/", title: "App Directory", kind: "PAGE", location: "PAGE" },
    { href: "/glossary/", title: "AI Girlfriend Glossary", kind: "PAGE", location: "PAGE" },
    { href: "/about/", title: "About Us", kind: "PAGE", location: "PAGE" },
    { href: "/contact/", title: "Contact Us", kind: "PAGE", location: "PAGE" },
    { href: "/editorial-guidelines/", title: "Editorial Guidelines", kind: "PAGE", location: "PAGE" },
    { href: "/how-we-test/", title: "How We Test AI Girlfriend Apps", kind: "PAGE", location: "PAGE" },
    { href: "/how-we-test/scoring/", title: "Scoring System", kind: "PAGE", location: "PAGE" },
    { href: "/how-we-test/process/", title: "Testing Process Overview", kind: "PAGE", location: "PAGE" },
    { href: "/how-we-test/tests/", title: "All Tests Directory", kind: "PAGE", location: "PAGE" },
    { href: "/how-we-test/tooltips/", title: "How Score Tooltips Work", kind: "PAGE", location: "PAGE" },
    { href: "/how-we-test/market-data/", title: "Market Data Methodology", kind: "PAGE", location: "PAGE" },
  ];
}

export function getHtmlSitemapPage(): HtmlSitemapFullPage {
  const testCategories = buildTestCategories();
  const scoredTestsCount = testCategories.reduce((sum, category) => sum + category.testCount, 0);
  const testingSubcategoriesCount = testCategories.reduce(
    (sum, category) => sum + category.subcategories.length,
    0,
  );
  const extra = extraSearchHits();

  return {
    reviewsCount: htmlSitemapReviews.length,
    rankingsCount: htmlSitemapRoundups.length,
    guidesCount: htmlSitemapGuides.length,
    testsCount: htmlSitemapMainMethodology.length + htmlSitemapSupportingMethodology.length + testCategories.length,
    reviews: withHeading("Reviews", htmlSitemapReviews),
    roundups: withHeading("Roundups", htmlSitemapRoundups),
    guides: withHeading("Guides", htmlSitemapGuides),
    authors: withHeading("Authors", htmlSitemapAuthors),
    testingPagesCount:
      htmlSitemapMainMethodology.length + htmlSitemapSupportingMethodology.length + testCategories.length,
    testingCategoriesCount: testCategories.length,
    testingSubcategoriesCount,
    scoredTestsCount,
    mainMethodology: htmlSitemapMainMethodology.map((item) => ({
      ...item,
      description: htmlSitemapMethodologyDescriptions[item.href],
    })),
    methodology: htmlSitemapMainMethodology.map((item) => ({
      ...item,
      description: htmlSitemapMethodologyDescriptions[item.href],
    })),
    testCategories,
    supportingMethodology: htmlSitemapSupportingMethodology,
    supporting: htmlSitemapSupportingMethodology,
    resources: htmlSitemapResources,
    resourcesCount: htmlSitemapResources.length,
    company: { count: htmlSitemapCompany.length, links: htmlSitemapCompany },
    legal: htmlSitemapLegal,
    resourcesLegalCount: htmlSitemapResources.length + htmlSitemapCompany.length + htmlSitemapLegal.length,
    extra,
  };
}

export function buildSitemapPageSearchIndex(page: HtmlSitemapFullPage): HtmlSitemapSearchHit[] {
  const hits: HtmlSitemapSearchHit[] = [];
  const seen = new Set<string>();

  const add = (href: string, title: string, location: string) => {
    const key = `${href}|${title}|${location}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({ href, title, kind: location, location });
  };

  for (const column of [page.reviews, page.roundups, page.guides, page.authors]) {
    for (const link of column.links) {
      add(link.href, link.label, column.heading.toUpperCase());
    }
  }

  for (const item of page.mainMethodology) {
    add(item.href, item.label, "PAGE");
  }

  for (const item of page.supportingMethodology) {
    add(item.href, item.label, "PAGE");
  }

  for (const category of page.testCategories) {
    add(category.href, category.label, "TEST CATEGORY");
    for (const sub of category.subcategories) {
      add(sub.href, sub.label, `TEST · ${category.label.toUpperCase()}`);
      for (const test of sub.tests) {
        add(
          test.href,
          test.label,
          `TEST · ${category.label.toUpperCase()} · ${sub.label.toUpperCase()}`,
        );
      }
    }
  }

  for (const item of page.resources) add(item.href, item.label, "RESOURCES");
  for (const item of page.company.links) add(item.href, item.label, "COMPANY");
  for (const item of page.legal) add(item.href, item.label, "LEGAL");
  for (const item of page.extra ?? []) add(item.href, item.title, item.location);

  return hits;
}

export function filterSitemapSearchHits(query: string, hits: HtmlSitemapSearchHit[]): HtmlSitemapSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return hits.filter((hit) => hit.title.toLowerCase().includes(q) || hit.location.toLowerCase().includes(q));
}
