export interface TestEvidenceSectionContent {
  id: string;
  title: string;
  whatItMeasures: string;
  whyItMatters: string;
  howWeTest: string;
  whatWeCount: string[];
  whatWeDoNotCount: string[];
  displayedResult: string;
  displayedResultExtra?: string;
  /** DB evidence slug — scoring bands pulled from methodology export when set. */
  scoringEvidenceSlug?: string;
  /** Static scoring lines when no DB slug exists or copy should override. */
  scoringLines?: string[];
  scoringNote?: string;
  /** Collapsible extra scoring detail (e.g. per-gender bands). */
  scoringDisclosure?: {
    title: string;
    memberSlugs: { slug: string; label: string }[];
  };
  edgeCases: string;
}

export interface TestSubscoreMethodologyContent {
  categoryKey: string;
  subscoreSlug: string;
  heroIntro: string[];
  whyItMatters: {
    title: string;
    paragraphs: string[];
  };
  howWeTest: {
    title: string;
    paragraphs: string[];
  };
  highLowScore: {
    title: string;
    paragraphs: string[];
  };
  scoreCalculation: {
    title: string;
    paragraphs: string[];
    exactCalculationTitle: string;
    exactCalculationBody: string;
  };
  evidenceSections: TestEvidenceSectionContent[];
  limitations: {
    title: string;
    paragraphs: string[];
  };
}

