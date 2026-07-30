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
  /** Short line under the Scoring heading, before the bands table. */
  scoringIntro?: string;
  /** Override auto-generated scoring footnote. */
  scoringFootnote?: string;
  /** Example score for highlighting the matching row when scoring uses static lines. */
  exampleScore?: number;
  /** Collapsible extra scoring detail (e.g. per-gender bands). */
  scoringDisclosure?: {
    title: string;
    memberSlugs: { slug: string; label: string }[];
  };
  edgeCases: string;
  /** When false, compact layout skips the per-test Why it matters block. */
  showWhyItMatters?: boolean;
  /** Reference-only evidence (e.g. Other Extras) — listed in review, not scored. */
  referenceOnly?: boolean;
}

export interface TestEvidenceGroupContent {
  intro: string[];
  whyItMatters: string;
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
    /** Public evidence-group weights shown as progress bars (should sum to 100). */
    evidenceWeights: { label: string; weight: number }[];
    exactCalculationTitle: string;
    exactCalculationBody: string;
    calculationNotes?: {
      title: string;
      items: { title: string; body: string }[];
    };
  };
  evidenceSections: TestEvidenceSectionContent[];
  limitations: {
    title: string;
    paragraphs: string[];
  };
  /** Optional copy explaining evidence groups vs scored tests on the hero. */
  evidenceHierarchy?: {
    explanation: string;
    /** One-line intro below the Evidence groups heading on the methodology page. */
    sectionIntro?: string;
  };
  /** Group-level copy keyed by public evidence group slug. */
  evidenceGroupContent?: Record<string, TestEvidenceGroupContent>;
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
      'Every scored test is converted to a score from 0 to 10.',
      'Not all evidence groups affect the Variety score equally. The weighted scores are combined to get the final Variety score.',
    ],
    evidenceWeights: [
      { label: 'Amount', weight: 30 },
      { label: 'Styles', weight: 15 },
      { label: 'Genders', weight: 20 },
      { label: 'Ethnicities', weight: 10 },
      { label: 'Personalities', weight: 15 },
      { label: 'Scenarios', weight: 10 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each scored test gets a score from 0 to 10. Some scored tests count more than others. We apply the weights below and combine all the results to calculate the final Variety score.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a scored test does not apply, we remove it and spread its weight equally across the remaining scored tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the scored test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Variety is organized into 6 evidence groups. Some groups contain more than one scored test, which is why Variety has 11 scored tests in total.',
    sectionIntro: 'Variety has 6 evidence groups made up of 11 scored tests.',
  },
  evidenceGroupContent: {
    amount: {
      intro: [
        'Amount measures how many ready-made characters are available across the main character types.',
        'We score Female Characters, Male Characters, Anime Female Characters, and Anime Male Characters separately because the size of each group can be very different.',
      ],
      whyItMatters:
        'A small library can become repetitive quickly. Looking at each main character type separately also prevents one very large group from hiding the fact that other users have almost no choice.',
    },
  },
  evidenceSections: [
    {
      id: 'female-count',
      title: 'Female characters',
      whatItMeasures: 'Counts the ready-made female characters available in the library.',
      whyItMatters:
        'Female characters are the most common starting point for many users. A library with very few female options can feel limited even when the total count looks large.',
      howWeTest:
        'We count every character clearly labelled as female by the platform. We never guess a character\u2019s gender from their appearance.',
      whatWeCount: [
        'Female characters shown in the ready-made library',
        'Female characters available through the paid test account',
      ],
      whatWeDoNotCount: [
        'Gender guessed from an image',
        'Private characters',
        'Characters created by users',
        'Duplicate listings that point to the same profile',
      ],
      displayedResult: '82 female characters',
      scoringEvidenceSlug: 'female-count',
      showWhyItMatters: false,
      edgeCases:
        'Anime female characters are included in the total female count but are also tested separately to show how large the anime library is.',
    },
    {
      id: 'male-count',
      title: 'Male characters',
      whatItMeasures: 'Counts the ready-made male characters available in the library.',
      whyItMatters:
        'Users looking for male companions need enough choice to avoid repeating the same few profiles. A library focused almost entirely on female characters offers little value to them.',
      howWeTest:
        'We count every character clearly labelled as male by the platform. We never guess a character\u2019s gender from their appearance.',
      whatWeCount: [
        'Male characters shown in the ready-made library',
        'Male characters available through the paid test account',
      ],
      whatWeDoNotCount: [
        'Gender guessed from an image',
        'Private characters',
        'Characters created by users',
        'Unlabelled characters',
      ],
      displayedResult: '21 male characters',
      scoringEvidenceSlug: 'male-count',
      showWhyItMatters: false,
      edgeCases:
        'Male character libraries are often smaller than female libraries on these platforms. We score male availability on its own scale rather than comparing it directly to female totals.',
    },
    {
      id: 'anime-female-count',
      title: 'Anime female characters',
      whatItMeasures: 'Counts the ready-made anime-style female characters available in the library.',
      whyItMatters:
        'Anime is one of the most popular visual styles on companion platforms. Users who prefer anime art need enough distinct characters to explore, not just one or two token profiles.',
      howWeTest:
        'We count female characters that clearly use anime-style art, using platform labels and style categories where available.',
      whatWeCount: [
        'Anime-style female characters',
        'Characters listed under anime or 2D art categories when gender is also labelled',
      ],
      whatWeDoNotCount: [
        'Realistic characters with only minor cartoon styling',
        'Promotional images that are not actual character profiles',
        'Gender guessed from an image',
      ],
      displayedResult: '28 anime female characters',
      scoringEvidenceSlug: 'anime-female-count',
      showWhyItMatters: false,
      edgeCases:
        'Platforms sometimes mix realistic and anime characters in one list without clear style labels. When style cannot be confirmed reliably, we explain the limitation rather than guessing.',
    },
    {
      id: 'anime-male-count',
      title: 'Anime male characters',
      whatItMeasures: 'Counts the ready-made anime-style male characters available in the library.',
      whyItMatters:
        'Anime-style male characters are often even scarcer than anime female characters. This test shows whether the library supports that preference at all.',
      howWeTest:
        'We count male characters that clearly use anime-style art, using the same style rules as anime female characters.',
      whatWeCount: [
        'Anime-style male characters',
        'Characters listed under anime or 2D art categories when gender is also labelled',
      ],
      whatWeDoNotCount: [
        'Realistic male characters',
        'Style inferred without a clear platform label',
        'Gender guessed from an image',
      ],
      displayedResult: '6 anime male characters',
      scoringEvidenceSlug: 'anime-male-count',
      showWhyItMatters: false,
      edgeCases:
        'Some libraries offer anime art mainly for female characters. When no anime male characters exist, the score reflects that gap directly.',
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
        'Some libraries mix styles inside one category. We only count another style when the visual difference is clear enough that a normal user would notice it.',
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
      id: 'transgender-count',
      title: 'Transgender characters',
      whatItMeasures: 'The number of ready-made transgender characters in the library.',
      whyItMatters:
        'Transgender representation matters for users who specifically want that type of companion. It also signals whether the platform treats gender diversity as a real browsing option.',
      howWeTest:
        'We count characters explicitly labelled as transgender by the platform. We never infer this label from appearance.',
      whatWeCount: ['Transgender characters with explicit platform labels'],
      whatWeDoNotCount: [
        'Gender inferred from an image',
        'Characters only described indirectly in profile text',
        'Duplicate listings',
      ],
      displayedResult: '7 transgender characters',
      scoringEvidenceSlug: 'transgender-count',
      edgeCases:
        'Some platforms do not offer a transgender category at all. When the label is missing, the test may be marked Not Applicable rather than scored as zero availability.',
    },
    {
      id: 'non-binary-count',
      title: 'Non-binary characters',
      whatItMeasures: 'The number of ready-made non-binary characters in the library.',
      whyItMatters:
        'Non-binary characters give users another meaningful choice beyond binary gender categories. Very small counts can still be useful when the platform clearly supports the label.',
      howWeTest:
        'We count characters explicitly labelled as non-binary by the platform.',
      whatWeCount: ['Non-binary characters with explicit platform labels'],
      whatWeDoNotCount: [
        'Gender inferred from an image',
        'Unlabelled characters',
        'Duplicate listings',
      ],
      displayedResult: '3 non-binary characters',
      scoringEvidenceSlug: 'non-binary-count',
      edgeCases:
        'Non-binary support is still uncommon on many platforms. When no label exists, the result may be Not Applicable rather than Unknown.',
    },
    {
      id: 'other-count',
      title: 'Other gender groups',
      whatItMeasures:
        'The number of ready-made characters in other explicitly labelled gender groups not covered elsewhere.',
      whyItMatters:
        'Some platforms use additional gender labels beyond female, male, transgender, and non-binary. This test captures those options when they are clearly offered.',
      howWeTest:
        'We count characters in any additional gender groups explicitly named by the platform.',
      whatWeCount: ['Other explicitly labelled gender groups shown by the platform'],
      whatWeDoNotCount: [
        'Groups already counted under female, male, transgender, or non-binary',
        'Gender inferred from appearance',
        'Vague or duplicate labels',
      ],
      displayedResult: '2 characters in other gender groups',
      scoringEvidenceSlug: 'other-count',
      edgeCases:
        'When a platform does not use any additional gender labels, this test is usually marked Not Applicable.',
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

const charactersDiscovery: TestSubscoreMethodologyContent = {
  categoryKey: 'characters',
  subscoreSlug: 'discovery',
  heroIntro: [
    'Discovery measures how easy it is to find a character you actually want to talk to.',
    'A big character library is not very useful when you need to scroll through hundreds of profiles to find someone you like. We test the filters, categories, search tools, and general browsing experience.',
  ],
  whyItMatters: {
    title: 'Why Discovery matters',
    paragraphs: [
      'A huge character library can quickly become annoying when there is no easy way to explore it.',
      'You might know that you want an anime character, a specific personality, or a certain type of roleplay. Without useful filters, categories, or search, you may need to open dozens of profiles before finding someone suitable.',
      'This becomes an even bigger problem when the app keeps adding new characters. More choice should make the app better, not make it harder to find what you want.',
      'Good Discovery tools save time and help you find characters you might otherwise miss.',
    ],
  },
  howWeTest: {
    title: 'How we test Discovery',
    paragraphs: [
      'We use a paid account and open the full ready-made character library available during testing.',
      'First, we count every useful filter and category. Sorting options such as Newest and Most Popular are not counted as filters.',
      'We then test the search tool using three existing character names and three general keywords.',
      'Finally, we complete the 10 fixed browsing tasks from our testing guide. We record which tasks are easy, which take too many steps, and which cannot be completed.',
      'We use the normal tools available to users. We do not use admin access, direct profile links, or outside search engines.',
    ],
  },
  highLowScore: {
    title: 'What good Discovery looks like',
    paragraphs: [
      'A high Discovery score means the library is easy to explore, the filters and categories are useful, and search works for both character names and general keywords.',
      'A lower score means you need to scroll through a large number of profiles, the search tool barely works, or the available filters do not help narrow the results.',
    ],
  },
  scoreCalculation: {
    title: 'How the Discovery score is calculated',
    paragraphs: [
      'Every scored test gets a score from 0 to 10.',
      'All four tests count equally. We combine their scores to calculate the final Discovery score.',
    ],
    evidenceWeights: [
      { label: 'Filters', weight: 25 },
      { label: 'Categories', weight: 25 },
      { label: 'Search', weight: 25 },
      { label: 'Browsing', weight: 25 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by 25% and then add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Discovery is organized into 4 evidence groups. Each group contains one scored test: Filters, Categories, Search, and Browsing. The four tests count equally toward the final Discovery score.',
    sectionIntro: 'Discovery has 4 evidence groups made up of 4 scored tests.',
  },
  evidenceGroupContent: {
    filters: {
      intro: ['Filters measure how many useful controls help you narrow the character library.'],
      whyItMatters:
        'A good set of filters lets you quickly remove characters that do not match what you are looking for.',
    },
    categories: {
      intro: ['Categories measure how many useful groups help users browse different types of characters.'],
      whyItMatters:
        'Categories are different from filters. A category normally opens a ready-made group, while a filter lets you narrow the current results.',
    },
    search: {
      intro: ['Search measures whether you can find characters using names and general keywords.'],
      whyItMatters:
        'A search box is not very useful when it only works with the exact name of a character you already know.',
    },
    browsing: {
      intro: ['Browsing measures how easy the character library feels to use as a whole.'],
      whyItMatters:
        'Filters, categories, and search may all exist, but the library can still feel confusing when buttons are hard to find, results reset unexpectedly, or profiles take too many steps to open.',
    },
  },
  evidenceSections: [
    {
      id: 'filters',
      title: 'Filters',
      whatItMeasures: 'The number of useful filters available in the character library.',
      whyItMatters:
        'Useful filters help you remove characters that do not match your preferences without opening dozens of profiles.',
      howWeTest:
        'We open the character library and count every filter that meaningfully narrows the available characters.',
      whatWeCount: [
        'Gender filters',
        'Visual-style filters',
        'Personality filters',
        'Relationship or scenario filters',
        'Ethnicity filters',
        'Other controls that narrow the character results',
      ],
      whatWeDoNotCount: [
        'Sorting by newest or most popular',
        'Buttons that only change the order of the results',
        'Two filters that do the same thing',
        'Filters that do not actually change the results',
      ],
      displayedResult: '7 useful filters',
      scoringEvidenceSlug: 'filters',
      scoringIntro: 'More useful filters means a higher score. We use the ranges below.',
      showWhyItMatters: false,
      edgeCases:
        'Some apps call sorting options \u201cfilters.\u201d We only count controls that remove or narrow character results.',
    },
    {
      id: 'categories',
      title: 'Categories',
      whatItMeasures: 'The number of useful browsing categories available in the character library.',
      whyItMatters:
        'Useful categories help you jump straight into a type of character instead of browsing the whole library at once.',
      howWeTest: 'We count categories that lead to meaningfully different groups of characters.',
      whatWeCount: [
        'Anime characters',
        'Realistic characters',
        'Popular personality groups',
        'Relationship or roleplay groups',
        'Fantasy or themed groups',
        'Other categories with clearly different characters',
      ],
      whatWeDoNotCount: [
        'Newest or most-popular sorting',
        'Promotional banners',
        'Two categories that show almost the same results',
        'Empty categories',
        'Categories that do not lead to usable profiles',
      ],
      displayedResult: '8 useful categories',
      scoringEvidenceSlug: 'categories',
      scoringIntro: 'More useful categories means a higher score. We use the ranges below.',
      showWhyItMatters: false,
      edgeCases:
        'The same character may appear in more than one category. We count the useful categories, not the number of unique characters inside them.',
    },
    {
      id: 'search',
      title: 'Search',
      whatItMeasures: 'Whether the character search works for existing names and general keywords.',
      whyItMatters:
        'Search should help you find both a character you already know and a type of character you want to discover.',
      howWeTest:
        'We search for three existing character names and three general keywords. The keywords describe a character type, personality, style, or scenario rather than an exact profile name.',
      whatWeCount: [
        'A search tool inside the character library',
        'Search results for existing character names',
        'Search results for general keywords',
        'Partial-name search when it returns the correct character',
      ],
      whatWeDoNotCount: [
        'The browser\u2019s page-search tool',
        'A site-wide search that does not search the character library',
        'Filters without a search box',
        'Search suggestions that cannot be opened',
      ],
      displayedResult: 'Yes \u2014 all 3 names and 3 keywords worked',
      scoringLines: [
        'Yes \u2014 all six searches worked = 10/10',
        'Limited \u2014 some searches failed or only names worked = 5/10',
        'No useful character search = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, all six searches worked, so Search scores 10/10.',
      showWhyItMatters: false,
      edgeCases: 'When search finds character names but fails on keywords, we mark it as Limited.',
    },
    {
      id: 'browsing',
      title: 'Browsing',
      whatItMeasures: 'How easy it is to find and open suitable characters during normal use.',
      whyItMatters:
        'Even strong filters and search can feel frustrating when the library is hard to navigate in everyday use.',
      howWeTest:
        'We complete the 10 fixed browsing tasks in our testing guide. We record whether each task works smoothly, takes unnecessary extra steps, feels confusing, or cannot be completed.',
      whatWeCount: [
        'Browsing through the normal character library',
        'Using available filters, categories, and search',
        'Opening profiles and returning to the results',
        'Changing or clearing browsing choices',
      ],
      whatWeDoNotCount: [
        'Direct links to a character profile',
        'Admin tools',
        'Browser search',
        'Outside search engines',
        'Features unavailable to normal users',
      ],
      displayedResult: 'Easy overall \u2014 most tasks completed smoothly',
      scoringIntro: 'Browsing receives a score from 0 to 10 based on the complete test.',
      scoringNote:
        'More completed tasks and fewer confusing moments lead to a higher score. We also save notes explaining what worked well and what caused problems.\n\nIn this example, Browsing scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Browsing is scored from the full 10-task test. It does not use one simple count table because several different usability problems can affect the result.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Character libraries change regularly. Platforms may add new filters, remove categories, or update their search tool after we finish testing.',
      'Discovery tools can also differ between devices. A filter may be available on desktop but missing from the mobile app.',
      'Some platforms personalize their library based on your previous activity. This means two users may see different characters or categories.',
      'Our results reflect the paid account, device, and settings used on the recorded test date.',
    ],
  },
};

const charactersQuality: TestSubscoreMethodologyContent = {
  categoryKey: 'characters',
  subscoreSlug: 'quality',
  heroIntro: [
    'Quality measures how original, complete, and visually polished the ready-made character library feels.',
    'A platform can have hundreds of characters and still feel low quality. Some apps fill their library with copied profiles, weak descriptions, and broken images just to make the total number look more impressive.',
    'We review one fixed sample of characters and use the same sample for every Quality test.',
  ],
  whyItMatters: {
    title: 'Why Quality matters',
    paragraphs: [
      'A large character library does not automatically mean a good character library.',
      'Some platforms add new characters as quickly as possible to make their library look bigger. You often end up with copied personalities, nearly identical images, empty profiles, and the same basic scenario repeated with a different name.',
      'That can make the app feel boring even when it claims to offer hundreds of characters.',
      'Strong character quality means the profiles feel different, give you enough information before starting a chat, and use images that look clean and well made.',
      'That is why we check the library itself instead of only counting how many characters are available.',
    ],
  },
  howWeTest: {
    title: 'How we test Quality',
    paragraphs: [
      'We use a paid account and choose one fixed sample from the ready-made character library.',
      'We use the same characters for all four Quality tests. This prevents us from using the strongest profiles for one test and weaker profiles for another.',
      'First, we check the sample for duplicate or near-duplicate profiles.',
      'We then check whether the characters have different appearances, personalities, and scenarios.',
      'Next, we review how complete each profile is.',
      'Finally, we review the main profile image for clarity, visual problems, and overall presentation.',
      'Duplicates still count toward the library totals under Variety. Quality is where we judge whether those listings are actually different and well made.',
    ],
  },
  highLowScore: {
    title: 'What good Quality looks like',
    paragraphs: [
      'A high Quality score means most characters feel original, their profiles contain useful information, and their main images look polished.',
      'A lower score means the library contains lots of copies, unfinished profiles, or poor-quality images.',
    ],
  },
  scoreCalculation: {
    title: 'How the Quality score is calculated',
    paragraphs: [
      'Every scored test gets a score from 0 to 10.',
      'All four tests count equally. We combine their scores to calculate the final Quality score.',
    ],
    evidenceWeights: [
      { label: 'Duplicates', weight: 25 },
      { label: 'Originality', weight: 25 },
      { label: 'Profile Quality', weight: 25 },
      { label: 'Visual Quality', weight: 25 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by 25% and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Quality is organized into 4 evidence groups. Each group contains one scored test: Duplicates, Originality, Profile Quality, and Visual Quality. All four tests count equally toward the final Quality score.',
    sectionIntro: 'Quality has 4 evidence groups made up of 4 scored tests.',
  },
  evidenceGroupContent: {
    duplicates: {
      intro: [
        'Duplicates measures how many characters in the sample appear to be copies or near-copies of another profile.',
      ],
      whyItMatters:
        'A large number of duplicates can make a big library feel much smaller than it looks.',
    },
    originality: {
      intro: ['Originality measures how different the characters feel from one another.'],
      whyItMatters:
        'Changing the name or hair color is not enough when the personality and scenario are still almost identical.',
    },
    'profile-quality': {
      intro: [
        'Profile Quality measures whether character profiles give you enough useful information before you start chatting.',
      ],
      whyItMatters:
        'A good profile should explain who the character is and what kind of conversation or relationship to expect.',
    },
    'visual-quality': {
      intro: ['Visual Quality measures how clear and well made the main character images look.'],
      whyItMatters:
        'A profile image is often the first thing you see. Broken faces, damaged bodies, or blurry images can make the whole library feel rushed.',
    },
  },
  evidenceSections: [
    {
      id: 'duplicates',
      title: 'Duplicates',
      whatItMeasures: 'The percentage of reviewed profiles that repeat another character.',
      whyItMatters:
        'Duplicate profiles make a large library feel smaller and less worth exploring.',
      howWeTest:
        'We review every character in the fixed sample and compare it with the other profiles. We count a profile as a duplicate when most of these parts are nearly the same: main image, name, description, personality, and scenario.',
      whatWeCount: [
        'The same profile image with only a small change',
        'Nearly identical names and descriptions',
        'The same personality and scenario reused across profiles',
        'Profiles that clearly look like copied versions of one another',
      ],
      whatWeDoNotCount: [
        'Characters that share one trait but are otherwise different',
        'Characters from the same theme with different personalities',
        'Small similarities that are common across the whole app',
        'Profiles that use the same visual style but represent different characters',
      ],
      displayedResult: '3 duplicates in a sample of 50 profiles',
      displayedResultExtra: 'Duplicate rate: 6%',
      scoringIntro: 'Fewer duplicates means a higher score.',
      scoringLines: [
        '0% = 10/10',
        '20% = 8/10',
        '40% = 6/10',
        '60% = 4/10',
        '80% = 2/10',
        '100% = 0/10',
      ],
      scoringNote: 'The exact score moves with the duplicate rate.',
      scoringFootnote: 'A duplicate rate of 6% scores 9.4/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test looks for clear copies or near-copies. Two characters are not marked as duplicates just because they share one feature.',
    },
    {
      id: 'originality',
      title: 'Originality',
      whatItMeasures: 'The percentage of reviewed characters that feel original.',
      whyItMatters:
        'A library full of near-identical personalities and scenarios feels repetitive even when the photos look different.',
      howWeTest:
        'We review the same fixed sample. Each character receives one point for a distinct appearance, a distinct personality, and a distinct scenario. A character passes when it gets at least 2 out of 3 points.',
      whatWeCount: [
        'A look that is clearly different from the other profiles',
        'A personality that changes how the character behaves',
        'A scenario that gives the conversation a different starting point',
      ],
      whatWeDoNotCount: [
        'A name change on an otherwise copied profile',
        'A small color change to the same image',
        'Rewording the same personality description',
        'Reusing the same relationship or roleplay idea with minor changes',
      ],
      displayedResult: '41 of 50 characters passed',
      displayedResultExtra: 'Originality rate: 82%',
      scoringIntro: 'A higher originality rate means a higher score.',
      scoringLines: [
        '20% = 2/10',
        '40% = 4/10',
        '60% = 6/10',
        '80% = 8/10',
        '100% = 10/10',
      ],
      scoringNote: 'The exact score matches the percentage.',
      scoringFootnote: 'A result of 82% scores 8.2/10.',
      showWhyItMatters: false,
      edgeCases:
        'A character does not need to be completely unique in every way. It passes when at least two of the three areas feel different.',
    },
    {
      id: 'profile-quality',
      title: 'Profile Quality',
      whatItMeasures: 'How complete and useful the character profiles are.',
      whyItMatters:
        'Useful profile information helps you choose a character before you spend time starting a chat.',
      howWeTest:
        'We review the same fixed sample. Each profile receives one point for including a name, a clear description, personality information, relationship or scenario information, and example dialogue or an opening message. Each profile can receive up to five points.',
      whatWeCount: [
        'Information clearly shown on the profile',
        'A description that explains who the character is',
        'Personality details that help set expectations',
        'A clear relationship or scenario',
        'An opening message or example of how the character talks',
      ],
      whatWeDoNotCount: [
        'Information that only appears after starting the chat',
        'Empty or placeholder text',
        'Repeated text copied across several profiles',
        'Vague descriptions that do not explain the character',
      ],
      displayedResult: '210 of 250 profile checks passed',
      displayedResultExtra: 'Profile Quality: 84%',
      scoringIntro: 'More completed profile checks means a higher score.',
      scoringLines: [
        '20% = 2/10',
        '40% = 4/10',
        '60% = 6/10',
        '80% = 8/10',
        '100% = 10/10',
      ],
      scoringNote: 'The exact score matches the percentage.',
      scoringFootnote: 'A result of 84% scores 8.4/10.',
      showWhyItMatters: false,
      edgeCases:
        'A profile can still receive some points when it is missing information. The final result is based on all profile checks across the full sample.',
    },
    {
      id: 'visual-quality',
      title: 'Visual Quality',
      whatItMeasures: 'The quality and consistency of the main profile images.',
      whyItMatters:
        'Poor profile images make even a large library feel rushed or low effort.',
      howWeTest:
        'We review the main image of every character in the same fixed sample. Each image receives one point for a clear face, a clear body, no major anatomy errors, no obvious image damage, and good overall presentation. Each image can receive up to five points.',
      whatWeCount: [
        'The face is clear and easy to see',
        'The body looks complete and believable',
        'Hands, limbs, and clothing are not badly broken',
        'The image is not blurry, corrupted, or heavily damaged',
        'The image looks suitable for a finished character profile',
      ],
      whatWeDoNotCount: [
        'Small style choices that are clearly intentional',
        'Minor background problems that do not affect the character',
        'Personal preference for realistic or anime art',
        'Image quality inside the chat or image generator',
      ],
      displayedResult: '225 of 250 image checks passed',
      displayedResultExtra: 'Visual Quality: 90%',
      scoringIntro: 'More visual checks passed means a higher score.',
      scoringLines: [
        '20% = 2/10',
        '40% = 4/10',
        '60% = 6/10',
        '80% = 8/10',
        '100% = 10/10',
      ],
      scoringNote: 'The exact score matches the percentage.',
      scoringFootnote: 'A result of 90% scores 9.0/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test only reviews the main profile images in the character library. Generated images are tested separately under Images.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Quality is based on a fixed sample, not every character in the library. The sample helps us spot clear patterns, but it cannot guarantee that every profile has the same level of quality.',
      'Character libraries also change regularly. New profiles may be added and weak profiles may be improved or removed after testing.',
      'Originality and visual quality can involve some judgement. We reduce this by using the same checklist for every platform.',
      'Public community characters may have very different quality from characters made by the platform. We record which type of library was included in the sample.',
    ],
  },
};

const customizationAppearance: TestSubscoreMethodologyContent = {
  categoryKey: 'customization',
  subscoreSlug: 'appearance',
  heroIntro: [
    'Appearance measures how much control you get over how your custom AI girlfriend looks.',
    'Some apps give you dozens of choices for hair, body type, clothing, and other details. Others give you only a few basic presets, which makes it much harder to create the character you actually have in mind.',
    'The first eight tests cover appearance. Personality Presets covers the basic personality choice shown during character creation. More detailed personality controls are tested separately under the Personality subscore.',
  ],
  whyItMatters: {
    title: 'Why Appearance matters',
    paragraphs: [
      'Creating your own AI girlfriend is supposed to give you more control than choosing someone from the ready-made library.',
      'That does not help much when the creator only gives you three body types, a few hairstyles, and almost no clothing choices.',
      'The difference between apps can be huge. One platform may let you choose from dozens of hairstyles, outfits, colors, and body options. Another may only give you a handful of basic presets.',
      'More useful choices make it easier to create someone who matches what you actually like. They also help the app feel less repetitive because you are not forced to create the same basic character every time.',
      'This score only looks at the options the creator gives you. Whether the finished character actually looks good is tested separately under Images.',
    ],
  },
  howWeTest: {
    title: 'How we test Appearance',
    paragraphs: [
      'We use a paid account and open the full character creator.',
      'We go through the creator once and count every selectable option for age, ethnicity, eye color, body type, breast size, hair style, hair color, and outfits.',
      'We also count the basic personality presets offered during creation because they are part of the current Appearance score.',
      'We only count options that normal users can select. We do not count options that are shown in marketing images but are not available inside the creator.',
      'When the app uses a slider or custom color picker instead of normal presets, we record how the control works and explain any limit that affects the count.',
    ],
  },
  highLowScore: {
    title: 'What good Appearance looks like',
    paragraphs: [
      'A high Appearance score means the character creator gives you plenty of useful choices across the face, hair, body, clothing, and basic character setup.',
      'A lower score means most settings only have a few presets, important options are missing, or many characters end up looking very similar.',
    ],
  },
  scoreCalculation: {
    title: 'How the Appearance score is calculated',
    paragraphs: [
      'Every scored test gets a score from 0 to 10.',
      'Some tests count slightly more than others. We apply each test\u2019s weight and combine the results to calculate the final Appearance score.',
    ],
    evidenceWeights: [
      { label: 'Age', weight: 13.9 },
      { label: 'Ethnicity', weight: 13.0 },
      { label: 'Eye Color', weight: 11.1 },
      { label: 'Body Type', weight: 11.1 },
      { label: 'Breast Size', weight: 10.2 },
      { label: 'Hair Style', weight: 10.2 },
      { label: 'Hair Color', weight: 10.2 },
      { label: 'Outfits', weight: 10.2 },
      { label: 'Personality Presets', weight: 10.0 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply that score by how much the test counts, then add all the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Appearance is organized into 9 evidence groups. Each group contains one scored test: Age, Ethnicity, Eye Color, Body Type, Breast Size, Hair Style, Hair Color, Outfits, and Personality Presets.',
    sectionIntro: 'Appearance has 9 evidence groups made up of 9 scored tests.',
  },
  evidenceGroupContent: {
    age: {
      intro: ['Age measures how many adult age choices the character creator gives you.'],
      whyItMatters:
        'A useful age setting should give you more control than a simple \u201cyoung\u201d or \u201cold\u201d choice.',
    },
    ethnicity: {
      intro: ['Ethnicity measures how many ethnicity options you can choose when creating a character.'],
      whyItMatters: 'More options make it easier to create someone who matches your preferences.',
    },
    'eye-color': {
      intro: ['Eye Color measures how many eye colors you can choose for your character.'],
      whyItMatters:
        'It is a small detail, but having only two or three colors makes the creator feel very basic.',
    },
    'body-type': {
      intro: ['Body Type measures how many different body shapes you can choose.'],
      whyItMatters:
        'This is one of the clearest differences between basic and advanced character creators.',
    },
    'breast-size': {
      intro: [
        'Breast Size measures how many breast-size choices are available for adult female characters.',
      ],
      whyItMatters:
        'It is scored separately because some apps offer several body types but almost no control over this specific feature.',
    },
    'hair-style': {
      intro: ['Hair Style measures how many different hairstyles you can choose.'],
      whyItMatters:
        'Hair is one of the most noticeable parts of a character, so a small selection can make created characters look repetitive.',
    },
    'hair-color': {
      intro: ['Hair Color measures how many hair colors you can choose.'],
      whyItMatters:
        'We look at whether the creator only offers a few basic colors or gives you enough choice to create something more specific.',
    },
    outfits: {
      intro: ['Outfits measures how many clothing choices are available when creating a character.'],
      whyItMatters:
        'A wide outfit selection helps characters look different and makes it easier to match a specific style or scenario.',
    },
    'creator-personalities': {
      intro: [
        'Personality Presets measures how many basic personality choices are available during character creation.',
      ],
      whyItMatters:
        'This test only covers the high-level presets shown in the creator. Detailed traits, interests, relationships, roles, and voices are tested separately under Personality.',
    },
  },
  evidenceSections: [
    {
      id: 'age',
      title: 'Age',
      whatItMeasures: 'How many adult age choices the character creator gives you.',
      whyItMatters:
        'A useful age setting should give you more control than a simple \u201cyoung\u201d or \u201cold\u201d choice.',
      howWeTest:
        'We count the selectable adult age options. When the creator uses a minimum and maximum age instead of presets, we record the available adult age range.',
      whatWeCount: [
        'Selectable adult age presets',
        'Labelled adult age ranges',
        'A working age slider with clearly different settings',
      ],
      whatWeDoNotCount: [
        'Ages shown only in ready-made character profiles',
        'Age guessed from the generated image',
        'Decorative labels that do not change the character',
        'Options for underage characters',
      ],
      displayedResult: '8 age options',
      scoringEvidenceSlug: 'age',
      scoringIntro: 'More age options means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'Some apps use exact ages, while others use broader groups such as young adult, adult, and mature. We record whichever system the normal user can actually select.',
    },
    {
      id: 'ethnicity',
      title: 'Ethnicity',
      whatItMeasures: 'How many ethnicity options you can choose when creating a character.',
      whyItMatters: 'More options make it easier to create someone who matches your preferences.',
      howWeTest:
        'We count every ethnicity option clearly shown inside the character creator. We only use the labels provided by the platform. We never guess ethnicity from the generated image.',
      whatWeCount: [
        'Clearly labelled ethnicity options',
        'Options that can be selected inside the creator',
        'Distinct choices that produce different character groups',
      ],
      whatWeDoNotCount: [
        'Ethnicity guessed from appearance',
        'Country labels that the platform does not use as ethnicity options',
        'Two labels that clearly mean the same thing',
        'Ethnicities shown only in the ready-made library',
      ],
      displayedResult: '10 ethnicity options',
      scoringEvidenceSlug: 'ethnicity',
      scoringIntro: 'More ethnicity options means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'A creator may generate visually diverse characters without offering clear ethnicity controls. This test only scores the choices the user can actually select.',
    },
    {
      id: 'eye-color',
      title: 'Eye Color',
      whatItMeasures: 'How many eye colors you can choose for your character.',
      whyItMatters:
        'It is a small detail, but having only two or three colors makes the creator feel very basic.',
      howWeTest: 'We count every clearly selectable eye color.',
      whatWeCount: [
        'Separate eye-color presets',
        'Clearly different color swatches',
        'A working custom color option',
      ],
      whatWeDoNotCount: [
        'Tiny shade differences that look almost identical',
        'Colors that appear randomly but cannot be selected',
        'Eye colors shown only in example images',
      ],
      displayedResult: '7 eye colors',
      scoringEvidenceSlug: 'eye-color',
      scoringIntro: 'More eye colors means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'When the app includes a full custom color picker, we explain that separately instead of pretending it is an unlimited number of presets.',
    },
    {
      id: 'body-type',
      title: 'Body Type',
      whatItMeasures: 'How many different body shapes you can choose.',
      whyItMatters:
        'This is one of the clearest differences between basic and advanced character creators.',
      howWeTest:
        'We count every body-type preset or clearly separate body control offered in the creator.',
      whatWeCount: [
        'Slim',
        'Athletic',
        'Curvy',
        'Muscular',
        'Plus size',
        'Other clearly different body options',
      ],
      whatWeDoNotCount: [
        'Tiny changes that are almost impossible to notice',
        'Body types shown only in marketing images',
        'Random body changes that cannot be selected',
        'Breast-size options, which are scored separately',
      ],
      displayedResult: '6 body types',
      scoringEvidenceSlug: 'body-type',
      scoringIntro: 'More body types means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'When the app uses sliders instead of presets, we record the available controls and explain how much real variation they provide.',
    },
    {
      id: 'breast-size',
      title: 'Breast Size',
      whatItMeasures: 'How many breast-size choices are available for adult female characters.',
      whyItMatters:
        'It is scored separately because some apps offer several body types but almost no control over this specific feature.',
      howWeTest:
        'We count every clearly selectable breast-size option shown for adult characters.',
      whatWeCount: [
        'Clearly labelled size presets',
        'A working size slider with separate settings',
        'Options that visibly change the character',
      ],
      whatWeDoNotCount: [
        'Size guessed from generated images',
        'Random results that cannot be selected',
        'Tiny changes that do not create a noticeable difference',
        'Options shown only in marketing images',
      ],
      displayedResult: '8 breast-size options',
      scoringEvidenceSlug: 'breast-size',
      scoringIntro: 'More options means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'This setting may only appear for certain character types. We record the account settings and character type used during testing.',
    },
    {
      id: 'hair-style',
      title: 'Hair Style',
      whatItMeasures: 'How many different hairstyles you can choose.',
      whyItMatters:
        'Hair is one of the most noticeable parts of a character, so a small selection can make created characters look repetitive.',
      howWeTest: 'We count every clearly different hairstyle available in the creator.',
      whatWeCount: [
        'Short and long hairstyles',
        'Straight, curly, braided, tied, and other distinct styles',
        'Clearly different cuts or shapes',
      ],
      whatWeDoNotCount: [
        'The same hairstyle shown in another color',
        'Tiny variations that look almost identical',
        'Hairstyles that appear randomly but cannot be selected',
        'Hats or accessories unless they are part of a separate hairstyle',
      ],
      displayedResult: '18 hairstyles',
      scoringEvidenceSlug: 'hair-style',
      scoringIntro: 'More hairstyles means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'Hair color is scored separately. Changing the color does not turn one hairstyle into several hairstyles.',
    },
    {
      id: 'hair-color',
      title: 'Hair Color',
      whatItMeasures: 'How many hair colors you can choose.',
      whyItMatters:
        'We look at whether the creator only offers a few basic colors or gives you enough choice to create something more specific.',
      howWeTest: 'We count every selectable hair-color option.',
      whatWeCount: [
        'Separate color presets',
        'Natural and fantasy colors',
        'Clearly different selectable shades',
        'A working custom color control',
      ],
      whatWeDoNotCount: [
        'Colors shown only in generated examples',
        'Random colors that cannot be selected',
        'Several labels that produce the same color',
        'Hair highlights unless they are a separate selectable control',
      ],
      displayedResult: '24 hair colors',
      scoringEvidenceSlug: 'hair-color',
      scoringIntro: 'More hair colors means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'A full color picker can offer more freedom than a long list of presets. When one is available, we explain it alongside the result.',
    },
    {
      id: 'outfits',
      title: 'Outfits',
      whatItMeasures: 'How many clothing choices are available when creating a character.',
      whyItMatters:
        'A wide outfit selection helps characters look different and makes it easier to match a specific style or scenario.',
      howWeTest: 'We count every separate outfit or clothing option available in the creator.',
      whatWeCount: [
        'Complete outfit presets',
        'Clearly different clothing choices',
        'Casual, formal, fantasy, work, sports, and other distinct styles',
      ],
      whatWeDoNotCount: [
        'The same outfit in several colors',
        'Accessories that do not change the main outfit',
        'Clothing shown only in marketing images',
        'Outfits that cannot be selected by normal users',
      ],
      displayedResult: '40 outfits',
      scoringEvidenceSlug: 'outfits',
      scoringIntro: 'More outfits means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'Some apps offer individual tops and bottoms, while others only offer complete outfits. We record how the creator works and count the selectable choices without mixing the two systems unfairly.',
    },
    {
      id: 'creator-personalities',
      title: 'Personality Presets',
      whatItMeasures: 'How many basic personality choices are available during character creation.',
      whyItMatters:
        'This test only covers the high-level presets shown in the creator. Detailed traits, interests, relationships, roles, and voices are tested separately under Personality.',
      howWeTest: 'We count every basic personality preset available during the creation process.',
      whatWeCount: [
        'Shy',
        'Confident',
        'Romantic',
        'Bratty',
        'Dominant',
        'Funny',
        'Other clearly different personality presets',
      ],
      whatWeDoNotCount: [
        'Detailed traits scored under Personality',
        'Personality text written through a custom prompt',
        'Near-identical labels that mean almost the same thing',
        'Personalities shown only on ready-made character profiles',
      ],
      displayedResult: '12 personality presets',
      scoringEvidenceSlug: 'creator-personalities',
      scoringIntro: 'More personality presets means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'This test appears inside the live Appearance score because it is part of the initial creator setup. The deeper personality-building options are not counted here.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'More options do not always mean more real control. An app may show 50 hair colors that are almost identical, while another app may offer fewer presets but include a proper custom color picker.',
      'Some options may also be connected. For example, choosing one visual style may remove certain hairstyles, outfits, or body types.',
      'Character creators can change regularly. Platforms may add new presets, remove old ones, or move choices behind a more expensive plan.',
      'This score measures the options available in the creator. It does not measure whether the finished image follows those choices correctly. We test that separately under Images and Control.',
    ],
  },
};

const customizationPersonality: TestSubscoreMethodologyContent = {
  categoryKey: 'customization',
  subscoreSlug: 'personality',
  heroIntro: [
    'Personality measures how much control you get over who your custom AI girlfriend is.',
    'Two characters can look completely different but still feel almost the same when they share the same interests, relationship style, voice, and personality. We check whether the creator gives you enough options to build someone who actually feels different.',
    'Basic personality presets are tested under Appearance because they are part of the first character-creation screen. This page looks at the deeper options used to shape the character.',
  ],
  whyItMatters: {
    title: 'Why Personality matters',
    paragraphs: [
      'Looks are only one part of creating an AI girlfriend.',
      'You may want someone who is shy, confident, romantic, bratty, dominant, funny, or interested in the same things as you. You may also want to choose the type of relationship, her job or background, and the voice she uses.',
      'Without these options, custom characters can still feel repetitive. You may create someone with a completely different appearance, but the conversation can feel almost identical to the last character you made.',
      'A strong personality creator gives you enough choices to create someone who fits the type of relationship and experience you actually want.',
    ],
  },
  howWeTest: {
    title: 'How we test Personality',
    paragraphs: [
      'We use a paid account and open the full character creator.',
      'We count every selectable personality trait, interest or hobby, relationship or chat style, role or occupation, voice, and kink or intimacy preference.',
      'We also record how many traits can be selected for one character.',
      'For Interests and Role, we check whether you can write your own option instead of only choosing from presets.',
      'For Voice, we test three options to make sure they sound noticeably different. We also record whether voice previews are available.',
      'We complete these checks during the same Personality and Voice testing session.',
    ],
  },
  highLowScore: {
    title: 'What good Personality looks like',
    paragraphs: [
      'A high Personality score means the creator gives you plenty of useful ways to shape how the character behaves, what she likes, what kind of relationship you have, and how she sounds.',
      'A lower score means you are forced to choose from a few basic options, or many of the choices feel almost the same.',
    ],
  },
  scoreCalculation: {
    title: 'How the Personality score is calculated',
    paragraphs: [
      'Every scored test gets a score from 0 to 10.',
      'Some tests count slightly more than others. We multiply every test score by how much it counts and then add the points together.',
    ],
    evidenceWeights: [
      { label: 'Traits', weight: 18.28 },
      { label: 'Interests', weight: 18.28 },
      { label: 'Relationship', weight: 18.28 },
      { label: 'Role', weight: 17.2 },
      { label: 'Voice', weight: 17.2 },
      { label: 'Kink Options', weight: 10.76 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply that score by how much the test counts. We then add all the points together to get the final Personality score.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Personality is organized into 6 evidence groups. Each group contains one scored test: Traits, Interests, Relationship, Role, Voice, and Kink Options.',
    sectionIntro: 'Personality has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    traits: {
      intro: ['Traits measures how many personality traits you can choose for your character.'],
      whyItMatters:
        'Traits help shape how the character behaves. Examples could include shy, confident, jealous, caring, funny, or adventurous.',
    },
    interests: {
      intro: ['Interests measures how many hobbies and interests you can give your character.'],
      whyItMatters:
        'Shared interests can make the character feel more personal and give you more things to talk about.',
    },
    relationship: {
      intro: ['Relationship measures how many relationship types and chat styles you can choose.'],
      whyItMatters: 'This decides the basic connection between you and the character.',
    },
    role: {
      intro: ['Role measures how many occupations, backgrounds, and character roles you can choose.'],
      whyItMatters: 'A role gives the character more context than a basic personality alone.',
    },
    voice: {
      intro: ['Voice measures how many voice options you can choose for your character.'],
      whyItMatters:
        'The voice can completely change how the same character feels during voice messages or calls.',
    },
    'kink-options': {
      intro: ['Kink Options measures how many intimacy preferences you can choose for the character.'],
      whyItMatters:
        'This can be useful for users who want more control over adult roleplay and relationship boundaries.',
    },
  },
  evidenceSections: [
    {
      id: 'traits',
      title: 'Traits',
      whatItMeasures: 'How many personality traits you can choose for your character.',
      whyItMatters:
        'Traits help shape how the character behaves. Examples could include shy, confident, jealous, caring, funny, or adventurous.',
      howWeTest:
        'We count every selectable personality trait in the character creator. We also record the maximum number of traits that can be selected for one character.',
      whatWeCount: [
        'Clearly selectable personality traits',
        'Traits that describe how the character behaves',
        'Options that are meaningfully different from each other',
      ],
      whatWeDoNotCount: [
        'Traits shown only on ready-made character profiles',
        'Custom text written in a prompt',
        'Two labels that clearly mean the same thing',
        'Interests, relationships, and roles, which are tested separately',
      ],
      displayedResult: '28 traits available',
      displayedResultExtra: 'Maximum selectable: 5',
      scoringEvidenceSlug: 'traits',
      scoringIntro: 'More available traits means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'The score is based on the total number of traits available. We also show the maximum number you can select because a creator may offer 50 traits but only let you use one.',
    },
    {
      id: 'interests',
      title: 'Interests',
      whatItMeasures: 'How many hobbies and interests you can give your character.',
      whyItMatters:
        'Shared interests can make the character feel more personal and give you more things to talk about.',
      howWeTest:
        'We count every selectable interest shown in the creator. We also check whether you can enter your own custom interest.',
      whatWeCount: [
        'Hobbies',
        'Music, movie, or book interests',
        'Sports and activities',
        'Lifestyle interests',
        'Other clearly different selectable interests',
      ],
      whatWeDoNotCount: [
        'Personality traits',
        'Roles or occupations',
        'Interests shown only in ready-made profiles',
        'Two labels that clearly describe the same interest',
      ],
      displayedResult: '24 interests available',
      displayedResultExtra: 'Custom interest: Yes',
      scoringEvidenceSlug: 'interests',
      scoringIntro: 'More interests means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'The score is based on the number of preset interests. Whether custom interests are available is shown beside the result as useful extra context.',
    },
    {
      id: 'relationship',
      title: 'Relationship',
      whatItMeasures: 'How many relationship types and chat styles you can choose.',
      whyItMatters: 'This decides the basic connection between you and the character.',
      howWeTest:
        'We count every selectable relationship type and chat style shown in the creator.',
      whatWeCount: [
        'Girlfriend or boyfriend',
        'Friend',
        'Spouse',
        'Romantic partner',
        'Dominant partner',
        'Other clearly different relationship or chat styles',
      ],
      whatWeDoNotCount: [
        'Character occupations',
        'Personality traits',
        'Small wording changes to the same relationship',
        'Relationships that only appear in ready-made profiles',
      ],
      displayedResult: '14 relationship types',
      scoringEvidenceSlug: 'relationship',
      scoringIntro: 'More relationship types means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'The live test combines relationship types and chat styles into one count. We only count options that create a meaningfully different relationship or conversation style.',
    },
    {
      id: 'role',
      title: 'Role',
      whatItMeasures: 'How many occupations, backgrounds, and character roles you can choose.',
      whyItMatters: 'A role gives the character more context than a basic personality alone.',
      howWeTest:
        'We count all preset roles, occupations, and backgrounds shown in the creator. We also check whether you can enter your own custom role.',
      whatWeCount: [
        'Student',
        'Teacher',
        'Doctor',
        'Athlete',
        'Artist',
        'Fantasy roles',
        'Other clearly different jobs or backgrounds',
      ],
      whatWeDoNotCount: [
        'Personality traits',
        'Relationship types',
        'The character\u2019s name',
        'Roles shown only in ready-made profiles',
        'Two labels that describe the same basic role',
      ],
      displayedResult: '30 preset roles',
      displayedResultExtra: 'Custom role: Yes',
      scoringEvidenceSlug: 'role',
      scoringIntro: 'More roles means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'The score is based on the number of preset roles. Custom role entry is recorded separately because it can give you more freedom than a long preset list.',
    },
    {
      id: 'voice',
      title: 'Voice',
      whatItMeasures: 'How many voice options you can choose for your character.',
      whyItMatters:
        'The voice can completely change how the same character feels during voice messages or calls.',
      howWeTest:
        'We count every selectable voice. We then test three voices to make sure the options sound noticeably different. We also check whether you can preview the voices before creating the character.',
      whatWeCount: [
        'Clearly selectable voices',
        'Voices that sound noticeably different',
        'Options available through the normal character creator',
      ],
      whatWeDoNotCount: [
        'The same voice under a different name',
        'Voice styles that cannot be selected',
        'Voices only available after creating the character',
        'Sound effects or background audio',
      ],
      displayedResult: '12 voices',
      displayedResultExtra: 'Voice previews: Yes',
      scoringEvidenceSlug: 'voice',
      scoringIntro: 'More voices means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'The score is based on the number of selectable voices. Voice previews and how different the voices sound are shown with the result for extra context.',
    },
    {
      id: 'kink-options',
      title: 'Kink Options',
      whatItMeasures: 'How many intimacy preferences you can choose for the character.',
      whyItMatters:
        'This can be useful for users who want more control over adult roleplay and relationship boundaries.',
      howWeTest: 'We count every kink or intimacy preference shown in the character creator.',
      whatWeCount: [
        'Clearly selectable kink preferences',
        'Intimacy preferences that change the character setup',
        'Options available to normal adult users',
      ],
      whatWeDoNotCount: [
        'Kinks mentioned only inside a profile description',
        'Preferences entered through a custom prompt',
        'Two labels that clearly mean the same thing',
        'Features unavailable to the test account',
      ],
      displayedResult: '7 kink options',
      scoringEvidenceSlug: 'kink-options',
      scoringIntro: 'More options means a higher score.',
      showWhyItMatters: false,
      edgeCases:
        'This is not a required testing field, but it affects the score when a result is recorded. If the creator offers no kink options, the recorded count is 0.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'More options do not always mean more control. An app may list 40 traits that are mostly small variations of the same idea. Another app may have fewer presets but let you write a detailed custom personality.',
      'Some choices may also be connected. Selecting one relationship type may remove certain traits, roles, or kink options.',
      'The score is mainly based on the selectable options in the creator. Custom text prompts are tested separately under Control.',
      'Voice quality is also separate from the number of voices. This test checks how many voice choices are available and whether they sound different. The quality of voice messages and calls is tested elsewhere.',
      'Character creators change regularly. Our results show what was available through the paid test account on the recorded test date.',
    ],
  },
};

const customizationControl: TestSubscoreMethodologyContent = {
  categoryKey: 'customization',
  subscoreSlug: 'control',
  heroIntro: [
    'Control measures how much freedom you get beyond the basic buttons and presets in the character creator.',
    'We check whether you can write your own instructions, preview the character before finishing, and make changes after the character has been created.',
  ],
  whyItMatters: {
    title: 'Why Control matters',
    paragraphs: [
      'A creator can have hundreds of presets and still give you very little real control.',
      'You may want a specific hairstyle, personality, relationship, or background that is not included in the standard choices. Custom prompts let you explain what you want instead of picking the closest preset and hoping for the best.',
      'Editing is just as important. You may spend time creating a character and then notice that the voice, personality, or appearance is not right. You should not have to delete the character and start again because of one bad choice.',
      'A preview also helps you avoid wasting credits. You should be able to see what you are creating before the app locks everything in or charges you for the final result.',
    ],
  },
  howWeTest: {
    title: 'How we test Control',
    paragraphs: [
      'We use a paid account and create five test characters.',
      'We use the same five characters for every Control test.',
      'First, we enter our own written instructions and check whether the creator accepts them.',
      'We then check whether a visual or written preview appears before the character is finalized.',
      'After creating the characters, we try to change five important areas: appearance, personality, relationship, voice, and name.',
      'Using the same characters keeps the tests consistent and makes it easier to compare different platforms.',
    ],
  },
  highLowScore: {
    title: 'What good Control looks like',
    paragraphs: [
      'A high Control score means you can add your own instructions, preview the character before finishing, and change important details later.',
      'A lower score means you are stuck with basic presets, cannot see the result before confirming, or cannot fix the character after creating it.',
    ],
  },
  scoreCalculation: {
    title: 'How the Control score is calculated',
    paragraphs: [
      'Every scored test gets a score from 0 to 10.',
      'All three tests count equally. We combine their scores to calculate the final Control score.',
    ],
    evidenceWeights: [
      { label: 'Custom Prompts', weight: 33.33 },
      { label: 'Editing', weight: 33.33 },
      { label: 'Preview', weight: 33.34 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply the score by how much the test counts. We then add the points together to get the final Control score.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Control is organized into 3 evidence groups. Each group contains one scored test: Custom Prompts, Editing, and Preview. All three tests count equally toward the final Control score.',
    sectionIntro: 'Control has 3 evidence groups made up of 3 scored tests.',
  },
  evidenceGroupContent: {
    'custom-prompts': {
      intro: [
        'Custom Prompts measures whether you can use your own written instructions when creating a character.',
      ],
      whyItMatters: 'This gives you more freedom than only choosing from preset buttons.',
    },
    editing: {
      intro: ['Editing measures what you can change after the character has been created.'],
      whyItMatters:
        'This matters because you may not notice a bad choice until you see the finished character or start chatting.',
    },
    preview: {
      intro: ['Preview measures whether you can see the character before finishing the creation process.'],
      whyItMatters:
        'A useful preview helps you catch problems before the character is saved or credits are spent.',
    },
  },
  evidenceSections: [
    {
      id: 'custom-prompts',
      title: 'Custom Prompts',
      whatItMeasures: 'Whether you can use your own written instructions when creating a character.',
      whyItMatters: 'This gives you more freedom than only choosing from preset buttons.',
      howWeTest:
        'We create five characters using our own written instructions. We check whether the creator lets us enter the instructions and accepts them for all five characters.',
      whatWeCount: [
        'A free-text prompt box',
        'Written appearance instructions',
        'Written personality or background instructions',
        'Custom instructions accepted during creation',
      ],
      whatWeDoNotCount: [
        'Choosing from preset buttons',
        'Editing the character after creation',
        'A profile description that does not affect creation',
        'A prompt box that is shown but cannot be submitted',
      ],
      displayedResult: 'Yes \u2014 custom instructions were accepted for all five characters',
      scoringLines: [
        'Yes \u2014 custom instructions are available and accepted = 10/10',
        'Limited \u2014 prompts work but have major restrictions = 5/10',
        'No \u2014 custom prompts are not available = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Custom Prompts scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether custom prompts are available and accepted. It does not score how closely the finished character matches the prompt. Prompt accuracy is tested separately under Images.',
    },
    {
      id: 'editing',
      title: 'Editing',
      whatItMeasures: 'What you can change after the character has been created.',
      whyItMatters:
        'This matters because you may not notice a bad choice until you see the finished character or start chatting.',
      howWeTest:
        'After creating the five test characters, we try to change appearance, personality, relationship, voice, and name. Each editable area counts as one passed check.',
      whatWeCount: [
        'Changes saved through the normal character settings',
        'Appearance changes',
        'Personality changes',
        'Relationship changes',
        'Voice changes',
        'Name changes',
      ],
      whatWeDoNotCount: [
        'Deleting the character and creating a new one',
        'Temporary changes that disappear after refreshing',
        'Changes only available through support',
        'Editing a chat message instead of the character',
      ],
      displayedResult: '4 of 5 areas can be edited',
      displayedResultExtra: 'Editing result: 80%',
      scoringIntro: 'More editable areas means a higher score.',
      scoringLines: [
        'None (0%) = 0/10',
        '1 of 5 (20%) = 2/10',
        '2 of 5 (40%) = 4/10',
        '3 of 5 (60%) = 6/10',
        '4 of 5 (80%) = 8/10',
        '5 of 5 (100%) = 10/10',
      ],
      scoringFootnote: 'A result of 4 editable areas scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'The score is based on how many of the five areas can be edited. An app can still receive some points when only part of the character can be changed.',
    },
    {
      id: 'preview',
      title: 'Preview',
      whatItMeasures: 'Whether you can see the character before finishing the creation process.',
      whyItMatters:
        'A useful preview helps you catch problems before the character is saved or credits are spent.',
      howWeTest:
        'We create five test characters. Before confirming each character, we check whether the app shows a visual preview, a written preview, both, or no useful preview.',
      whatWeCount: [
        'A character image shown before final confirmation',
        'A written summary of the selected character',
        'A preview that updates when settings change',
        'A preview available without completing the full creation',
      ],
      whatWeDoNotCount: [
        'Seeing the character only after creation',
        'Marketing example images',
        'A blank placeholder',
        'A preview that does not reflect the selected settings',
      ],
      displayedResult: 'Limited \u2014 a written preview is available, but no final image is shown',
      scoringLines: [
        'Yes \u2014 a useful preview is available = 10/10',
        'Limited \u2014 a preview exists but has important restrictions = 5/10',
        'No \u2014 no useful preview before creation = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Preview scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'A visual preview and a written preview are not exactly the same. We record which type is available and note any important restrictions.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'A custom prompt being accepted does not mean the final character will follow it perfectly. This test only checks whether written instructions are available and accepted. We test how accurately generated images follow prompts under Images.',
      'Previews can also work differently. Some apps show a full image, while others only show a short written summary. We record what type of preview is available.',
      'Editing may depend on the setting. An app might let you change the name and voice but lock the appearance and personality.',
      'Some apps charge credits when creating or editing a character. Those costs are tested separately under Pricing.',
      'Character creators change regularly. Our results show what was available through the paid test account on the date of testing.',
    ],
  },
};

const chatUnderstanding: TestSubscoreMethodologyContent = {
  categoryKey: 'chat',
  subscoreSlug: 'understanding',
  heroIntro: [
    'Understanding measures how well the AI follows what you say during a conversation.',
    'A reply can sound good at first but still be frustrating if the AI forgets your name, ignores your question, misses something you said earlier, or completely misunderstands the roleplay.',
    'We test whether the AI remembers details, gives direct answers, follows the conversation, listens to your instructions, and understands the scenario.',
  ],
  whyItMatters: {
    title: 'Why Understanding matters',
    paragraphs: [
      'Talking to an AI girlfriend becomes annoying very quickly when she does not understand you.',
      'You might tell her your name, where you live, and what you like. A few messages later, she may forget everything and ask the same questions again.',
      'The same problem happens with instructions. You may ask for short replies, tell her not to use emojis, or set up a specific roleplay. A weak AI ignores those rules and does whatever it wants.',
      'A good chat should do more than create nice-sounding sentences. It should understand what you are asking, remember what has already happened, and respond in a way that makes sense for the conversation.',
    ],
  },
  howWeTest: {
    title: 'How we test Understanding',
    paragraphs: [
      'We open five new chats with five different characters.',
      'We use the same script in every chat so that each platform receives the same test.',
      'In every conversation, we give the AI five facts about ourselves, ask five direct questions, set three simple rules, build a short conversation that requires earlier context, and start the same roleplay with five checks.',
      'This gives us 25 memory checks, 25 direct-question checks, 5 context results, 15 instruction checks, and 25 roleplay checks.',
      'We enter one row for each of the five chats in our testing worksheet.',
      'The five facts are: my name is Herman, I live in Bangkok, my favorite food is pizza, I have a dog named Milo, and I work at night.',
      'The three rules are: call me Herman, keep replies under three sentences, and do not use emojis.',
      'The five direct questions cover a rainy date, favorite movie, cheering up after a bad day, dinner, and vacation.',
      'The roleplay starts at a quiet hotel bar. The character is confident but slightly nervous, stays in character, and describes actions in italics.',
    ],
  },
  highLowScore: {
    title: 'What good Understanding looks like',
    paragraphs: [
      'A high Understanding score means the AI remembers most tested facts, answers questions directly, uses earlier messages correctly, follows simple rules, and understands the roleplay.',
      'A lower score means the AI regularly forgets details, changes the subject, ignores instructions, or loses track of the scenario.',
    ],
  },
  scoreCalculation: {
    title: 'How the Understanding score is calculated',
    paragraphs: [
      'Every scored test gets a score from 0 to 10.',
      'All five tests count equally. We combine their scores to calculate the final Understanding score.',
    ],
    evidenceWeights: [
      { label: 'Memory', weight: 20 },
      { label: 'Relevance', weight: 20 },
      { label: 'Context', weight: 20 },
      { label: 'Instructions', weight: 20 },
      { label: 'Roleplay Accuracy', weight: 20 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by 20% and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Understanding is organized into 5 evidence groups. Each group contains one scored test: Memory, Relevance, Context, Instructions, and Roleplay Accuracy. All five tests count equally toward the final Understanding score.',
    sectionIntro: 'Understanding has 5 evidence groups made up of 5 scored tests.',
  },
  evidenceGroupContent: {
    memory: {
      intro: ['Memory measures how many personal facts the AI remembers later in the conversation.'],
      whyItMatters:
        'A chat feels much more personal when the AI remembers basic things about you instead of asking the same questions again.',
    },
    relevance: {
      intro: ['Relevance measures how often the AI gives a clear answer to the question you asked.'],
      whyItMatters:
        'A reply can sound natural but still be useless when it avoids the question or changes the subject.',
    },
    context: {
      intro: [
        'Context measures whether the AI can use information from earlier in the same conversation.',
      ],
      whyItMatters:
        'A weak AI only reacts to the most recent message. A stronger AI understands how the newest message connects to what happened before.',
    },
    instructions: {
      intro: ['Instructions measures how well the AI follows simple rules you give it.'],
      whyItMatters:
        'This matters when you want a specific reply style, format, or behavior during the chat.',
    },
    'roleplay-accuracy': {
      intro: [
        'Roleplay Accuracy measures whether the AI understands the scenario and keeps the important details correct.',
      ],
      whyItMatters:
        'A roleplay quickly falls apart when the character forgets the location, changes roles, or responds as if the scene never happened.',
    },
  },
  evidenceSections: [
    {
      id: 'memory',
      title: 'Memory',
      whatItMeasures: 'How many personal facts the AI remembers later in the conversation.',
      whyItMatters:
        'A chat feels much more personal when the AI remembers basic things about you instead of asking the same questions again.',
      howWeTest:
        'We give the AI five facts in each of the five chats. Later in the conversation, we ask questions to see whether it still remembers them. The five facts cover name, location, favorite food, pet, and work schedule.',
      whatWeCount: [
        'The correct fact',
        'A clearly correct answer using slightly different wording',
        'A natural reference to the fact without being reminded',
        'An answer that keeps the important meaning correct',
      ],
      whatWeDoNotCount: [
        'A wrong answer',
        'A vague guess',
        'Repeating the fact immediately after we give it',
        'Remembering one part while changing the important detail',
        'Information saved manually through a memory tool',
      ],
      displayedResult: '21 of 25 facts remembered',
      displayedResultExtra: 'Memory result: 84%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 84% scores 8.4/10.',
      showWhyItMatters: false,
      edgeCases:
        'This is an in-chat memory test. It does not measure whether the character remembers the information days or weeks later. Long-term and manual memory features are covered separately.',
    },
    {
      id: 'relevance',
      title: 'Relevance',
      whatItMeasures: 'How often the AI gives a clear answer to the question you asked.',
      whyItMatters:
        'A reply can sound natural but still be useless when it avoids the question or changes the subject.',
      howWeTest:
        'We ask five direct questions in each of the five chats. A reply passes when it clearly answers the question and stays on topic.',
      whatWeCount: [
        'A clear answer to the question',
        'An answer that adds useful details',
        'A short or long answer when the main question is still answered',
        'A relevant follow-up question after answering',
      ],
      whatWeDoNotCount: [
        'Changing the subject',
        'Giving a vague answer that avoids the question',
        'Only asking a question back',
        'Sending an unrelated response',
        'Ignoring an important part of the question',
      ],
      displayedResult: '22 of 25 questions answered directly',
      displayedResultExtra: 'Relevance result: 88%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 88% scores 8.8/10.',
      showWhyItMatters: false,
      edgeCases:
        'The answer does not need to match our personal preference. It only needs to clearly answer what was asked.',
    },
    {
      id: 'context',
      title: 'Context',
      whatItMeasures: 'Whether the AI can use information from earlier in the same conversation.',
      whyItMatters:
        'A weak AI only reacts to the most recent message. A stronger AI understands how the newest message connects to what happened before.',
      howWeTest:
        'We create a short multi-message exchange in each of the five chats. Later, we send a message that only makes sense when the AI remembers and understands the earlier parts of the conversation. Each chat receives one Context result.',
      whatWeCount: [
        'Correctly using something said earlier',
        'Remembering the setting or topic',
        'Understanding how several messages connect',
        'Responding based on the full conversation',
      ],
      whatWeDoNotCount: [
        'Only reacting to the latest message',
        'Giving a generic reply that could fit any conversation',
        'Guessing correctly without using earlier details',
        'Contradicting something established earlier',
      ],
      displayedResult: '4 of 5 chats used earlier context correctly',
      displayedResultExtra: 'Context result: 80%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: [
        '0 of 5 = 0/10',
        '1 of 5 = 2/10',
        '2 of 5 = 4/10',
        '3 of 5 = 6/10',
        '4 of 5 = 8/10',
        '5 of 5 = 10/10',
      ],
      scoringFootnote: 'A result of 4 passed chats scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Memory and Context are connected, but they are not the same test. Memory checks whether the AI remembers a specific fact. Context checks whether it understands how earlier messages affect the current conversation.',
    },
    {
      id: 'instructions',
      title: 'Instructions',
      whatItMeasures: 'How well the AI follows simple rules you give it.',
      whyItMatters:
        'This matters when you want a specific reply style, format, or behavior during the chat.',
      howWeTest:
        'We give the same three rules in each of the five chats: call me Herman, keep replies under three sentences, and do not use emojis. We check each rule separately. This creates 15 instruction checks in total.',
      whatWeCount: [
        'Calling the user Herman when appropriate',
        'Keeping replies within the requested length',
        'Avoiding emojis',
        'Following the rules throughout the test',
      ],
      whatWeDoNotCount: [
        'Following a rule once and then repeatedly breaking it',
        'Ignoring one rule because the other two were followed',
        'Almost following the request',
        'A lucky reply that follows the rule without showing consistency',
      ],
      displayedResult: '13 of 15 instructions followed',
      displayedResultExtra: 'Instructions result: 86.7%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 86.7% scores 8.67/10.',
      showWhyItMatters: false,
      edgeCases:
        'Each rule is scored separately. A chat can pass two rules and fail the third.',
    },
    {
      id: 'roleplay-accuracy',
      title: 'Roleplay Accuracy',
      whatItMeasures: 'Whether the AI understands the scenario and keeps the important details correct.',
      whyItMatters:
        'A roleplay quickly falls apart when the character forgets the location, changes roles, or responds as if the scene never happened.',
      howWeTest:
        'We use the same hotel-bar roleplay in all five chats. Each conversation receives one point for every check it passes: starts the scenario correctly, stays in character, remembers the setting, responds properly to actions, and does not contradict or break the scene. This creates 25 roleplay checks in total.',
      whatWeCount: [
        'Correctly starting in the hotel bar',
        'Keeping the assigned personality and role',
        'Remembering who the user is',
        'Responding to actions inside the scene',
        'Keeping the situation consistent',
      ],
      whatWeDoNotCount: [
        'Moving to a new location without a reason',
        'Changing the user\u2019s or character\u2019s role',
        'Ignoring actions written in the roleplay',
        'Speaking out of character',
        'Breaking the scene or contradicting earlier events',
      ],
      displayedResult: '22 of 25 roleplay checks passed',
      displayedResultExtra: 'Roleplay Accuracy result: 88%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 88% scores 8.8/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether the AI understands and maintains the setup. The overall quality and creativity of the roleplay are tested separately under Chat Realism.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Chat quality can change between characters. One character may understand you very well while another performs much worse on the same platform.',
      'We use five different characters to reduce this problem, but we cannot test every character in the library.',
      'This test measures understanding inside the tested conversations. It does not prove that the AI will remember everything after several days or weeks.',
      'Manual memory tools are also tested separately under Chat Features. Understanding focuses on whether the AI naturally remembers and uses information during the conversation.',
      'AI models change regularly. Our results show how the chat performed on the recorded test date.',
    ],
  },
};

const chatRealism: TestSubscoreMethodologyContent = {
  categoryKey: 'chat',
  subscoreSlug: 'realism',
  heroIntro: [
    'Realism measures how natural and human the conversation feels.',
    'An AI girlfriend can remember your name and answer every question correctly, but the chat can still feel robotic. We check whether the replies sound natural, match the character\u2019s personality, handle emotions properly, and help move the conversation forward.',
  ],
  whyItMatters: {
    title: 'Why Realism matters',
    paragraphs: [
      'Chat is the main reason most people use an AI girlfriend app.',
      'The conversation should not feel like you are talking to a customer support bot wearing a cute profile picture.',
      'A realistic AI girlfriend should have her own personality, react properly to your mood, and help keep the conversation going. She should not send the same safe reply every time or make you do all the work.',
      'Roleplay is also a big part of these apps. A good character should add details, respond to your actions, and keep the story moving instead of giving short and lifeless answers.',
      'That is why we do not only check whether the AI understands you. We also check whether talking to it actually feels natural and enjoyable.',
    ],
  },
  howWeTest: {
    title: 'How we test Realism',
    paragraphs: [
      'We use the same five chats from the Understanding test.',
      'Each chat uses a different character and includes 20 AI replies. This gives us 100 replies to review.',
      'For every chat, we record how many of the 20 replies sound natural, whether the character keeps her personality, how many of the five roleplay checks pass, how often the character takes useful initiative, how well it handles five emotional moments, and how many replies match the selected communication style.',
      'Using the same chats keeps the tests consistent and lets us judge several parts of the conversation without starting with a completely different set of characters.',
    ],
  },
  highLowScore: {
    title: 'What good Realism looks like',
    paragraphs: [
      'A high Realism score means the replies sound natural, the character keeps her personality, and conversations feel like a real back-and-forth exchange.',
      'A lower score means the chat feels robotic, passive, emotionally flat, or completely different from the character you selected.',
    ],
  },
  scoreCalculation: {
    title: 'How the Realism score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Realism score.',
    ],
    evidenceWeights: [
      { label: 'Naturalness', weight: 17 },
      { label: 'Personality', weight: 17 },
      { label: 'Roleplay', weight: 17 },
      { label: 'Initiative', weight: 17 },
      { label: 'Emotion', weight: 16 },
      { label: 'Style', weight: 16 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by how much it counts and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Realism is organized into 6 evidence groups. Each group contains one scored test: Naturalness, Personality, Roleplay, Initiative, Emotion, and Style.',
    sectionIntro: 'Realism has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    naturalness: {
      intro: ['Naturalness measures how many replies sound like something a real person might actually send.'],
      whyItMatters:
        'A reply does not need to be perfect. It should simply feel natural for the conversation instead of sounding robotic, copied, or strangely formal.',
    },
    personality: {
      intro: ['Personality measures whether the character keeps the traits she is supposed to have.'],
      whyItMatters:
        'A bratty goth character should not suddenly turn into a polite life coach after ten messages.',
    },
    roleplay: {
      intro: ['Roleplay measures how enjoyable and well-written the roleplay feels.'],
      whyItMatters:
        'Understanding tests whether the AI remembers the basic scenario. Realism checks whether it actually does something interesting with it.',
    },
    initiative: {
      intro: ['Initiative measures how often the character helps move the conversation forward.'],
      whyItMatters:
        'A good AI girlfriend should not make you ask every question and introduce every new topic yourself.',
    },
    emotion: {
      intro: ['Emotion measures how well the AI responds to the user\u2019s mood.'],
      whyItMatters:
        'A realistic character should react differently when you are happy, sad, angry, nervous, or romantic.',
    },
    style: {
      intro: ['Style measures whether the replies match the communication style selected for the character.'],
      whyItMatters:
        'For example, a short and playful style should not suddenly turn into long and formal essays.',
    },
  },
  evidenceSections: [
    {
      id: 'naturalness',
      title: 'Naturalness',
      whatItMeasures: 'How many replies sound like something a real person might actually send.',
      whyItMatters:
        'A reply does not need to be perfect. It should simply feel natural for the conversation instead of sounding robotic, copied, or strangely formal.',
      howWeTest:
        'We review all 100 replies from the five chats. Every reply is checked for natural wording, a suitable reply length, logical flow, and no robotic or copy-paste language. A reply passes when it meets at least three of these four checks.',
      whatWeCount: [
        'Wording that sounds natural',
        'A reply length that fits the message',
        'A response that flows from the previous message',
        'Casual language when it suits the character',
        'Longer replies when the situation needs more detail',
      ],
      whatWeDoNotCount: [
        'Robotic or overly formal wording',
        'Replies that feel copied from a template',
        'Very long essays in response to a simple message',
        'One-line answers when more detail is clearly needed',
        'Replies that suddenly change the subject',
      ],
      displayedResult: '84 of 100 replies passed',
      displayedResultExtra: 'Naturalness result: 84%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 84% scores 8.4/10.',
      showWhyItMatters: false,
      edgeCases:
        'Natural does not mean short. A longer reply can still pass when it fits the conversation and sounds like something the character would say.',
    },
    {
      id: 'personality',
      title: 'Personality',
      whatItMeasures: 'Whether the character keeps the traits she is supposed to have.',
      whyItMatters:
        'A bratty goth character should not suddenly turn into a polite life coach after ten messages.',
      howWeTest:
        'Each of the five tested characters has three clear personality traits. We review all 20 replies in each chat. A chat passes when the character keeps at least two of the three traits throughout the conversation.',
      whatWeCount: [
        'The character\u2019s wording matches her personality',
        'Her reactions make sense for the selected traits',
        'The personality stays clear across the full chat',
        'Small changes in mood that still fit the character',
      ],
      whatWeDoNotCount: [
        'Mentioning a trait once and then ignoring it',
        'Becoming a completely different person halfway through',
        'Generic replies that could come from any character',
        'Breaking personality whenever the topic changes',
      ],
      displayedResult: '4 of 5 chats kept the selected personality',
      displayedResultExtra: 'Personality result: 80%',
      scoringIntro: 'A higher pass rate means a higher score.',
      scoringLines: [
        '0 of 5 = 0/10',
        '1 of 5 = 2/10',
        '2 of 5 = 4/10',
        '3 of 5 = 6/10',
        '4 of 5 = 8/10',
        '5 of 5 = 10/10',
      ],
      scoringFootnote: 'A result of 4 passed chats scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'The character does not need to repeat the same behavior in every message. We look for a consistent personality, not a character who says the same thing over and over again.',
    },
    {
      id: 'roleplay',
      title: 'Roleplay',
      whatItMeasures: 'How enjoyable and well-written the roleplay feels.',
      whyItMatters:
        'Understanding tests whether the AI remembers the basic scenario. Realism checks whether it actually does something interesting with it.',
      howWeTest:
        'We review the roleplay inside all five chats. Each chat receives one point for every check it passes: stays in character, adds useful details, responds to the user\u2019s actions, keeps the story consistent, and moves the scenario forward. This creates 25 roleplay checks in total.',
      whatWeCount: [
        'Describing useful actions or details',
        'Reacting to what the user does',
        'Keeping the story consistent',
        'Adding something new to the scene',
        'Giving the user something useful to respond to',
      ],
      whatWeDoNotCount: [
        'Repeating the user\u2019s message',
        'Giving very short replies that add nothing',
        'Ignoring actions inside the roleplay',
        'Suddenly changing the location or story',
        'Waiting for the user to control every part of the scene',
      ],
      displayedResult: '21 of 25 roleplay checks passed',
      displayedResultExtra: 'Roleplay result: 84%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 84% scores 8.4/10.',
      showWhyItMatters: false,
      edgeCases:
        'Roleplay Accuracy under Understanding checks whether the AI follows the setup correctly. This test goes further and checks whether the roleplay is actually good.',
    },
    {
      id: 'initiative',
      title: 'Initiative',
      whatItMeasures: 'How often the character helps move the conversation forward.',
      whyItMatters:
        'A good AI girlfriend should not make you ask every question and introduce every new topic yourself.',
      howWeTest:
        'We use 10 open-ended messages in each of the five chats. This creates 50 chances for the character to take initiative. A reply passes when it asks a relevant question, adds a useful new detail, or suggests a logical next action.',
      whatWeCount: [
        'Asking a question that fits the topic',
        'Introducing a useful new detail',
        'Suggesting something to do next',
        'Moving the roleplay forward',
        'Keeping the conversation alive naturally',
      ],
      whatWeDoNotCount: [
        'Asking a random question to fill space',
        'Repeating the user\u2019s last message',
        'Adding details that do not fit the conversation',
        'Changing the subject for no reason',
        'Ending every reply without giving the user anything to respond to',
      ],
      displayedResult: '39 of 50 replies showed useful initiative',
      displayedResultExtra: 'Initiative result: 78%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 78% scores 7.8/10.',
      showWhyItMatters: false,
      edgeCases:
        'More initiative is not always better. The character should help move the conversation forward without taking over or ignoring what the user wants.',
    },
    {
      id: 'emotion',
      title: 'Emotion',
      whatItMeasures: 'How well the AI responds to the user\u2019s mood.',
      whyItMatters:
        'A realistic character should react differently when you are happy, sad, angry, nervous, or romantic.',
      howWeTest:
        'We use five emotional situations in each of the five chats: happy, sad, angry, nervous, and romantic. This creates 25 emotional-response tests. A reply passes when the character notices the mood and responds in a suitable way.',
      whatWeCount: [
        'Matching the user\u2019s emotional tone',
        'Showing support when the user is upset',
        'Reacting naturally to good news',
        'Handling anger without ignoring it',
        'Responding properly to romantic messages',
      ],
      whatWeDoNotCount: [
        'Giving the same reply to every emotion',
        'Ignoring an obvious emotional cue',
        'Making a joke during a serious moment without a good reason',
        'Becoming romantic when the user is upset',
        'Sending a generic reply that could fit any mood',
      ],
      displayedResult: '21 of 25 emotional moments were handled well',
      displayedResultExtra: 'Emotion result: 84%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 84% scores 8.4/10.',
      showWhyItMatters: false,
      edgeCases:
        'There is no single perfect response to an emotion. We check whether the reply fits the situation, not whether it uses one exact sentence.',
    },
    {
      id: 'style',
      title: 'Style',
      whatItMeasures: 'Whether the replies match the communication style selected for the character.',
      whyItMatters:
        'For example, a short and playful style should not suddenly turn into long and formal essays.',
      howWeTest:
        'We select one communication style for each of the five chats. We review all 20 replies in every conversation. A reply passes when it clearly matches the selected style. This creates 100 style checks in total.',
      whatWeCount: [
        'Reply length that matches the selected style',
        'Wording that fits the chosen tone',
        'The style stays clear throughout the chat',
        'Natural changes that still fit the same overall style',
      ],
      whatWeDoNotCount: [
        'The selected style only appearing in the first reply',
        'Every character sounding exactly the same',
        'Sudden changes from casual to formal',
        'Long replies when a short style was selected',
        'Generic replies with no clear communication style',
      ],
      displayedResult: '82 of 100 replies matched the selected style',
      displayedResultExtra: 'Style result: 82%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 82% scores 8.2/10.',
      showWhyItMatters: false,
      edgeCases:
        'Style and Personality are connected, but they are not the same. Personality is who the character is. Style is how she communicates.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Realism is partly based on judgement. Different users may prefer different reply lengths, writing styles, or levels of detail.',
      'We reduce this problem by using the same checks for every app.',
      'Chat quality can also change between characters. One character may feel very natural while another feels robotic, even when they use the same platform.',
      'We test five different characters to reduce the effect of one unusually strong or weak character.',
      'Realism also changes depending on the conversation. An AI may perform well during casual chat but struggle with emotional topics or longer roleplays.',
      'Our results show how the platform performed during the fixed test on the recorded test date.',
    ],
  },
};

const chatReliability: TestSubscoreMethodologyContent = {
  categoryKey: 'chat',
  subscoreSlug: 'reliability',
  heroIntro: [
    'Reliability measures how well the chat works without annoying technical problems.',
    'A conversation can feel natural at first, but the experience quickly falls apart when the AI repeats itself, refuses normal messages, takes forever to reply, contradicts earlier details, or sends broken answers.',
    'We also check whether the AI can understand a correction and recover after getting something wrong.',
  ],
  whyItMatters: {
    title: 'Why Reliability matters',
    paragraphs: [
      'Even a good AI girlfriend becomes frustrating when the chat does not work properly.',
      'You may be having a great conversation, and then the AI suddenly repeats the same sentence, forgets what it said five messages earlier, or sends an answer that has nothing to do with the chat.',
      'Slow replies are also annoying. Waiting a few seconds is normal, but regularly waiting 10 or 20 seconds can make the conversation feel dead.',
      'Refusals can be another problem. We are not testing whether the AI allows everything. We send messages that should be allowed under the platform\u2019s own rules and check whether the AI still refuses them for no clear reason.',
      'A reliable chat should respond quickly, avoid repeating itself, keep important details consistent, and recover when you correct a mistake.',
    ],
  },
  howWeTest: {
    title: 'How we test Reliability',
    paragraphs: [
      'We use the same five chats from the Understanding and Realism tests.',
      'Each chat contains 20 AI replies, giving us 100 replies to review.',
      'We check those replies for repeated sentences or ideas, broken or unrelated answers, and contradictions with earlier facts.',
      'We also create one clear misunderstanding in each chat and correct the AI to see whether it can recover.',
      'For the separate refusal test, we send 25 allowed prompts and count how many are refused without a valid reason.',
      'For Reply Speed, we time 25 replies and use the median result. The median is the middle result after the times are placed in order, so one unusually fast or slow reply does not control the score.',
      'Repetition, Refusals, and Errors are displayed per 50 replies or prompts. When the test uses a different sample size, we convert the result to the same public unit so platforms remain easy to compare.',
    ],
  },
  highLowScore: {
    title: 'What good Reliability looks like',
    paragraphs: [
      'A high Reliability score means problems are rare, replies arrive quickly, and the AI can recover when something goes wrong.',
      'A lower score means the chat regularly repeats itself, refuses normal messages, contradicts earlier details, or sends broken replies.',
    ],
  },
  scoreCalculation: {
    title: 'How the Reliability score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Reliability score.',
    ],
    evidenceWeights: [
      { label: 'Repetition', weight: 17 },
      { label: 'Refusals', weight: 17 },
      { label: 'Reply Speed', weight: 17 },
      { label: 'Errors', weight: 17 },
      { label: 'Consistency', weight: 16 },
      { label: 'Recovery', weight: 16 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by how much it counts and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Reliability is organized into 6 evidence groups. Each group contains one scored test: Repetition, Refusals, Reply Speed, Errors, Consistency, and Recovery.',
    sectionIntro: 'Reliability has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    repetition: {
      intro: [
        'Repetition measures how often the AI repeats the same sentence, idea, or type of reply without a good reason.',
      ],
      whyItMatters:
        'A repeated phrase once in a long conversation is not a major problem. Repeated answers become frustrating when they make the chat feel stuck or scripted.',
    },
    refusals: {
      intro: ['Refusals measures how often the AI refuses a message that should be allowed.'],
      whyItMatters:
        'This does not test whether the platform is completely unfiltered. We only count refusals when the prompt follows the app\u2019s own rules.',
    },
    'reply-speed': {
      intro: ['Reply Speed measures how long the AI normally takes to finish its response.'],
      whyItMatters:
        'Fast replies help the conversation feel natural. Long waits can make even a good chat feel slow and awkward.',
    },
    errors: {
      intro: ['Errors measures how often the AI sends a broken or unusable reply.'],
      whyItMatters:
        'This includes answers that are cut off, empty, nonsensical, or completely unrelated to the conversation.',
    },
    consistency: {
      intro: [
        'Consistency measures how often the AI contradicts facts already established in the conversation.',
      ],
      whyItMatters:
        'The AI may remember a fact correctly at first but later say something that directly conflicts with it.',
    },
    recovery: {
      intro: ['Recovery measures whether the AI can fix a misunderstanding after you correct it.'],
      whyItMatters:
        'Everyone makes mistakes. The important part is whether the AI listens to the correction or continues giving the wrong answer.',
    },
  },
  evidenceSections: [
    {
      id: 'repetition',
      title: 'Repetition',
      whatItMeasures:
        'How often the AI repeats the same sentence, idea, or type of reply without a good reason.',
      whyItMatters:
        'A repeated phrase once in a long conversation is not a major problem. Repeated answers become frustrating when they make the chat feel stuck or scripted.',
      howWeTest:
        'We review all 100 replies from the five chats. We count replies that repeat the same sentence, the same main idea, the same answer structure, or a previous reply with only a few words changed. We then convert the result to a rate per 50 replies.',
      whatWeCount: [
        'Reusing almost the same full reply',
        'Repeating the same advice or idea several times',
        'Sending the same opening or ending again and again',
        'Rewriting an earlier answer without adding anything useful',
      ],
      whatWeDoNotCount: [
        'Repeating an important detail when it makes sense',
        'Referring back to something said earlier',
        'Using the same character catchphrase occasionally',
        'Similar wording when the answer itself is different',
        'Repeating something because the user asked again',
      ],
      displayedResult: '2 repetition problems per 50 replies',
      displayedResultExtra: '4 repeated replies out of 100',
      scoringEvidenceSlug: 'repetition',
      scoringIntro: 'Fewer repetition problems means a higher score.',
      scoringFootnote: 'A result of 2 repetition problems per 50 replies scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'We report repetition per 50 replies so results remain easy to compare, even when the full test contains 100 replies.',
    },
    {
      id: 'refusals',
      title: 'Refusals',
      whatItMeasures: 'How often the AI refuses a message that should be allowed.',
      whyItMatters:
        'This does not test whether the platform is completely unfiltered. We only count refusals when the prompt follows the app\u2019s own rules.',
      howWeTest:
        'We send 25 different prompts that should be allowed under the platform\u2019s current policies. We count how many prompts receive an unnecessary refusal. We then convert the result to a rate per 50 prompts so every platform uses the same scoring unit.',
      whatWeCount: [
        'Refusing a harmless request without explaining why',
        'Blocking a normal roleplay that follows the rules',
        'Refusing a prompt that the platform says is allowed',
        'Repeatedly changing the subject instead of responding',
      ],
      whatWeDoNotCount: [
        'Refusing content that clearly breaks the platform\u2019s rules',
        'Warning the user while still answering the allowed part',
        'A temporary technical error',
        'Asking for clarification when the prompt is unclear',
      ],
      displayedResult: '2 refusals per 50 prompts',
      displayedResultExtra: '1 unnecessary refusal out of 25 prompts',
      scoringEvidenceSlug: 'refusals',
      scoringIntro: 'Fewer unnecessary refusals means a higher score.',
      scoringFootnote: 'A result of 2 refusals per 50 prompts scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'One refusal in our 25-prompt test equals two refusals per 50 prompts for scoring.',
    },
    {
      id: 'reply-speed',
      title: 'Reply Speed',
      whatItMeasures: 'How long the AI normally takes to finish its response.',
      whyItMatters:
        'Fast replies help the conversation feel natural. Long waits can make even a good chat feel slow and awkward.',
      howWeTest:
        'We time 25 replies. The timer starts when the message is sent and stops when the full AI reply has finished appearing. We use the median reply time.',
      whatWeCount: [
        'The full wait from sending the message to the completed reply',
        'Normal text replies during the paid test',
        'Loading and typing time shown by the platform',
      ],
      whatWeDoNotCount: [
        'Time spent writing the user\u2019s message',
        'Image, voice, or video generation',
        'Replies affected by a confirmed internet outage',
        'A result recorded before the full response finishes',
      ],
      displayedResult: 'Median reply time: 3.4 seconds',
      scoringEvidenceSlug: 'reply-speed',
      scoringIntro: 'Faster replies mean a higher score.',
      scoringFootnote: 'A median reply time of 3.4 seconds scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'We use the median instead of the average. This prevents one unusually slow or fast reply from changing the result too much.',
    },
    {
      id: 'errors',
      title: 'Errors',
      whatItMeasures: 'How often the AI sends a broken or unusable reply.',
      whyItMatters:
        'This includes answers that are cut off, empty, nonsensical, or completely unrelated to the conversation.',
      howWeTest:
        'We review all 100 replies from the five chats. We count replies that are cut off, empty, broken, nonsensical, or unrelated to the conversation. We then convert the result to errors per 50 replies.',
      whatWeCount: [
        'A reply that stops halfway through',
        'An empty message',
        'Broken formatting that makes the answer unreadable',
        'Random or nonsensical text',
        'An answer with no clear connection to the chat',
      ],
      whatWeDoNotCount: [
        'A reply we personally dislike',
        'A short answer that still makes sense',
        'A factual mistake that does not break the reply',
        'A valid refusal, which is tested separately',
        'Repetition, which is tested separately',
      ],
      displayedResult: '1 error per 50 replies',
      displayedResultExtra: '2 errors out of 100 replies',
      scoringEvidenceSlug: 'errors',
      scoringIntro: 'Fewer errors means a higher score.',
      scoringFootnote: 'A result of 1 error per 50 replies scores 9/10.',
      showWhyItMatters: false,
      edgeCases:
        'A reply is only counted once, even when it contains more than one problem.',
    },
    {
      id: 'consistency',
      title: 'Consistency',
      whatItMeasures: 'How often the AI contradicts facts already established in the conversation.',
      whyItMatters:
        'The AI may remember a fact correctly at first but later say something that directly conflicts with it.',
      howWeTest:
        'We use the same five personal facts from the Understanding test in each of the five chats. Later in the conversation, we check whether the AI contradicts any of those facts. This creates 25 consistency checks.',
      whatWeCount: [
        'Saying the user lives somewhere different',
        'Changing the user\u2019s name',
        'Referring to the pet by the wrong name',
        'Claiming the user has a different favorite food',
        'Contradicting the established work schedule',
      ],
      whatWeDoNotCount: [
        'Forgetting a fact without contradicting it',
        'Asking the user to confirm something',
        'Correctly updating a fact after the user changes it',
        'A vague reply that does not make a clear claim',
      ],
      displayedResult: '2 contradictions across 25 checks',
      displayedResultExtra: 'Contradiction rate: 8%',
      scoringIntro: 'Fewer contradictions means a higher score.',
      scoringLines: ['0% = 10/10', '20% = 8/10', '40% = 6/10', '60% = 4/10', '80% = 2/10', '100% = 0/10'],
      scoringNote: 'The exact percentage is used between these points.',
      scoringFootnote: 'A contradiction rate of 8% scores 9.2/10.',
      showWhyItMatters: false,
      edgeCases:
        'Memory and Consistency are different. Memory checks whether the AI can recall a fact. Consistency checks whether it later says something that conflicts with that fact.',
    },
    {
      id: 'recovery',
      title: 'Recovery',
      whatItMeasures: 'Whether the AI can fix a misunderstanding after you correct it.',
      whyItMatters:
        'Everyone makes mistakes. The important part is whether the AI listens to the correction or continues giving the wrong answer.',
      howWeTest:
        'We create one clear misunderstanding in each of the five chats. We correct the AI immediately afterward. The test passes when the AI understands the correction and responds properly within its next two replies.',
      whatWeCount: [
        'Clearly accepting the correction',
        'Using the corrected information afterward',
        'Fixing the mistake within two replies',
        'Continuing the conversation without repeating the same error',
      ],
      whatWeDoNotCount: [
        'Saying sorry but continuing with the wrong information',
        'Ignoring the correction',
        'Fixing one detail while repeating the main mistake',
        'Only correcting the mistake after being told several times',
      ],
      displayedResult: '4 of 5 recovery tests passed',
      displayedResultExtra: 'Recovery result: 80%',
      scoringIntro: 'A higher recovery rate means a higher score.',
      scoringLines: [
        '0 of 5 = 0/10',
        '1 of 5 = 2/10',
        '2 of 5 = 4/10',
        '3 of 5 = 6/10',
        '4 of 5 = 8/10',
        '5 of 5 = 10/10',
      ],
      scoringFootnote: 'A result of 4 passed recovery tests scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'The AI does not need to use one exact apology. It only needs to understand the correction and act on it.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Chat reliability can change depending on your internet connection, device, and the time of day.',
      'A slow reply does not always mean the AI model itself is slow. The platform may be busy, or the connection may be unstable. Timing several replies helps reduce the effect of one unusual result.',
      'Repetition can also be reasonable in some situations. The AI may repeat an important fact when the conversation calls for it. We only count repetition when the same sentence, idea, or reply structure is reused without a clear reason.',
      'A refusal is only counted when the message should be allowed under the platform\u2019s own rules. We do not lower the score because the app refuses content that clearly breaks its policies.',
      'Reliability can also differ between characters. We use five different characters to reduce the effect of one unusually strong or weak chat.',
      'Our results show how the platform performed during the fixed test on the recorded test date.',
    ],
  },
};

const chatFeaturesMedia: TestSubscoreMethodologyContent = {
  categoryKey: 'chat-features',
  subscoreSlug: 'media',
  heroIntro: [
    'Media measures what you and the AI character can send inside the chat.',
    'A normal text chat can start to feel basic after a while. Images, voice messages, videos, GIFs, and reactions make the conversation feel more personal and much more immersive.',
    'We do not only check whether an app advertises these features. We try each one three times to see whether it actually works.',
  ],
  whyItMatters: {
    title: 'Why Media matters',
    paragraphs: [
      'Media makes an AI girlfriend chat feel like more than a normal chatbot.',
      'Receiving a photo can make the conversation feel more visual. A voice message lets you hear the character\u2019s personality instead of only reading it. Video can make the whole experience feel much more immersive.',
      'The difference between apps can also be huge.',
      'Some AI girlfriend apps let you send photos, receive voice replies, request videos, and react to messages without leaving the conversation. Others only offer basic text chat, even though their homepage makes the app look much more advanced.',
      'These features also do not always work reliably. An app may claim that characters can send images, but the request fails twice out of three attempts. Voice replies may only work with certain characters, or video may be locked behind an extra payment.',
      'That is why we try every feature instead of only checking whether there is a button for it.',
    ],
  },
  howWeTest: {
    title: 'How we test Media',
    paragraphs: [
      'We use a paid account and test every available media feature inside the chat.',
      'We try each feature three times in separate conversations.',
      'For media sent by the user, we upload or record three different files.',
      'For media received from the character, we make the same request in three separate chats and record whether the character sends the requested result.',
      'We record whether all three attempts worked, whether only some attempts worked, any important restrictions, whether credits were used, and whether the media appeared properly inside the conversation.',
      'The current guided test includes Images Sent, Images Received, Voice Sent, Voice Received, Chat Video, GIFs, and Reactions.',
    ],
  },
  highLowScore: {
    title: 'What good Media looks like',
    paragraphs: [
      'A high Media score means images, voice messages, videos, GIFs, and reactions work reliably inside the chat.',
      'A lower score means important media features are missing, only work with certain characters, or regularly fail during normal use.',
    ],
  },
  scoreCalculation: {
    title: 'How the Media score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Media score.',
      'The live methodology gives more weight to media you receive from the character than media you send yourself.',
    ],
    evidenceWeights: [
      { label: 'Images Sent', weight: 7 },
      { label: 'Images Received', weight: 21 },
      { label: 'Voice Sent', weight: 7 },
      { label: 'Voice Received', weight: 23 },
      { label: 'Chat Video', weight: 20 },
      { label: 'GIFs', weight: 2 },
      { label: 'Reactions', weight: 20 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets one of these scores: Yes \u2014 10/10, Limited \u2014 5/10, No \u2014 0/10, or Unknown \u2014 0/10. We multiply every score by how much it counts and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If the app clearly does not support the underlying feature, the related test may be removed and its weight is spread across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot confirm whether a feature works, it receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Media is organized into 7 evidence groups. Each group contains one scored test: Images Sent, Images Received, Voice Sent, Voice Received, Chat Video, GIFs, and Reactions.',
    sectionIntro: 'Media has 7 evidence groups made up of 7 scored tests.',
  },
  evidenceGroupContent: {
    'images-sent': {
      intro: ['Images Sent measures whether you can send your own images to the AI character.'],
      whyItMatters:
        'This can make the conversation more personal because you can show the character what you are talking about instead of trying to explain everything with text.',
    },
    'images-received': {
      intro: ['Images Received measures whether the AI character can send images inside the chat.'],
      whyItMatters:
        'This is one of the most popular chat features because it lets the conversation become visual without opening a separate image generator.',
    },
    'voice-sent': {
      intro: ['Voice Sent measures whether you can send your own voice messages to the character.'],
      whyItMatters:
        'Speaking can feel easier and more natural than typing, especially during longer conversations.',
    },
    'voice-received': {
      intro: ['Voice Received measures whether the AI character can reply with a voice message.'],
      whyItMatters:
        'Hearing the character can make the conversation feel much more personal and helps the selected voice and personality come to life.',
    },
    'chat-video': {
      intro: ['Chat Video measures whether the AI character can send or generate a video inside the conversation.'],
      whyItMatters: 'This can make the chat feel much more immersive than receiving another static image.',
    },
    gifs: {
      intro: ['GIFs measures whether animated GIFs can be sent and received inside the chat.'],
      whyItMatters:
        'GIFs are a small feature, but they can make casual conversations feel more expressive and less robotic.',
    },
    reactions: {
      intro: ['Reactions measures whether users can react directly to chat messages.'],
      whyItMatters:
        'Reactions make it easier to respond quickly without sending another full message. They also make the chat feel closer to a normal messaging app.',
    },
  },
  evidenceSections: [
    {
      id: 'images-sent',
      title: 'Images Sent',
      whatItMeasures: 'Whether you can send your own images to the AI character.',
      whyItMatters:
        'This can make the conversation more personal because you can show the character what you are talking about instead of trying to explain everything with text.',
      howWeTest:
        'We send three different image files in three separate chats. We check whether every image uploads, appears in the conversation, and can be understood by the character.',
      whatWeCount: [
        'Uploading an image from your device',
        'Sending the image inside a normal chat',
        'The image appearing properly in the conversation',
        'The character responding to the image',
      ],
      whatWeDoNotCount: [
        'Uploading a profile picture',
        'Adding an image during character creation',
        'Sharing an outside link instead of the actual file',
        'An upload button that repeatedly fails',
        'Images that appear in chat but cannot be seen by the AI',
      ],
      displayedResult: 'Yes \u2014 all 3 images were sent successfully',
      scoringLines: [
        'Yes \u2014 all three attempts worked = 10/10',
        'Limited \u2014 only some attempts worked or restrictions were important = 5/10',
        'No \u2014 none of the attempts worked = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Images Sent scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'We use different images for all three attempts. This helps us check whether the feature works normally instead of passing because of one lucky upload.',
    },
    {
      id: 'images-received',
      title: 'Images Received',
      whatItMeasures: 'Whether the AI character can send images inside the chat.',
      whyItMatters:
        'This is one of the most popular chat features because it lets the conversation become visual without opening a separate image generator.',
      howWeTest:
        'We request one image in three separate chats. We check whether the image is received inside the conversation and whether important restrictions affect the feature.',
      whatWeCount: [
        'A generated image sent by the character',
        'A character image that appears inside the chat',
        'An image created from the conversation or request',
        'Media that can be opened and viewed normally',
      ],
      whatWeDoNotCount: [
        'An image created only through a separate generator',
        'A link that sends the user to another page',
        'A profile image that was already visible before the request',
        'An image request that uses credits but produces nothing',
        'A text reply saying an image was sent when no image appears',
      ],
      displayedResult: 'Limited \u2014 images were received in 2 of 3 chats',
      scoringLines: [
        'Yes \u2014 images were received in all three chats = 10/10',
        'Limited \u2014 only some attempts worked or restrictions applied = 5/10',
        'No \u2014 no images were received = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Images Received scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether images can be received in chat. Image quality and prompt accuracy are tested separately under Images.',
    },
    {
      id: 'voice-sent',
      title: 'Voice Sent',
      whatItMeasures: 'Whether you can send your own voice messages to the character.',
      whyItMatters:
        'Speaking can feel easier and more natural than typing, especially during longer conversations.',
      howWeTest:
        'We send three voice messages in three separate chats. We check whether each recording is sent properly and whether the character can respond to what was said.',
      whatWeCount: [
        'Recording a voice message inside the app',
        'Uploading an accepted voice file',
        'The message appearing and playing inside the chat',
        'The AI understanding the spoken message',
      ],
      whatWeDoNotCount: [
        'Voice calls',
        'Text-to-speech playback of a typed message',
        'Uploading audio outside the conversation',
        'Recordings that send but cannot be played',
        'A microphone button that does not create a message',
      ],
      displayedResult: 'Yes \u2014 all 3 voice messages were sent successfully',
      scoringLines: [
        'Yes \u2014 all three attempts worked = 10/10',
        'Limited \u2014 only some attempts worked or restrictions applied = 5/10',
        'No \u2014 voice messages could not be sent = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Voice Sent scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Voice messages and live voice calls are different features. Voice calls are tested under Interaction.',
    },
    {
      id: 'voice-received',
      title: 'Voice Received',
      whatItMeasures: 'Whether the AI character can reply with a voice message.',
      whyItMatters:
        'Hearing the character can make the conversation feel much more personal and helps the selected voice and personality come to life.',
      howWeTest:
        'We request a voice reply in three separate chats. We check whether the message arrives, can be played, and is clearly connected to the conversation.',
      whatWeCount: [
        'A voice message sent inside the chat',
        'A playable audio response from the character',
        'Speech that matches the written or spoken conversation',
        'Voice replies available through normal use',
      ],
      whatWeDoNotCount: [
        'A live phone call',
        'Reading a text reply aloud with the device\u2019s accessibility tools',
        'Voice previews inside the character creator',
        'Audio that cannot be played',
        'A generic sound clip with no spoken reply',
      ],
      displayedResult: 'Yes \u2014 voice replies worked in all 3 chats',
      scoringLines: [
        'Yes \u2014 all three attempts worked = 10/10',
        'Limited \u2014 only some attempts worked or restrictions applied = 5/10',
        'No \u2014 no voice replies were received = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Voice Received scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether voice replies work. The number of available voices is tested under Customization, while voice pricing is tested under Pricing.',
    },
    {
      id: 'chat-video',
      title: 'Chat Video',
      whatItMeasures: 'Whether the AI character can send or generate a video inside the conversation.',
      whyItMatters: 'This can make the chat feel much more immersive than receiving another static image.',
      howWeTest:
        'We request one video in three separate chats. We check whether the video appears inside the chat, plays properly, and is available through normal use.',
      whatWeCount: [
        'A generated video sent inside the chat',
        'A playable video reply from the character',
        'Video requested through the normal conversation',
        'A finished result that can be viewed without leaving the chat',
      ],
      whatWeDoNotCount: [
        'Video available only through a separate generator',
        'Pre-recorded marketing clips',
        'A link to an outside video page',
        'A failed generation that still uses credits',
        'A static image labelled as a video',
      ],
      displayedResult: 'No \u2014 no video was received in any of the 3 chats',
      scoringLines: [
        'Yes \u2014 videos were received in all three chats = 10/10',
        'Limited \u2014 only some attempts worked or restrictions applied = 5/10',
        'No \u2014 no chat videos were received = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Chat Video scores 0/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether chat video is available. Video length, motion, quality, and prompt accuracy are tested separately under Video.',
    },
    {
      id: 'gifs',
      title: 'GIFs',
      whatItMeasures: 'Whether animated GIFs can be sent and received inside the chat.',
      whyItMatters:
        'GIFs are a small feature, but they can make casual conversations feel more expressive and less robotic.',
      howWeTest:
        'We try to send and receive one GIF in three separate chats. We check whether the GIF appears properly and plays inside the conversation.',
      whatWeCount: [
        'Sending a GIF from the app\u2019s GIF picker',
        'Uploading an accepted GIF file',
        'Receiving an animated GIF from the character',
        'The animation playing inside the chat',
      ],
      whatWeDoNotCount: [
        'A still image taken from a GIF',
        'An outside link that does not play in the chat',
        'Stickers or emojis',
        'Video files',
        'A GIF button that opens but cannot send anything',
      ],
      displayedResult: 'Limited \u2014 GIFs could be sent, but the character could not send one back',
      scoringLines: [
        'Yes \u2014 sending and receiving worked properly = 10/10',
        'Limited \u2014 only part of the feature worked = 5/10',
        'No \u2014 GIFs were not supported = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, GIFs scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'GIFs only count for 2% of Media because they add less to the experience than images, voice replies, or video.',
    },
    {
      id: 'reactions',
      title: 'Reactions',
      whatItMeasures: 'Whether users can react directly to chat messages.',
      whyItMatters:
        'Reactions make it easier to respond quickly without sending another full message. They also make the chat feel closer to a normal messaging app.',
      howWeTest:
        'We try to react to three separate messages. We check whether each reaction saves properly and remains visible after reopening or refreshing the conversation.',
      whatWeCount: [
        'Emoji reactions attached to a specific message',
        'Likes, hearts, or other reaction choices',
        'Reactions that remain visible inside the chat',
        'Reactions available to normal users',
      ],
      whatWeDoNotCount: [
        'Sending an emoji as a new message',
        'Liking a character profile',
        'Rating an AI reply outside the conversation',
        'Reactions that disappear immediately',
        'Decorative animations that are not linked to a message',
      ],
      displayedResult: 'Yes \u2014 all 3 message reactions worked',
      scoringLines: [
        'Yes \u2014 all three reactions worked = 10/10',
        'Limited \u2014 only some worked or choices were heavily restricted = 5/10',
        'No \u2014 message reactions were not available = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Reactions scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'A simple emoji message is not counted as a reaction. The reaction must be attached to a specific message.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Media features can be different depending on the character, device, or subscription.',
      'A voice feature may work on the mobile app but not on desktop. Some characters may support images while others do not.',
      'A feature may also technically work but still have important restrictions. For example, users may only be able to send certain file types, or the character may only send pre-made images instead of generating something based on the conversation.',
      'We record these restrictions and use Limited when the feature exists but does not work properly in every test.',
      'This score checks whether media can be exchanged inside the chat. The actual quality of generated images and videos is tested separately under Images and Video.',
      'Media costs are also tested separately under Pricing.',
    ],
  },
};

const chatFeaturesInteraction: TestSubscoreMethodologyContent = {
  categoryKey: 'chat-features',
  subscoreSlug: 'interaction',
  heroIntro: [
    'Interaction measures how much the AI can do beyond sending one normal reply at a time.',
    'We check whether you can make voice calls, use different chat modes, create group chats, receive multiple messages, and get messages from the character without writing first.',
    'These features can make the app feel much more like a real relationship and less like a basic chatbot.',
  ],
  whyItMatters: {
    title: 'Why Interaction matters',
    paragraphs: [
      'The best AI girlfriend apps do more than wait for you to send a message.',
      'Voice calls let you have a real-time conversation. Chat modes can change how the character behaves. Group chats let several characters take part in the same conversation.',
      'Smaller details also make a big difference.',
      'Double texting feels more natural than receiving one large block of text every time. Proactive messages make the character feel more alive because she can message you without waiting for you to start every conversation.',
      'The difference between apps is huge. One platform may offer calls, several useful chat modes, and characters that message you first. Another may still work like a basic chatbot where every interaction starts and ends with one text reply.',
      'That is why we test whether these features are actually available and whether they work properly.',
    ],
  },
  howWeTest: {
    title: 'How we test Interaction',
    paragraphs: [
      'We use a paid account and test every available interaction feature.',
      'For Voice Calls, we start three calls on three different days. We record whether each call connects and the longest call length the app allows.',
      'For Chat Modes, we count every mode that clearly changes how the conversation works.',
      'We then test two modes with five messages each. We rate whether each mode works well, partly works, or barely changes the chat.',
      'For Group Chat, we create three conversations and try adding two AI characters, three AI characters, and four AI characters.',
      'During normal chat testing, we count how often the AI sends two or more separate messages before we reply.',
      'Finally, we keep three chats open for seven days without sending anything. We record every message the characters send without a new user message.',
    ],
  },
  highLowScore: {
    title: 'What good Interaction looks like',
    paragraphs: [
      'A high Interaction score means the app gives you several useful ways to interact with the character beyond normal text chat.',
      'A lower score means the experience is mostly limited to sending one message and receiving one reply.',
    ],
  },
  scoreCalculation: {
    title: 'How the Interaction score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Interaction score.',
      'Voice Calls has the highest weight. Group Chat has the lowest weight.',
    ],
    evidenceWeights: [
      { label: 'Voice Calls', weight: 27 },
      { label: 'Chat Modes', weight: 22 },
      { label: 'Mode Types', weight: 17 },
      { label: 'Group Chat', weight: 5 },
      { label: 'Double Texting', weight: 15 },
      { label: 'Proactive Messages', weight: 14 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by how much it counts and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests. Mode Types is automatically marked Not Applicable when the app has one chat mode or fewer.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Interaction is organized into 6 evidence groups. Each group contains one scored test: Voice Calls, Chat Modes, Mode Types, Group Chat, Double Texting, and Proactive Messages.',
    sectionIntro: 'Interaction has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    'voice-calls': {
      intro: ['Voice Calls measures whether you can have a live voice conversation with the AI character.'],
      whyItMatters:
        'A proper voice call should feel like a real-time conversation rather than sending separate recorded voice messages.',
    },
    'chat-modes': {
      intro: ['Chat Modes measures how many different ways you can change how the conversation works.'],
      whyItMatters:
        'Examples could include romantic chat, roleplay, storytelling, assistant mode, or other modes that clearly change the AI\u2019s behavior.',
    },
    'mode-types': {
      intro: ['Mode Types measures whether the available chat modes actually work.'],
      whyItMatters:
        'An app can list several modes, but they are not useful when every mode produces almost the same replies.',
    },
    'group-chat': {
      intro: ['Group Chat measures whether several AI characters can join the same conversation.'],
      whyItMatters:
        'This can be useful for group roleplays, stories, or conversations where several characters interact with one another.',
    },
    'double-texting': {
      intro: ['Double Texting measures how often the AI sends more than one separate message before you reply.'],
      whyItMatters:
        'This can make the conversation feel more like a real messaging app instead of receiving one large block of text every time.',
    },
    'proactive-messages': {
      intro: ['Proactive Messages measures whether the character can message you without waiting for you to write first.'],
      whyItMatters:
        'This helps the character feel more present instead of disappearing every time you close the app.',
    },
  },
  evidenceSections: [
    {
      id: 'voice-calls',
      title: 'Voice Calls',
      whatItMeasures: 'Whether you can have a live voice conversation with the AI character.',
      whyItMatters:
        'A proper voice call should feel like a real-time conversation rather than sending separate recorded voice messages.',
      howWeTest:
        'We start three voice calls on three different days. For each call, we record whether it connects, whether the audio works, whether the conversation continues normally, and the maximum call length allowed.',
      whatWeCount: [
        'A live two-way voice conversation',
        'Calls started through the normal chat or call screen',
        'The AI responding in real time',
        'Calls available to normal paying users',
      ],
      whatWeDoNotCount: [
        'Recorded voice messages',
        'Text replies read aloud',
        'Voice previews',
        'Pre-recorded audio clips',
        'A call button that never connects',
      ],
      displayedResult: 'Yes \u2014 all 3 calls connected',
      displayedResultExtra: 'Maximum call length: 10 minutes',
      scoringLines: [
        'Yes \u2014 all three calls worked = 10/10',
        'Limited \u2014 only some calls worked or important restrictions applied = 5/10',
        'No \u2014 voice calls were unavailable or none connected = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Voice Calls scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Voice quality is not scored here. This test checks whether live calling works. Voice options, audio quality, and call costs are covered elsewhere.',
    },
    {
      id: 'chat-modes',
      title: 'Chat Modes',
      whatItMeasures: 'How many different ways you can change how the conversation works.',
      whyItMatters:
        'Examples could include romantic chat, roleplay, storytelling, assistant mode, or other modes that clearly change the AI\u2019s behavior.',
      howWeTest:
        'We count every selectable mode that creates a noticeable change in the conversation. A different name or icon is not enough. The mode needs to change how the character responds.',
      whatWeCount: [
        'Modes that change the reply style',
        'Modes that change the type of conversation',
        'Story or roleplay modes',
        'Modes that add clear rules or behavior',
        'Options normal users can select',
      ],
      whatWeDoNotCount: [
        'Minor tone settings',
        'Different names for almost the same mode',
        'Buttons that do not noticeably change the replies',
        'Character personalities',
        'Features that cannot be selected during normal use',
      ],
      displayedResult: '6 chat modes',
      scoringEvidenceSlug: 'chat-modes',
      scoringIntro: 'More working chat modes means a higher score.',
      scoringFootnote: 'A result of 6 chat modes scores 7/10.',
      showWhyItMatters: false,
      edgeCases:
        'Chat Modes measures how many modes exist. Mode Types is a separate test that checks how well the tested modes actually work.',
    },
    {
      id: 'mode-types',
      title: 'Mode Types',
      whatItMeasures: 'Whether the available chat modes actually work.',
      whyItMatters:
        'An app can list several modes, but they are not useful when every mode produces almost the same replies.',
      howWeTest:
        'We select two available modes. We send five messages in each mode and check whether the conversation clearly changes. Each tested mode is rated Good (10 points), Partial (5 points), or Poor (0 points). The Mode Types score is the average of the tested mode ratings.',
      whatWeCount: [
        'The mode clearly changes how the AI responds',
        'The change stays noticeable across several messages',
        'The mode follows its stated purpose',
        'The chat remains usable while the mode is active',
      ],
      whatWeDoNotCount: [
        'A different label with no clear change',
        'One unusual reply followed by normal behavior',
        'A mode that repeatedly breaks',
        'A mode that ignores its own description',
        'Character personality settings',
      ],
      displayedResult: 'Average: 7.5/10',
      displayedResultExtra: 'Romantic Mode: Good \u2014 10 points. Story Mode: Partial \u2014 5 points.',
      scoringIntro: 'We average the tested mode ratings.',
      scoringLines: ['Good = 10/10', 'Partial = 5/10', 'Poor = 0/10'],
      scoringFootnote: 'In this example, Mode Types scores 7.5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Mode Types is marked Not Applicable when the platform has one chat mode or fewer. There is not enough choice to compare how different modes work in that case.',
    },
    {
      id: 'group-chat',
      title: 'Group Chat',
      whatItMeasures: 'Whether several AI characters can join the same conversation.',
      whyItMatters:
        'This can be useful for group roleplays, stories, or conversations where several characters interact with one another.',
      howWeTest:
        'We create three group chats. We try adding two AI characters, three AI characters, and four AI characters. We record whether the chats work and the maximum number of characters supported.',
      whatWeCount: [
        'Several AI characters inside one conversation',
        'Each character clearly identified',
        'Characters responding inside the same chat',
        'Group chats available to normal users',
      ],
      whatWeDoNotCount: [
        'Switching between separate one-to-one chats',
        'One AI pretending to play several characters',
        'A group chat that only includes human users',
        'A feature shown in marketing but unavailable in the app',
      ],
      displayedResult: 'Limited \u2014 chats with 2 and 3 characters worked, but 4 characters were not supported',
      displayedResultExtra: 'Maximum supported: 3 AI characters',
      scoringLines: [
        'Yes \u2014 all three group-chat tests worked = 10/10',
        'Limited \u2014 only some group sizes worked or important restrictions applied = 5/10',
        'No \u2014 group chat was unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Group Chat scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'We also record whether the characters become confused or speak as each other. The main score is based on whether the group-chat feature works and any important limits.',
    },
    {
      id: 'double-texting',
      title: 'Double Texting',
      whatItMeasures: 'How often the AI sends more than one separate message before you reply.',
      whyItMatters:
        'This can make the conversation feel more like a real messaging app instead of receiving one large block of text every time.',
      howWeTest:
        'During normal chat testing, we send a message and wait without replying. We count each time the character sends two or more separate messages before our next message. The result is shown per 100 user messages.',
      whatWeCount: [
        'Two or more separate messages sent before the user replies',
        'Follow-up messages that add something useful',
        'Messages that arrive naturally as part of one reply',
      ],
      whatWeDoNotCount: [
        'One long message split visually by paragraphs',
        'Notifications about credits or app updates',
        'Duplicate messages caused by an error',
        'Several messages sent only after the user replies again',
        'System messages',
      ],
      displayedResult: '12 double-texting moments per 100 user messages',
      scoringEvidenceSlug: 'double-texting',
      scoringIntro: 'More double-texting moments means a higher score.',
      scoringFootnote: 'A result of 12 double-texting moments scores 7/10.',
      showWhyItMatters: false,
      edgeCases:
        'More double texting is not always better. It should feel natural and add something to the conversation rather than breaking one basic sentence into several pointless messages.',
    },
    {
      id: 'proactive-messages',
      title: 'Proactive Messages',
      whatItMeasures: 'Whether the character can message you without waiting for you to write first.',
      whyItMatters:
        'This helps the character feel more present instead of disappearing every time you close the app.',
      howWeTest:
        'We keep three active chats open for seven days. We do not send any new messages during the test. We record every message sent by a character without a new user message.',
      whatWeCount: [
        'A character starting a new conversation',
        'A genuine follow-up to an earlier chat',
        'A message sent without a new user prompt',
        'Messages delivered through the normal chat',
      ],
      whatWeDoNotCount: [
        'Marketing notifications',
        'Payment reminders',
        'System messages',
        'Messages scheduled by the user',
        'A reply delayed from an earlier user message',
        'Push notifications with no message inside the chat',
      ],
      displayedResult: 'Yes \u2014 4 proactive messages arrived during the seven-day test',
      displayedResultExtra: 'Messages appeared in 2 of 3 chats',
      scoringLines: [
        'Yes \u2014 proactive messages worked = 10/10',
        'Limited \u2014 the feature worked with important restrictions = 5/10',
        'No \u2014 no proactive messages arrived or the feature was unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Proactive Messages scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'The result includes the number of proactive messages and how many of the three chats received one. A platform may support the feature but send messages less often than our seven-day test period.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Some Interaction features may only work with certain characters, devices, or subscription plans.',
      'Voice calls can also be affected by internet speed, microphone permissions, or temporary server problems. Testing on three different days helps reduce the effect of one unusual failure.',
      'Chat modes can be difficult to compare because every platform names them differently. We only count a mode when it clearly changes how the chat behaves.',
      'Double texting does not automatically make the chat better. Sending several useful messages can feel natural, but splitting one basic sentence into five tiny messages can become annoying.',
      'Proactive Messages are tested for seven days. A character may support the feature but message less often than that, so we clearly show the test period with the result.',
      'Our results reflect the paid account, characters, and devices used on the recorded test date.',
    ],
  },
};

const chatFeaturesControls: TestSubscoreMethodologyContent = {
  categoryKey: 'chat-features',
  subscoreSlug: 'controls',
  heroIntro: [
    'Controls measures how much control you have over your conversations after a message has already been sent.',
    'Sometimes you make a typo, the AI gives a bad reply, or the app saves the wrong memory. A good platform should let you fix these problems without deleting everything and starting over.',
    'We test whether you can edit, delete, regenerate, save memories, manage memories, reset chats, and export conversations.',
  ],
  whyItMatters: {
    title: 'Why Controls matters',
    paragraphs: [
      'AI chats do not always go perfectly.',
      'You may send a message with a typo, receive a reply you do not like, or notice that the AI saved the wrong information about you.',
      'Without proper controls, your only option may be to continue with the mistake or delete the entire conversation.',
      'Regenerating replies can quickly fix a bad answer. Editing and deleting messages helps you clean up the conversation. Memory controls are especially useful when the AI remembers something incorrectly.',
      'Resetting and exporting are also important. A reset gives you a fresh start, while an export lets you save a conversation before deleting your account or leaving the platform.',
      'Good controls make the app easier to use and give you more ownership over your chats.',
    ],
  },
  howWeTest: {
    title: 'How we test Controls',
    paragraphs: [
      'We use a paid account and test every control three times.',
      'We try to edit three previously sent messages, delete three individual messages, regenerate three AI replies, save three separate memories, view/edit/delete saved memories, reset three conversations, and export three conversations.',
      'We record whether all attempts work, only some attempts work, or the feature is not available.',
      'For exports, we also record which file formats are offered.',
      'Using three attempts helps us catch controls that appear to work but fail during normal use.',
    ],
  },
  highLowScore: {
    title: 'What good Controls looks like',
    paragraphs: [
      'A high Controls score means you can easily fix messages, retry bad replies, manage saved memories, reset conversations, and export your chats.',
      'A lower score means the conversation is mostly locked after messages are sent, or important controls only work in limited situations.',
    ],
  },
  scoreCalculation: {
    title: 'How the Controls score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Controls score.',
      'Edit Messages and Delete Messages count slightly more than the other five tests.',
    ],
    evidenceWeights: [
      { label: 'Edit Messages', weight: 15 },
      { label: 'Delete Messages', weight: 15 },
      { label: 'Regenerate Replies', weight: 14 },
      { label: 'Save Memories', weight: 14 },
      { label: 'Edit Memories', weight: 14 },
      { label: 'Reset Chat', weight: 14 },
      { label: 'Export Chat', weight: 14 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Most tests use the same simple scoring: Yes \u2014 10/10, Limited \u2014 5/10, No \u2014 0/10, or Unknown \u2014 0/10. We multiply every score by how much it counts and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Controls is organized into 7 evidence groups. Each group contains one scored test: Edit Messages, Delete Messages, Regenerate Replies, Save Memories, Edit Memories, Reset Chat, and Export Chat.',
    sectionIntro: 'Controls has 7 evidence groups made up of 7 scored tests.',
  },
  evidenceGroupContent: {
    'edit-messages': {
      intro: ['Edit Messages measures whether you can change a message after sending it.'],
      whyItMatters:
        'This is useful when you make a typo, explain something badly, or want to change the direction of the conversation.',
    },
    'delete-messages': {
      intro: ['Delete Messages measures whether you can remove individual messages from a conversation.'],
      whyItMatters: 'This helps when you send something by mistake without needing to delete the entire chat.',
    },
    'regenerate-replies': {
      intro: ['Regenerate Replies measures whether you can ask the AI for a new answer without sending another message.'],
      whyItMatters:
        'This is useful when the first reply is boring, incorrect, or takes the conversation in the wrong direction.',
    },
    'save-memories': {
      intro: ['Save Memories measures whether you can manually tell the app what the AI should remember.'],
      whyItMatters:
        'This can help the character remember important details such as your name, preferences, relationship, or personal history.',
    },
    'edit-memories': {
      intro: ['Edit Memories measures whether you can see, correct, and remove information the app has saved.'],
      whyItMatters: 'This matters because an incorrect memory can affect every future conversation.',
    },
    'reset-chat': {
      intro: ['Reset Chat measures whether you can restart a conversation with the same character.'],
      whyItMatters:
        'This is useful when the chat has gone in the wrong direction but you do not want to remove the character.',
    },
    'export-chat': {
      intro: ['Export Chat measures whether you can download a copy of your conversations.'],
      whyItMatters:
        'This can be useful when you want to keep an important chat, move away from the platform, or save your data before deleting your account.',
    },
  },
  evidenceSections: [
    {
      id: 'edit-messages',
      title: 'Edit Messages',
      whatItMeasures: 'Whether you can change a message after sending it.',
      whyItMatters:
        'This is useful when you make a typo, explain something badly, or want to change the direction of the conversation.',
      howWeTest:
        'We try to edit three previously sent messages. We check whether each change saves properly and whether the conversation updates afterward.',
      whatWeCount: [
        'Editing a message through the normal chat controls',
        'Correcting the text after it has been sent',
        'The edited version staying visible after reopening the chat',
        'The conversation continuing from the edited message',
      ],
      whatWeDoNotCount: [
        'Deleting the message and sending a new one',
        'Editing text before pressing Send',
        'A temporary change that disappears after refreshing',
        'Editing the character\u2019s profile instead of the chat message',
      ],
      displayedResult: 'Yes \u2014 all 3 messages were edited successfully',
      scoringLines: [
        'Yes \u2014 all three edits worked = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 messages could not be edited = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Edit Messages scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Some platforms only let you edit the latest message. We record this as an important restriction.',
    },
    {
      id: 'delete-messages',
      title: 'Delete Messages',
      whatItMeasures: 'Whether you can remove individual messages from a conversation.',
      whyItMatters: 'This helps when you send something by mistake without needing to delete the entire chat.',
      howWeTest:
        'We try to delete three individual messages. We check whether each message disappears and stays deleted after reopening the conversation.',
      whatWeCount: [
        'Deleting one message at a time',
        'The message being removed from the visible conversation',
        'The deletion remaining after the page is refreshed',
        'A normal control available inside the chat',
      ],
      whatWeDoNotCount: [
        'Deleting the full conversation',
        'Hiding a message only on the current screen',
        'Removing a notification',
        'Deleting the character instead of the message',
      ],
      displayedResult: 'Limited \u2014 user messages could be deleted, but AI replies could not',
      scoringLines: [
        'Yes \u2014 all three deletion tests worked = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 individual messages could not be deleted = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Delete Messages scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'We record whether you can delete user messages, AI replies, or both. A feature may receive Limited when only one message type can be deleted.',
    },
    {
      id: 'regenerate-replies',
      title: 'Regenerate Replies',
      whatItMeasures: 'Whether you can ask the AI for a new answer without sending another message.',
      whyItMatters:
        'This is useful when the first reply is boring, incorrect, or takes the conversation in the wrong direction.',
      howWeTest:
        'We try to regenerate three finished AI replies. We check whether a new reply appears and whether the conversation can continue normally afterward.',
      whatWeCount: [
        'A retry or regenerate button on an AI reply',
        'A new answer replacing or appearing beside the first one',
        'The regenerated reply saving properly',
        'The chat continuing from the selected reply',
      ],
      whatWeDoNotCount: [
        'Deleting the reply and sending the prompt again',
        'Editing the AI reply yourself',
        'Pressing a button that returns the exact same message',
        'Regenerating images instead of chat replies',
      ],
      displayedResult: 'Yes \u2014 all 3 replies were regenerated successfully',
      scoringLines: [
        'Yes \u2014 all three regenerations worked = 10/10',
        'Limited \u2014 only some worked or restrictions applied = 5/10',
        'No \u2014 replies could not be regenerated = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Regenerate Replies scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether regeneration works. How different or useful the new reply is may be mentioned in the review, but the main score is based on feature availability and reliability.',
    },
    {
      id: 'save-memories',
      title: 'Save Memories',
      whatItMeasures: 'Whether you can manually tell the app what the AI should remember.',
      whyItMatters:
        'This can help the character remember important details such as your name, preferences, relationship, or personal history.',
      howWeTest:
        'We try to save three separate memories. We check whether each memory appears in the app and stays saved after reopening the account.',
      whatWeCount: [
        'A manual Add Memory control',
        'Saving a clear personal fact',
        'The memory remaining visible later',
        'Memories available through normal user settings',
      ],
      whatWeDoNotCount: [
        'The AI naturally remembering something during one chat',
        'Hidden memories that users cannot control',
        'Writing the fact in a normal chat message',
        'Character-profile details that are not stored as user memories',
      ],
      displayedResult: 'Limited \u2014 2 of 3 memories were saved',
      scoringLines: [
        'Yes \u2014 all three memories were saved = 10/10',
        'Limited \u2014 only some worked or restrictions applied = 5/10',
        'No \u2014 memories could not be saved manually = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Save Memories scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Natural chat memory is tested under Understanding. This test only checks whether users can manually save information.',
    },
    {
      id: 'edit-memories',
      title: 'Edit Memories',
      whatItMeasures: 'Whether you can see, correct, and remove information the app has saved.',
      whyItMatters: 'This matters because an incorrect memory can affect every future conversation.',
      howWeTest:
        'We use three saved memories and try to view them, edit them, and delete them. We record which actions are supported.',
      whatWeCount: [
        'A visible list of saved memories',
        'Editing the text of a saved memory',
        'Deleting an individual memory',
        'Changes remaining after reopening the app',
      ],
      whatWeDoNotCount: [
        'Asking the AI in chat to forget something',
        'Deleting the full account',
        'Hidden memories that users cannot view',
        'Changing the character\u2019s personality instead of a saved memory',
      ],
      displayedResult: 'Limited \u2014 memories could be viewed and deleted, but not edited',
      scoringLines: [
        'Yes \u2014 memories can be viewed, edited, and deleted = 10/10',
        'Limited \u2014 only some memory controls are available = 5/10',
        'No \u2014 saved memories cannot be managed = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Edit Memories scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'If the platform does not let users save memories, Edit Memories receives a score of 0. A platform may receive Limited when memories can be viewed but not edited or deleted.',
    },
    {
      id: 'reset-chat',
      title: 'Reset Chat',
      whatItMeasures: 'Whether you can restart a conversation with the same character.',
      whyItMatters:
        'This is useful when the chat has gone in the wrong direction but you do not want to remove the character.',
      howWeTest:
        'We try to reset three separate conversations. We check whether the old messages are cleared and whether a fresh conversation starts properly.',
      whatWeCount: [
        'A reset or restart control for the conversation',
        'Old chat messages being cleared',
        'A fresh opening message or empty chat appearing',
        'The same character remaining available afterward',
      ],
      whatWeDoNotCount: [
        'Creating a separate chat while leaving the old one active',
        'Deleting the character',
        'Manually deleting every message',
        'Clearing only the current screen without resetting the conversation',
      ],
      displayedResult: 'Yes \u2014 all 3 chats reset successfully',
      scoringLines: [
        'Yes \u2014 all three resets worked = 10/10',
        'Limited \u2014 only some worked or restrictions applied = 5/10',
        'No \u2014 conversations could not be reset = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Reset Chat scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Some apps keep saved memories after a reset, while others remove everything. We record what happens so users know whether Reset Chat means a fresh conversation or a completely fresh start.',
    },
    {
      id: 'export-chat',
      title: 'Export Chat',
      whatItMeasures: 'Whether you can download a copy of your conversations.',
      whyItMatters:
        'This can be useful when you want to keep an important chat, move away from the platform, or save your data before deleting your account.',
      howWeTest:
        'We try to export three separate conversations. We check whether the export finishes, opens properly, and includes the expected messages. We also record the available file formats.',
      whatWeCount: [
        'Downloading a full conversation',
        'A working export created through normal account controls',
        'Files that open and contain the chat messages',
        'Common formats such as text, PDF, HTML, or JSON',
      ],
      whatWeDoNotCount: [
        'Copying messages manually',
        'Taking screenshots',
        'Exporting account data without the chat content',
        'An export button that creates an empty or broken file',
        'Support sending the chat manually',
      ],
      displayedResult: 'No \u2014 none of the 3 conversations could be exported',
      scoringLines: [
        'Yes \u2014 all three exports worked = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 chats could not be exported = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Export Chat scores 0/10.',
      showWhyItMatters: false,
      edgeCases:
        'A platform may receive Limited when export works but important information is missing or only one conversation can be downloaded.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Controls can work differently depending on the device.',
      'An app may allow message editing on its website but not inside the mobile app.',
      'Some controls also have important limits. For example, you may only be able to edit your most recent message, delete your own messages but not AI replies, or regenerate a reply only once.',
      'We use Limited when a control exists but these restrictions make it noticeably less useful.',
      'Memory controls can also be confusing. Some apps remember information automatically but do not let users view or edit what was saved.',
      'If manual memory saving is unavailable, Edit Memories cannot work normally. The live scoring system gives Edit Memories a score of 0 when Save Memories is recorded as No.',
      'This score checks whether the controls work. It does not judge the quality of regenerated replies or how accurate the AI\u2019s natural memory is. Those are tested separately under Chat.',
    ],
  },
};

const chatFeaturesPlatformExtras: TestSubscoreMethodologyContent = {
  categoryKey: 'chat-features',
  subscoreSlug: 'platform-extras',
  heroIntro: [
    'Platform Extras looks at optional experiences that go beyond normal text chat.',
    'This includes features such as live AI cam, interactive videos, shorts, roulette, and episodic stories. These extras can make an app feel more immersive, but they should not earn points just because they exist.',
    'Only Live Cam affects the score. Other extras are listed in the review but do not add or remove points.',
  ],
  whyItMatters: {
    title: 'Why Platform Extras matters',
    paragraphs: [
      'AI girlfriend technology is moving extremely fast.',
      'A few years ago, even voice messages were uncommon. Apps later added phone calls, interactive videos, and now live webcam-style experiences.',
      'These features can make an app feel more like a full entertainment platform instead of a basic chatbot.',
      'That said, a new feature is not automatically a good feature.',
      'Some apps add flashy buttons that barely work or only exist to sell more credits. Others build extras that are genuinely fun and give you something different to do when you get bored with normal chat.',
      'That is why we test Live Cam and record other notable extras instead of trusting the feature list on the homepage.',
    ],
  },
  howWeTest: {
    title: 'How we test Platform Extras',
    paragraphs: [
      'We use a paid account and open the app\u2019s bonus-feature area.',
      'First, we check whether the platform offers a Live Cam or webcam-style experience with a character on video.',
      'When it is available, we record how the feature is opened, which characters support it, whether the experience works, any important limits, and supporting proof.',
      'We then record any other notable extras, such as shorts, roulette, interactive videos, episodic stories, or other unusual experiences.',
      'For each extra, we save a short name, a simple description, and proof where possible.',
      'Other Extras do not affect the score. They are included because they can still help readers decide whether the app offers something interesting beyond normal chat.',
    ],
  },
  highLowScore: {
    title: 'What good Platform Extras look like',
    paragraphs: [
      'A strong Platform Extras result means the Live Cam is actually available and works like a real webcam-style character experience.',
      'Other extras should also add something useful or entertaining instead of feeling like unfinished marketing features.',
    ],
  },
  scoreCalculation: {
    title: 'How the Platform Extras score is calculated',
    paragraphs: [
      'Platform Extras works differently from most other subscores.',
      'Live Cam is the only scored test. Other extras are recorded so readers can see what else the app offers, but they do not affect the score.',
      'Live Cam is a bonus-only feature. An app is not punished simply because it does not offer one.',
    ],
    evidenceWeights: [
      { label: 'Live Cam', weight: 100 },
      { label: 'Other Extras', weight: 0 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Because Live Cam is the only scored test, the Platform Extras score equals the Live Cam result when it applies. Yes = 10/10, Limited = 6/10, Not offered = Not Applicable with no penalty, and Unknown = 0/10.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not offered',
          body: 'If an app has no Live Cam, we mark the test as Not Applicable. It does not receive a score of 0.',
        },
        {
          title: 'Unknown',
          body: 'If the app claims to offer Live Cam but we cannot confirm whether it works, the result receives 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the normal result does not fairly explain the feature. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Platform Extras includes Live Cam as the only scored test. Other Extras is a reference list that does not affect the score.',
    sectionIntro:
      'Platform Extras has two evidence groups: Live Cam (1 scored test) and Other Extras (1 reference list).',
  },
  evidenceGroupContent: {
    'live-cam': {
      intro: ['Live Cam measures whether the app offers a webcam-style video experience with an AI character.'],
      whyItMatters: 'This should feel different from requesting one generated video inside a normal chat.',
    },
    'other-extras': {
      intro: ['Other Extras records useful or unusual experiences that go beyond standard chat.'],
      whyItMatters:
        'These features are still worth mentioning even though they do not all fit into one fair scoring system.',
    },
  },
  evidenceSections: [
    {
      id: 'live-cam',
      title: 'Live Cam',
      whatItMeasures: 'Whether the app offers a webcam-style video experience with an AI character.',
      whyItMatters: 'This should feel different from requesting one generated video inside a normal chat.',
      howWeTest:
        'We open the Live Cam feature through a paid account. We check whether the feature opens, a character appears on video, the experience can be used normally, important restrictions affect access, and the app clearly shows which characters are supported.',
      whatWeCount: [
        'A live or webcam-style character experience',
        'A character remaining visible during the session',
        'A feature available through normal user access',
        'A working experience that can actually be opened and used',
      ],
      whatWeDoNotCount: [
        'A normal generated video',
        'An image turned into a short animation',
        'A pre-recorded short or story episode',
        'A marketing demo that users cannot access',
        'A voice call without a video character',
        'A button that repeatedly fails to open',
      ],
      displayedResult: 'Yes \u2014 a working Live Cam experience was available',
      scoringLines: [
        'Yes \u2014 works normally = 10/10',
        'Limited \u2014 available with major restrictions = 6/10',
        'Not offered = Not Applicable',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Live Cam scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Live Cam is treated as a bonus. An app without Live Cam is marked Not Applicable instead of receiving 0. This prevents newer experimental technology from unfairly lowering the score of an otherwise strong app.',
    },
    {
      id: 'other-extras',
      title: 'Other Extras',
      whatItMeasures: 'Useful or unusual experiences that go beyond standard chat.',
      whyItMatters:
        'These features are still worth mentioning even though they do not all fit into one fair scoring system.',
      howWeTest:
        'We explore the app and record each notable extra we can access. For every feature, we add a short name, a simple description, an optional note, and supporting proof.',
      whatWeCount: [
        'Shorts',
        'Roulette',
        'Interactive videos',
        'Episodic stories',
        'Mini-games',
        'Other experiences beyond normal chat',
        'Features available to regular users',
      ],
      whatWeDoNotCount: [
        'Standard text chat',
        'Normal image or video generation already tested elsewhere',
        'Small visual changes to the interface',
        'Features announced but not released',
        'Marketing pages for tools we cannot access',
        'Duplicate names for the same feature',
      ],
      displayedResult: 'AI Shorts, Character Roulette, Interactive Stories',
      displayedResultExtra: 'Other extras found in this example',
      referenceOnly: true,
      scoringNote: 'These features are listed for information only.',
      showWhyItMatters: false,
      edgeCases:
        'Other Extras never increase or lower the Platform Extras score. They appear in the review so readers can see what makes the platform different.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Platform extras can depend on the device, subscription, region, or selected character.',
      'A feature may be available on mobile but missing from desktop. Some users may also receive access before others during a slow rollout.',
      'The word “live” can mean different things across platforms. We judge the experience available to normal users rather than guessing which technology runs behind it.',
      'This score mainly checks whether Live Cam is available and usable. It does not fully score video quality, character accuracy, or generation costs. Those details can be discussed in the review and tested under Video or Pricing where relevant.',
      'Bonus features also change quickly. Our results show what was available on the recorded test date.',
    ],
  },
};

const imagesQuality: TestSubscoreMethodologyContent = {
  categoryKey: 'images',
  subscoreSlug: 'quality',
  heroIntro: [
    'Quality measures how good the finished images actually look.',
    'Most image generators can create one impressive result when everything goes right. We generate a full batch because we want to know whether the app can produce good images consistently\u2014not only one lucky image for its homepage.',
    'We check realism, major visual problems, composition, and the highest resolution you can download.',
  ],
  whyItMatters: {
    title: 'Why Quality matters',
    paragraphs: [
      'Images are one of the biggest reasons people sign up for AI girlfriend apps.',
      'The problem is that almost every modern image generator can create something that looks good at first glance. That does not mean it performs well every time.',
      'You may get one great image followed by several with broken hands, damaged faces, strange bodies, or terrible framing.',
      'This becomes even more frustrating when every generation costs credits. A broken image is not only disappointing\u2014it can also mean you need to pay again and hope the next attempt works.',
      'That is why we test a full batch. A strong generator should create good-looking, usable images consistently instead of relying on one lucky result.',
    ],
  },
  howWeTest: {
    title: 'How we test Quality',
    paragraphs: [
      'We use a paid account and generate 10 test images.',
      'We upload every image to the same worksheet and review them one by one.',
      'For each image, we rate visual realism and overall quality, composition and framing, and major defects or visual problems.',
      'We also download the highest-quality image available and record its exact width and height.',
      'Using a batch of 10 images helps reduce luck. One unusually good or bad result cannot control the whole score.',
    ],
  },
  highLowScore: {
    title: 'What good Quality looks like',
    paragraphs: [
      'A high Quality score means the images usually look polished, have few major visual problems, are framed properly, and can be downloaded at a useful resolution.',
      'A lower score means too many images look broken, badly cropped, poorly arranged, or too small to use properly.',
    ],
  },
  scoreCalculation: {
    title: 'How the Quality score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'All four tests count equally. We multiply each test score by 25% and add the points together.',
    ],
    evidenceWeights: [
      { label: 'Realism', weight: 25 },
      { label: 'Visual Errors', weight: 25 },
      { label: 'Composition', weight: 25 },
      { label: 'Resolution', weight: 25 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by 25% and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Quality is organized into 4 evidence groups. Each group contains one scored test: Realism, Visual Errors, Composition, and Resolution. All four tests count equally toward the final Quality score.',
    sectionIntro: 'Quality has 4 evidence groups made up of 4 scored tests.',
  },
  evidenceGroupContent: {
    realism: {
      intro: ['Realism measures how believable and polished the generated images look.'],
      whyItMatters: 'We look at the full image rather than judging only the character\u2019s face.',
    },
    'visual-errors': {
      intro: ['Visual Errors measures how many generated images contain at least one major problem.'],
      whyItMatters:
        'A generation counts as having an error when the problem is serious enough to make the result look clearly broken or difficult to use.',
    },
    composition: {
      intro: ['Composition measures how well the subject and background are arranged inside the image.'],
      whyItMatters:
        'Even a realistic image can be difficult to use when the character is cut off, placed awkwardly, or surrounded by a messy background.',
    },
    resolution: {
      intro: ['Resolution measures the maximum image size you can download.'],
      whyItMatters:
        'A larger image gives you more detail and is easier to crop, edit, or use on a larger screen.',
    },
  },
  evidenceSections: [
    {
      id: 'realism',
      title: 'Realism',
      whatItMeasures: 'How believable and polished the generated images look.',
      whyItMatters: 'We look at the full image rather than judging only the character\u2019s face.',
      howWeTest:
        'We rate every image from 1 to 5. When giving the rating, we look at face, body, hands, lighting, and background. A higher rating means the image looks more realistic and has fewer obvious problems.',
      whatWeCount: [
        'A believable face',
        'Natural-looking body proportions',
        'Hands that look complete',
        'Lighting that fits the scene',
        'A background that looks clear and believable',
        'An overall result that feels finished',
      ],
      whatWeDoNotCount: [
        'Whether the image followed every part of the prompt',
        'Whether the same character is preserved across several images',
        'Small style choices that are clearly intentional',
        'Personal preference for one art style over another',
      ],
      displayedResult: 'Realism result: 84%',
      displayedResultExtra: 'Average rating: 4.2 out of 5',
      scoringIntro: 'A higher average rating means a higher score.',
      scoringLines: [
        '1 out of 5 = 2/10',
        '2 out of 5 = 4/10',
        '3 out of 5 = 6/10',
        '4 out of 5 = 8/10',
        '5 out of 5 = 10/10',
      ],
      scoringNote: 'The exact average is used between these points.',
      scoringFootnote: 'An average rating of 4.2 out of 5 scores 8.4/10.',
      showWhyItMatters: false,
      edgeCases:
        'Prompt Accuracy and Character Consistency are tested separately. An image can look great but still lose points elsewhere when it ignores the prompt or changes the character.',
    },
    {
      id: 'visual-errors',
      title: 'Visual Errors',
      whatItMeasures: 'How many generated images contain at least one major problem.',
      whyItMatters:
        'A generation counts as having an error when the problem is serious enough to make the result look clearly broken or difficult to use.',
      howWeTest:
        'We inspect all 10 images and complete a defect checklist for each one. An image is marked as having a major error when it includes at least one serious problem.',
      whatWeCount: [
        'Extra or missing limbs',
        'Broken hands',
        'A damaged face',
        'Objects merged together',
        'Broken or disappearing clothing',
        'A badly distorted background',
        'A body that looks clearly deformed',
      ],
      whatWeDoNotCount: [
        'A small detail that most people would not notice',
        'A style choice that looks intentional',
        'A missing prompt detail',
        'A weak pose that does not make the image look broken',
        'A generation failure that produced no image, which is tested under Experience',
      ],
      displayedResult: 'Visual error rate: 20%',
      displayedResultExtra: '2 of 10 images had a major error',
      scoringIntro: 'Fewer images with major errors means a higher score.',
      scoringLines: [
        '0% = 10/10',
        '20% = 8/10',
        '40% = 6/10',
        '60% = 4/10',
        '80% = 2/10',
        '100% = 0/10',
      ],
      scoringNote: 'The exact percentage is used between these points.',
      scoringFootnote: 'A visual error rate of 20% scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Each image is counted once. An image with three major defects still counts as one image with an error, not three separate failures.',
    },
    {
      id: 'composition',
      title: 'Composition',
      whatItMeasures: 'How well the subject and background are arranged inside the image.',
      whyItMatters:
        'Even a realistic image can be difficult to use when the character is cut off, placed awkwardly, or surrounded by a messy background.',
      howWeTest:
        'We rate every image from 1 to 5. When giving the rating, we look at whether the requested subject is fully visible, accidental cropping, subject placement, background clarity, and overall balance.',
      whatWeCount: [
        'The character is visible as requested',
        'Important body parts are not accidentally cropped',
        'The subject is placed naturally',
        'The background is clear',
        'The full image feels balanced',
      ],
      whatWeDoNotCount: [
        'Whether the prompt details are correct',
        'Small creative framing choices',
        'Personal preference for close-up or full-body images',
        'Visual defects already counted under Visual Errors',
      ],
      displayedResult: 'Composition result: 82%',
      displayedResultExtra: 'Average rating: 4.1 out of 5',
      scoringIntro: 'A higher average rating means a higher score.',
      scoringLines: [
        '1 out of 5 = 2/10',
        '2 out of 5 = 4/10',
        '3 out of 5 = 6/10',
        '4 out of 5 = 8/10',
        '5 out of 5 = 10/10',
      ],
      scoringNote: 'The exact average is used between these points.',
      scoringFootnote: 'An average rating of 4.1 out of 5 scores 8.2/10.',
      showWhyItMatters: false,
      edgeCases:
        'Composition depends partly on the prompt. If the prompt asks for a close-up portrait, we do not punish the image for leaving the character\u2019s legs outside the frame.',
    },
    {
      id: 'resolution',
      title: 'Resolution',
      whatItMeasures: 'The maximum image size you can download.',
      whyItMatters:
        'A larger image gives you more detail and is easier to crop, edit, or use on a larger screen.',
      howWeTest:
        'We generate an image using the highest quality setting available. We download the finished file and record its exact width and height in pixels. We use the downloaded file rather than trusting the resolution shown on the pricing or marketing page.',
      whatWeCount: [
        'The highest-quality image normal users can download',
        'The actual width and height of the finished file',
        'Upscaling that is included and available through normal use',
      ],
      whatWeDoNotCount: [
        'Resolution promised only in marketing',
        'A preview image that cannot be downloaded',
        'A larger display size that does not change the real file',
        'Third-party upscaling outside the app',
      ],
      displayedResult: 'Maximum resolution: 1920 \u00d7 1080',
      displayedResultExtra: 'Resolution level: 1080p',
      scoringLines: [
        '480p = 4/10',
        '720p = 6/10',
        '1080p = 8/10',
        '4K = 10/10',
      ],
      scoringFootnote: 'A maximum resolution of 1080p scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'A larger file does not automatically mean the image looks better. Resolution measures image size. Realism and Visual Errors measure the actual visual quality.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Image generation always includes some randomness.',
      'The same prompt can create a strong image once and a much weaker result the next time. Testing 10 images reduces this problem, but it cannot remove randomness completely.',
      'Results can also depend on the type of image. A generator may perform well on close-up portraits but struggle with full-body poses, several people, or complicated backgrounds.',
      'Quality only looks at how the finished images appear. Whether the generator followed the prompt and kept the same character is tested separately under Accuracy.',
      'Image models also change quickly. Our results show how the generator performed on the recorded test date.',
    ],
  },
};

const imagesAccuracy: TestSubscoreMethodologyContent = {
  categoryKey: 'images',
  subscoreSlug: 'accuracy',
  heroIntro: [
    'Accuracy measures whether the image generator creates what you actually asked for.',
    'A picture can look amazing and still be a bad result. You might ask for a red dress and get a black one, or generate the same AI girlfriend again and suddenly receive a completely different face.',
    'We check whether the generator follows your prompt, keeps the character looking the same, and edits only the parts you asked it to change.',
  ],
  whyItMatters: {
    title: 'Why Accuracy matters',
    paragraphs: [
      'Good image quality is not enough when the generator ignores what you asked for.',
      'You may request a red dress, a beach background, and a specific pose. The result might look beautiful but give you a white dress, an indoor setting, and a completely different pose.',
      'This becomes especially frustrating when every generation costs credits. Each wrong result means you may need to pay again and hope the next attempt follows the prompt.',
      'Character consistency matters for the same reason. Your AI girlfriend should not get a different face, body, or age every time you generate another image.',
      'Editing should also be accurate. If you ask to change the outfit, the app should not change the face, body, pose, and background at the same time.',
      'A strong image generator should create what you asked for and keep the character recognizable without making you waste credits on constant retries.',
    ],
  },
  howWeTest: {
    title: 'How we test Accuracy',
    paragraphs: [
      'We use a paid account and complete three image tests.',
      'First, we generate a batch of 10 images and rate how well each result follows the prompt.',
      'We then upload a reference portrait and create five variations of the same character. We compare every variation with the reference and check face, body, visual style, and overall character consistency.',
      'Finally, we complete 10 image-editing tasks. Every edit is checked to see whether the requested change was made without changing the face, body, pose, or background.',
      'The active worksheet uses 10 batch images, five character-consistency variations, and 10 editing tasks.',
    ],
  },
  highLowScore: {
    title: 'What good Accuracy looks like',
    paragraphs: [
      'A high Accuracy score means the generator follows most of your instructions, keeps the same character across images, and makes clean edits without changing unrelated parts.',
      'A lower score means important prompt details are regularly ignored, the character changes between images, or simple edits damage the rest of the picture.',
    ],
  },
  scoreCalculation: {
    title: 'How the Accuracy score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Accuracy score.',
      'The live methodology gives slightly more weight to Prompt Accuracy and the main character-consistency tests.',
    ],
    evidenceWeights: [
      { label: 'Prompt Accuracy', weight: 17 },
      { label: 'Character Consistency', weight: 17 },
      { label: 'Face Consistency', weight: 17 },
      { label: 'Body Consistency', weight: 17 },
      { label: 'Style Consistency', weight: 16 },
      { label: 'Editing Accuracy', weight: 16 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply every score by how much it counts and add the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Accuracy is organized into 6 evidence groups. Each group contains one scored test: Prompt Accuracy, Character Consistency, Face Consistency, Body Consistency, Style Consistency, and Editing Accuracy.',
    sectionIntro: 'Accuracy has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    'prompt-accuracy': {
      intro: ['Prompt Accuracy measures how well the generated images follow your instructions.'],
      whyItMatters: 'A beautiful image is not accurate when it leaves out the important details you asked for.',
    },
    'character-consistency': {
      intro: [
        'Character Consistency measures whether the character still looks like the same person across different images.',
      ],
      whyItMatters:
        'This is the overall consistency result. Face, Body, and Style Consistency show the separate parts behind it.',
    },
    'face-consistency': {
      intro: ['Face Consistency measures whether the character\u2019s face stays recognizable.'],
      whyItMatters:
        'The hairstyle or outfit may change, but the character should not suddenly look like a different person.',
    },
    'body-consistency': {
      intro: ['Body Consistency measures whether the character keeps the same general body type and proportions.'],
      whyItMatters:
        'A character should not change from slim to muscular or from short to very tall unless the prompt asks for it.',
    },
    'style-consistency': {
      intro: ['Style Consistency measures whether the images keep the requested visual style.'],
      whyItMatters:
        'A realistic image should not suddenly look like anime, a 3D render, or a cartoon unless the prompt asks for that change.',
    },
    'editing-accuracy': {
      intro: [
        'Editing Accuracy measures whether the app makes the requested change without damaging the rest of the image.',
      ],
      whyItMatters:
        'If you ask to change the outfit, the face, body, pose, and background should stay the same.',
    },
  },
  evidenceSections: [
    {
      id: 'prompt-accuracy',
      title: 'Prompt Accuracy',
      whatItMeasures: 'How well the generated images follow your instructions.',
      whyItMatters: 'A beautiful image is not accurate when it leaves out the important details you asked for.',
      howWeTest:
        'We generate 10 test images. Each prompt contains five clear details to check, such as clothing, color, location, pose, or an object or background detail. We check how many requested details appear correctly in the finished images.',
      whatWeCount: [
        'The requested clothing appears',
        'Important colors are correct',
        'The location matches the prompt',
        'The requested pose is followed',
        'Important objects or background details are included',
      ],
      whatWeDoNotCount: [
        'Extra small details that do not change the request',
        'Personal preference about how attractive the result looks',
        'Visual quality problems tested under Quality',
        'A detail that is only partly visible when the prompt asked for it clearly',
      ],
      displayedResult: 'Prompt Accuracy result: 82%',
      displayedResultExtra: '41 of 50 requested details were followed',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 82% scores 8.2/10.',
      showWhyItMatters: false,
      edgeCases:
        'Every requested detail is checked separately. An image can follow four parts of the prompt and miss the fifth.',
    },
    {
      id: 'character-consistency',
      title: 'Character Consistency',
      whatItMeasures: 'Whether the character still looks like the same person across different images.',
      whyItMatters:
        'This is the overall consistency result. Face, Body, and Style Consistency show the separate parts behind it.',
      howWeTest:
        'We upload one reference portrait. We then generate five new images of the same character and compare every result with the reference. The overall result is calculated from the Face, Body, and Style ratings in the consistency worksheet.',
      whatWeCount: [
        'The character is still clearly recognizable',
        'The face, body, and style remain similar',
        'Important identifying features stay visible',
        'The result looks like another image of the same character',
      ],
      whatWeDoNotCount: [
        'A completely different person with similar hair',
        'A face match while the body changes heavily',
        'The same art style with a different identity',
        'Small pose, clothing, or background changes that were requested',
      ],
      displayedResult: 'Overall consistency result: 80%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 80% scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Character Consistency is the overall result. The next three tests explain whether any problems came from the face, body, or visual style.',
    },
    {
      id: 'face-consistency',
      title: 'Face Consistency',
      whatItMeasures: 'Whether the character\u2019s face stays recognizable.',
      whyItMatters:
        'The hairstyle or outfit may change, but the character should not suddenly look like a different person.',
      howWeTest:
        'We compare the face in each of the five variation images with the reference portrait. Each image is rated based on whether the face matches the reference.',
      whatWeCount: [
        'The same main facial structure',
        'Similar eyes, nose, mouth, and jaw',
        'The character remains easy to recognize',
        'Normal changes caused by expression or camera angle',
      ],
      whatWeDoNotCount: [
        'A different person with similar hair',
        'A face that only matches because the pose is copied',
        'Large age changes',
        'Major changes to facial shape',
        'Small lighting changes that do not affect identity',
      ],
      displayedResult: 'Face Consistency result: 80%',
      displayedResultExtra: '4 of 5 images kept the same face',
      scoringIntro: 'A higher match rate means a higher score.',
      scoringLines: [
        '0 of 5 = 0/10',
        '1 of 5 = 2/10',
        '2 of 5 = 4/10',
        '3 of 5 = 6/10',
        '4 of 5 = 8/10',
        '5 of 5 = 10/10',
      ],
      scoringFootnote: 'A result of 4 matching images scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'The face does not need to be pixel-perfect. It only needs to clearly look like the same character.',
    },
    {
      id: 'body-consistency',
      title: 'Body Consistency',
      whatItMeasures: 'Whether the character keeps the same general body type and proportions.',
      whyItMatters:
        'A character should not change from slim to muscular or from short to very tall unless the prompt asks for it.',
      howWeTest:
        'We compare the body in each of the five variation images with the reference. We check whether the main body features stay consistent.',
      whatWeCount: [
        'Similar height appearance',
        'Similar body type',
        'Similar proportions',
        'The same general build',
        'Natural changes caused by pose or clothing',
      ],
      whatWeDoNotCount: [
        'A completely different body type',
        'Large changes in height or proportions',
        'Unrequested changes to body shape',
        'A difference caused only by loose clothing or camera angle',
        'Breast-size controls tested separately under Customization',
      ],
      displayedResult: 'Body Consistency result: 60%',
      displayedResultExtra: '3 of 5 images kept the same body',
      scoringIntro: 'A higher match rate means a higher score.',
      scoringLines: [
        '0 of 5 = 0/10',
        '1 of 5 = 2/10',
        '2 of 5 = 4/10',
        '3 of 5 = 6/10',
        '4 of 5 = 8/10',
        '5 of 5 = 10/10',
      ],
      scoringFootnote: 'A result of 3 matching images scores 6/10.',
      showWhyItMatters: false,
      edgeCases:
        'Different poses can make the body look slightly different. We only mark a problem when the actual body characteristics appear to change.',
    },
    {
      id: 'style-consistency',
      title: 'Style Consistency',
      whatItMeasures: 'Whether the images keep the requested visual style.',
      whyItMatters:
        'A realistic image should not suddenly look like anime, a 3D render, or a cartoon unless the prompt asks for that change.',
      howWeTest:
        'We compare the visual style of each variation with the reference and the requested style. The active worksheet rates five variation images.',
      whatWeCount: [
        'Realistic images remain realistic',
        'Anime images keep an anime look',
        'Lighting and rendering remain reasonably similar',
        'The requested art style is easy to recognize',
      ],
      whatWeDoNotCount: [
        'Normal changes in lighting or background',
        'A different pose',
        'Small changes in sharpness',
        'A major switch to another art style',
        'Style changes clearly requested in the prompt',
      ],
      displayedResult: 'Style Consistency result: 80%',
      displayedResultExtra: '4 of 5 images kept the requested style',
      scoringIntro: 'A higher match rate means a higher score.',
      scoringLines: [
        '0 of 5 = 0/10',
        '1 of 5 = 2/10',
        '2 of 5 = 4/10',
        '3 of 5 = 6/10',
        '4 of 5 = 8/10',
        '5 of 5 = 10/10',
      ],
      scoringFootnote: 'A result of 4 matching images scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Style Consistency is about keeping the requested look. It does not judge whether realistic art is better than anime or another style.',
    },
    {
      id: 'editing-accuracy',
      title: 'Editing Accuracy',
      whatItMeasures: 'Whether the app makes the requested change without damaging the rest of the image.',
      whyItMatters:
        'If you ask to change the outfit, the face, body, pose, and background should stay the same.',
      howWeTest:
        'We complete 10 image-editing tasks. For every edit, we check whether the requested change was made and whether the face, body, pose, and background stayed the same. This creates 50 checks in total.',
      whatWeCount: [
        'The requested change is clearly visible',
        'Unrelated parts remain unchanged',
        'The character stays recognizable',
        'The edited image still looks usable',
      ],
      whatWeDoNotCount: [
        'The requested change is ignored',
        'The whole image is regenerated',
        'The face or body changes unnecessarily',
        'The pose changes when it was meant to stay the same',
        'The background changes without being requested',
      ],
      displayedResult: 'Editing Accuracy result: 76%',
      displayedResultExtra: '38 of 50 editing checks passed',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: ['20% = 2/10', '40% = 4/10', '60% = 6/10', '80% = 8/10', '100% = 10/10'],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'A result of 76% scores 7.6/10.',
      showWhyItMatters: false,
      edgeCases:
        'An edit only fully passes when it makes the requested change without causing unwanted changes elsewhere.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Image generation always includes some randomness.',
      'The same prompt can create a very accurate result once and ignore several details the next time. Testing several images helps reduce luck, but it cannot remove randomness completely.',
      'Some prompts are also harder than others. A simple portrait is easier to follow than a complicated scene with several characters, objects, poses, and clothing details.',
      'Character consistency can depend on the tools offered by the app. A platform with a proper reference-image feature may perform better than one that only lets you describe the character with text.',
      'A character can also keep the same face but change her body or visual style. That is why we score Face, Body, and Style Consistency separately.',
      'This score measures whether the results are accurate. How attractive, realistic, or visually polished the images look is tested separately under Quality.',
    ],
  },
};

const imagesExperience: TestSubscoreMethodologyContent = {
  categoryKey: 'images',
  subscoreSlug: 'experience',
  heroIntro: [
    'Experience measures what it is actually like to use the image generator.',
    'An app can create great images and still be frustrating when generations take forever, fail regularly, or make you jump through several screens just to create one picture.',
    'We check speed, failures, where images can be generated, whether custom prompts are accepted, whether editing is available, and whether adult image generation is supported.',
  ],
  whyItMatters: {
    title: 'Why Experience matters',
    paragraphs: [
      'Images are one of the most popular features in AI girlfriend apps.',
      'But the finished image is only part of the experience.',
      'A generator is not very useful when every image takes several minutes, half the attempts fail, or you cannot write your own prompt.',
      'This matters even more because many apps charge credits for every generation. A failed image or heavily restricted prompt can mean spending more money just to get something usable.',
      'Ease of use also matters because many people using these apps are beginners. They should not need to understand advanced prompting or search through several menus before creating their first image.',
      'A strong image generator should be quick, reliable, and easy to use while still giving you enough control.',
    ],
  },
  howWeTest: {
    title: 'How we test Experience',
    paragraphs: [
      'We use a paid account and test every image-generation tool available.',
      'For Speed, we time the image-generation attempts. The timer starts when generation is submitted and stops when the finished image becomes available.',
      'For Failures, we count attempts that fail completely, stay stuck, produce no image, or produce an unusable result.',
      'We then test whether images can be generated inside chat and through a separate image generator.',
      'We enter three different free-form prompts to check whether custom prompting is available.',
      'For Image Editing, we try three simple tasks: change the clothing, change the background, and change the pose.',
      'Finally, we review the platform\u2019s rules and complete three allowed adult-image tests where legally appropriate.',
    ],
  },
  highLowScore: {
    title: 'What good Experience looks like',
    paragraphs: [
      'A high Experience score means images generate quickly, failures are rare, and the app gives you several useful ways to create and edit images.',
      'A lower score means generations are slow, regularly fail, or give you very little control.',
    ],
  },
  scoreCalculation: {
    title: 'How the Experience score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Experience score.',
      'The live system stores four tests at a weight of 13 and three tests at a weight of 12. We turn those into public percentages that add up to 100%.',
    ],
    evidenceWeights: [
      { label: 'Speed', weight: 14.77 },
      { label: 'Failures', weight: 14.77 },
      { label: 'Chat Generation', weight: 14.77 },
      { label: 'Separate Generator', weight: 14.77 },
      { label: 'Custom Prompts', weight: 13.64 },
      { label: 'Image Editing', weight: 13.64 },
      { label: 'NSFW Support', weight: 13.64 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply that score by how much the test counts. We then add all the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Experience is organized into 7 evidence groups. Each group contains one scored test: Speed, Failures, Chat Generation, Separate Generator, Custom Prompts, Image Editing, and NSFW Support.',
    sectionIntro: 'Experience has 7 evidence groups made up of 7 scored tests.',
  },
  evidenceGroupContent: {
    speed: {
      intro: ['Speed measures how long the image generator normally takes to produce a finished image.'],
      whyItMatters:
        'Fast generation makes it easier to try ideas and correct a bad result without waiting several minutes every time.',
    },
    failures: {
      intro: ['Failures measures how often an image-generation attempt does not produce a usable result.'],
      whyItMatters:
        'A generator can be fast but still waste your time and credits when too many attempts fail.',
    },
    'chat-generation': {
      intro: ['Chat Generation measures whether you can request an image without leaving the conversation.'],
      whyItMatters:
        'This is usually the easiest option for beginners because the image can be connected directly to what you are talking about.',
    },
    'separate-generator': {
      intro: ['Separate Generator measures whether the app has a dedicated image-generation tool outside the chat.'],
      whyItMatters:
        'A separate generator usually gives users more space for prompts, settings, styles, and other controls.',
    },
    'custom-prompts': {
      intro: ['Custom Prompts measures whether you can write your own image instructions.'],
      whyItMatters:
        'Preset buttons are easy to use, but they can become limiting when you want a specific outfit, pose, location, or scene.',
    },
    'image-editing': {
      intro: ['Image Editing measures whether you can make basic changes to a generated image.'],
      whyItMatters:
        'Editing can save time and credits because you do not need to regenerate the full picture just to change one detail.',
    },
    'nsfw-support': {
      intro: [
        'NSFW Support measures whether the image generator supports adult content under the platform\u2019s current rules.',
      ],
      whyItMatters:
        'Because AI girlfriend apps are adult platforms, many users want to know what type of image content is actually allowed before paying.',
    },
  },
  evidenceSections: [
    {
      id: 'speed',
      title: 'Speed',
      whatItMeasures: 'How long the image generator normally takes to produce a finished image.',
      whyItMatters:
        'Fast generation makes it easier to try ideas and correct a bad result without waiting several minutes every time.',
      howWeTest:
        'We time the image-generation attempts. The timer starts when we submit the generation and stops when the finished image is available. We use the median time. The median is the middle result after placing all generation times in order. This prevents one unusually slow or fast attempt from controlling the score.',
      whatWeCount: [
        'Time spent waiting after pressing Generate',
        'Loading and processing time',
        'Time until the finished image can be viewed',
        'Normal generations made through the paid account',
      ],
      whatWeDoNotCount: [
        'Time spent writing the prompt',
        'Time spent downloading the image',
        'Image-editing time',
        'A confirmed internet or platform outage',
        'Waiting caused by the tester leaving the page',
      ],
      displayedResult: 'Median generation time: 14 seconds',
      scoringEvidenceSlug: 'speed',
      scoringIntro: 'Faster generation means a higher score.',
      scoringFootnote: 'A median time of 14 seconds scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'When one request creates several images at once, we time the full generation and explain how many images were included.',
    },
    {
      id: 'failures',
      title: 'Failures',
      whatItMeasures: 'How often an image-generation attempt does not produce a usable result.',
      whyItMatters:
        'A generator can be fast but still waste your time and credits when too many attempts fail.',
      howWeTest:
        'We record every failed attempt during the image-generation test. An attempt fails when it produces no image, remains stuck, shows a generation error, or produces a result that is completely unusable.',
      whatWeCount: [
        'An error message instead of an image',
        'A generation that never finishes',
        'A blank or corrupted result',
        'An image that is so broken it cannot reasonably be used',
        'An attempt that uses credits but produces nothing useful',
      ],
      whatWeDoNotCount: [
        'An image we simply do not like',
        'A prompt detail being missed',
        'A minor visual problem',
        'A usable image with weak composition',
        'A result that takes a long time but eventually finishes',
      ],
      displayedResult: 'Failure rate: 10%',
      displayedResultExtra: '2 failed attempts out of 20',
      scoringIntro: 'Fewer failures means a higher score.',
      scoringLines: [
        '0% = 10/10',
        '20% = 8/10',
        '40% = 6/10',
        '60% = 4/10',
        '80% = 2/10',
        '100% = 0/10',
      ],
      scoringNote: 'The exact percentage is used between these points.',
      scoringFootnote: 'A failure rate of 10% scores 9/10.',
      showWhyItMatters: false,
      edgeCases:
        'Prompt mistakes and visual defects are tested separately. Failures only counts attempts that do not produce a usable finished image.',
    },
    {
      id: 'chat-generation',
      title: 'Chat Generation',
      whatItMeasures: 'Whether you can request an image without leaving the conversation.',
      whyItMatters:
        'This is usually the easiest option for beginners because the image can be connected directly to what you are talking about.',
      howWeTest:
        'We request one image in three separate chats. We check whether the request works and whether the image appears inside the conversation.',
      whatWeCount: [
        'Requesting an image through a normal chat message',
        'An image created from the current conversation',
        'The result appearing inside the chat',
        'The feature working with normal paying characters',
      ],
      whatWeDoNotCount: [
        'Opening a separate generator',
        'Clicking an outside link',
        'Receiving a pre-made profile picture',
        'A text reply claiming an image was sent when none appears',
        'A request that uses credits but produces no image',
      ],
      displayedResult: 'Yes \u2014 images were generated in all 3 chats',
      scoringLines: [
        'Yes \u2014 all three attempts worked = 10/10',
        'Limited \u2014 only some attempts worked or important restrictions applied = 5/10',
        'No \u2014 chat generation was unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Chat Generation scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether image generation works inside chat. Image quality and prompt accuracy are tested separately.',
    },
    {
      id: 'separate-generator',
      title: 'Separate Generator',
      whatItMeasures: 'Whether the app has a dedicated image-generation tool outside the chat.',
      whyItMatters:
        'A separate generator usually gives users more space for prompts, settings, styles, and other controls.',
      howWeTest:
        'We check whether the platform has a separate image-generation page or tool. When available, we create three images through it.',
      whatWeCount: [
        'A dedicated image-generation page',
        'A separate creation tool with its own controls',
        'Three completed image generations',
        'A tool available to normal paying users',
      ],
      whatWeDoNotCount: [
        'Generating images only inside chat',
        'A marketing demo',
        'A gallery without a Generate button',
        'A tool that repeatedly fails',
        'An outside service owned by another company',
      ],
      displayedResult: 'Yes \u2014 all 3 images were created through a dedicated generator',
      scoringLines: [
        'Yes \u2014 all three attempts worked = 10/10',
        'Limited \u2014 restrictions or failures affected the feature = 5/10',
        'No \u2014 no separate generator was available = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Separate Generator scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'A platform can receive points for both Chat Generation and a Separate Generator. They serve different types of users and are tested separately.',
    },
    {
      id: 'custom-prompts',
      title: 'Custom Prompts',
      whatItMeasures: 'Whether you can write your own image instructions.',
      whyItMatters:
        'Preset buttons are easy to use, but they can become limiting when you want a specific outfit, pose, location, or scene.',
      howWeTest:
        'We enter three different free-form prompts. We check whether each prompt is accepted and whether major restrictions affect what can be entered.',
      whatWeCount: [
        'A free-text prompt box',
        'Users writing their own image instructions',
        'All three prompts being accepted',
        'Normal safety rules that are clearly explained',
      ],
      whatWeDoNotCount: [
        'Only choosing from preset buttons',
        'A prompt selected automatically by the app',
        'Editing a character description',
        'A text box that cannot be submitted',
        'Prompts so restricted that most normal instructions are blocked',
      ],
      displayedResult: 'Yes \u2014 all 3 free-form prompts were accepted',
      scoringLines: [
        'Yes \u2014 all three prompts were accepted = 10/10',
        'Limited \u2014 prompts worked but were heavily restricted = 5/10',
        'No \u2014 custom prompts were unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Custom Prompts scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether custom prompts are accepted. Whether the image actually follows the prompt is tested under Prompt Accuracy.',
    },
    {
      id: 'image-editing',
      title: 'Image Editing',
      whatItMeasures: 'Whether you can make basic changes to a generated image.',
      whyItMatters:
        'Editing can save time and credits because you do not need to regenerate the full picture just to change one detail.',
      howWeTest:
        'We try three basic editing tasks: change the clothing, change the background, and change the pose. We record how many editing types are supported.',
      whatWeCount: [
        'A tool that changes the clothing',
        'A tool that changes the background',
        'A tool that changes the pose',
        'Editing through normal user controls',
        'A finished edited image',
      ],
      whatWeDoNotCount: [
        'Regenerating a completely new image',
        'Editing through outside software',
        'Changing the prompt before the first generation',
        'A button that appears but does not create an edit',
        'Manual photo editing performed by support',
      ],
      displayedResult: 'Limited \u2014 clothing and background could be changed, but pose editing was unavailable',
      displayedResultExtra: '2 of 3 editing types supported',
      scoringLines: [
        'Yes \u2014 all three editing tasks were supported = 10/10',
        'Limited \u2014 only some tasks worked or important restrictions applied = 5/10',
        'No \u2014 image editing was unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Image Editing scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether editing tools are available. Editing Accuracy separately checks whether the requested change works without damaging the rest of the image.',
    },
    {
      id: 'nsfw-support',
      title: 'NSFW Support',
      whatItMeasures: 'Whether the image generator supports adult content under the platform\u2019s current rules.',
      whyItMatters:
        'Because AI girlfriend apps are adult platforms, many users want to know what type of image content is actually allowed before paying.',
      howWeTest:
        'We read the platform\u2019s current rules and help pages. Where legally appropriate, we complete three allowed adult-content tests. We check whether the requests are accepted and whether important restrictions affect the feature.',
      whatWeCount: [
        'Adult image generation clearly allowed by the platform',
        'Requests that follow the platform\u2019s stated rules',
        'Finished images produced through normal user access',
        'Clear information about what is and is not allowed',
      ],
      whatWeDoNotCount: [
        'Requests that break the platform\u2019s rules',
        'Illegal content',
        'Marketing claims we cannot verify',
        'Adult-ready-made characters without image generation',
        'A request that is accepted but produces no result',
      ],
      displayedResult: 'Limited \u2014 adult images were supported, but important prompt restrictions applied',
      scoringLines: [
        'Yes \u2014 adult image generation worked under the stated rules = 10/10',
        'Limited \u2014 support existed with important restrictions = 5/10',
        'No \u2014 adult image generation was not supported = 0/10',
        'Unknown \u2014 we could not verify the rules or result = 0/10',
      ],
      scoringFootnote: 'In this example, NSFW Support scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test does not reward illegal or unsafe content. We only test adult content that is legal and clearly allowed under the platform\u2019s own rules.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Generation speed can change depending on the time of day, server demand, internet connection, and the number of images requested at once.',
      'A slow result does not always mean the generator itself is bad. Timing several attempts helps reduce the effect of one unusually slow generation.',
      'Some features may also be available only with certain characters, subscriptions, or devices.',
      'A separate generator and chat generation are both useful, but they serve different users. Beginners may prefer creating an image directly in chat, while more experienced users may prefer a dedicated generator with more controls.',
      'Image Editing on this page only checks whether basic editing features exist. We test whether those edits are accurate under the Images Accuracy methodology.',
      'NSFW Support can also change when a platform updates its rules. Our result reflects what the platform allowed on the recorded test date.',
    ],
  },
};

const videoCapabilities: TestSubscoreMethodologyContent = {
  categoryKey: 'video',
  subscoreSlug: 'capabilities',
  heroIntro: [
    'Capabilities measures what the video generator can actually do.',
    'Some AI girlfriend apps let you write your own video prompt, animate an image, request videos inside the chat, add audio, and create longer clips.',
    'Others only give you one button that turns an image into a basic five-second animation.',
    'We check exactly which options are available and whether they really work.',
  ],
  whyItMatters: {
    title: 'Why Capabilities matters',
    paragraphs: [
      'Video generation is still a fairly new feature in AI girlfriend apps.',
      'The difference between platforms is massive.',
      'One app might let you write your own prompt, add audio, create a 60-second video, and generate it directly inside the chat.',
      'Another might only let you click Turn into video after creating an image. You cannot explain what should happen, and the finished clip may only last five seconds.',
      'Both apps can say they offer video generation, but they clearly do not offer the same experience.',
      'That is why we look beyond whether a video button exists. We check how many ways you can create videos, how long they can be, whether they include audio, and the highest resolution available.',
    ],
  },
  howWeTest: {
    title: 'How we test Capabilities',
    paragraphs: [
      'We use a paid account and test every available way to create a video.',
      'For Text-to-Video, we try to create three videos using only written prompts.',
      'For Image-to-Video, we use three different source images.',
      'For Chat Video, we request one video in three separate chats.',
      'We then generate three videos with audio requests and check separately for speech, sound effects, and music.',
      'We record the longest video length the app offers and generate one video at that setting to confirm it works.',
      'Finally, we download the highest-quality video and record its exact width and height.',
    ],
  },
  highLowScore: {
    title: 'What good Capabilities looks like',
    paragraphs: [
      'A high Capabilities score means the app gives you several useful ways to create videos, supports audio, and offers a useful video length and resolution.',
      'A lower score means the app only offers a very basic image-animation tool with short, silent, low-resolution clips.',
    ],
  },
  scoreCalculation: {
    title: 'How the Capabilities score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Capabilities score.',
      'Capabilities makes up 34% of the Video score.',
      'The stored test weights do not add up to 100%, so we convert them into the percentages below.',
      'The live system gives Text-to-Video the smallest weight. Image-to-Video, Chat Video, and Audio count the most.',
    ],
    evidenceWeights: [
      { label: 'Text-to-Video', weight: 5.68 },
      { label: 'Image-to-Video', weight: 19.32 },
      { label: 'Chat Video', weight: 19.32 },
      { label: 'Audio', weight: 19.32 },
      { label: 'Maximum Length', weight: 18.18 },
      { label: 'Maximum Resolution', weight: 18.18 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply the score by how much the test counts. We then add all the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Capabilities is organized into 6 evidence groups. Each group contains one scored test: Text-to-Video, Image-to-Video, Chat Video, Audio, Maximum Length, and Maximum Resolution.',
    sectionIntro: 'Capabilities has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    'text-to-video': {
      intro: ['Text-to-Video measures whether you can create a video using only a written prompt.'],
      whyItMatters:
        'This gives you more control because you can describe the scene and what should happen instead of starting with an existing image.',
    },
    'image-to-video': {
      intro: ['Image-to-Video measures whether you can turn an existing image into a video.'],
      whyItMatters:
        'This is currently one of the most common ways AI girlfriend apps create videos.',
    },
    'chat-video': {
      intro: ['Chat Video measures whether you can ask the AI character for a video inside the conversation.'],
      whyItMatters:
        'This makes video feel like part of the relationship instead of a completely separate creation tool.',
    },
    audio: {
      intro: ['Audio measures whether generated videos can include sound.'],
      whyItMatters:
        'We check speech, sound effects, and music separately because an app may support one type but not the others.',
    },
    'maximum-length': {
      intro: ['Maximum Length measures the longest video the app lets you generate.'],
      whyItMatters:
        'A five-second clip gives you very little time for a full action or scene. Longer videos give you more creative freedom.',
    },
    'maximum-resolution': {
      intro: ['Maximum Resolution measures the highest video quality you can download.'],
      whyItMatters:
        'Higher resolution gives you more detail and makes the video look better on larger screens.',
    },
  },
  evidenceSections: [
    {
      id: 'text-to-video',
      title: 'Text-to-Video',
      whatItMeasures: 'Whether you can create a video using only a written prompt.',
      whyItMatters:
        'This gives you more control because you can describe the scene and what should happen instead of starting with an existing image.',
      howWeTest:
        'We enter three different video prompts. Each test starts with text only. We do not upload a source image. We check whether every prompt is accepted and produces a finished video.',
      whatWeCount: [
        'A free-text video prompt',
        'Video created without uploading an image',
        'The user can describe the action or scene',
        'A finished video from each test',
      ],
      whatWeDoNotCount: [
        'Turning an existing image into a video',
        'Choosing only from preset actions',
        'A marketing demo that users cannot access',
        'A prompt box that still requires a source image',
        'An attempt that never produces a video',
      ],
      displayedResult: 'Yes \u2014 all 3 text-only videos were created',
      scoringLines: [
        'Yes \u2014 all three tests worked = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 Text-to-Video was unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Text-to-Video scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test checks whether Text-to-Video works. How closely the finished video follows the prompt is tested separately under Video Quality.',
    },
    {
      id: 'image-to-video',
      title: 'Image-to-Video',
      whatItMeasures: 'Whether you can turn an existing image into a video.',
      whyItMatters:
        'This is currently one of the most common ways AI girlfriend apps create videos.',
      howWeTest:
        'We upload three different source images. We try to create one video from each image and record whether every attempt works.',
      whatWeCount: [
        'Uploading a source image',
        'Turning a generated image into a video',
        'A finished video based on the selected image',
        'The original character remaining visible in the result',
      ],
      whatWeDoNotCount: [
        'Text-to-Video without a source image',
        'A slideshow made from several still images',
        'A zoom effect that does not create real motion',
        'A marketing preview',
        'A generation that never finishes',
      ],
      displayedResult: 'Yes \u2014 all 3 source images were turned into videos',
      scoringLines: [
        'Yes \u2014 all three tests worked = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 Image-to-Video was unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Image-to-Video scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test only checks whether Image-to-Video works. Motion quality and character consistency are scored separately under Video Quality.',
    },
    {
      id: 'chat-video',
      title: 'Chat Video',
      whatItMeasures: 'Whether you can ask the AI character for a video inside the conversation.',
      whyItMatters:
        'This makes video feel like part of the relationship instead of a completely separate creation tool.',
      howWeTest:
        'We request one video in three separate chats. We check whether the video is created and appears inside the conversation.',
      whatWeCount: [
        'Requesting a video through a normal chat message',
        'A playable video appearing inside the conversation',
        'The video being connected to the current character',
        'The feature working through normal paid access',
      ],
      whatWeDoNotCount: [
        'Opening a separate video generator',
        'Receiving a link to another tool',
        'Pre-recorded marketing videos',
        'A static image shown as a video',
        'A request that uses credits but produces nothing',
      ],
      displayedResult: 'Limited \u2014 videos were received in 2 of 3 chats',
      scoringLines: [
        'Yes \u2014 all three tests worked = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 Chat Video was unavailable = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Chat Video scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Chat Video is also checked under Chat Features because receiving video inside chat is useful in two different ways: Chat Features checks whether media can be exchanged; Video Capabilities checks which video-generation methods the platform offers.',
    },
    {
      id: 'audio',
      title: 'Audio',
      whatItMeasures: 'Whether generated videos can include sound.',
      whyItMatters:
        'We check speech, sound effects, and music separately because an app may support one type but not the others.',
      howWeTest:
        'We generate three videos and request audio. Across the tests, we check for speech, sound effects, and music. We record which types are actually supported.',
      whatWeCount: [
        'Spoken dialogue created with the video',
        'Sound effects that match the scene',
        'Background music generated or added by the app',
        'Audio included in the finished video file',
      ],
      whatWeDoNotCount: [
        'Audio added later through outside software',
        'A silent video',
        'Voice messages outside the video',
        'Music playing in the app interface',
        'Audio advertised but missing from the downloaded file',
      ],
      displayedResult: 'Limited \u2014 speech worked, but sound effects and music were unavailable',
      scoringLines: [
        'Yes \u2014 useful audio support worked across the tests = 10/10',
        'Limited \u2014 only some audio types worked or restrictions applied = 5/10',
        'No \u2014 generated videos were silent = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Audio scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Supporting one audio type is not the same as supporting all three. We use Limited when audio exists but only some types work or important restrictions apply.',
    },
    {
      id: 'maximum-length',
      title: 'Maximum Length',
      whatItMeasures: 'The longest video the app lets you generate.',
      whyItMatters:
        'A five-second clip gives you very little time for a full action or scene. Longer videos give you more creative freedom.',
      howWeTest:
        'We record the longest selectable video length. We then generate one video using that setting to confirm the full length actually works.',
      whatWeCount: [
        'The longest duration normal users can select',
        'A finished video generated at that duration',
        'Length available through the tested paid plan',
      ],
      whatWeDoNotCount: [
        'Length promised only in marketing',
        'Several short clips joined together outside the app',
        'A setting that repeatedly fails',
        'A longer length available only through private or unreleased access',
      ],
      displayedResult: '30 seconds',
      displayedResultExtra: 'Maximum video length: 30 seconds',
      scoringEvidenceSlug: 'maximum-length',
      scoringIntro: 'Longer videos receive a higher score.',
      scoringFootnote: 'A maximum length of 30 seconds scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Longer does not automatically mean better. Video stability and quality are tested separately.',
    },
    {
      id: 'maximum-resolution',
      title: 'Maximum Resolution',
      whatItMeasures: 'The highest video quality you can download.',
      whyItMatters:
        'Higher resolution gives you more detail and makes the video look better on larger screens.',
      howWeTest:
        'We generate a video using the highest-quality setting available. We download the finished file and record its exact width and height in pixels.',
      whatWeCount: [
        'The highest resolution normal users can download',
        'The actual dimensions of the finished video file',
        'Resolution available through the tested subscription',
      ],
      whatWeDoNotCount: [
        'Resolution promised only on a pricing page',
        'A large preview that downloads at a smaller size',
        'Upscaling done through outside software',
        'A quality setting that does not change the finished file',
      ],
      displayedResult: 'Maximum resolution: 1920 \u00d7 1080',
      displayedResultExtra: 'Resolution level: 1080p',
      scoringLines: [
        '480p = 4/10',
        '720p = 6/10',
        '1080p = 8/10',
        '4K = 10/10',
      ],
      scoringFootnote:
        'A maximum resolution of 1080p scores 8/10. The calculation engine uses these fixed resolution levels.',
      showWhyItMatters: false,
      edgeCases:
        'Resolution only measures the size of the video. A high-resolution video can still have poor motion, visual errors, or an inconsistent character.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Not every app uses the same video system.',
      'Some platforms focus on image-to-video, while others give users a full text prompt. We score each option separately so one feature does not hide the absence of another.',
      'A longer video is not automatically a better video. Longer clips have more time to warp the face, body, clothing, or background. Video quality is tested separately.',
      'The same applies to resolution. A 1080p video can still look bad when the motion is broken or the character changes halfway through.',
      'Audio support may also be limited. An app could support background music but not speech, or speech but no sound effects. We record which types actually work.',
      'Capabilities may differ between devices, characters, subscription plans, or regions. Our results show what was available through the paid test account on the recorded test date.',
    ],
  },
};

const videoQuality: TestSubscoreMethodologyContent = {
  categoryKey: 'video',
  subscoreSlug: 'quality',
  heroIntro: [
    'Quality measures how good the finished videos actually look.',
    'AI video can go wrong in a lot of ways. The movement may look unnatural, the character can change halfway through, or the background can start flickering and warping.',
    'We generate three videos with the same prompt and check the motion, prompt accuracy, character consistency, major visual problems, and stability from start to finish.',
  ],
  whyItMatters: {
    title: 'Why Quality matters',
    paragraphs: [
      'Video generation is still fairly new, and the quality difference between apps is massive.',
      'One app may create smooth movement while keeping the character recognizable from beginning to end. Another may start with a good image and completely fall apart after two seconds.',
      'The face can change. The body can warp. Clothing can disappear. Hands can break, and the background can start flickering.',
      'This is especially frustrating because video generation often costs a lot of credits. A broken video may mean paying again and hoping the next result works.',
      'That is why we do not judge the generator from one lucky clip. We generate several videos and watch every one from beginning to end.',
    ],
  },
  howWeTest: {
    title: 'How we test Quality',
    paragraphs: [
      'We use a paid account and generate three videos with the same prompt.',
      'We upload and review every finished video.',
      'For each video, we rate motion quality, prompt accuracy, character consistency, and visual stability.',
      'We also mark whether the video contains a major visual error.',
      'Using the same prompt makes the results easier to compare. It also helps us see whether the generator performs consistently or produces one good result and two broken ones.',
      'The active testing worksheet uses three videos.',
    ],
  },
  highLowScore: {
    title: 'What good Quality looks like',
    paragraphs: [
      'A high Quality score means the movement looks natural, the video follows the prompt, and the character stays recognizable throughout the clip.',
      'A lower score means videos regularly contain warping, flickering, broken movement, or major character changes.',
    ],
  },
  scoreCalculation: {
    title: 'How the Quality score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Quality score.',
      'Quality makes up 33% of the Video score.',
      'The stored weights are converted into percentages that add up to 100%.',
    ],
    evidenceWeights: [
      { label: 'Motion', weight: 20.48 },
      { label: 'Prompt Accuracy', weight: 20.48 },
      { label: 'Character Consistency', weight: 20.48 },
      { label: 'Visual Errors', weight: 19.28 },
      { label: 'Frame Consistency', weight: 19.28 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply that score by how much the test counts. We then add all the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Quality is organized into 5 evidence groups. Each group contains one scored test: Motion, Prompt Accuracy, Character Consistency, Visual Errors, and Frame Consistency.',
    sectionIntro: 'Quality has 5 evidence groups made up of 5 scored tests.',
  },
  evidenceGroupContent: {
    motion: {
      intro: ['Motion measures how natural the movement looks.'],
      whyItMatters:
        'A video should not feel like a still image being stretched, shaken, or awkwardly pushed around.',
    },
    accuracy: {
      intro: ['Prompt Accuracy measures how closely the video follows the instructions you gave it.'],
      whyItMatters:
        'A video can look impressive but still be a bad result when the character does something completely different from what you asked for.',
    },
    'character-consistency': {
      intro: ['Character Consistency measures whether the character stays recognizable throughout the video.'],
      whyItMatters:
        'The face, hair, body, clothing, and other important features should not suddenly change from one frame to the next.',
    },
    'visual-errors': {
      intro: ['Visual Errors measures how many videos contain at least one major problem.'],
      whyItMatters:
        'A video counts as having a major error when the problem is serious enough to make the result clearly broken or difficult to use.',
    },
    'frame-consistency': {
      intro: ['Frame Consistency measures how stable the video stays from beginning to end.'],
      whyItMatters:
        'A video may keep the same general character but still flicker, warp, or change small details every few frames.',
    },
  },
  evidenceSections: [
    {
      id: 'motion',
      title: 'Motion',
      whatItMeasures: 'How natural the movement looks.',
      whyItMatters:
        'A video should not feel like a still image being stretched, shaken, or awkwardly pushed around.',
      howWeTest:
        'We watch all three videos and give each one a Motion rating from 1 to 5. We look at body movement, facial movement, hand movement, camera movement, and whether the movement follows believable physics.',
      whatWeCount: [
        'Natural body movement',
        'Facial expressions that change smoothly',
        'Hands that move without breaking',
        'Camera movement that feels stable',
        'Hair and clothing reacting naturally',
        'Movement that fits the scene',
      ],
      whatWeDoNotCount: [
        'A still image with almost no real movement',
        'Random shaking',
        'Limbs moving in impossible ways',
        'A floating or sliding character',
        'Camera movement that makes the clip difficult to watch',
        'Warping already counted as a major visual error',
      ],
      displayedResult: 'Average Motion rating: 4 out of 5',
      displayedResultExtra: 'Video 1: 4/5 · Video 2: 4/5 · Video 3: 4/5',
      scoringIntro: 'A higher average rating means a higher score.',
      scoringLines: [
        '1 out of 5 = 2/10',
        '2 out of 5 = 4/10',
        '3 out of 5 = 6/10',
        '4 out of 5 = 8/10',
        '5 out of 5 = 10/10',
      ],
      scoringNote: 'The exact average is used between these points.',
      scoringFootnote: 'An average Motion rating of 4 out of 5 scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'More movement is not always better. A small natural action can score higher than a dramatic movement that looks broken.',
    },
    {
      id: 'accuracy',
      title: 'Prompt Accuracy',
      whatItMeasures: 'How closely the video follows the instructions you gave it.',
      whyItMatters:
        'A video can look impressive but still be a bad result when the character does something completely different from what you asked for.',
      howWeTest:
        'We use one prompt with five clear instructions. We rate every video from 1 to 5 based on how many important parts of the prompt it follows. The instructions may cover the requested action, the character\u2019s movement, the setting, the camera behavior, and an object or other important detail.',
      whatWeCount: [
        'The requested action happens',
        'The character moves in the correct way',
        'The scene matches the prompt',
        'Important objects remain visible',
        'Camera movement follows the instruction',
        'The result clearly matches the main idea',
      ],
      whatWeDoNotCount: [
        'A good-looking video that ignores the requested action',
        'A tiny movement when the prompt asks for a full action',
        'Important prompt details appearing only briefly',
        'An unrelated camera movement',
        'A result that uses the source image but ignores the written prompt',
      ],
      displayedResult: 'Average Prompt Accuracy rating: 4.33 out of 5',
      displayedResultExtra: 'Video 1: 4/5 · Video 2: 5/5 · Video 3: 4/5',
      scoringIntro: 'A higher average rating means a higher score.',
      scoringLines: [
        '1 out of 5 = 2/10',
        '2 out of 5 = 4/10',
        '3 out of 5 = 6/10',
        '4 out of 5 = 8/10',
        '5 out of 5 = 10/10',
      ],
      scoringNote: 'The exact average is used between these points.',
      scoringFootnote: 'An average rating of 4.33 out of 5 scores 8.67/10.',
      showWhyItMatters: false,
      edgeCases:
        'Prompt Accuracy does not judge whether the video looks attractive or realistic. It only checks whether the generator created what you asked for.',
    },
    {
      id: 'character-consistency',
      title: 'Character Consistency',
      whatItMeasures: 'Whether the character stays recognizable throughout the video.',
      whyItMatters:
        'The face, hair, body, clothing, and other important features should not suddenly change from one frame to the next.',
      howWeTest:
        'We watch all three videos from beginning to end. We rate every video from 1 to 5 based on how well it keeps the face, hair, body, clothing, and main identifying features.',
      whatWeCount: [
        'The face remains recognizable',
        'Hair stays the same',
        'Body type and proportions stay similar',
        'Clothing remains consistent',
        'Important character details do not disappear',
        'Normal changes caused by movement or camera angle',
      ],
      whatWeDoNotCount: [
        'The face changing into another person',
        'Hair color or style changing without a reason',
        'The body becoming much larger or smaller',
        'Clothing changing or disappearing',
        'Tattoos, accessories, or other details moving around',
        'A character that only matches in the first frame',
      ],
      displayedResult: 'Average Character Consistency rating: 4 out of 5',
      displayedResultExtra: 'Video 1: 4/5 · Video 2: 4/5 · Video 3: 4/5',
      scoringIntro: 'A higher average rating means a higher score.',
      scoringLines: [
        '1 out of 5 = 2/10',
        '2 out of 5 = 4/10',
        '3 out of 5 = 6/10',
        '4 out of 5 = 8/10',
        '5 out of 5 = 10/10',
      ],
      scoringNote: 'The exact average is used between these points.',
      scoringFootnote: 'An average rating of 4 out of 5 scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'The character does not need to look completely frozen. Normal changes in expression, pose, and lighting are allowed as long as the same person remains recognizable.',
    },
    {
      id: 'visual-errors',
      title: 'Visual Errors',
      whatItMeasures: 'How many videos contain at least one major problem.',
      whyItMatters:
        'A video counts as having a major error when the problem is serious enough to make the result clearly broken or difficult to use.',
      howWeTest:
        'We watch all three videos and complete a defect checklist. A video is marked as having a major error when it contains at least one serious issue.',
      whatWeCount: [
        'A broken or changing face',
        'An extra or missing limb',
        'A badly damaged hand',
        'A sudden body change',
        'Broken or impossible movement',
        'Major clothing damage',
        'A heavily distorted background',
        'Objects merging into the character',
      ],
      whatWeDoNotCount: [
        'A small visual problem that does not affect the video',
        'A prompt detail being missed',
        'Slightly awkward but usable movement',
        'A small background flicker',
        'A style choice that is clearly intentional',
        'A failed generation that produced no video, which is tested under Experience',
      ],
      displayedResult: 'Visual error rate: 33.3%',
      displayedResultExtra: '1 of 3 videos had a major visual error',
      scoringIntro: 'Fewer videos with major errors means a higher score.',
      scoringLines: [
        '0 of 3 = 10/10',
        '1 of 3 = 6.67/10',
        '2 of 3 = 3.33/10',
        '3 of 3 = 0/10',
      ],
      scoringFootnote: 'A result of 1 video with a major error scores 6.67/10.',
      showWhyItMatters: false,
      edgeCases:
        'Each video is counted once. A video with several major problems still counts as one video with an error.',
    },
    {
      id: 'frame-consistency',
      title: 'Frame Consistency',
      whatItMeasures: 'How stable the video stays from beginning to end.',
      whyItMatters:
        'A video may keep the same general character but still flicker, warp, or change small details every few frames.',
      howWeTest:
        'We watch all three videos from beginning to end. We rate every video from 1 to 5 based on whether it avoids major face changes, body changes, clothing changes, object changes, and background flicker.',
      whatWeCount: [
        'The face remains stable between frames',
        'Body proportions do not pulse or warp',
        'Clothing stays consistent',
        'Objects remain in the same place',
        'The background does not constantly flicker',
        'Movement flows smoothly from one frame to the next',
      ],
      whatWeDoNotCount: [
        'Normal movement',
        'A requested camera change',
        'Lighting changing naturally',
        'Small changes that are difficult to notice',
        'A character identity problem already covered under Character Consistency',
        'One major defect already counted under Visual Errors',
      ],
      displayedResult: 'Average Frame Consistency rating: 3.67 out of 5',
      displayedResultExtra: 'Video 1: 4/5 · Video 2: 3/5 · Video 3: 4/5',
      scoringIntro: 'A higher average rating means a higher score.',
      scoringLines: [
        '1 out of 5 = 2/10',
        '2 out of 5 = 4/10',
        '3 out of 5 = 6/10',
        '4 out of 5 = 8/10',
        '5 out of 5 = 10/10',
      ],
      scoringNote: 'The exact average is used between these points.',
      scoringFootnote: 'An average rating of 3.67 out of 5 scores 7.33/10.',
      showWhyItMatters: false,
      edgeCases:
        'Character Consistency and Frame Consistency are related but different. Character Consistency asks whether it remains the same person. Frame Consistency asks whether the full video remains visually stable.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Video generation always includes some randomness.',
      'The same prompt can create a strong result once and a broken result the next time. Testing three videos reduces the effect of luck, but it cannot remove it completely.',
      'The source image also matters. A simple portrait with a clean background may work much better than a full-body image with several people or objects.',
      'Longer videos are usually harder to keep stable. The longer the clip continues, the more chances the face, body, clothing, or background has to change.',
      'Quality only looks at the finished video. Generation speed, failures, and ease of use are tested separately under Video Experience.',
    ],
  },
};

const videoExperience: TestSubscoreMethodologyContent = {
  categoryKey: 'video',
  subscoreSlug: 'experience',
  heroIntro: [
    'Experience measures what it is actually like to use the video generator.',
    'A generator can create good videos and still be frustrating when every attempt takes several minutes, videos regularly fail, or you need to click through too many screens just to start.',
    'We check generation speed, failed attempts, how many steps it takes to create a video, and whether you can quickly retry a finished result.',
  ],
  whyItMatters: {
    title: 'Why Experience matters',
    paragraphs: [
      'AI video generation can be expensive and slow.',
      'A platform may create a great-looking video, but that does not help much when every attempt takes 20 minutes or half the generations fail.',
      'Failed attempts are especially frustrating when the app still uses your credits. You may need to pay again just to get the video you originally asked for.',
      'Ease of use also matters because many people signing up for AI girlfriend apps are beginners. You should not need to understand complicated video software or search through several menus before creating your first clip.',
      'Regeneration makes bad results easier to fix. Instead of setting everything up again, you should be able to quickly retry the video or create another version.',
      'A good video generator should be fast, reliable, and simple enough that normal users can create a video without a tutorial.',
    ],
  },
  howWeTest: {
    title: 'How we test Experience',
    paragraphs: [
      'We use a paid account and test the normal video-generation process available to users.',
      'For Speed, we time 10 video generations. The timer starts when generation is submitted and stops when the finished video becomes available.',
      'For Failures, we record how many of those 10 attempts fail completely, remain stuck, produce no video, or produce a completely unusable result.',
      'For Ease of Use, we create three videos and count every required click or action from opening the generator to starting the generation.',
      'Finally, we try to regenerate three finished videos.',
      'This lets us compare how fast, reliable, and easy each generator is under normal use.',
    ],
  },
  highLowScore: {
    title: 'What good Experience looks like',
    paragraphs: [
      'A high Experience score means videos generate reasonably quickly, failures are rare, the generator is easy to use, and finished videos can be retried.',
      'A lower score means videos take too long, attempts regularly fail, or creating one clip requires too many steps.',
    ],
  },
  scoreCalculation: {
    title: 'How the Experience score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Experience score.',
      'Experience makes up 33% of the Video score.',
      'The first three tests count slightly more than Regeneration.',
      'The stored weights are 17, 17, 17, and 16. We convert them into the percentages below so readers can easily see how much each test counts.',
    ],
    evidenceWeights: [
      { label: 'Speed', weight: 25.37 },
      { label: 'Failures', weight: 25.37 },
      { label: 'Ease of Use', weight: 25.37 },
      { label: 'Regeneration', weight: 23.88 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply that score by how much the test counts. We then add all the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly unfair. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Experience is organized into 4 evidence groups. Each group contains one scored test: Speed, Failures, Ease of Use, and Regeneration.',
    sectionIntro: 'Experience has 4 evidence groups made up of 4 scored tests.',
  },
  evidenceGroupContent: {
    speed: {
      intro: ['Speed measures how long the generator normally takes to finish a video.'],
      whyItMatters:
        'Fast generation makes it easier to try new ideas and replace a bad result without waiting several minutes every time.',
    },
    failures: {
      intro: ['Failures measures how often a video-generation attempt does not produce a usable result.'],
      whyItMatters:
        'A generator may be fast, but it is still frustrating when too many attempts fail or remain stuck.',
    },
    'ease-of-use': {
      intro: ['Ease of Use measures how many steps it takes to start creating a video.'],
      whyItMatters:
        'A simple generator should let you move from opening the tool to starting generation without clicking through several confusing screens.',
    },
    regeneration: {
      intro: ['Regeneration measures whether you can quickly retry a finished video or create another version.'],
      whyItMatters:
        'This can save time when the first result is broken or does not look how you expected.',
    },
  },
  evidenceSections: [
    {
      id: 'speed',
      title: 'Speed',
      whatItMeasures: 'How long the generator normally takes to finish a video.',
      whyItMatters:
        'Fast generation makes it easier to try new ideas and replace a bad result without waiting several minutes every time.',
      howWeTest:
        'We time 10 video generations. The timer starts when we submit the generation and stops when the finished video is available. We use the median time. The median is the middle result after all 10 times are placed in order. This prevents one unusually fast or slow attempt from changing the score too much.',
      whatWeCount: [
        'Processing time after pressing Generate',
        'Time spent waiting in a generation queue',
        'Time until the finished video can be played',
        'Normal attempts made through the paid account',
      ],
      whatWeDoNotCount: [
        'Time spent writing the prompt',
        'Time spent choosing the source image',
        'Time spent downloading the finished video',
        'A confirmed internet or platform outage',
        'Time after the finished video becomes available',
      ],
      displayedResult: '95 seconds',
      displayedResultExtra: 'Median generation time: 95 seconds',
      scoringEvidenceSlug: 'speed',
      scoringIntro: 'Faster generation means a higher score.',
      scoringFootnote: 'A median generation time of 95 seconds scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Video length and quality settings can affect generation time. We record the settings used so the result has proper context.',
    },
    {
      id: 'failures',
      title: 'Failures',
      whatItMeasures: 'How often a video-generation attempt does not produce a usable result.',
      whyItMatters:
        'A generator may be fast, but it is still frustrating when too many attempts fail or remain stuck.',
      howWeTest:
        'We record the result of 10 video-generation attempts. An attempt is marked as failed when it shows an error, remains stuck, produces no video, or produces a completely unusable result.',
      whatWeCount: [
        'An error message instead of a video',
        'A generation that never finishes',
        'A blank or corrupted video',
        'A video that cannot be opened or played',
        'A severely broken result that cannot reasonably be used',
      ],
      whatWeDoNotCount: [
        'A video we simply do not like',
        'A prompt detail being missed',
        'Minor visual problems',
        'A finished video with weak motion',
        'A slow attempt that eventually produces a usable result',
      ],
      displayedResult: 'Failure rate: 20%',
      displayedResultExtra: '2 failed attempts out of 10',
      scoringIntro: 'Fewer failures means a higher score.',
      scoringLines: [
        '0% = 10/10',
        '20% = 8/10',
        '40% = 6/10',
        '60% = 4/10',
        '80% = 2/10',
        '100% = 0/10',
      ],
      scoringNote: 'The exact failure rate is used between these points.',
      scoringFootnote: 'A failure rate of 20% scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Prompt accuracy and visual problems are scored separately under Video Quality. Failures only covers attempts that do not produce a usable finished video.',
    },
    {
      id: 'ease-of-use',
      title: 'Ease of Use',
      whatItMeasures: 'How many steps it takes to start creating a video.',
      whyItMatters:
        'A simple generator should let you move from opening the tool to starting generation without clicking through several confusing screens.',
      howWeTest:
        'We create three videos. For each video, we count every required click or action from opening the generator to starting the generation. We then calculate the average number of steps.',
      whatWeCount: [
        'Opening the video generator',
        'Selecting the character or source image',
        'Entering the required prompt',
        'Choosing required video settings',
        'Pressing the final Generate button',
        'Any other required action before generation starts',
      ],
      whatWeDoNotCount: [
        'Optional settings',
        'Time spent waiting for the video',
        'Downloading the finished result',
        'Watching the finished video',
        'Editing or regenerating afterward',
        'Actions that only appear because the tester chooses an optional feature',
      ],
      displayedResult: '4 steps',
      displayedResultExtra: 'Average steps to start: 4',
      scoringEvidenceSlug: 'ease-of-use',
      scoringIntro: 'Fewer required steps means a higher score.',
      scoringFootnote: 'An average of 4 steps scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Fewer steps normally means the generator is easier to use. However, we do not reward an app for removing useful controls. The review can still explain when a generator is simple because it gives users almost no creative freedom.',
    },
    {
      id: 'regeneration',
      title: 'Regeneration',
      whatItMeasures: 'Whether you can quickly retry a finished video or create another version.',
      whyItMatters:
        'This can save time when the first result is broken or does not look how you expected.',
      howWeTest:
        'We create three finished videos. We then try to regenerate each one through the normal controls. We check whether a new video is created and whether important restrictions affect the feature.',
      whatWeCount: [
        'A Regenerate or Retry button',
        'Creating another version from the same setup',
        'Reusing the source image and settings',
        'A new finished video being produced',
        'The feature working through normal paid access',
      ],
      whatWeDoNotCount: [
        'Starting a completely new generation from scratch',
        'Re-entering every setting manually',
        'Regenerating only the source image',
        'A button that returns the same finished file',
        'An attempt that fails without producing another video',
      ],
      displayedResult: 'Limited \u2014 2 of 3 videos were regenerated successfully',
      scoringLines: [
        'Yes \u2014 all three regenerations worked = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 finished videos could not be regenerated = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Regeneration scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Some apps create a new variation, while others repeat the same prompt and settings. Both can count when the feature saves users from rebuilding the full generation manually.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'Generation speed can change depending on server demand, internet connection, video length, and the settings used.',
      'One slow generation does not automatically mean the platform is slow. We use the median time from several attempts so one unusual result does not control the score.',
      'A video can also take longer because it has a higher resolution or longer duration. We record the settings used so readers can understand the result.',
      'Ease of use does not measure how attractive the interface looks. It measures how many required steps users need to complete before generation starts.',
      'Regeneration can also work in different ways. Some apps retry the same setup, while others create a variation. We record what the button actually does and use Limited when important restrictions make it less useful.',
      'Video quality, motion, and character consistency are tested separately under Video Quality.',
    ],
  },
};

const privacyDataUse: TestSubscoreMethodologyContent = {
  categoryKey: 'privacy',
  subscoreSlug: 'data-use',
  heroIntro: [
    'Data Use looks at what the company does with your chats, photos, and personal information.',
    'AI girlfriend apps can collect extremely private data. We check whether your information may be used to train AI, read by people, shared with other companies, or used for advertising.',
    'We also check how long the company says it keeps your data and whether its privacy policy gives clear answers.',
  ],
  whyItMatters: {
    title: 'Why Data Use matters',
    paragraphs: [
      'AI girlfriend apps are adult platforms, and users may share very private information with them.',
      'This can include intimate chats, personal photos, relationship details, and information you would never want shared publicly.',
      'The problem is that it is not always clear what happens after you press Send.',
      'Some companies may use chats or photos to train their AI. Employees or outside contractors may be allowed to review conversations. Personal data may also be shared with other companies or used for advertising.',
      'That does not automatically mean the app is doing something illegal. But you deserve to know what is happening before you share anything private.',
      'A strong Data Use result means the company clearly explains what it does, avoids unnecessary use of private information, and does not hide important details inside vague legal language.',
    ],
  },
  howWeTest: {
    title: 'How we test Data Use',
    paragraphs: [
      'We use a paid test account and review the platform\u2019s privacy policy, terms of service, help pages, account settings, and training and privacy controls.',
      'We read the policy pages once and use the same sources for the related tests.',
      'For each answer, we save the result, the source, the date checked, and any important wording or limitation.',
      'We never assume a privacy protection exists just because it is common on other apps. The company needs to clearly explain it.',
      'Training is also checked inside the test account because some apps place the real choice inside the settings instead of the privacy policy.',
    ],
  },
  highLowScore: {
    title: 'What good Data Use looks like',
    paragraphs: [
      'A high Data Use score means the company clearly explains how it handles your information and avoids using it in ways that could put your privacy at risk.',
      'A lower score means chats or photos may be used for training, read by people, shared widely, or kept for an unclear amount of time.',
    ],
  },
  scoreCalculation: {
    title: 'How the Data Use score is calculated',
    paragraphs: [
      'Every test gets a score from 0 to 10.',
      'We multiply each test score by how much it counts. We then add all the points together to calculate the final Data Use score.',
      'Data Use makes up 31% of the Privacy score.',
      'The stored weights add up to 98, so we convert them into percentages that add up to 100%.',
      'Policy Clarity has the biggest effect on this score because clear information is especially important when dealing with private data.',
    ],
    evidenceWeights: [
      { label: 'Training', weight: 14.29 },
      { label: 'Human Review', weight: 14.29 },
      { label: 'Data Sharing', weight: 4.08 },
      { label: 'Advertising', weight: 4.08 },
      { label: 'Retention', weight: 20.41 },
      { label: 'Policy Clarity', weight: 42.86 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply that score by how much the test counts. We then add all the points together.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'Not Applicable',
          body: 'If a test does not apply, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Unknown',
          body: 'Privacy works differently from most other categories. If the company does not give a clear answer, we mark the result as Unknown and leave it out of the calculation. Unknown does not mean the app is safe. It means we could not confirm the answer.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly misleading. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Data Use is organized into 6 evidence groups. Each group contains one scored test: Training, Human Review, Data Sharing, Advertising, Retention, and Policy Clarity.',
    sectionIntro: 'Data Use has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    training: {
      intro: ['Training measures whether the company says your chats, photos, or other personal data may be used to train or improve its AI.'],
      whyItMatters:
        'Many users may not expect private conversations to become training material.',
    },
    'human-review': {
      intro: ['Human Review measures whether employees or outside workers may read your chats.'],
      whyItMatters:
        'Human access may sometimes be needed for support, safety, or abuse reports. The important part is whether the company clearly explains when and why it can happen.',
    },
    'data-sharing': {
      intro: ['Data Sharing measures whether personal information is shared with other companies.'],
      whyItMatters:
        'Some sharing is needed to run an online service. The bigger concern is broad or poorly explained sharing.',
    },
    advertising: {
      intro: ['Advertising measures whether personal information is used for ads, personalized marketing, or user profiling.'],
      whyItMatters:
        'This matters because private chats and interests should not quietly become advertising data.',
    },
    retention: {
      intro: ['Retention measures how long the company says it keeps your information.'],
      whyItMatters:
        'Deleting a chat or account does not always mean the data disappears immediately.',
    },
    'policy-clarity': {
      intro: ['Policy Clarity measures whether the company gives clear answers to the privacy questions users are most likely to care about.'],
      whyItMatters:
        'A long privacy policy is not helpful when it avoids the important questions.',
    },
  },
  evidenceSections: [
    {
      id: 'training',
      title: 'Training',
      whatItMeasures: 'Whether the company says your chats, photos, or other personal data may be used to train or improve its AI.',
      whyItMatters:
        'Many users may not expect private conversations to become training material.',
      howWeTest:
        'We search the privacy policy, terms of service, help pages, and account settings. We look for clear wording about AI training, model improvement, product improvement, and similar uses.',
      whatWeCount: [
        'Chats used to train AI models',
        'Photos used to improve image models',
        'Personal content used to improve automated systems',
        'Data used for training unless the user opts out',
        'Clear wording that private content is not used for training',
      ],
      whatWeDoNotCount: [
        'Anonymous technical data used to fix crashes',
        'Basic usage statistics with no chat content',
        'Claims made by unofficial users or social-media accounts',
        'Assumptions based on what other companies do',
      ],
      displayedResult: 'No \u2014 the company says private chats and photos are not used for AI training',
      displayedResultExtra: 'Source checked: Privacy policy',
      scoringLines: [
        'No \u2014 private content is not used for training = 10/10',
        'Limited \u2014 only some data is used or clear limits apply = 3/10',
        'Yes \u2014 private content may be used for training = 0/10',
        'Unknown \u2014 no clear answer = Excluded',
      ],
      scoringFootnote: 'In this example, Training scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'We record the source and date because a company can change its training rules later. If the policy gives no clear answer, we use Unknown instead of guessing.',
    },
    {
      id: 'human-review',
      title: 'Human Review',
      whatItMeasures: 'Whether employees or outside workers may read your chats.',
      whyItMatters:
        'Human access may sometimes be needed for support, safety, or abuse reports. The important part is whether the company clearly explains when and why it can happen.',
      howWeTest:
        'We search the privacy policy, terms, and help pages for wording about employees reading chats, contractors reviewing content, safety reviews, support access, quality checks, and moderation.',
      whatWeCount: [
        'Employees may review conversations',
        'Contractors may access chat content',
        'Chats may be checked for safety or quality',
        'Human access is clearly limited to specific situations',
        'The company clearly states that people do not routinely read chats',
      ],
      whatWeDoNotCount: [
        'Automated moderation with no human access',
        'A support agent reading a message you directly send to support',
        'Unverified claims from users',
        'General wording about \u201cprocessing\u201d data with no mention of people',
      ],
      displayedResult: 'No \u2014 the company says chats are not routinely reviewed by people',
      scoringLines: [
        'No \u2014 people do not routinely review chats = 10/10',
        'Limited \u2014 review only happens in clearly limited situations = 3/10',
        'Yes \u2014 people may broadly review chats = 0/10',
        'Unknown \u2014 no clear answer = Excluded',
      ],
      scoringFootnote: 'In this example, Human Review scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'A company may receive a Limited result when human review only happens for clear reasons, such as reported content or support requests.',
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      whatItMeasures: 'Whether personal information is shared with other companies.',
      whyItMatters:
        'Some sharing is needed to run an online service. The bigger concern is broad or poorly explained sharing.',
      howWeTest:
        'We review the list of third parties or groups of companies that may receive user data. We record whether sharing happens, why the data is shared, which types of companies receive it, and how many third-party categories are listed.',
      whatWeCount: [
        'Cloud and hosting providers',
        'Analytics companies',
        'Payment processors',
        'Advertising partners',
        'AI model providers',
        'Other companies receiving user information',
      ],
      whatWeDoNotCount: [
        'Data kept only inside the company',
        'Sharing required by law when clearly explained',
        'Anonymous statistics that cannot reasonably identify a user',
        'Companies mentioned without receiving user data',
      ],
      displayedResult: 'Limited \u2014 data is shared with hosting, analytics, and payment providers',
      displayedResultExtra: 'Third-party categories: 3',
      scoringLines: [
        'No \u2014 personal data is not shared with outside companies = 10/10',
        'Limited \u2014 sharing is clearly restricted to necessary providers = 4/10',
        'Yes \u2014 personal data is shared more broadly = 0/10',
        'Unknown \u2014 no clear answer = Excluded',
      ],
      scoringFootnote: 'In this example, Data Sharing scores 4/10.',
      showWhyItMatters: false,
      edgeCases:
        'Almost every online service uses some outside providers. We use Limited when sharing is necessary and clearly restricted. We use Yes when sharing is broad or goes beyond what is reasonably needed to operate the service.',
    },
    {
      id: 'advertising',
      title: 'Advertising',
      whatItMeasures: 'Whether personal information is used for ads, personalized marketing, or user profiling.',
      whyItMatters:
        'This matters because private chats and interests should not quietly become advertising data.',
      howWeTest:
        'We check the privacy policy and account settings for wording about advertising, personalized ads, marketing profiles, tracking, behavioral advertising, and selling or sharing data for ads.',
      whatWeCount: [
        'Personal information used to choose ads',
        'User behavior used for ad targeting',
        'Data shared with advertising partners',
        'Profiles created for marketing',
        'A clear statement that personal data is not used for advertising',
      ],
      whatWeDoNotCount: [
        'The company sending its own basic service emails',
        'A general newsletter the user chose to receive',
        'Non-personalized ads with no user profiling',
        'Necessary payment or account messages',
      ],
      displayedResult: 'No \u2014 the company says personal data is not used for personalized advertising',
      scoringLines: [
        'No \u2014 personal data is not used for advertising = 10/10',
        'Limited \u2014 some restricted advertising use applies = 3/10',
        'Yes \u2014 personal data may be used for advertising = 0/10',
        'Unknown \u2014 no clear answer = Excluded',
      ],
      scoringFootnote: 'In this example, Advertising scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Marketing and personalized advertising are not the same. We focus on whether personal information is used to target or profile the user.',
    },
    {
      id: 'retention',
      title: 'Retention',
      whatItMeasures: 'How long the company says it keeps your information.',
      whyItMatters:
        'Deleting a chat or account does not always mean the data disappears immediately.',
      howWeTest:
        'We record the stated storage period for chats, account information, payment information, and deleted data. We use the exact time given by the company, such as days, months, or years.',
      whatWeCount: [
        'A clear number of days, months, or years',
        'Different periods for different types of data',
        'A clear explanation of what happens after deletion',
        'Legal or security exceptions that are clearly explained',
      ],
      whatWeDoNotCount: [
        'We keep data as long as needed with no useful limit',
        'A deletion button with no explanation of what happens afterward',
        'Guessing how long a company probably stores information',
        'Retention periods from an outdated policy',
      ],
      displayedResult: 'Chats: Deleted within 30 days',
      displayedResultExtra:
        'Account information: Kept while the account is active · Payment records: Up to 7 years · Deleted data backups: Up to 90 days',
      scoringNote:
        'Retention receives a manual score from 0 to 10. Clear, specific, and reasonable storage periods lead to a higher score. Vague wording, missing periods, or very long unexplained storage lead to a lower score. The product evidence shows the recorded periods and the reason for the score.',
      scoringFootnote: 'Example Retention score: 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Retention does not use one simple scoring table because different types of data may need different storage periods. We record the exact result and explain why the score was given.',
    },
    {
      id: 'policy-clarity',
      title: 'Policy Clarity',
      whatItMeasures: 'Whether the company gives clear answers to the privacy questions users are most likely to care about.',
      whyItMatters:
        'A long privacy policy is not helpful when it avoids the important questions.',
      howWeTest:
        'We check whether the company clearly answers these six questions: Are chats used for AI training? Can people read chats? Is data shared with other companies? Can users delete their data? How long is data stored? What security protection is used? Each clear answer counts as one passed check.',
      whatWeCount: [
        'A direct Yes or No answer',
        'A clear explanation of when something happens',
        'Important restrictions stated in plain language',
        'Information that is easy to find in official pages',
      ],
      whatWeDoNotCount: [
        'Vague statements such as we care about privacy',
        'Legal wording that never answers the question',
        'Important information spread across conflicting pages',
        'Answers from unofficial sources',
        'A topic being mentioned without explaining what actually happens',
      ],
      displayedResult: '5 of 6 questions clearly answered',
      displayedResultExtra: 'Policy Clarity result: 83.3%',
      scoringIntro: 'A higher percentage means a higher score.',
      scoringLines: [
        '0 of 6 = 0/10',
        '1 of 6 = 1.67/10',
        '2 of 6 = 3.33/10',
        '3 of 6 = 5/10',
        '4 of 6 = 6.67/10',
        '5 of 6 = 8.33/10',
        '6 of 6 = 10/10',
      ],
      scoringFootnote: 'A result of 5 clear answers scores 8.33/10.',
      showWhyItMatters: false,
      edgeCases:
        'Policy Clarity does not reward a company for having privacy-friendly practices. It rewards the company for clearly telling users what those practices are. The actual practices are scored in the other tests.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'We cannot look inside a company\u2019s private systems.',
      'We can only check what the company says, what its settings show, and what normal users can test.',
      'A company may follow better practices than its policy explains. It may also write a strong policy without following it properly. Our score reflects the evidence we can confirm.',
      'Privacy wording can also be difficult to understand. We use the clearest reasonable meaning, save the source, and explain important uncertainty.',
      'Policies change regularly. Our results show what the company stated on the recorded test date.',
    ],
  },
};

const privacyUserControl: TestSubscoreMethodologyContent = {
  categoryKey: 'privacy',
  subscoreSlug: 'user-control',
  heroIntro: [
    'User Control measures how much control you have over the personal information stored by an AI girlfriend app.',
    'We check whether you can delete conversations, close your account, request deletion of personal data stored outside the visible account, opt out of AI training, and download a copy of your data.',
    'These controls matter because deleting something from the screen does not always mean the company has deleted it from its systems.',
    'The current live database contains five User Control evidence tests. Consent Controls appears in an older methodology description but is not an active evidence definition in the live scoring system.',
  ],
  whyItMatters: {
    title: 'Why User Control matters',
    paragraphs: [
      'AI girlfriend apps can store highly personal information.',
      'This may include private conversations, uploaded photos, generated images and videos, character preferences, relationship details, payment and account information, and information saved by the AI as memories.',
      'A delete button does not always remove all of this information.',
      'Deleting a conversation may only remove it from your chat list. Closing an account may leave backups, payment records, or other stored information behind.',
      'That is why we test several different controls.',
      'Delete Chats checks whether individual conversations can be removed. Delete Account checks whether users can close the full account without fighting through support.',
      'Delete Personal Data goes further by checking whether users can request deletion of information that may remain outside the visible account.',
      'Training Opt-Out checks whether users can stop their content from being used to improve AI models. Export Data checks whether users can obtain a copy of the information connected to their account.',
      'A strong platform should make these controls easy to find and easy to understand.',
    ],
  },
  howWeTest: {
    title: 'How we test User Control',
    paragraphs: [
      'We use a paid test account and complete the User Data Controls test session.',
      'We create three chats and try to delete each one.',
      'We then check the account settings for a direct account-deletion option and count the number of steps required to request deletion.',
      'We review the account settings, privacy policy, terms, and help pages to determine whether users can request deletion of personal information stored outside the visible account.',
      'We also check those sources for an AI-training opt-out.',
      'Finally, we request an export of the test account\u2019s data and record whether it arrives within 30 days.',
      'For every test, we save the result, relevant notes, and supporting evidence.',
    ],
  },
  highLowScore: {
    title: 'What good User Control looks like',
    paragraphs: [
      'A high User Control score means users can remove their conversations, close their accounts, request full data deletion, control AI training, and download their information.',
      'A lower score means important controls are missing, hidden, or only available through a slow support process.',
    ],
  },
  scoreCalculation: {
    title: 'How the User Control score is calculated',
    paragraphs: [
      'Every test receives a score from 0 to 10.',
      'The live database stores the following weights: 25 for Delete Chats, 25 for Delete Account, 12 for Delete Personal Data, 12 for Training Opt-Out, and 12 for Export Data.',
      'These weights add up to 86 rather than 100. The scoring engine automatically rescales them when calculating the final score.',
      'After rescaling, the public percentages are 29.07% for Delete Chats, 29.07% for Delete Account, and 13.95% for each of the remaining three tests.',
      'Delete Chats and Delete Account have the largest effect on the score.',
    ],
    evidenceWeights: [
      { label: 'Delete Chats', weight: 29.07 },
      { label: 'Delete Account', weight: 29.07 },
      { label: 'Delete Personal Data', weight: 13.95 },
      { label: 'Training Opt-Out', weight: 13.95 },
      { label: 'Export Data', weight: 13.95 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'The stored weights are 25, 25, 12, 12, and 12, totaling 86. Percentages are rounded for display. The calculation engine uses the original stored weights and rescales them proportionally.',
    calculationNotes: {
      title: 'Standard scoring',
      items: [
        {
          title: 'Yes',
          body: 'The control is clearly available and works without an important restriction.',
        },
        {
          title: 'Limited',
          body: 'The control exists, but an important restriction makes it less useful. Examples include only some data can be deleted, support must be contacted, the export is incomplete, or the training opt-out only covers some content.',
        },
        {
          title: 'No',
          body: 'The control is clearly unavailable.',
        },
        {
          title: 'Unknown',
          body: 'We could not confirm whether the control exists. Privacy Unknown results are excluded from the calculation rather than automatically receiving 0. Unknown does not mean the app is safe or that the control is available.',
        },
        {
          title: 'Not Applicable',
          body: 'A test can be marked Not Applicable when it genuinely does not apply. For example, Training Opt-Out may be Not Applicable when the company clearly states that private chats and photos are never used for AI training. When a test is Not Applicable, we remove it and spread its weight across the remaining tests.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly misleading. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'User Control is organized into 5 evidence groups. Each group contains one scored test: Delete Chats, Delete Account, Delete Personal Data, Training Opt-Out, and Export Data.',
    sectionIntro: 'User Control has 5 evidence groups made up of 5 scored tests.',
  },
  evidenceGroupContent: {
    'delete-chats': {
      intro: ['Delete Chats measures whether you can remove individual conversations from your account.'],
      whyItMatters:
        'This lets you remove a private or unwanted conversation without deleting your full account.',
    },
    'delete-account': {
      intro: ['Delete Account measures whether users can request account deletion directly through the account settings.'],
      whyItMatters:
        'A user should not need to search through legal pages or argue with customer support just to leave the platform.',
    },
    'delete-personal-data': {
      intro: [
        'Delete Personal Data measures whether users can request deletion of personal information that may remain outside the visible account.',
      ],
      whyItMatters: 'This is broader than deleting chats or closing the account.',
    },
    'training-opt-out': {
      intro: [
        'Training Opt-Out measures whether users can stop their chats, photos, or other content from being used to train or improve AI systems.',
      ],
      whyItMatters:
        'This test focuses on user choice. Whether the company uses private content for training in the first place is scored separately under Data Use.',
    },
    'export-data': {
      intro: ['Export Data measures whether you can request and receive a copy of the information connected to your account.'],
      whyItMatters:
        'This can help users understand what the platform stores and keep a copy before deleting their account.',
    },
  },
  evidenceSections: [
    {
      id: 'delete-chats',
      title: 'Delete Chats',
      whatItMeasures: 'Whether you can remove individual conversations from your account.',
      whyItMatters:
        'This lets you remove a private or unwanted conversation without deleting your full account.',
      howWeTest:
        'We create three separate chats. We try to delete each conversation through the normal controls available to users. We record how many chats were deleted, whether restrictions applied, and whether the chats remained removed after reopening the account.',
      whatWeCount: [
        'Deleting one full conversation',
        'The conversation disappearing from the chat list',
        'The deletion remaining after refreshing or reopening the app',
        'A normal deletion control available to users',
      ],
      whatWeDoNotCount: [
        'Deleting individual messages while the conversation remains',
        'Archiving or hiding the chat',
        'Muting notifications',
        'Removing the character while keeping the chat history',
        'A deleted chat returning after the page is refreshed',
      ],
      displayedResult: 'Yes \u2014 all 3 chats were deleted successfully',
      scoringLines: [
        'Yes \u2014 all three chats could be deleted = 10/10',
        'Limited \u2014 only some worked or important restrictions applied = 5/10',
        'No \u2014 chats could not be deleted = 0/10',
        'Unknown \u2014 result could not be confirmed = Excluded',
      ],
      scoringFootnote: 'In this example, Delete Chats scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test confirms that the chat is removed from the visible account. We cannot independently confirm when every server backup is permanently erased.',
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      whatItMeasures: 'Whether users can request account deletion directly through the account settings.',
      whyItMatters:
        'A user should not need to search through legal pages or argue with customer support just to leave the platform.',
      howWeTest:
        'We open the test account\u2019s settings and look for an account-deletion option. We count every required step from opening the settings to reaching the deletion request or final confirmation. We also record whether the option is inside the account, support must be contacted, extra identity checks are required, and the company explains what happens to stored data.',
      whatWeCount: [
        'A clearly labelled Delete Account option',
        'An in-product deletion request',
        'A normal process available to paying users',
        'Clear confirmation of what the request will remove',
      ],
      whatWeDoNotCount: [
        'Logging out',
        'Cancelling the subscription without deleting the account',
        'Removing the app from the device',
        'Deactivating notifications',
        'A policy saying deletion is possible without explaining how',
      ],
      displayedResult: 'Limited \u2014 deletion was available, but support had to be contacted',
      displayedResultExtra: 'Steps required: 6',
      scoringLines: [
        'Yes \u2014 deletion can be requested directly in account settings = 10/10',
        'Limited \u2014 deletion exists but requires extra help or important restrictions apply = 5/10',
        'No \u2014 no usable account-deletion process was found = 0/10',
        'Unknown \u2014 the process could not be confirmed = Excluded',
      ],
      scoringFootnote: 'In this example, Delete Account scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Cancelling a paid subscription and deleting an account are different actions. To avoid destroying the test account before all testing is complete, we may stop at the final irreversible confirmation step. The live test measures whether the deletion request is available and how many steps it requires.',
    },
    {
      id: 'delete-personal-data',
      title: 'Delete Personal Data',
      whatItMeasures:
        'Whether users can request deletion of personal information that may remain outside the visible account.',
      whyItMatters: 'This is broader than deleting chats or closing the account.',
      howWeTest:
        'We review the privacy policy, account settings, help pages, and data-request instructions. We check whether users can request deletion of stored personal information beyond the content they can remove themselves.',
      whatWeCount: [
        'A personal-data deletion request',
        'A privacy request form',
        'A clear email or contact method for deletion requests',
        'Clear instructions explaining which data can be removed',
        'A process available to normal users',
      ],
      whatWeDoNotCount: [
        'Only deleting visible chats',
        'Only deleting the account profile',
        'Cancelling the subscription',
        'Asking the AI character to forget something',
        'A vague statement saying users have rights without explaining how to use them',
      ],
      displayedResult:
        'Yes \u2014 users can submit a request to delete personal data stored outside the visible account',
      scoringLines: [
        'Yes \u2014 a clear personal-data deletion process exists = 10/10',
        'Limited \u2014 only some data can be deleted or important restrictions apply = 5/10',
        'No \u2014 no personal-data deletion process is available = 0/10',
        'Unknown \u2014 the company does not clearly explain the process = Excluded',
      ],
      scoringFootnote: 'In this example, Delete Personal Data scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Some information may be kept for legal, payment, fraud-prevention, or security reasons. A platform can still pass when it clearly explains these exceptions and provides a real deletion process for other personal data.',
    },
    {
      id: 'training-opt-out',
      title: 'Training Opt-Out',
      whatItMeasures:
        'Whether users can stop their chats, photos, or other content from being used to train or improve AI systems.',
      whyItMatters:
        'This test focuses on user choice. Whether the company uses private content for training in the first place is scored separately under Data Use.',
      howWeTest:
        'We check the account settings, privacy settings, privacy policy, help pages, and training or model-improvement controls. We look for a clear option or request process that lets users opt out.',
      whatWeCount: [
        'A training toggle inside the account',
        'A clear opt-out request form',
        'A documented email process',
        'An opt-out covering chats, images, or other private content',
        'Clear information about what the opt-out changes',
      ],
      whatWeDoNotCount: [
        'Turning off marketing emails',
        'Disabling personalized advertising',
        'Deleting one chat',
        'A vague privacy setting with no explanation',
        'A policy saying data may be used without providing a choice',
      ],
      displayedResult:
        'Limited \u2014 users can opt out of future training, but the control does not cover data already collected',
      scoringLines: [
        'Yes \u2014 a clear and useful training opt-out exists = 10/10',
        'Limited \u2014 the opt-out covers only some data or important restrictions apply = 5/10',
        'No \u2014 training may occur and no opt-out exists = 0/10',
        'Unknown \u2014 training choice is not clearly explained = Excluded',
        'Not Applicable \u2014 private content is clearly not used for training = Removed and weights rescaled',
      ],
      scoringFootnote: 'In this example, Training Opt-Out scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'When a company clearly states that private content is never used for AI training, this test may be marked Not Applicable because there is nothing to opt out from. When the company uses some information but lets users opt out of only part of that use, the result may be Limited.',
    },
    {
      id: 'export-data',
      title: 'Export Data',
      whatItMeasures: 'Whether you can request and receive a copy of the information connected to your account.',
      whyItMatters:
        'This can help users understand what the platform stores and keep a copy before deleting their account.',
      howWeTest:
        'We request an export of the paid test account\u2019s data. We record how the export is requested, whether support is required, when the export arrives, what file formats are included, and whether important account information is present. The live methodology allows up to 30 days for the export to arrive.',
      whatWeCount: [
        'A self-service data export',
        'A formal data-access request',
        'A downloadable account-data file',
        'An export delivered within the test period',
        'A file that opens and contains account information',
      ],
      whatWeDoNotCount: [
        'Copying chats manually',
        'Taking screenshots',
        'Exporting only one conversation when a full account export was requested',
        'Receiving an empty or broken file',
        'A policy saying users can request data without providing a working process',
      ],
      displayedResult: 'Yes \u2014 the account export arrived after 8 days',
      displayedResultExtra: 'Format: JSON and HTML',
      scoringLines: [
        'Yes \u2014 a useful account-data export was received = 10/10',
        'Limited \u2014 the export was incomplete or important restrictions applied = 5/10',
        'No \u2014 no usable export was available = 0/10',
        'Unknown \u2014 the export process could not be confirmed = Excluded',
      ],
      scoringFootnote: 'In this example, Export Data scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'A data export does not need to use one specific file type. Formats such as JSON, HTML, CSV, PDF, or text may all be useful when the file opens and contains the expected information.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'We cannot directly inspect the company\u2019s internal databases.',
      'When a chat disappears, we can confirm that it is no longer visible in the account. We cannot independently prove that every backup copy was immediately erased.',
      'The same limitation applies to account deletion and personal-data requests. We can test the available process and review what the company promises, but we cannot see every internal system.',
      'Some companies are legally required to keep certain information after account deletion. Payment records, fraud-prevention records, and legal records may be stored longer than normal account content.',
      'That does not automatically mean deletion controls are bad. The company should clearly explain what remains, why it remains, and for how long.',
      'Export requests can also take time. The live methodology gives the company up to 30 days to deliver the export.',
      'Our results reflect the controls, policy, and account settings available on the recorded test date.',
    ],
  },
};

const privacySecurity: TestSubscoreMethodologyContent = {
  categoryKey: 'privacy',
  subscoreSlug: 'security',
  heroIntro: [
    'Security measures how well an AI girlfriend app protects account access, explains payment information, and handles past security problems.',
    'We check the company\u2019s documented encryption, try to enable two-factor authentication, confirm whether the billing name is shown before payment, and search for confirmed security incidents from the previous five years.',
    'The live database does not contain separate active tests for Account Security or Billing Privacy. Those names appear in older methodology files but are not part of the current scoring system.',
  ],
  whyItMatters: {
    title: 'Why Security matters',
    paragraphs: [
      'AI girlfriend accounts can contain highly private information.',
      'This may include intimate conversations, uploaded photos, generated adult images and videos, saved memories, personal preferences, and payment information.',
      'Someone who gains access to the account may be able to see much more than they could through a normal entertainment app.',
      'Encryption helps protect information while it is being sent or stored. Two-factor authentication adds another check when someone tries to sign in.',
      'Billing information also matters. Users should know what name may appear on their bank or card statement before they pay.',
      'Past security incidents provide additional context. A confirmed breach does not automatically mean the service is unsafe today, but users should know whether incidents happened and how often.',
      'A strong Security result means the app documents useful protections, gives users an additional login-security option, explains the billing descriptor, and has few or no confirmed recent security incidents.',
    ],
  },
  howWeTest: {
    title: 'How we test Security',
    paragraphs: [
      'We use a paid test account and complete one Security and Billing session.',
      'First, we review official security, privacy, and help pages for statements about encryption in transit, encryption at rest, and end-to-end encryption. We do not assume that any type of encryption exists when the company does not clearly state it.',
      'We then open the test account\u2019s security settings and try to enable two-factor authentication.',
      'Before making a payment, we check the checkout page and payment help pages to see whether the expected billing name is shown.',
      'Finally, we search for confirmed breaches, leaks, and other security incidents from the previous five years.',
      'We only count an incident when it is supported by at least one of these sources: an official company statement, a regulator, a court filing, or a reliable security report.',
      'The active guided-testing session contains four evidence tests: Encryption, Two-Factor Authentication, Billing Descriptor, and Security Incidents.',
    ],
  },
  highLowScore: {
    title: 'What good Security looks like',
    paragraphs: [
      'A high Security score means important protections are clearly documented, two-factor authentication works, the billing name is shown before purchase, and no confirmed security incidents were found during the five-year review period.',
      'A lower score means protections are missing or unclear, users cannot secure their accounts with a second login step, the statement name is hidden until after payment, or the company has several confirmed incidents.',
    ],
  },
  scoreCalculation: {
    title: 'How the Security score is calculated',
    paragraphs: [
      'Every test receives a score from 0 to 10.',
      'We multiply each score by how much the test counts. We then add the points together to calculate the final Security score.',
      'Security makes up 28% of the Privacy score.',
      'Billing Descriptor and Security Incidents have the largest effect on the score. Together, they make up 86% of Security.',
    ],
    evidenceWeights: [
      { label: 'Encryption', weight: 7 },
      { label: 'Two-Factor Authentication', weight: 7 },
      { label: 'Billing Descriptor', weight: 43 },
      { label: 'Security Incidents', weight: 43 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test gets a score from 0 to 10. We multiply that score by how much the test counts. We then add all the points together.',
    calculationNotes: {
      title: 'Standard result scoring',
      items: [
        {
          title: 'Yes, Limited, and No',
          body: 'Encryption, Two-Factor Authentication, and Billing Descriptor use Yes = 10/10, Limited = 5/10, and No = 0/10. Security Incidents uses a separate count-based scoring table.',
        },
        {
          title: 'Unknown',
          body: 'Privacy Unknown results are excluded from the score. Unknown does not mean that the app is secure. It means we could not find enough reliable information to give a confirmed result.',
        },
        {
          title: 'Not Applicable',
          body: 'If a test genuinely does not apply, we remove it and spread its weight across the remaining scored tests. A test that has not been completed should not be entered as zero confirmed incidents or as a positive security result.',
        },
        {
          title: 'Manual adjustment',
          body: 'In rare cases, we may adjust a score when the calculated result is clearly misleading. We always record the reason.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Security is organized into 4 evidence groups. Each group contains one scored test: Encryption, Two-Factor Authentication, Billing Descriptor, and Security Incidents.',
    sectionIntro: 'Security has 4 evidence groups made up of 4 scored tests.',
  },
  evidenceGroupContent: {
    encryption: {
      intro: ['Encryption measures which types of data protection the company clearly says it uses.'],
      whyItMatters:
        'We check encryption in transit, encryption at rest, and end-to-end encryption.',
    },
    'two-factor-authentication': {
      intro: ['Two-Factor Authentication measures whether users can protect their account with a second login step.'],
      whyItMatters:
        'A password can be stolen or reused. Two-factor authentication makes it harder for someone to enter the account with only the password.',
    },
    'billing-descriptor': {
      intro: ['Billing Descriptor measures whether the company shows the expected billing name before the user pays.'],
      whyItMatters:
        'The billing descriptor is the name that may appear on a bank or card statement.',
    },
    'security-incidents': {
      intro: [
        'Security Incidents measures the number of confirmed breaches, leaks, or similar security problems connected to the company during the previous five years.',
      ],
      whyItMatters:
        'This test uses confirmed incidents rather than rumors or unverified user claims.',
    },
  },
  evidenceSections: [
    {
      id: 'encryption',
      title: 'Encryption',
      whatItMeasures: 'Which types of data protection the company clearly says it uses.',
      whyItMatters:
        'Encryption in transit protects data while it travels between your device and the company\u2019s systems. Encryption at rest protects stored data. End-to-end encryption is stronger for private messages because only the people or devices at the ends of the conversation should be able to read the content.',
      howWeTest:
        'We search official sources, including the privacy policy, security pages, help center, terms of service, and official company statements. We record how many of the three encryption types the company clearly confirms. We do not use technical guesses based only on the website using HTTPS.',
      whatWeCount: [
        'A direct statement that data is encrypted in transit',
        'A direct statement that stored data is encrypted',
        'A clear claim that chats or messages use end-to-end encryption',
        'Official documentation that explains where the protection applies',
        'Current information from the company',
      ],
      whatWeDoNotCount: [
        'General claims such as your data is secure',
        'A padlock icon in the browser',
        'HTTPS alone as proof of encryption at rest',
        'Encryption claims from an unofficial review',
        'Assuming end-to-end encryption because messages are private',
        'A statement that does not explain which data it covers',
      ],
      displayedResult:
        'Limited \u2014 encryption in transit and at rest were clearly stated, but no end-to-end encryption claim was found',
      displayedResultExtra: 'Protections confirmed: 2 of 3',
      scoringLines: [
        'Yes \u2014 strong encryption coverage is clearly documented = 10/10',
        'Limited \u2014 only some protections are clearly documented = 5/10',
        'No \u2014 the company does not document the tested protections = 0/10',
        'Unknown \u2014 available information is not clear enough = Excluded',
      ],
      scoringFootnote: 'In this example, Encryption scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Encryption in transit, encryption at rest, and end-to-end encryption are not the same thing. A platform should not describe normal website encryption as end-to-end encryption. The live database records the number of the three protections confirmed, but its scoring rule uses the final Yes, Limited, No, or Unknown status.',
    },
    {
      id: 'two-factor-authentication',
      title: 'Two-Factor Authentication',
      whatItMeasures: 'Whether users can protect their account with a second login step.',
      whyItMatters:
        'A password can be stolen or reused. Two-factor authentication makes it harder for someone to enter the account with only the password.',
      howWeTest:
        'We open the paid test account\u2019s security settings and try to enable two-factor authentication. We record whether the feature exists, whether setup works, which method is supported, and whether important restrictions apply. Supported methods may include authentication app, email code, SMS code, security key, or passkey.',
      whatWeCount: [
        'A working authentication-app setup',
        'A working SMS or email verification method',
        'A security key or passkey used as an additional check',
        'Recovery codes provided during setup',
        'A second login step available to regular users',
      ],
      whatWeDoNotCount: [
        'Email verification used only when creating the account',
        'A password-reset email',
        'Signing in with Google or Apple by itself',
        'A CAPTCHA',
        'A feature shown in help pages but missing from the account',
        'A code that cannot be enabled or used',
      ],
      displayedResult: 'Yes \u2014 two-factor authentication worked through an authentication app',
      displayedResultExtra: 'Recovery codes were provided',
      scoringLines: [
        'Yes \u2014 a useful second login step works = 10/10',
        'Limited \u2014 the feature works with important restrictions = 5/10',
        'No \u2014 two-factor authentication is unavailable = 0/10',
        'Unknown \u2014 availability could not be confirmed = Excluded',
      ],
      scoringFootnote: 'In this example, Two-Factor Authentication scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Not all two-factor methods offer the same protection. An authentication app or hardware key is generally more useful than relying only on email, but the current evidence test records the feature as Yes, Limited, or No rather than giving each method a different automatic score.',
    },
    {
      id: 'billing-descriptor',
      title: 'Billing Descriptor',
      whatItMeasures: 'Whether the company shows the expected billing name before the user pays.',
      whyItMatters:
        'The billing descriptor is the name that may appear on a bank or card statement.',
      howWeTest:
        'Before completing payment, we check the checkout page, payment information, billing help pages, and subscription FAQs. We look for the exact billing name or a clear example of the name users should expect.',
      whatWeCount: [
        'The exact statement name shown before payment',
        'A representative descriptor clearly explained before payment',
        'Billing information displayed during checkout',
        'An official help page linked from the payment process',
      ],
      whatWeDoNotCount: [
        'Discovering the name only after the payment',
        'A vague statement such as discreet billing with no name',
        'An unofficial user claiming what appeared on their statement',
        'Support providing the answer only after purchase',
        'The company name appearing elsewhere without saying it is the descriptor',
      ],
      displayedResult: 'Yes \u2014 \u201cCCBILL.COM\u201d was shown as the expected billing descriptor before payment',
      scoringLines: [
        'Yes \u2014 the expected billing name is shown before payment = 10/10',
        'Limited \u2014 partial or unclear billing information is shown = 5/10',
        'No \u2014 the billing name is not shown before payment = 0/10',
        'Unknown \u2014 it cannot be confirmed = Excluded',
      ],
      scoringFootnote: 'In this example, Billing Descriptor scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test measures billing transparency, not how discreet the name is. A clearly disclosed descriptor can receive full points even when the name reveals the service. Actual payment discretion is recorded separately under Pricing\u2019s Payment Privacy evidence.',
    },
    {
      id: 'security-incidents',
      title: 'Security Incidents',
      whatItMeasures:
        'The number of confirmed breaches, leaks, or similar security problems connected to the company during the previous five years.',
      whyItMatters:
        'This test uses confirmed incidents rather than rumors or unverified user claims.',
      howWeTest:
        'We search for incidents from the five years before the review date. We look for data breaches, exposed databases, leaked chats or media, unauthorized account access, security failures confirmed by an authority, and other incidents that exposed user information. For each incident, we save the source and relevant date.',
      whatWeCount: [
        'An incident confirmed by the company',
        'An incident confirmed by a regulator',
        'An incident confirmed by a court filing',
        'An incident confirmed by a reliable security report',
      ],
      whatWeDoNotCount: [
        'Unverified social-media posts',
        'A user claiming their individual account was hacked',
        'Service outages with no data exposure',
        'Rumors with no supporting evidence',
        'Incidents involving an unrelated company',
        'Reports older than the five-year review period',
      ],
      displayedResult: '0 confirmed security incidents during the previous five years',
      scoringLines: [
        '0 incidents = 10/10',
        '1 incident = 6/10',
        '2 incidents = 3/10',
        '3 or more incidents = 0/10',
        'Search not completed or result unclear = Excluded',
      ],
      scoringFootnote: 'A result of zero confirmed incidents scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Zero confirmed incidents means our search did not find a qualifying incident during the review period. It does not prove that the company has never experienced a security problem. An unfinished search must be recorded as Unknown or Not Applicable during testing.',
    },
  ],
  limitations: {
    title: 'Limitations and edge cases',
    paragraphs: [
      'We cannot directly inspect the company\u2019s servers, source code, or internal security systems.',
      'Our Encryption result is based on what the company clearly documents. A company may use protections it does not publicly explain, but we cannot award points based on assumptions.',
      'The opposite is also possible. A company can publish strong security claims without giving independent proof that every system follows them.',
      'Two-factor authentication may work differently depending on the sign-in method. For example, it may be available for email accounts but not accounts created through Google or Apple.',
      'Billing Descriptor only checks whether the expected billing name is shown before payment. It does not automatically mean the descriptor is discreet.',
      'A company could clearly show a revealing brand name and still pass the Billing Descriptor test because the user was warned before paying. Payment discretion is recorded separately in the Pricing system.',
      'Security Incidents only includes confirmed incidents found during the previous five years. Finding zero confirmed incidents does not prove that no incident has ever happened.',
      'Our result reflects the documentation, account settings, billing information, and confirmed reports available on the recorded test date.',
    ],
  },
};

const privacySupport: TestSubscoreMethodologyContent = {
  categoryKey: 'privacy',
  subscoreSlug: 'support',
  heroIntro: [
    'Support measures three simple things: how easy it is to contact the company, how quickly the company replies, and how helpful the reply is.',
    'We contact support once with a real question, then rate the full experience from Poor to Excellent.',
    'Support Available and Support Channels are shown for information only. Only Ease of Contact, Response Speed, and Helpfulness affect the score.',
  ],
  whyItMatters: {
    title: 'Why Support matters',
    paragraphs: [
      'AI girlfriend apps can hold private chats, photos, payment details, and other personal information.',
      'Users may need help when their account stops working, credits disappear, a payment problem happens, they cannot cancel their subscription, they want to delete their account, they want a copy of their data, or an image or video generation fails.',
      'A support email alone is not enough.',
      'The contact option should be easy to find. The company should reply within a reasonable time. The answer should also solve the problem or give the user a clear next step.',
      'A fast but useless answer is not good support. A helpful answer that takes far too long is also not ideal.',
    ],
  },
  howWeTest: {
    title: 'How we test Support',
    paragraphs: [
      'We use a paid account.',
      'First, we look for official support options such as email, a contact form, live chat, help-center contact, Discord, Reddit, or Telegram.',
      'We then send one real question.',
      'The question must be safe and should not damage the test account.',
      'Good example questions include how to cancel a subscription, whether purchased credits expire, whether account data can be exported, whether deleting an account removes chats, and which plan includes voice calls.',
      'We use the same support conversation to rate Ease of Contact, Response Speed, and Helpfulness.',
      'The database tells testers to judge the overall experience. Response Speed is not based on a strict number of hours.',
    ],
  },
  highLowScore: {
    title: 'What good Support looks like',
    paragraphs: [
      'A strong support experience means the contact option is easy to find, the support form or email works, a real person replies within a reasonable time, the reply answers the question, and the user receives a clear solution or next step.',
      'Common problems include no contact option, a broken contact form, only unofficial community support, automatic replies only, ignored questions, instructions that do not work, being passed between several agents, or no clear solution.',
    ],
  },
  scoreCalculation: {
    title: 'How the Support score is calculated',
    paragraphs: [
      'Each scored test receives a rating from Poor to Excellent.',
      'Poor = 2/10, Fair = 4/10, Good = 6/10, Very good = 8/10, and Excellent = 10/10.',
      'We then multiply each score by its weight. Ease of Contact is 34%, Response Speed is 33%, and Helpfulness is 33%.',
    ],
    evidenceWeights: [
      { label: 'Ease of Contact', weight: 34 },
      { label: 'Response Speed', weight: 33 },
      { label: 'Helpfulness', weight: 33 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each rating is converted to a score out of 10, then multiplied by its weight. The three scored tests use the stored weights 34, 33, and 33.',
    calculationNotes: {
      title: 'Special cases',
      items: [
        {
          title: 'No support available',
          body: 'When the platform offers no way to contact support, the three scored tests are marked Not Applicable. The platform does not receive a normal Support score.',
        },
        {
          title: 'Unknown',
          body: 'When we cannot confirm a Privacy result, we leave it out of the calculation instead of giving it a score of 0. Unknown does not mean the result is good. It only means there was not enough clear information to score it.',
        },
        {
          title: 'Rating scale',
          body: 'Ease of Contact, Response Speed, and Helpfulness all use the same Poor to Excellent rating scale shown in each evidence group.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Support has five evidence groups. Support Available and Support Channels are reference only. Ease of Contact, Response Speed, and Helpfulness are scored.',
    sectionIntro: 'Support has 5 evidence groups. Only the final three affect the score.',
  },
  evidenceGroupContent: {
    'support-available': {
      intro: ['Support Available records whether the app offers any real way to contact the company.'],
      whyItMatters: 'Readers need to know whether official support exists before judging the scored experience.',
    },
    'support-channels': {
      intro: ['Support Channels records the official ways users can contact the company.'],
      whyItMatters: 'More channels do not always mean better support. One reliable support email can be better than several channels that never reply.',
    },
    'support-reach': {
      intro: ['Ease of Contact measures how easy it is to find support and send a request.'],
      whyItMatters: 'Users should not have to hunt through menus or broken forms just to ask for help.',
    },
    'support-speed': {
      intro: ['Response Speed measures how quickly the company answers the support question.'],
      whyItMatters: 'Privacy and billing problems often need a timely answer, not a reply days later.',
    },
    'support-helpfulness': {
      intro: ['Helpfulness measures whether the answer solved the problem or clearly moved it toward a solution.'],
      whyItMatters: 'A fast reply that ignores the question is not useful support.',
    },
  },
  evidenceSections: [
    {
      id: 'support-available',
      title: 'Support Available',
      whatItMeasures: 'Whether the app offers any real way to contact the company.',
      whyItMatters: 'This result is shown in the review but does not affect the score.',
      howWeTest:
        'We check the app, website, help center, account settings, footer, and legal pages.',
      whatWeCount: [
        'Support email',
        'Contact form',
        'Live chat',
        'In-app support',
        'Official Discord, Reddit, or Telegram support',
      ],
      whatWeDoNotCount: [
        'An unofficial fan group',
        'A help center with no contact option',
        'A broken contact form',
        'A no-reply email',
        'Social-media comments with no support process',
      ],
      displayedResult: 'Yes \u2014 customer support is available',
      referenceOnly: true,
      scoringNote: 'This result is shown in the review but does not affect the score.',
      showWhyItMatters: false,
      edgeCases:
        'This test is reference-only. It helps readers see whether support exists, but it does not change the Support score.',
    },
    {
      id: 'support-channels',
      title: 'Support Channels',
      whatItMeasures: 'The official ways users can contact the company.',
      whyItMatters: 'This information does not affect the score.',
      howWeTest:
        'We save any official support email, contact page, contact form, live-chat link, Discord link, Reddit link, or Telegram link.',
      whatWeCount: [
        'Support email',
        'Contact page',
        'Contact form',
        'Live-chat link',
        'Discord link',
        'Reddit link',
        'Telegram link',
      ],
      whatWeDoNotCount: [
        'Unofficial community groups',
        'Broken or hidden contact links',
        'Social-media profiles with no support process',
      ],
      displayedResult: 'Support email, Contact form, Official Discord',
      displayedResultExtra: 'Support channels found in this example',
      referenceOnly: true,
      scoringNote: 'More channels do not always mean better support. This information does not affect the score.',
      showWhyItMatters: false,
      edgeCases:
        'This test is reference-only. We list official contact options, but the channel list does not change the Support score.',
    },
    {
      id: 'support-reach',
      title: 'Ease of Contact',
      whatItMeasures: 'How easy it is to find support and send a request.',
      whyItMatters:
        'The support link should be easy to find, and the user should be able to send a request without confusion.',
      howWeTest:
        'We check how easy the support option is to find, whether the instructions are clear, whether the form or email works, whether unnecessary steps are required, and whether the request sends successfully.',
      whatWeCount: [
        'A support link that is easy to find',
        'Clear instructions for contacting support',
        'A working contact form or email',
        'A request that sends successfully',
      ],
      whatWeDoNotCount: [
        'A hidden or broken contact option',
        'Unnecessary steps that block the request',
        'Instructions that do not match the actual process',
      ],
      displayedResult: 'Very good \u2014 the support link was easy to find, and the form worked correctly',
      scoringLines: [
        'Poor = 2/10',
        'Fair = 4/10',
        'Good = 6/10',
        'Very good = 8/10',
        'Excellent = 10/10',
      ],
      scoringFootnote: 'In this example, Ease of Contact scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'A weak result means the contact option is hidden, broken, or requires too many steps.',
    },
    {
      id: 'support-speed',
      title: 'Response Speed',
      whatItMeasures: 'How quickly the company answers the support question.',
      whyItMatters:
        'We judge the overall speed instead of using a strict rule such as under 12 hours.',
      howWeTest:
        'We send one real request and wait for a reply.',
      whatWeCount: [
        'A reply from a support agent',
        'A useful follow-up question',
        'A response connected to the issue',
      ],
      whatWeDoNotCount: [
        'An automatic ticket confirmation',
        'A chatbot greeting',
        'A marketing email',
        'A reply from an unofficial community member',
      ],
      displayedResult: 'Good \u2014 a support agent replied the next day',
      scoringLines: [
        'Poor = 2/10',
        'Fair = 4/10',
        'Good = 6/10',
        'Very good = 8/10',
        'Excellent = 10/10',
      ],
      scoringFootnote: 'In this example, Response Speed scores 6/10.',
      showWhyItMatters: false,
      edgeCases:
        'We send one real support request and judge the overall speed. Automatic confirmations and chatbot greetings do not count as a reply.',
    },
    {
      id: 'support-helpfulness',
      title: 'Helpfulness',
      whatItMeasures:
        'Whether the answer solved the problem or clearly moved it toward a solution.',
      whyItMatters:
        'The answer should directly explain what the user should do.',
      howWeTest:
        'We check whether the reply understood the question, gave useful information, provided clear instructions, solved the issue, or gave a clear next step.',
      whatWeCount: [
        'An answer that understood the question',
        'Useful information',
        'Clear instructions',
        'A solved issue or clear next step',
      ],
      whatWeDoNotCount: [
        'A generic or unrelated answer',
        'Instructions that do not work',
        'No clear solution or next step',
      ],
      displayedResult: 'Very good \u2014 the agent answered the question and gave clear steps',
      scoringLines: [
        'Poor = 2/10',
        'Fair = 4/10',
        'Good = 6/10',
        'Very good = 8/10',
        'Excellent = 10/10',
      ],
      scoringFootnote: 'In this example, Helpfulness scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'A weak result means the answer is generic, unrelated, or gives instructions that do not work.',
    },
  ],
  limitations: {
    title: 'Limitations',
    paragraphs: [
      'We only contact support once.',
      'Another user may speak to a different agent and have a different experience.',
      'Response times can also change depending on the day of the week, public holidays, the company\u2019s time zone, how busy support is, and the type of question.',
      'Our result shows the support experience we received on the recorded test date.',
      'Support makes up 13% of Privacy. Only Ease of Contact, Response Speed, and Helpfulness affect the Support score.',
    ],
  },
};

const pricingPlanValue: TestSubscoreMethodologyContent = {
  categoryKey: 'pricing',
  subscoreSlug: 'plan-value',
  heroIntro: [
    'Plan Value measures what you receive for the price of the subscription.',
    'A cheap plan is not always good value. It may leave important features behind extra payments or give you very few credits.',
    'An expensive plan can still offer good value when it includes useful features, generous credits, and reasonable usage limits.',
    'We check the monthly price, annual price, included features, included credits, plan limits, and annual discount.',
    'Monthly Price, Annual Price, Included Credits, and Plan Limits currently use manual scores because the live database does not provide fixed scoring bands. These tests always show the exact raw result and a clear reason for the score.',
  ],
  whyItMatters: {
    title: 'Why Plan Value matters',
    paragraphs: [
      'The advertised subscription price does not always show the real value of a plan.',
      'A plan may cost only $10 per month but still require separate credits for images, videos, and calls.',
      'Another plan may cost more but include most features and enough monthly credits for regular use.',
      'Annual plans can also look cheaper because the company shows the monthly average instead of the full amount charged at once.',
      'For example, $8 per month when billed yearly may actually mean the user pays $96 immediately.',
      'That is why we record both the full annual payment and the effective monthly price.',
    ],
  },
  howWeTest: {
    title: 'How we test Plan Value',
    paragraphs: [
      'We use the main paid plan available to normal customers.',
      'We record pricing from the Pricing section of the database and confirm it using the company\u2019s checkout and pricing pages.',
      'We collect the full monthly price, full annual payment, effective monthly annual price, credits included with the plan, features included without extra payment, daily or monthly usage limits, and annual discount.',
      'Included Features and Plan Limits are also checked through the guided Plan Inclusions and Limits test.',
    ],
  },
  highLowScore: {
    title: 'What good Plan Value looks like',
    paragraphs: [
      'A strong plan usually has a reasonable monthly price, a cheaper effective price when paying yearly, most important features included, enough credits for normal use, clear and reasonable usage limits, and a useful annual discount.',
      'Common problems include the cheapest price only being available with annual payment, important features requiring separate credits, included credits running out very quickly, hidden daily or monthly limits, annual discounts smaller than advertised, websites showing the monthly average but hiding the full yearly charge, and users needing a more expensive plan to access basic features.',
    ],
  },
  scoreCalculation: {
    title: 'How the Plan Value score is calculated',
    paragraphs: [
      'Each test receives a score from 0 to 10.',
      'We multiply each score by its weight and add the results together.',
      'Included Credits has the biggest effect on the score at 25%. Monthly Price and Included Features are the next most important tests at 20% each.',
      'Included Features and Annual Discount use automatic scoring. Monthly Price, Annual Price, Included Credits, and Plan Limits use the exact pricing information we collect and receive a manual score from 0 to 10.',
    ],
    evidenceWeights: [
      { label: 'Monthly Price', weight: 20 },
      { label: 'Annual Price', weight: 15 },
      { label: 'Included Features', weight: 20 },
      { label: 'Included Credits', weight: 25 },
      { label: 'Plan Limits', weight: 10 },
      { label: 'Annual Discount', weight: 10 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test receives a score from 0 to 10. We multiply each score by its weight and add the results together.',
    calculationNotes: {
      title: 'Automatic and manual scores',
      items: [
        {
          title: 'Automatic scoring',
          body: 'Included Features and Annual Discount convert their percentage results directly into a score from 0 to 10.',
        },
        {
          title: 'Manual scoring',
          body: 'Monthly Price, Annual Price, Included Credits, and Plan Limits use the exact pricing information we collect. The database does not currently provide fixed dollar or credit benchmarks for these four tests, so we record the exact result and explain the score instead of pretending there is an automatic formula.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Plan Value is organized into 6 evidence groups. Each group contains one scored test: Monthly Price, Annual Price, Included Features, Included Credits, Plan Limits, and Annual Discount.',
    sectionIntro: 'Plan Value has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    'monthly-price': {
      intro: ['Monthly Price records the normal cost of paying one month at a time.'],
      whyItMatters: 'We use the full non-discounted price of the main monthly subscription.',
    },
    'annual-price': {
      intro: ['Annual Price measures the cost of paying for one full year.'],
      whyItMatters: 'We show both the total amount charged and the effective monthly cost.',
    },
    'included-features': {
      intro: ['Included Features measures how many important features are available without another payment.'],
      whyItMatters: 'We check 10 core features that users expect on a paid plan.',
    },
    'included-credits': {
      intro: ['Included Credits records how many credits or tokens come with the subscription.'],
      whyItMatters:
        'Credits may be used for images, videos, voice messages, calls, or other paid actions.',
    },
    'plan-limits': {
      intro: ['Plan Limits measures the daily or monthly limits placed on important features.'],
      whyItMatters: 'A plan may advertise a feature as included but still limit how often you can use it.',
    },
    'annual-discount': {
      intro: ['Annual Discount measures how much users save by paying for one year instead of paying monthly for 12 months.'],
      whyItMatters: 'A small discount may not justify paying the full yearly amount upfront.',
    },
  },
  evidenceSections: [
    {
      id: 'monthly-price',
      title: 'Monthly Price',
      whatItMeasures: 'The normal cost of paying one month at a time.',
      whyItMatters: 'We use the full non-discounted price of the main monthly subscription.',
      howWeTest:
        'We check the pricing page and checkout screen. We record the monthly subscription price, currency, required taxes or fees when clearly shown, and whether the price is temporary or introductory.',
      whatWeCount: [
        'The normal one-month subscription',
        'The price available to regular customers',
        'The full amount charged for one month',
        'Required fees shown before payment',
      ],
      whatWeDoNotCount: [
        'A yearly plan divided by 12',
        'A temporary first-month discount',
        'A coupon code',
        'An affiliate-only discount',
        'A free trial',
      ],
      displayedResult: '$12.99 per month',
      scoringNote:
        'The exact price receives a score from 0 to 10. Lower prices usually score better, but the live database does not currently contain fixed dollar bands. The evidence result always shows the real monthly price next to the score.',
      scoringFootnote: 'In this example, Monthly Price scores 7/10.',
      showWhyItMatters: false,
      edgeCases:
        'The monthly plan and annual plan are tested separately. A website should not describe an annual plan\u2019s monthly average as the normal monthly price.',
    },
    {
      id: 'annual-price',
      title: 'Annual Price',
      whatItMeasures: 'The cost of paying for one full year.',
      whyItMatters: 'We show both the total amount charged and the effective monthly cost.',
      howWeTest:
        'We record the full annual payment and divide it by 12. For example, a $96 annual payment equals $8 per month.',
      whatWeCount: [
        'The normal annual subscription',
        'The full amount charged at checkout',
        'The effective monthly price',
        'Required fees shown before payment',
      ],
      whatWeDoNotCount: [
        'Showing only $8 per month without the $96 yearly charge',
        'Temporary annual discounts',
        'Coupon codes',
        'Lifetime plans',
        'A monthly plan multiplied by 12',
      ],
      displayedResult: '$96 billed yearly',
      displayedResultExtra: 'Effective price: $8 per month',
      scoringNote:
        'The annual price receives a score from 0 to 10. A lower effective price normally scores better. The live database does not yet provide fixed dollar bands for this test.',
      scoringFootnote: 'In this example, Annual Price scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'The effective monthly price does not mean users pay monthly. Most annual plans charge the full yearly amount at once.',
    },
    {
      id: 'included-features',
      title: 'Included Features',
      whatItMeasures: 'How many important features are available without another payment.',
      whyItMatters: 'We check 10 core features.',
      howWeTest:
        'We check whether the selected plan includes standard chat, character library, character creation, image generation, image editing, video generation, voice messages, voice calls, memory controls, and message regeneration. A feature counts as included when users can access it without buying another subscription.',
      whatWeCount: [
        'A feature available on the tested plan',
        'A feature that uses the plan\u2019s included credits',
        'A normal feature available to paying users',
      ],
      whatWeDoNotCount: [
        'A feature requiring a more expensive plan',
        'A separate one-time purchase',
        'A feature shown in marketing but unavailable',
        'A tool still marked as coming soon',
      ],
      displayedResult: '8 of 10 core features included',
      displayedResultExtra: 'Result: 80%',
      scoringIntro: 'The percentage is changed directly into a score.',
      scoringLines: [
        '0 of 10 = 0/10',
        '2 of 10 = 2/10',
        '4 of 10 = 4/10',
        '6 of 10 = 6/10',
        '8 of 10 = 8/10',
        '10 of 10 = 10/10',
      ],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote: 'An app with 8 of 10 features included scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'A feature may count as included even when it uses credits. The price of using those credits is tested separately under Usage Costs.',
    },
    {
      id: 'included-credits',
      title: 'Included Credits',
      whatItMeasures: 'How many credits or tokens come with the subscription.',
      whyItMatters:
        'Credits may be used for images, videos, voice messages, calls, or other paid actions.',
      howWeTest:
        'We record credits included at signup, credits added each billing period, whether unused credits carry over, which features use credits, and whether different plans receive different amounts.',
      whatWeCount: [
        'Credits included with the paid subscription',
        'Credits added automatically each month or year',
        'Tokens that can be used for paid features',
      ],
      whatWeDoNotCount: [
        'Free signup credits',
        'Credits bought separately',
        'Temporary bonuses',
        'Referral rewards',
        'Promotional coupon credits',
      ],
      displayedResult: '100 credits included each month',
      scoringNote:
        'Included Credits receives a score from 0 to 10. More useful credit value normally scores better. The database does not currently have fixed credit bands, so the exact amount and how those credits can be used must be shown with the score.',
      scoringFootnote: 'In this example, Included Credits scores 7/10.',
      showWhyItMatters: false,
      edgeCases:
        'A large credit number does not always mean better value. One app may charge 10 credits for an image, while another charges 100. We therefore show the exact credit amount and test the real cost of using those credits under Usage Costs.',
    },
    {
      id: 'plan-limits',
      title: 'Plan Limits',
      whatItMeasures: 'The daily or monthly limits placed on important features.',
      whyItMatters:
        'A plan may advertise a feature as included but still limit how often you can use it.',
      howWeTest:
        'We record the exact limits for messages, images, videos, voice messages, voice calls, and created characters.',
      whatWeCount: [
        'Daily message limits',
        'Monthly image limits',
        'Maximum video generations',
        'Voice-minute limits',
        'Character-creation limits',
        'Fair-use restrictions',
      ],
      whatWeDoNotCount: [
        'The number of credits included',
        'Technical file-size limits',
        'Safety rules',
        'Limits that only apply to free accounts',
        'Restrictions on features not included in the plan',
      ],
      displayedResult: 'Messages: Unlimited · Images: 20 per month · Videos: 4 per month',
      displayedResultExtra: 'Voice calls: 30 minutes per month · Created characters: 5',
      scoringNote:
        'Plan Limits receives a score from 0 to 10. Fewer and more generous limits normally lead to a higher score. The database does not yet provide one fixed scoring table because the limits cover several different features.',
      scoringFootnote: 'In this example, Plan Limits scores 6/10.',
      showWhyItMatters: false,
      edgeCases:
        'Unlimited may still have a fair-use rule. We check the terms and record any limits the company explains.',
    },
    {
      id: 'annual-discount',
      title: 'Annual Discount',
      whatItMeasures:
        'How much users save by paying for one year instead of paying monthly for 12 months.',
      whyItMatters:
        'We compare monthly price × 12 with the full annual price on the same tier.',
      howWeTest:
        'We compare the monthly price multiplied by 12 with the full annual price. Annual discount equals the amount saved divided by the normal yearly monthly cost, multiplied by 100. For example, $10 × 12 = $120 versus a $90 annual plan saves $30, which is a 25% discount.',
      whatWeCount: [
        'The same subscription tier',
        'Normal public prices',
        'The full annual payment',
        'A discount available to regular users',
      ],
      whatWeDoNotCount: [
        'Comparing two different plan levels',
        'Temporary sales',
        'Coupon codes',
        'First-year-only discounts without explanation',
        'Comparing the annual plan with a higher monthly tier',
      ],
      displayedResult: '25% cheaper than paying monthly for 12 months',
      scoringIntro: 'The percentage is changed directly into a score from 0 to 10.',
      scoringLines: [
        '0% = 0/10',
        '10% = 1/10',
        '20% = 2/10',
        '30% = 3/10',
        '50% = 5/10',
        '100% = 10/10',
      ],
      scoringNote: 'The exact percentage becomes the score.',
      scoringFootnote:
        'A 25% annual discount equals 2.5/10 under the linear rule. In this worked example, Annual Discount is recorded as 3/10.',
      exampleScore: 3,
      showWhyItMatters: false,
      edgeCases:
        'Some platforms show a monthly average instead of the full annual total. We use the real annual cost when it is clearly shown.',
    },
  ],
  limitations: {
    title: 'Limitations',
    paragraphs: [
      'Pricing can change at any time.',
      'Prices may also differ because of country, currency, taxes, App Store fees, Google Play fees, website-only discounts, or temporary sales.',
      'We use the normal website price available to our paid test account on the recorded test date.',
      'Credit systems are also difficult to compare because every app uses different credit amounts and prices. We therefore show real usage costs separately under Usage Costs.',
      'Plan Value makes up 30% of the Pricing score.',
    ],
  },
};

const pricingUsageCosts: TestSubscoreMethodologyContent = {
  categoryKey: 'pricing',
  subscoreSlug: 'usage-costs',
  heroIntro: [
    'Usage Costs measures how much it costs to actually use an AI girlfriend app after subscribing.',
    'Many apps charge extra credits for images, videos, voice messages, and calls. This means a cheap subscription can become expensive once you start using its main features.',
    'We calculate the real cost of each feature and estimate how much a regular user may spend in one month.',
    'All six tests use manual scoring in the live database. There are currently no fixed price bands. Every public result therefore shows the exact cost and a clear reason for the score rather than presenting the score as fully automatic.',
  ],
  whyItMatters: {
    title: 'Why Usage Costs matters',
    paragraphs: [
      'The subscription price is often only part of the real cost.',
      'An app may advertise a plan for $10 per month, but users may still need credits for generating images, creating videos, receiving voice messages, making voice calls, and using other premium features.',
      'Credits can also be confusing. One platform may charge 10 credits for an image. Another may charge 100 credits. This does not tell you which one is cheaper until you calculate the dollar value of those credits.',
      'That is why we convert everything into simple costs such as dollars per image, dollars per 10 seconds of video, dollars per 10 seconds of voice, dollars per minute of calling, and estimated total monthly cost.',
    ],
  },
  howWeTest: {
    title: 'How we test Usage Costs',
    paragraphs: [
      'We collect the prices and credit information from the pricing page, checkout, account balance, credit top-up page, feature-generation screens, and payment terms.',
      'We then calculate the cost of using each feature.',
      'The Usage Costs results are filled from the structured Pricing section of the database rather than entered during a separate guided test session.',
    ],
  },
  highLowScore: {
    title: 'What good Usage Costs looks like',
    paragraphs: [
      'A strong Usage Costs result means images are affordable, videos do not use too many credits, voice messages and calls have reasonable prices, larger credit packages offer better value, regular users do not need constant top-ups, and the full monthly cost stays close to the advertised subscription price.',
      'Common problems include a cheap subscription that includes very few credits, videos that use most of the monthly credit balance, failed generations that still use credits, small credit packages with a very high cost per credit, users needing several top-ups every month, unclear credit costs for each feature, and a real monthly cost much higher than the advertised plan price.',
    ],
  },
  scoreCalculation: {
    title: 'How the Usage Costs score is calculated',
    paragraphs: [
      'Each test receives a score from 0 to 10. Lower and more reasonable costs usually receive higher scores.',
      'Video Cost has the biggest effect on the score at 25%. Image Cost and Monthly Spend are the next most important tests at 20% each.',
      'All six tests currently use manual scoring. The database does not use fixed rules such as under $0.20 per image always scoring 10. Instead, we record the exact cost and give it a score from 0 to 10.',
      'The exact result is always shown beside the score so readers can judge the value for themselves.',
    ],
    evidenceWeights: [
      { label: 'Image Cost', weight: 20 },
      { label: 'Video Cost', weight: 25 },
      { label: 'Voice Cost', weight: 15 },
      { label: 'Call Cost', weight: 10 },
      { label: 'Top-Up Value', weight: 10 },
      { label: 'Monthly Spend', weight: 20 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test receives a score from 0 to 10. We multiply each score by its weight and add the results together.',
    calculationNotes: {
      title: 'Manual scoring',
      items: [
        {
          title: 'No fixed price bands',
          body: 'The live database does not currently contain fixed dollar bands for any Usage Costs test. We record the exact cost and explain the score instead of pretending there is an automatic formula.',
        },
        {
          title: 'Lower costs score better',
          body: 'Lower and more reasonable costs normally receive higher scores, but the exact score depends on the full pricing picture for that app.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Usage Costs is organized into 6 evidence groups. Each group contains one scored test: Image Cost, Video Cost, Voice Cost, Call Cost, Top-Up Value, and Monthly Spend.',
    sectionIntro: 'Usage Costs has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    'image-cost': {
      intro: ['Image Cost measures the estimated price of generating one usable image.'],
      whyItMatters: 'Images are one of the most common paid actions after subscribing.',
    },
    'video-cost': {
      intro: ['Video Cost measures the estimated price of creating 10 seconds of video.'],
      whyItMatters: 'We use 10 seconds so apps with different video lengths can be compared fairly.',
    },
    'voice-cost': {
      intro: ['Voice Cost measures the estimated price of receiving or generating 10 seconds of voice.'],
      whyItMatters: 'Using the same 10-second length makes it easier to compare apps with different voice-message limits.',
    },
    'call-cost': {
      intro: ['Call Cost measures the estimated price of one minute of voice calling.'],
      whyItMatters: 'Live voice calls are scored separately from short generated voice messages.',
    },
    'top-up-value': {
      intro: ['Top-Up Value measures the value of buying extra credits after included credits run out.'],
      whyItMatters: 'We check both the smallest and largest normal credit packages.',
    },
    'monthly-spend': {
      intro: ['Monthly Spend estimates how much a regular user may spend during one month.'],
      whyItMatters: 'This is often more useful than looking only at the subscription price.',
    },
  },
  evidenceSections: [
    {
      id: 'image-cost',
      title: 'Image Cost',
      whatItMeasures: 'The estimated price of generating one usable image.',
      whyItMatters: 'Images are one of the most common paid actions after subscribing.',
      howWeTest:
        'First, we record how many credits one standard image costs. We then calculate the dollar value of those credits using the cheapest credit package available to normal users. Cost per credit multiplied by credits used for one image equals cost per image.',
      whatWeCount: [
        'Credits used for one standard image',
        'The normal image quality available to paying users',
        'The real price of the required credits',
        'The cost of extra credits when included credits run out',
      ],
      whatWeDoNotCount: [
        'Free promotional credits',
        'Referral rewards',
        'Temporary discounts',
        'Affiliate coupons',
        'Third-party image generators',
        'An image included only as a marketing example',
      ],
      displayedResult: 'Estimated image cost: $0.50 per image',
      scoringNote:
        'Image Cost receives a score from 0 to 10. Lower costs normally receive higher scores. The live database does not currently contain fixed price bands, so the exact cost and the reason for the score must be shown.',
      scoringFootnote: 'In this example, Image Cost scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'When possible, we calculate the cost per usable image. For example, if five generations cost $2.50 in total but only four images are usable, the usable-image cost would be $2.50 ÷ 4 = $0.63 per usable image.',
    },
    {
      id: 'video-cost',
      title: 'Video Cost',
      whatItMeasures: 'The estimated price of creating 10 seconds of video.',
      whyItMatters: 'We use 10 seconds so apps with different video lengths can be compared fairly.',
      howWeTest:
        'We calculate the cost of the standard video length offered by the app, then change the result into a cost per 10 seconds. A 5-second video at $1.20 becomes $2.40 per 10 seconds. A 20-second video at $3 becomes $1.50 per 10 seconds.',
      whatWeCount: [
        'Credits needed for a standard video',
        'The dollar price of those credits',
        'Required generation fees',
        'The video length selected in the Pricing section',
      ],
      whatWeDoNotCount: [
        'Free promotional videos',
        'Video editing through outside software',
        'Temporary discounts',
        'A video created only for a marketing demo',
        'Optional upgrades that are not needed for a normal video',
      ],
      displayedResult: 'Estimated video cost: $2.40 per 10 seconds',
      scoringNote:
        'Video Cost receives a score from 0 to 10. Lower costs normally score better. The exact cost is always displayed because the database does not currently use fixed price bands.',
      scoringFootnote: 'In this example, Video Cost scores 6/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test measures price, not quality. A cheap video may still have broken movement or poor character consistency. Video quality is tested separately under the Video category.',
    },
    {
      id: 'voice-cost',
      title: 'Voice Cost',
      whatItMeasures: 'The estimated price of receiving or generating 10 seconds of voice.',
      whyItMatters:
        'Using the same 10-second length makes it easier to compare apps with different voice-message limits.',
      howWeTest:
        'We record how many credits one voice message costs, how long the voice message is, and the dollar value of the credits. We then calculate the cost per 10 seconds. For example, a 20-second voice message costing 4 credits at $0.05 each totals $0.20, or $0.10 per 10 seconds.',
      whatWeCount: [
        'AI voice-message costs',
        'Credits used for generated speech',
        'Required fees for receiving or creating voice',
        'Normal voice access available to paying users',
      ],
      whatWeDoNotCount: [
        'Live voice-call minutes',
        'Free voice previews',
        'Voice messages created outside the app',
        'Temporary promotional credits',
        'Normal text messages read aloud by the device',
      ],
      displayedResult: 'Estimated voice cost: $0.10 per 10 seconds',
      scoringNote:
        'Voice Cost receives a score from 0 to 10. Lower and clearer costs normally score better. The exact result must be shown beside the score.',
      scoringFootnote: 'In this example, Voice Cost scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Voice messages and voice calls are scored separately. Voice Cost covers short generated voice messages. Call Cost covers live voice conversations.',
    },
    {
      id: 'call-cost',
      title: 'Call Cost',
      whatItMeasures: 'The estimated price of one minute of voice calling.',
      whyItMatters: 'Live voice calls are scored separately from short generated voice messages.',
      howWeTest:
        'We record how many credits one minute of calling uses, then calculate the dollar value of those credits using the cheapest credit package available to normal users. For example, 20 credits at $0.05 each equals $1 per minute.',
      whatWeCount: [
        'Credits used during a live voice call',
        'Per-minute call fees',
        'Required connection charges',
        'The normal cost available to paying users',
      ],
      whatWeDoNotCount: [
        'Voice-message costs',
        'Mobile phone charges outside the app',
        'Free trial minutes',
        'Promotional calling credits',
        'Video-generation audio',
      ],
      displayedResult: 'Estimated call cost: $1 per minute',
      scoringNote:
        'Call Cost receives a score from 0 to 10. Lower call prices normally receive higher scores. The database does not currently provide fixed price bands.',
      scoringFootnote: 'In this example, Call Cost scores 7/10.',
      showWhyItMatters: false,
      edgeCases:
        'Some platforms round calls up. For example, a 20-second call may still be charged as one full minute. We record this when it meaningfully increases the real cost.',
    },
    {
      id: 'top-up-value',
      title: 'Top-Up Value',
      whatItMeasures: 'The value of buying extra credits after included credits run out.',
      whyItMatters: 'We check both the smallest and largest normal credit packages.',
      howWeTest:
        'For each package, we record the package price, number of credits, and cost per credit using package price divided by included credits.',
      whatWeCount: [
        'Normal credit packages available to users',
        'The smallest available package',
        'The largest available package',
        'The real cost per credit',
        'Required payment fees',
      ],
      whatWeDoNotCount: [
        'Limited-time bonus offers',
        'Referral credits',
        'Influencer coupons',
        'Free signup credits',
        'Packages unavailable to normal users',
        'Enterprise or private pricing',
      ],
      displayedResult: 'Smallest: $5 for 50 credits ($0.10 per credit)',
      displayedResultExtra: 'Largest: $40 for 800 credits ($0.05 per credit)',
      scoringNote:
        'Top-Up Value receives a score from 0 to 10. Better cost per credit and more reasonable package choices normally receive higher scores. The exact package information is always shown with the score.',
      scoringFootnote: 'In this example, Top-Up Value scores 6/10.',
      showWhyItMatters: false,
      edgeCases:
        'The cheapest package price does not always offer the best value. A $5 package is easier to afford, but a larger package may provide twice as many credits per dollar. We show both so readers can understand the trade-off.',
    },
    {
      id: 'monthly-spend',
      title: 'Monthly Spend',
      whatItMeasures: 'How much a regular user may spend during one month.',
      whyItMatters: 'This is often more useful than looking only at the subscription price.',
      howWeTest:
        'We calculate the cost of the required subscription, 500 chat messages, 20 images, 4 videos, 30 minutes of voice use, required credit top-ups, and required payment fees. We begin with the monthly subscription, then calculate whether included credits cover this regular-use example. When they are not enough, we add the cheapest top-up combination that covers the remaining use.',
      whatWeCount: [
        'Required subscription',
        'Chat-message costs',
        'Image-generation costs',
        'Video-generation costs',
        'Voice-message or call costs',
        'Required credit top-ups',
        'Required payment fees',
      ],
      whatWeDoNotCount: [
        'Optional upgrades',
        'Tips or gifts',
        'Temporary promotions',
        'Referral rewards',
        'Heavy use beyond the fixed example',
        'Purchases unrelated to the tested features',
      ],
      displayedResult: 'Estimated monthly spend for regular use: $23.99',
      scoringNote:
        'Monthly Spend receives a score from 0 to 10. Lower total monthly costs normally receive higher scores. The live database does not currently provide fixed dollar bands, so the full calculation and reason for the score must be shown.',
      scoringFootnote: 'In this example, Monthly Spend scores 7/10.',
      showWhyItMatters: false,
      edgeCases:
        'Monthly Spend is an estimate, not a promise of what every user will pay. A person who only chats may spend less. A person who generates many videos may spend much more. The fixed example helps us compare every app using the same level of activity.',
    },
  ],
  limitations: {
    title: 'Limitations',
    paragraphs: [
      'Usage costs can change because of different credit packages, temporary discounts, country or currency, taxes, payment fees, App Store or Google Play prices, different image or video quality settings, or changes to the credit system.',
      'We use the normal website prices available to our test account on the recorded test date.',
      'Credit costs can also be difficult to compare. Some platforms use one credit system for every feature, while others use separate tokens for images, videos, and calls. We convert these systems into dollar costs whenever possible.',
      'Usage Costs makes up 35% of the Pricing score.',
    ],
  },
};

const pricingFreeAccess: TestSubscoreMethodologyContent = {
  categoryKey: 'pricing',
  subscoreSlug: 'free-access',
  heroIntro: [
    'Free Access measures what you can do before paying.',
    'Some apps let free users chat, create images, try voice features, and use several characters. Other apps ask for payment almost immediately.',
    'We record exactly what a free user receives and whether a credit card is required.',
    'The live database uses manual scores for six of these tests. Free Value uses the fixed Yes = 10, Limited = 5, No = 0 rule. Every manual result shows the exact free allowance and a simple reason for the score.',
  ],
  whyItMatters: {
    title: 'Why Free Access matters',
    paragraphs: [
      'A free plan lets users test an app before spending money.',
      'This is especially useful for AI girlfriend apps because it can be difficult to judge them from screenshots or advertising.',
      'Before paying, users may want to check whether the chat feels natural, whether they like the characters, whether image generation works, whether voice sounds good, and whether the app is easy to use.',
      'A free plan is less useful when it only gives one or two messages before asking for payment.',
      'Credit-card requirements also matter. A free trial is not completely risk-free when users must enter payment details and remember to cancel.',
    ],
  },
  howWeTest: {
    title: 'How we test Free Access',
    paragraphs: [
      'We create a new free account without buying a subscription.',
      'We then use each main feature until the free allowance runs out, a payment screen appears, or the app blocks further use.',
      'We record the number of free chat messages, free images, free videos, free voice time, available characters, whether a credit card is required, and when free allowances reset or expire.',
      'We test the normal free offer available to new users. We do not include affiliate bonuses, referral rewards, or special coupon codes.',
    ],
  },
  highLowScore: {
    title: 'What good Free Access looks like',
    paragraphs: [
      'A strong free plan usually gives users enough access to properly test the app. This may include enough messages for a real conversation, at least a few free images, a chance to try video or voice, access to several characters, no credit card required, free allowances that reset, and clear rules about when free credits expire.',
      'Common problems include payment being required after only a few messages, no media features on the free plan, a credit card required to start the trial, a trial that automatically becomes paid, free credits that expire very quickly, unclear reset rules, free users limited to one character, and a homepage that says free while most features are locked.',
    ],
  },
  scoreCalculation: {
    title: 'How the Free Access score is calculated',
    paragraphs: [
      'Each test receives a score from 0 to 10. We multiply each score by its weight and add the results together.',
      'Free Chat and Free Images each contribute 20%. Free Video contributes 15%. Free Value contributes 15%. Free Voice, Free Characters, and Restrictions each contribute 10%.',
      'Free Value uses automatic scoring. The other six tests use manual scores because the database does not currently have fixed rules such as 50 free messages always scoring 8.',
    ],
    evidenceWeights: [
      { label: 'Free Chat', weight: 20 },
      { label: 'Free Images', weight: 20 },
      { label: 'Free Video', weight: 15 },
      { label: 'Free Voice', weight: 10 },
      { label: 'Free Characters', weight: 10 },
      { label: 'Free Value', weight: 15 },
      { label: 'Restrictions', weight: 10 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test receives a score from 0 to 10. We multiply each score by its weight and add the results together.',
    calculationNotes: {
      title: 'Automatic and manual scores',
      items: [
        {
          title: 'Free Value',
          body: 'Yes = 10/10, Limited = 5/10, No = 0/10, and Unknown = 0/10.',
        },
        {
          title: 'Manual scoring',
          body: 'Free Chat, Free Images, Free Video, Free Voice, Free Characters, and Restrictions show the exact free allowance and explain the score clearly instead of using fixed count bands.',
        },
        {
          title: 'Unknown',
          body: 'If we cannot verify a result, the test receives a score of 0.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Free Access is organized into 7 evidence groups. Each group contains one scored test: Free Chat, Free Images, Free Video, Free Voice, Free Characters, Free Value, and Restrictions.',
    sectionIntro: 'Free Access has 7 evidence groups made up of 7 scored tests.',
  },
  evidenceGroupContent: {
    'free-chat': {
      intro: ['Free Chat measures how many messages a free user can send before payment is required.'],
      whyItMatters: 'Users need enough messages to judge whether the chat feels natural.',
    },
    'free-images': {
      intro: ['Free Images measures how many images a free user can generate before payment is required.'],
      whyItMatters: 'Image generation is often a main reason people try these apps.',
    },
    'free-video': {
      intro: ['Free Video measures how many videos a free user can create before payment is required.'],
      whyItMatters: 'Even one free video can help users understand what the feature is like.',
    },
    'free-voice': {
      intro: ['Free Voice measures how much voice use is available without payment.'],
      whyItMatters: 'This can include voice messages or live calls.',
    },
    'free-characters': {
      intro: ['Free Characters measures how many characters a free user can create or chat with.'],
      whyItMatters: 'A free plan is less useful when users can only test one character.',
    },
    'free-value': {
      intro: ['Free Value checks whether the app offers a useful free experience without requiring payment details.'],
      whyItMatters: 'This test is mainly about whether users can safely try the app before paying.',
    },
    restrictions: {
      intro: ['Restrictions records the rules placed on the free plan.'],
      whyItMatters: 'A free allowance may reset every day, expire after one week, or disappear when the user closes the account.',
    },
  },
  evidenceSections: [
    {
      id: 'free-chat',
      title: 'Free Chat',
      whatItMeasures: 'How many messages a free user can send before payment is required.',
      whyItMatters: 'Users need enough messages to judge whether the chat feels natural.',
      howWeTest:
        'We create a free account and start a normal conversation. We continue sending messages until the app blocks the chat or asks for payment. We also check whether the allowance resets.',
      whatWeCount: [
        'Messages available without payment',
        'Daily free messages',
        'Monthly free messages',
        'Unlimited free chat with clear fair-use rules',
        'Messages available immediately after signup',
      ],
      whatWeDoNotCount: [
        'Messages given only after buying something',
        'Referral rewards',
        'Temporary promotional bonuses',
        'Messages available only with a credit card trial',
        'Messages sent through a paid account',
      ],
      displayedResult: '20 free messages per day',
      scoringNote:
        'Free Chat receives a score from 0 to 10. More useful free chat normally receives a higher score. The exact message allowance and reset period are always shown beside the score.',
      scoringFootnote: 'In this example, Free Chat scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'We record how the allowance works, such as 20 messages total, 10 messages per day, 100 messages per month, or unlimited free messages. A daily allowance may offer more long-term value than a larger one-time allowance.',
    },
    {
      id: 'free-images',
      title: 'Free Images',
      whatItMeasures: 'How many images a free user can generate before payment is required.',
      whyItMatters: 'Image generation is often a main reason people try these apps.',
      howWeTest:
        'We try to create images through every image tool available to free users. We continue until the allowance ends or the app asks for payment.',
      whatWeCount: [
        'Images generated without payment',
        'Daily or monthly free images',
        'Images created using free signup credits',
        'Images created inside chat or through a separate generator',
      ],
      whatWeDoNotCount: [
        'Ready-made character profile images',
        'Marketing examples',
        'Images unlocked only after subscribing',
        'Referral rewards',
        'Temporary coupon bonuses',
      ],
      displayedResult: '3 free images after signup',
      scoringNote:
        'Free Images receives a score from 0 to 10. More free generations and better reset rules normally lead to a higher score. The database does not currently use fixed image-count bands.',
      scoringFootnote: 'In this example, Free Images scores 6/10.',
      showWhyItMatters: false,
      edgeCases:
        'We record whether the free images are a one-time bonus or regularly reset, such as 3 images once, 2 images per day, or 10 images per month.',
    },
    {
      id: 'free-video',
      title: 'Free Video',
      whatItMeasures: 'How many videos a free user can create before payment is required.',
      whyItMatters: 'Even one free video can help users understand what the feature is like.',
      howWeTest:
        'We try to generate videos through every video option available to free users. We record how many successful videos can be created.',
      whatWeCount: [
        'Free text-to-video generations',
        'Free image-to-video generations',
        'Videos requested inside chat',
        'Free video credits given to new users',
      ],
      whatWeDoNotCount: [
        'Video previews on the homepage',
        'Pre-recorded character videos',
        'Videos requiring a paid subscription',
        'Failed attempts that produce no video',
        'Referral bonuses',
      ],
      displayedResult: '1 free five-second video',
      scoringNote:
        'Free Video receives a score from 0 to 10. More useful free video access normally receives a higher score. The exact video allowance is always shown.',
      scoringFootnote: 'In this example, Free Video scores 4/10.',
      showWhyItMatters: false,
      edgeCases:
        'We record the type and length of the free video when this information is useful. One free 10-second video may offer more value than several very short previews.',
    },
    {
      id: 'free-voice',
      title: 'Free Voice',
      whatItMeasures: 'How much voice use is available without payment.',
      whyItMatters: 'This can include voice messages or live calls.',
      howWeTest:
        'We use the available free voice features until the allowance runs out. We record the total amount of free voice time in seconds.',
      whatWeCount: [
        'AI voice messages',
        'Voice replies received in chat',
        'Live voice-call time',
        'Free voice time that resets',
        'Voice credits included with the free account',
      ],
      whatWeDoNotCount: [
        'Short voice previews in the character creator',
        'Device text-to-speech',
        'Audio from marketing videos',
        'Voice available only after payment',
        'Promotional rewards from referrals',
      ],
      displayedResult: '30 seconds of free voice messages',
      scoringNote:
        'Free Voice receives a score from 0 to 10. More useful voice time normally receives a higher score. The exact number of seconds and the type of voice feature are shown with the result.',
      scoringFootnote: 'In this example, Free Voice scores 4/10.',
      showWhyItMatters: false,
      edgeCases:
        'We explain whether the allowance covers voice messages, voice calls, or both. These are different experiences even when the total time is similar.',
    },
    {
      id: 'free-characters',
      title: 'Free Characters',
      whatItMeasures: 'How many characters a free user can create or chat with.',
      whyItMatters: 'A free plan is less useful when users can only test one character.',
      howWeTest:
        'We check how many ready-made characters can be opened by a free user. We also check whether free users can create their own characters.',
      whatWeCount: [
        'Ready-made characters available to free users',
        'Characters that can actually be chatted with',
        'Custom characters that can be created for free',
        'Character access that resets or remains available',
      ],
      whatWeDoNotCount: [
        'Character profiles that can be viewed but not used',
        'Paid-only characters',
        'Locked characters shown in the library',
        'Characters available only through referral rewards',
        'Marketing screenshots',
      ],
      displayedResult: 'Free users can chat with all ready-made characters and create 1 custom character',
      scoringNote:
        'Free Characters receives a score from 0 to 10. Access to more usable characters normally leads to a higher score.',
      scoringFootnote: 'In this example, Free Characters scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'We explain whether the result refers to characters available for chat, characters users can create, or both.',
    },
    {
      id: 'free-value',
      title: 'Free Value',
      whatItMeasures:
        'Whether the app offers a useful free experience without requiring payment details.',
      whyItMatters: 'This test is mainly about whether users can safely try the app before paying.',
      howWeTest:
        'We create a new account and check whether useful features are available, whether a credit card is required, whether the free offer is only a short trial, and whether the trial automatically becomes paid.',
      whatWeCount: [
        'No credit card is required',
        'Users can properly try the app',
        'The free account offers more than a basic preview',
      ],
      whatWeDoNotCount: [
        'Users cannot meaningfully try the app without paying',
        'Payment is required immediately',
        'A marketing preview presented as a full free plan',
      ],
      displayedResult: 'Yes \u2014 useful free access with no credit card required',
      scoringLines: [
        'Yes \u2014 useful free access without a credit card = 10/10',
        'Limited \u2014 free access has an important restriction = 5/10',
        'No \u2014 payment details are required = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Free Value scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Limited may apply when some useful features are free but important restrictions apply, the trial is very short, payment details are required, or the free experience is too limited to properly test the app.',
    },
    {
      id: 'restrictions',
      title: 'Restrictions',
      whatItMeasures: 'The rules placed on the free plan.',
      whyItMatters:
        'A free allowance may reset every day, expire after one week, or disappear when the user closes the account.',
      howWeTest:
        'We check the app, pricing page, account balance, and terms. We record when free access resets, whether free credits expire, how long a free trial lasts, whether payment details are required, and whether some features are completely blocked.',
      whatWeCount: [
        'Daily reset rules',
        'Monthly reset rules',
        'Trial length',
        'Credit-expiry periods',
        'Important free-account limits',
        'Clear fair-use rules',
      ],
      whatWeDoNotCount: [
        'Normal safety rules',
        'File-size limits',
        'Restrictions that only affect paid users',
        'Temporary technical problems',
        'Rules we cannot confirm',
      ],
      displayedResult: 'Free messages reset daily, but signup credits expire after seven days',
      scoringNote:
        'Restrictions receives a score from 0 to 10. Clear and generous rules normally receive a higher score. Harsh, confusing, or quickly expiring allowances receive a lower score.',
      scoringFootnote: 'In this example, Restrictions scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Restrictions are not always bad. For example, 10 free messages that reset every day may be more useful than 50 messages that never return. We score how fair and useful the full restriction system is.',
    },
  ],
  limitations: {
    title: 'Limitations',
    paragraphs: [
      'Free offers can change quickly.',
      'They may also differ because of country, device, website or mobile app, new-user promotions, test groups, App Store rules, or limited-time offers.',
      'We test the normal free offer available to our account on the recorded test date.',
      'We clearly separate permanent free access, one-time signup credits, a temporary free trial, and promotional rewards.',
      'Free Access makes up 20% of the Pricing score.',
    ],
  },
};

const pricingBilling: TestSubscoreMethodologyContent = {
  categoryKey: 'pricing',
  subscoreSlug: 'billing',
  heroIntro: [
    'Billing measures how clear and fair the payment process is.',
    'We check whether the app explains its prices before payment, whether important features cost extra, whether credits expire, whether refunds are possible, how easy cancellation is, and what name appears on the bank statement.',
    'Paywalls still exists in the live database with a 20% weight, but the tester hint says it is deprecated and removed from testing. It is also missing from the active Billing and Policies guided session. This should be fixed before publishing. Either restore the Paywalls test to the testing workflow or remove it from the live Billing score and spread its weight across the remaining tests.',
  ],
  whyItMatters: {
    title: 'Why Billing matters',
    paragraphs: [
      'The price shown on the homepage is not always the full story.',
      'An app may advertise a cheap subscription but only explain later that images cost extra credits, videos require a more expensive plan, credits expire, refunds are not allowed, cancellation requires contacting support, or the bank statement shows the adult app\u2019s name.',
      'Users should know these things before paying.',
      'A good billing system clearly explains the price, renewal rules, included credits, extra costs, refund policy, and cancellation process.',
    ],
  },
  howWeTest: {
    title: 'How we test Billing',
    paragraphs: [
      'We use a paid account and check the full payment process.',
      'We review the pricing page, checkout page, account settings, credit balance, payment help pages, refund policy, subscription terms, and cancellation settings.',
      'We record what a normal user can see before and after paying.',
      'Payment Privacy is filled from the structured Pricing section of the database. The other active billing checks are completed through the Billing and Policies testing session.',
    ],
  },
  highLowScore: {
    title: 'What good Billing looks like',
    paragraphs: [
      'A strong Billing result usually means important pricing details are shown before checkout, few important features require another payment, purchased credits do not expire, the refund policy is easy to find, users can cancel without contacting support, and the bank-statement name is discreet and explained before payment.',
      'Common problems include the annual price being shown as a monthly price, hidden extra credit costs, important features requiring a higher plan, purchased credits expiring without a clear warning, a refund policy that is difficult to find, users having to email support to cancel, a statement name that reveals the type of service, and a billing name shown only after payment.',
    ],
  },
  scoreCalculation: {
    title: 'How the Billing score is calculated',
    paragraphs: [
      'Each test receives a score from 0 to 10. We multiply each score by its weight and add the results together.',
      'Pricing Clarity and Paywalls each contribute 20%. Credit Expiry, Refunds, Cancellation, and Payment Privacy each contribute 15%.',
      'Outside the Privacy category, an Unknown result normally receives 0 points. Credit Expiry is a special case: its database rule gives Unknown a score of 2/10.',
      'If a test truly does not apply, we remove it from the calculation and increase the remaining test weights so they still add up to 100%.',
    ],
    evidenceWeights: [
      { label: 'Pricing Clarity', weight: 20 },
      { label: 'Paywalls', weight: 20 },
      { label: 'Credit Expiry', weight: 15 },
      { label: 'Refunds', weight: 15 },
      { label: 'Cancellation', weight: 15 },
      { label: 'Payment Privacy', weight: 15 },
    ],
    exactCalculationTitle: 'View exact calculation',
    exactCalculationBody:
      'Each test receives a score from 0 to 10. We multiply each score by its weight and add the results together.',
    calculationNotes: {
      title: 'Unknown and Not Applicable',
      items: [
        {
          title: 'Unknown',
          body: 'Outside Privacy, Unknown normally receives 0 points. We only use Unknown when we cannot find a clear answer. Credit Expiry is the exception: Unknown scores 2/10 under the live database rule.',
        },
        {
          title: 'Not Applicable',
          body: 'If a test truly does not apply, we remove it from the calculation and spread its weight across the remaining tests.',
        },
        {
          title: 'Automatic scoring',
          body: 'Pricing Clarity and Paywalls convert checklist percentages directly into scores. Paywalls uses inverted scoring, so fewer extra paywalls lead to a higher score.',
        },
      ],
    },
  },
  evidenceHierarchy: {
    explanation:
      'Billing is organized into 6 evidence groups: Pricing Clarity, Paywalls, Credit Expiry, Refunds, Cancellation, and Payment Privacy.',
    sectionIntro: 'Billing has 6 evidence groups made up of 6 scored tests.',
  },
  evidenceGroupContent: {
    'pricing-clarity': {
      intro: ['Pricing Clarity measures how much important information the app shows before payment.'],
      whyItMatters: 'We check eight pricing details that users need before checkout.',
    },
    paywalls: {
      intro: ['Paywalls measures how many important features require another payment after subscribing.'],
      whyItMatters: 'This may include buying a more expensive plan, purchasing separate credits, or paying for the feature separately.',
    },
    'credit-expiry': {
      intro: ['Credit Expiry measures whether purchased credits disappear after a set amount of time.'],
      whyItMatters: 'Users should not lose credits they paid for without a clear warning.',
    },
    refunds: {
      intro: ['Refunds measures whether users can get their money back and what rules apply.'],
      whyItMatters: 'Users should know the refund rules before paying.',
    },
    cancellation: {
      intro: ['Cancellation measures how easy it is to stop the subscription.'],
      whyItMatters: 'Users should be able to cancel without searching through several pages or contacting support.',
    },
    'payment-privacy': {
      intro: ['Payment Privacy measures how discreet the payment looks on a bank or card statement.'],
      whyItMatters: 'Users may not want an adult AI app\u2019s name clearly shown on their statement.',
    },
  },
  evidenceSections: [
    {
      id: 'pricing-clarity',
      title: 'Pricing Clarity',
      whatItMeasures: 'How much important information the app shows before payment.',
      whyItMatters: 'We check eight pricing details.',
      howWeTest:
        'We check the pricing and checkout pages before completing payment. Each clearly explained item receives one point. We check subscription price, renewal period, included credits, image cost, video cost, usage limits, credit expiry, and refund policy.',
      whatWeCount: [
        'The full subscription price is visible',
        'The renewal period is explained',
        'Included credits are shown',
        'Image and video costs are explained',
        'Important limits are visible',
        'Credit expiry is explained',
        'The refund policy is linked or summarized',
      ],
      whatWeDoNotCount: [
        'Information shown only after payment',
        'Important details hidden in unrelated pages',
        'Vague wording such as additional fees may apply',
        'A discount price with no normal price',
        'An annual total hidden behind a monthly average',
      ],
      displayedResult: '6 of 8 pricing details were clearly shown',
      displayedResultExtra: 'Pricing Clarity: 75%',
      scoringIntro: 'The percentage becomes a score from 0 to 10.',
      scoringLines: [
        '0 of 8 = 0/10',
        '2 of 8 = 2.5/10',
        '4 of 8 = 5/10',
        '6 of 8 = 7.5/10',
        '8 of 8 = 10/10',
      ],
      scoringFootnote: 'In this example, Pricing Clarity scores 7.5/10.',
      showWhyItMatters: false,
      edgeCases:
        'We check pricing pages before payment. Information shown only after checkout does not count.',
    },
    {
      id: 'paywalls',
      title: 'Paywalls',
      whatItMeasures: 'How many important features require another payment after subscribing.',
      whyItMatters:
        'This may include buying a more expensive plan, purchasing separate credits, or paying for the feature separately.',
      howWeTest:
        'We check the same 10 core features used in Included Features: standard chat, character library, character creation, image generation, image editing, video generation, voice messages, voice calls, memory controls, and message regeneration. We count how many require an extra payment.',
      whatWeCount: [
        'A more expensive subscription is required',
        'Extra credits must be purchased',
        'The feature requires a separate purchase',
        'The feature is shown but locked on the tested plan',
      ],
      whatWeDoNotCount: [
        'A feature included in the tested plan',
        'A feature using credits already included with the subscription',
        'A reasonable usage limit',
        'A feature the platform does not offer at all',
      ],
      displayedResult: '2 of 10 core features require another payment',
      displayedResultExtra: 'Paywall rate: 20%',
      scoringIntro: 'This score is inverted. Fewer extra paywalls lead to a higher score.',
      scoringLines: [
        '0 of 10 = 10/10',
        '2 of 10 = 8/10',
        '4 of 10 = 6/10',
        '6 of 10 = 4/10',
        '8 of 10 = 2/10',
        '10 of 10 = 0/10',
      ],
      scoringFootnote: 'In this example, Paywalls scores 8/10.',
      showWhyItMatters: false,
      edgeCases:
        'Paywalls still exists in the live database, but the tester hint marks it as deprecated and it is missing from the active Billing and Policies guided session. This workflow mismatch should be resolved before publishing.',
    },
    {
      id: 'credit-expiry',
      title: 'Credit Expiry',
      whatItMeasures: 'Whether purchased credits disappear after a set amount of time.',
      whyItMatters: 'Users should not lose credits they paid for without a clear warning.',
      howWeTest:
        'We check pricing terms, the credit purchase page, account balance, help pages, and subscription rules. We record whether credits expire and, when possible, the exact expiry period.',
      whatWeCount: [
        'Purchased credits expire',
        'Credits disappear after a set number of days',
        'Unused credits are removed at the end of a billing period',
      ],
      whatWeDoNotCount: [
        'Normal subscription renewal rules when credits are clearly explained as monthly',
        'Safety or account-closure rules unrelated to purchased credit expiry',
      ],
      displayedResult: 'No \u2014 purchased credits do not expire',
      scoringLines: [
        'No \u2014 credits do not expire = 10/10',
        'Limited \u2014 only some credits expire or special rules apply = 5/10',
        'Yes \u2014 purchased credits expire = 0/10',
        'Unknown \u2014 the company does not explain it = 2/10',
      ],
      scoringFootnote: 'In this example, Credit Expiry scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'This test works in reverse because expiring credits are worse for users. Limited may apply when only some credits expire, subscription credits expire but purchased top-up credits do not, credits have a long expiry period, or the rules depend on the credit type.',
    },
    {
      id: 'refunds',
      title: 'Refunds',
      whatItMeasures: 'Whether users can get their money back and what rules apply.',
      whyItMatters: 'Users should know the refund rules before paying.',
      howWeTest:
        'We review the current refund policy. We record whether refunds are allowed, how long users have to request one, which purchases can be refunded, and important restrictions.',
      whatWeCount: [
        'A clear refund process exists',
        'Users have a reasonable request period',
        'The policy clearly explains which purchases qualify',
      ],
      whatWeDoNotCount: [
        'Unofficial support answers',
        'Refund promises with no written policy',
        'Policies we cannot confirm',
      ],
      displayedResult: 'Limited \u2014 refunds are available within seven days, but only when no credits have been used',
      scoringLines: [
        'Yes \u2014 a clear and useful refund policy exists = 10/10',
        'Limited \u2014 refunds have important restrictions = 5/10',
        'No \u2014 refunds are not available = 0/10',
        'Unknown \u2014 the policy is unclear = 0/10',
      ],
      scoringFootnote: 'In this example, Refunds scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'We review the policy. We do not make a false refund request simply to test support.',
    },
    {
      id: 'cancellation',
      title: 'Cancellation',
      whatItMeasures: 'How easy it is to stop the subscription.',
      whyItMatters:
        'Users should be able to cancel without searching through several pages or contacting support.',
      howWeTest:
        'We open the paid account settings and look for the cancellation option. We record whether self-service cancellation exists, how many steps are required, whether support must be contacted, and whether the end date is clearly shown. We may stop before the final confirmation so the test account remains active.',
      whatWeCount: [
        'Cancellation is available in account settings',
        'The process is clear',
        'Support is not required',
        'The user receives a clear confirmation',
      ],
      whatWeDoNotCount: [
        'Logging out',
        'Deleting the app without stopping the subscription',
        'Cancelling notifications only',
      ],
      displayedResult: 'Yes \u2014 cancellation was available in account settings and took three steps',
      scoringLines: [
        'Yes \u2014 clear self-service cancellation = 10/10',
        'Limited \u2014 cancellation has important difficulties = 5/10',
        'No \u2014 no usable cancellation process = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Cancellation scores 10/10.',
      showWhyItMatters: false,
      edgeCases:
        'Deleting the app does not cancel the subscription. Cancelling the subscription also does not always delete the account.',
    },
    {
      id: 'payment-privacy',
      title: 'Payment Privacy',
      whatItMeasures: 'How discreet the payment looks on a bank or card statement.',
      whyItMatters: 'Users may not want an adult AI app\u2019s name clearly shown on their statement.',
      howWeTest:
        'We check the checkout page, payment help pages, billing information, expected bank-statement name, and available payment methods. We record whether the billing name is discreet and whether it is shown before payment.',
      whatWeCount: [
        'The bank-statement name is discreet',
        'The descriptor does not clearly reveal the adult service',
        'The expected name is shown before payment',
        'Payment information is handled through a normal secure checkout',
      ],
      whatWeDoNotCount: [
        'Marketing claims about discreet billing with no supporting detail',
        'Descriptors shown only after payment',
        'Unofficial user guesses about statement names',
      ],
      displayedResult: 'Limited \u2014 the statement used a parent-company name, but it was not clearly shown before checkout',
      scoringLines: [
        'Yes \u2014 discreet and clearly explained = 10/10',
        'Limited \u2014 some privacy is provided, but restrictions apply = 5/10',
        'No \u2014 the payment is not discreet = 0/10',
        'Unknown = 0/10',
      ],
      scoringFootnote: 'In this example, Payment Privacy scores 5/10.',
      showWhyItMatters: false,
      edgeCases:
        'Payment Privacy and Billing Descriptor are related but different. Billing Descriptor under Privacy checks whether the name is shown before payment. Payment Privacy under Pricing checks whether the full payment process is discreet.',
    },
  ],
  limitations: {
    title: 'Limitations',
    paragraphs: [
      'Billing details can change depending on country, currency, website or mobile app, App Store or Google Play, payment provider, subscription plan, temporary discount, or local taxes.',
      'We use the normal website checkout available to our test account on the recorded test date.',
      'A bank-statement descriptor may also differ between payment providers. We record the descriptor shown by the company or used during our test payment.',
      'Billing makes up 15% of the Pricing score.',
    ],
  },
};

const REGISTRY: Record<string, TestSubscoreMethodologyContent> = {
  'characters/variety': charactersVariety,
  'characters/discovery': charactersDiscovery,
  'characters/quality': charactersQuality,
  'customization/appearance': customizationAppearance,
  'customization/personality': customizationPersonality,
  'customization/control': customizationControl,
  'chat/understanding': chatUnderstanding,
  'chat/realism': chatRealism,
  'chat/reliability': chatReliability,
  'chat-features/media': chatFeaturesMedia,
  'chat-features/interaction': chatFeaturesInteraction,
  'chat-features/controls': chatFeaturesControls,
  'chat-features/platform-extras': chatFeaturesPlatformExtras,
  'images/quality': imagesQuality,
  'images/accuracy': imagesAccuracy,
  'images/experience': imagesExperience,
  'video/capabilities': videoCapabilities,
  'video/quality': videoQuality,
  'video/experience': videoExperience,
  'privacy/data-use': privacyDataUse,
  'privacy/user-control': privacyUserControl,
  'privacy/security': privacySecurity,
  'privacy/support': privacySupport,
  'pricing/plan-value': pricingPlanValue,
  'pricing/usage-costs': pricingUsageCosts,
  'pricing/free-access': pricingFreeAccess,
  'pricing/billing': pricingBilling,
};

export function getTestSubscoreMethodology(
  categoryKey: string,
  subscoreSlug: string,
): TestSubscoreMethodologyContent | undefined {
  return REGISTRY[`${categoryKey}/${subscoreSlug}`];
}