const charactersVariety: TestSubscoreMethodologyContent = {
  categoryKey: 'characters',
  subscoreSlug: 'variety',
  heroIntro: [
    'Variety measures how much real choice the platform\u2019s ready-made character library gives you.',
    'A library can have hundreds of characters and still feel repetitive when most of them use the same styles, personalities, and scenarios. We look at the total amount of characters and how different those characters actually are.',
  ],
  whyItMatters: {
    title: 'Why Variety matters',
    paragraphs: [
      'Having a big character library matters because people eventually run out of interesting characters to talk to.',
      'This is especially important when you pay for an annual plan. An app might look exciting during the first week, but it can become boring quickly when the same few personalities, looks, and roleplay ideas keep appearing.',
      'Variety is not only about the total number. A platform with 200 nearly identical characters may offer less real choice than a platform with 80 characters spread across different styles, genders, personalities, and scenarios.',
    ],
  },
  howWeTest: {
    title: 'How we test Variety',
    paragraphs: [
      'We use a paid account and open the full ready-made character library available during testing.',
      'We record the test date, the account settings used, and whether adult content or other library filters were enabled.',
      'When the platform shows a reliable total, we record it. When no total is shown, we count the visible listings where possible. If the library cannot be counted reliably because of endless loading, hidden pages, or changing results, we report the limitation.',
      'We only use categories and labels shown by the platform. We never guess a character\u2019s gender or ethnicity from an image.',
      'Duplicate characters are still included in the library count. We test duplicates separately under Character Quality, so the same problem is not judged twice.',
    ],
  },
  highLowScore: {
    title: 'What earns a high or low score',
    paragraphs: [
      'A high Variety score means the library offers plenty of characters across several clearly different styles, gender groups, ethnicities, personalities, and scenarios.',
      'A lower score means the library is small, heavily focused on one type of character, or repeats the same ideas with minor changes.',
    ],
  },
  scoreCalculation: {
    title: 'How the Variety score is calculated',
    paragraphs: [
      'Every evidence result is converted to a score from 0 to 10 using the scoring bands shown below.',
      'The evidence scores are then combined to calculate the final Variety score. Variety makes up 34% of the Characters rating.',
      'Evidence weights in the scoring system are relative inputs, not public percentage shares. We do not label them as percentages on this page.',
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each of the six evidence groups produces a 0\u201310 score from its scoring bands. Those scores are combined using the relative weights configured in our scoring database for this subscore. The combined result is the Variety subscore, which contributes 34% of the Characters rating and 10% of the overall performance score.',
  },
  evidenceSections: [
    {
      id: 'amount',
      title: 'Amount',
      whatItMeasures: 'The total number of ready-made characters available in the library.',
      whyItMatters:
        'A small library can become repetitive quickly. If an app only offers a handful of characters, you may run out of interesting people to talk to long before your subscription ends.',
      howWeTest:
        'We record the total shown by the platform. When no total is shown, we count all visible ready-made character listings where possible.',
      whatWeCount: [
        'Public ready-made characters',
        'Characters available through the paid test account',
        'Characters behind an adult-content toggle when that toggle is available to normal users',
      ],
      whatWeDoNotCount: [
        'Private characters',
        'Characters we created ourselves',
        'Profiles that cannot be opened or accessed',
        'Promotional images that are not actual character profiles',
      ],
      displayedResult: '146 ready-made characters',
      displayedResultExtra: 'Female: 82\nMale: 21\nAnime: 34\nOther groups: 9',
      scoringNote:
        'Total library size uses a dedicated total-count scoring rule separate from individual gender or style breakdown counts. Breakdown numbers are shown for context but do not replace the total-library score.',
      edgeCases:
        'Endless scrolling can make exact counting difficult. Some characters may only appear after enabling adult content. Libraries can differ by region or account type. Duplicate listings still count here but are penalized under Quality.',
    },
    {
      id: 'styles',
      title: 'Styles',
      whatItMeasures: 'How many clearly different visual styles are available.',
      whyItMatters:
        'A library can be large but still feel limited when every character has the same realistic look. Different styles give users more ways to explore the app.',
      howWeTest:
        'We review the library and count clearly different styles such as realistic, anime, 2D cartoon, 3D render, and fantasy.',
      whatWeCount: [
        'Realistic',
        'Anime',
        '2D or cartoon',
        '3D render',
        'Fantasy',
        'Other clearly different styles',
      ],
      whatWeDoNotCount: [
        'Minor lighting changes',
        'Image-quality settings',
        'Filters that do not change the actual art style',
        'Two labels that produce almost identical results',
      ],
      displayedResult: '4 styles',
      displayedResultExtra: 'Realistic, Anime, 2D Cartoon and Fantasy',
      scoringEvidenceSlug: 'styles',
      edgeCases:
        'Some libraries mix styles inside one category. We only count another style when the visual difference is clear enough that a normal user would notice it. Anime female and anime male counts may appear in breakdown data but are treated as style-and-gender combinations, not separate public evidence groups.',
    },
    {
      id: 'genders',
      title: 'Genders',
      whatItMeasures:
        'The gender groups represented in the ready-made character library and the number of characters in each group.',
      whyItMatters:
        'Different users are looking for different types of companions. A library that only supports one gender gives many users almost no useful choice.',
      howWeTest:
        'We use the gender labels and categories provided by the platform. We never assign a gender based only on a character\u2019s appearance.',
      whatWeCount: ['Female', 'Male', 'Transgender', 'Non-binary', 'Other explicitly labelled groups'],
      whatWeDoNotCount: [
        'Gender inferred from an image',
        'Unlabelled characters',
        'Duplicate labels that refer to the same group',
      ],
      displayedResult: '5 gender groups',
      displayedResultExtra:
        'Female: 82\nMale: 21\nTransgender: 7\nNon-binary: 3\nOther: 2',
      scoringDisclosure: {
        title: 'View gender scoring bands',
        memberSlugs: [
          { slug: 'female-count', label: 'Female characters' },
          { slug: 'male-count', label: 'Male characters' },
          { slug: 'transgender-count', label: 'Transgender' },
          { slug: 'non-binary-count', label: 'Non-binary' },
          { slug: 'other-count', label: 'Other' },
        ],
      },
      edgeCases:
        'Some platforms do not label gender clearly. A character may appear in more than one category. Anime female and anime male are style-and-gender combinations shown as optional breakdown data rather than separate public evidence groups.',
    },
    {
      id: 'ethnicities',
      title: 'Ethnicities',
      whatItMeasures: 'The number of ethnicity categories explicitly shown by the platform.',
      whyItMatters:
        'A wider selection makes it easier for users to find characters who match their preferences or the type of relationship they want to explore.',
      howWeTest: 'We count the ethnicity categories shown in the library, filters, or character labels.',
      whatWeCount: [
        'Explicit platform categories',
        'Clearly named ethnicity filters',
        'Categories that lead to different groups of characters',
      ],
      whatWeDoNotCount: [
        'Ethnicity guessed from appearance',
        'Country labels unless the platform clearly uses them as ethnicity categories',
        'Two labels that clearly mean the same thing',
      ],
      displayedResult: '12 ethnicity categories',
      scoringEvidenceSlug: 'ethnicities',
      edgeCases:
        'A platform may represent a wide range of characters visually without offering explicit labels. We do not guess, so this test only reflects what the platform clearly identifies.',
    },
    {
      id: 'personalities',
      title: 'Personalities',
      whatItMeasures: 'How many distinct personality types users can browse or filter by.',
      whyItMatters:
        'Different pictures do not mean much when every character talks and behaves the same way. Personality variety helps the library feel less repetitive.',
      howWeTest: 'We count personality categories and filters shown in the character library.',
      whatWeCount: [
        'Clearly different personality categories',
        'Personality filters that lead to meaningfully different characters',
        'Platform-labelled personality types',
      ],
      whatWeDoNotCount: [
        'Near-identical labels such as \u201cshy\u201d and \u201cslightly shy\u201d when they clearly mean the same thing',
        'Personality details hidden inside individual profile descriptions',
        'User-created personality prompts',
      ],
      displayedResult: '18 personality types',
      scoringEvidenceSlug: 'personalities',
      edgeCases:
        'Some platforms give every character a custom description but provide no personality categories. In that case, we only count categories that can be identified consistently across the library.',
    },
    {
      id: 'scenarios',
      title: 'Scenarios',
      whatItMeasures: 'The number of relationship, story, and roleplay types available in the library.',
      whyItMatters:
        'Scenarios give users different reasons to start a conversation. Without them, a large library can still feel like the same basic chat repeated with different profile pictures.',
      howWeTest: 'We count the relationship, story, and roleplay categories shown by the platform.',
      whatWeCount: [
        'Girlfriend or boyfriend',
        'Friend or spouse',
        'Stepsibling or roommate',
        'Fantasy roles',
        'Workplace roles',
        'Dominant or submissive scenarios',
        'Other meaningfully different relationship or story types',
      ],
      whatWeDoNotCount: [
        'Small wording changes to the same scenario',
        'Individual opening messages',
        'Scenarios only available through user-created prompts',
        'Tags that do not change the relationship or story',
      ],
      displayedResult: '14 scenarios',
      scoringEvidenceSlug: 'scenarios',
      edgeCases:
        'Platforms often use several labels for almost the same relationship. We combine near-identical labels instead of rewarding the app for repeating the same idea.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Character libraries change frequently. New characters may be added, old profiles may be removed, and categories may be reorganized after we finish testing.',
      'Some libraries use endless scrolling or personalized recommendations, which can make exact counts difficult. We report Unknown or explain the limitation when a reliable count is not possible.',
      'Access may also depend on your subscription, region, or adult-content settings. Our results reflect the paid test account and settings used on the recorded test date.',
      'We only use labels provided by the platform for gender and ethnicity. We never guess these details from a character\u2019s appearance.',
    ],
  },
};

const REGISTRY: Record<string, TestSubscoreMethodologyContent> = {
  'characters/variety': charactersVariety,
};

export function getTestSubscoreMethodology(
  categoryKey: string,
  subscoreSlug: string,
): TestSubscoreMethodologyContent | undefined {
  return REGISTRY[`${categoryKey}/${subscoreSlug}`];
}
