import { testCategoryUrl, testSubscoreUrl } from '../lib/slugs';

export interface TestCategorySubscoreContent {
  /** Matches subscore slug (e.g. variety). */
  slug: string;
  /** Short question-style headline under the subscore name. */
  lead: string;
  /** Supporting paragraph(s). */
  body: string;
  /** Optional second paragraph after body. */
  bodyExtra?: string;
  /** Evidence labels shown under "We measure". */
  measures: string[];
  /** Link label, e.g. "View Variety methodology". */
  methodologyLinkLabel: string;
}

export interface TestCategoryGoodLooksLikeRow {
  slug: string;
  name: string;
  weight: number;
  description: string;
}

export interface TestCategoryGoodLooksLikeContent {
  title: string;
  intro: string;
  rows: TestCategoryGoodLooksLikeRow[];
  goodOverall: string;
  weakOverall: string;
}

export interface TestCategoryMethodologyContent {
  /** Intro paragraphs below the hero (replaces category.description when set). */
  intro: string[];
  subscores: TestCategorySubscoreContent[];
  howWeTest: {
    title: string;
    paragraphs: string[];
  };
  whyWeTest?: {
    title: string;
    lead: string;
    paragraphs: string[];
  };
  scoreCalculation: {
    title: string;
    intro: string;
    weights: { name: string; weight: number }[];
    footer: string;
  };
  limitations: {
    title: string;
    paragraphs: string[];
  };
  /** Compact subscore summary beside “Why we test” (replaces auto-synced benchmark panel). */
  goodLooksLike?: TestCategoryGoodLooksLikeContent;
  related: { label: string; href: string }[];
}

const characters: TestCategoryMethodologyContent = {
  intro: [
    'The Characters rating looks at the platform\u2019s ready-made character library.',
    'We check how much choice you get, how easy it is to find a character you actually like, and whether the library feels original or filled with rushed, copy-paste profiles.',
  ],
  subscores: [
    {
      slug: 'variety',
      lead: 'How many different characters, styles, personalities, and scenarios are available?',
      body: 'A platform can have hundreds of characters and still feel repetitive. We look beyond the total number and check whether the library actually gives you different types of characters to choose from.',
      measures: ['Amount', 'Styles', 'Genders', 'Ethnicities', 'Personalities', 'Scenarios'],
      methodologyLinkLabel: 'View Variety methodology',
    },
    {
      slug: 'discovery',
      lead: 'How easy is it to find the right character?',
      body: 'A large library is not very useful when you need to scroll through hundreds of profiles to find someone you like. We test the platform\u2019s filters, categories, search tools, and general browsing experience.',
      measures: ['Filters', 'Categories', 'Search', 'Browsing'],
      methodologyLinkLabel: 'View Discovery methodology',
    },
    {
      slug: 'quality',
      lead: 'How good is the character library?',
      body: 'Some platforms add a huge number of characters just to make their library look impressive. This often leads to duplicate profiles, weak descriptions, broken images, and characters that feel almost identical.',
      bodyExtra:
        'We review a fixed sample of 25 characters and check how original, complete, and visually polished they are.',
      measures: ['Duplicates', 'Originality', 'Profile Quality', 'Visual Quality'],
      methodologyLinkLabel: 'View Quality methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Characters',
    paragraphs: [
      'We use a paid account and inspect the full character library available during testing.',
      'First, we count the characters and record the different styles, gender groups, ethnicities, personalities, and scenarios shown by the platform.',
      'We then test the filters, categories, and search tools to see how quickly we can find specific types of characters.',
      'Finally, we review the same 50-character sample for every Quality test. This keeps the results consistent and prevents us from using stronger characters for one test and weaker characters for another.',
    ],
  },
  whyWeTest: {
    title: 'Why we test characters',
    lead: 'A big character library matters more than it might seem.',
    paragraphs: [
      'AI girlfriend apps can start to feel repetitive quickly, especially if the same few characters have similar personalities, texting styles, and scenarios. This becomes an even bigger problem when you pay for an annual plan. If an app only has five characters, you may run out of interesting people to talk to long before your subscription ends.',
      'That is why we do not only count how many characters are available. We also check whether the library has enough variety, whether the characters are easy to find, and whether their profiles feel original and well made.',
      'A strong character library gives you more people to meet, more types of relationships and roleplays to explore, and less chance of getting bored with the app.',
    ],
  },
  goodLooksLike: {
    title: 'What good Characters looks like',
    intro: 'A strong character library delivers on three key areas.',
    rows: [
      {
        slug: 'variety',
        name: 'Variety',
        weight: 34,
        description:
          'Enough choice to avoid repetition and support different personalities, styles, and scenarios.',
      },
      {
        slug: 'discovery',
        name: 'Discovery',
        weight: 33,
        description: 'Filters and search that make it easy to find the characters you want.',
      },
      {
        slug: 'quality',
        name: 'Quality',
        weight: 33,
        description: 'Profiles that feel original, detailed, and well made with minimal duplicates.',
      },
    ],
    goodOverall: 'All three areas perform well.',
    weakOverall: 'One area drags the library down.',
  },
  scoreCalculation: {
    title: 'How the Characters score is calculated',
    intro: 'The Characters score is made up of three subscores.',
    weights: [
      { name: 'Variety', weight: 34 },
      { name: 'Discovery', weight: 33 },
      { name: 'Quality', weight: 33 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Characters score makes up 10% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'Character libraries change all the time. Platforms regularly add new characters, remove old ones, or change their filters and categories. Our results show what was available on the date we tested the platform.',
      'We also only use labels shown by the platform. For example, we never guess a character\u2019s ethnicity or gender based on their appearance.',
      'The Quality score is based on a 50-character sample, not every character in the library. This gives us a good idea of the platform\u2019s overall quality, but it does not mean every single profile will be equally good.',
    ],
  },
  related: [
    { label: 'Variety Testing Methodology', href: testSubscoreUrl('characters', 'Variety') },
    { label: 'Discovery Testing Methodology', href: testSubscoreUrl('characters', 'Discovery') },
    { label: 'Quality Testing Methodology', href: testSubscoreUrl('characters', 'Quality') },
    { label: 'Customization Testing Methodology', href: testCategoryUrl('customization') },
  ],
};

const customization: TestCategoryMethodologyContent = {
  intro: [
    'The Customization rating looks at how much control you get when creating your own AI girlfriend.',
    'We check how much you can change how she looks, who she is, and whether you can go beyond basic presets with custom prompts, previews, and editing.',
  ],
  subscores: [
    {
      slug: 'appearance',
      lead: 'How much can you change how your AI girlfriend looks?',
      body: 'Some apps give you 20 body types, dozens of hairstyles, and enough options to create someone very specific. Others give you three body types and a few basic colors.',
      bodyExtra:
        'We count the options inside the character creator to see how much real choice you get.',
      measures: [
        'Age',
        'Ethnicity',
        'Eye Color',
        'Body Type',
        'Breast Size',
        'Hair Style',
        'Hair Color',
        'Outfits',
        'Personality Presets',
      ],
      methodologyLinkLabel: 'View Appearance methodology',
    },
    {
      slug: 'personality',
      lead: 'How much can you change who your AI girlfriend is?',
      body: 'Looks are only half the job. You may want someone who is shy, bratty, romantic, dominant, funny, or interested in the same things as you.',
      bodyExtra:
        'We check how many traits, interests, relationship types, roles, voices, and kink options you can choose from.',
      measures: ['Traits', 'Interests', 'Relationship', 'Role', 'Voice', 'Kink Options'],
      methodologyLinkLabel: 'View Personality methodology',
    },
    {
      slug: 'control',
      lead: 'How much freedom do you get beyond the basic presets?',
      body: 'Preset buttons can only take you so far. The best character creators let you describe exactly what you want, preview the result before spending credits, and make changes later if something does not turn out right.',
      bodyExtra: 'We create five test characters to see how much real control the app gives you.',
      measures: ['Custom Prompts', 'Editing', 'Preview'],
      methodologyLinkLabel: 'View Control methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Customization',
    paragraphs: [
      'We use a paid account and open the full character creator available during testing.',
      'First, we count the appearance options, including age, ethnicity, eye color, body type, breast size, hairstyles, hair colors, and outfits.',
      'We then count the personality options, including traits, interests, relationship types, roles, voices, and kink options.',
      'Finally, we create the same five test characters and use them for every Control test. We check whether custom prompts work, whether you can preview the character before finishing, and whether you can change things like the appearance, personality, relationship, voice, and name later.',
    ],
  },
  whyWeTest: {
    title: 'Why we test customization',
    lead: 'Customization is one of the biggest reasons people use AI girlfriend apps.',
    paragraphs: [
      'At some point, you may run out of ready-made characters you actually want to talk to. This happens even faster when an app has fewer than 50 characters, and it is especially annoying when you have already paid for a yearly plan.',
      'A good character creator helps fight that feeling of saturation. Instead of waiting for the app to add someone new, you can build your own AI girlfriend around what you actually like.',
      'The difference between apps is also huge. One app might give you 20 body types and let you describe a custom one with a prompt. Another might give you three body types and no way to go beyond the basic presets.',
      'That is why we do not only check whether customization exists. We check how much choice you get and how much real control you have over the final character.',
    ],
  },
  goodLooksLike: {
    title: 'What good Customization looks like',
    intro:
      'A strong character creator gives you enough freedom to build someone who actually matches your preferences.',
    rows: [
      {
        slug: 'appearance',
        name: 'Appearance',
        weight: 34,
        description:
          'Enough choices for age, ethnicity, hair, body type, clothing, and other parts of the character\u2019s appearance.',
      },
      {
        slug: 'personality',
        name: 'Personality',
        weight: 33,
        description:
          'Useful options for traits, interests, relationships, roles, and voice, so the character feels like more than a different profile picture.',
      },
      {
        slug: 'control',
        name: 'Control',
        weight: 33,
        description:
          'Custom prompts, previews, and editing tools that let you create something specific and fix it later.',
      },
    ],
    goodOverall: 'You can control both how the character looks and who she is.',
    weakOverall:
      'The creator relies on a few basic presets or gives you no way to customize the result properly.',
  },
  scoreCalculation: {
    title: 'How the Customization score is calculated',
    intro: 'The Customization score is made up of three subscores.',
    weights: [
      { name: 'Appearance', weight: 34 },
      { name: 'Personality', weight: 33 },
      { name: 'Control', weight: 33 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Customization score makes up 15% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'More options do not always mean better customization. Fifty hairstyles are not very useful when most of them look almost the same.',
      'Preset creators and prompt-based creators also work differently. Presets are usually easier for beginners, while custom prompts can give you more control\u2014but only when the app actually follows them.',
      'This score measures the controls available inside the character creator. It does not measure how good the finished image looks or how well the character chats. We test those separately under Images and Chat.',
      'Character creators also change all the time. Apps may add new options, remove old ones, or move features behind a paid plan. Our results show what was available on the date we tested the platform.',
    ],
  },
  related: [
    { label: 'Appearance Testing Methodology', href: testSubscoreUrl('customization', 'Appearance') },
    { label: 'Personality Testing Methodology', href: testSubscoreUrl('customization', 'Personality') },
    { label: 'Control Testing Methodology', href: testSubscoreUrl('customization', 'Control') },
    { label: 'Characters Testing Methodology', href: testCategoryUrl('characters') },
  ],
};

const chat: TestCategoryMethodologyContent = {
  intro: [
    'The Chat rating looks at the quality of the actual conversation.',
    'We check whether the AI understands you, remembers important details, stays in character, feels natural to talk to, and works without constantly repeating itself or breaking.',
  ],
  subscores: [
    {
      slug: 'understanding',
      lead: 'How well does the AI understand what you are saying?',
      body: 'A bad chat does not always give obviously broken answers. Sometimes it forgets your name after ten messages, ignores a clear instruction, misses something you said earlier, or completely misunderstands the roleplay.',
      bodyExtra:
        'We test whether the AI remembers details, answers your questions properly, follows the conversation, listens to your instructions, and understands the scenario you are trying to create.',
      measures: ['Memory', 'Relevance', 'Context', 'Instructions', 'Roleplay Accuracy'],
      methodologyLinkLabel: 'View Understanding methodology',
    },
    {
      slug: 'realism',
      lead: 'Does the conversation actually feel natural?',
      body: 'Some AI girlfriends sound surprisingly human. Others send robotic essays, repeat the same phrases, or feel like they have no personality at all.',
      bodyExtra:
        'We check whether the replies sound natural, whether the character keeps her personality, how well she handles roleplay and emotions, and whether she helps move the conversation forward instead of making you do all the work.',
      measures: ['Naturalness', 'Personality', 'Roleplay', 'Initiative', 'Emotion', 'Style'],
      methodologyLinkLabel: 'View Realism methodology',
    },
    {
      slug: 'reliability',
      lead: 'Can you trust the chat to work properly?',
      body: 'Even a good AI model becomes annoying when it repeats itself, refuses normal requests, takes forever to reply, or suddenly sends a broken answer that has nothing to do with the conversation.',
      bodyExtra: 'We check how often these problems happen and whether the AI can recover after it misunderstands you.',
      measures: ['Repetition', 'Refusals', 'Reply Speed', 'Errors', 'Consistency', 'Recovery'],
      methodologyLinkLabel: 'View Reliability methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Chat',
    paragraphs: [
      'We use a paid account and open five new chats with five different characters.',
      'We use the same script in every chat and collect 20 replies from each character. This gives us 100 replies to review.',
      'First, we test Understanding. We give the AI five facts about ourselves, ask five direct questions, set three simple rules, and start the same roleplay scenario in every chat.',
      'We check whether it remembers the facts, answers the questions, uses earlier messages, follows the rules, and understands the roleplay.',
      'We then use the same five chats to test Realism. We check whether the replies sound natural, whether the character keeps her personality, handles emotions properly, stays in style, and moves the conversation forward.',
      'Finally, we test Reliability. We count repetition, contradictions, broken replies, and other errors. We also correct the AI when it gets something wrong to see whether it can recover.',
      'We send 25 allowed prompts to test unnecessary refusals and time 25 replies to measure the typical reply speed.',
    ],
  },
  whyWeTest: {
    title: 'Why we test chat',
    lead: 'Chat is the soul of every AI girlfriend app.',
    paragraphs: [
      'Images are also extremely popular, but most people sign up because they want someone to talk to. A beautiful app, a huge character library, and a ton of bonus features do not matter much when the actual conversation is bad.',
      'The difference between apps can be massive. Some AI girlfriends can remember small details about you for weeks. Others forget your name almost immediately or ask the same question again five messages later.',
      'Roleplay can also fall apart quickly. A character might start as your confident goth girlfriend and suddenly reply like a customer support chatbot halfway through the conversation. That completely kills the experience.',
      'Some platforms also let you manually save or edit memories. We test those controls separately under Chat Features. On this page, we focus on whether the conversation itself remembers details and uses them naturally.',
      'That is why we test whether the AI understands you, feels human, stays in character, and works reliably over a longer conversation.',
    ],
  },
  goodLooksLike: {
    title: 'What good Chat looks like',
    intro:
      'A strong chat understands you, feels natural, and continues working well across longer conversations.',
    rows: [
      {
        slug: 'understanding',
        name: 'Understanding',
        weight: 34,
        description:
          'The AI remembers important details, answers your questions, follows instructions, and understands the roleplay.',
      },
      {
        slug: 'realism',
        name: 'Realism',
        weight: 33,
        description:
          'Replies feel natural, match the character\u2019s personality, handle emotions well, and help move the conversation forward.',
      },
      {
        slug: 'reliability',
        name: 'Reliability',
        weight: 33,
        description:
          'The chat responds quickly without constantly repeating itself, breaking, contradicting earlier messages, or refusing normal requests.',
      },
    ],
    goodOverall: 'The conversation feels natural, remembers what matters, and stays consistent.',
    weakOverall:
      'The AI forgets details, breaks character, repeats itself, or regularly sends poor replies.',
  },
  scoreCalculation: {
    title: 'How the Chat score is calculated',
    intro: 'The Chat score is made up of three subscores.',
    weights: [
      { name: 'Understanding', weight: 34 },
      { name: 'Realism', weight: 33 },
      { name: 'Reliability', weight: 33 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Chat score makes up 20% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'Chat quality can change between characters. One character may work extremely well while another feels much weaker, even on the same app. We test five different characters to reduce this problem, but we cannot test every character on the platform.',
      'AI girlfriend apps also update their chat models regularly. A platform may become noticeably better or worse after an update. Our results show how the chat performed on the date we tested it.',
      'Our memory test takes place inside fixed conversations. It shows whether the AI can remember and use details during those chats, but it cannot guarantee that the character will remember everything weeks or months later.',
      'Roleplay is also partly subjective. We use the same scenario and the same checks across every platform, but different users may prefer different writing styles and levels of detail.',
      'This score only covers the quality of the conversation. Voice messages, calls, in-chat images, message controls, and manual memory tools are tested separately under Chat Features.',
    ],
  },
  related: [
    { label: 'Understanding Testing Methodology', href: testSubscoreUrl('chat', 'Understanding') },
    { label: 'Realism Testing Methodology', href: testSubscoreUrl('chat', 'Realism') },
    { label: 'Reliability Testing Methodology', href: testSubscoreUrl('chat', 'Reliability') },
    { label: 'Chat Features Testing Methodology', href: testCategoryUrl('chat-features') },
  ],
};

const chatFeatures: TestCategoryMethodologyContent = {
  intro: [
    'The Chat Features rating looks at everything you can do inside the chat beyond sending a normal text message.',
    'We check whether you can send and receive media, make calls, use different chat modes, manage your messages and memories, and try newer features such as live AI cam.',
  ],
  subscores: [
    {
      slug: 'media',
      lead: 'What can you send and receive inside the chat?',
      body: 'A chat feels much more personal when you can send a photo, receive an image or voice reply, ask for a video, or react to messages.',
      bodyExtra: 'We try each media feature three times to check whether it is actually available and works properly.',
      measures: [
        'Images Sent',
        'Images Received',
        'Voice Sent',
        'Voice Received',
        'Chat Video',
        'GIFs',
        'Reactions',
      ],
      methodologyLinkLabel: 'View Media methodology',
    },
    {
      slug: 'interaction',
      lead: 'Does the chat feel like a real back-and-forth experience?',
      body: 'Sending one message and waiting for one reply can start to feel basic. Features such as phone calls, different chat modes, group chats, double texting, and proactive messages make the experience feel more alive.',
      bodyExtra:
        'We check which interaction features are available and whether they actually change how the chat works.',
      measures: [
        'Voice Calls',
        'Chat Modes',
        'Mode Types',
        'Group Chat',
        'Double Texting',
        'Proactive Messages',
      ],
      methodologyLinkLabel: 'View Interaction methodology',
    },
    {
      slug: 'controls',
      lead: 'How much control do you have over the conversation?',
      body: 'Sometimes the AI sends a bad reply, saves the wrong memory, or takes the conversation in a direction you do not like.',
      bodyExtra:
        'A good app should let you fix these problems without deleting everything and starting over. We test whether you can edit, delete, regenerate, reset, and export your conversations.',
      measures: [
        'Edit Messages',
        'Delete Messages',
        'Regenerate Replies',
        'Save Memories',
        'Edit Memories',
        'Reset Chat',
        'Export Chat',
      ],
      methodologyLinkLabel: 'View Controls methodology',
    },
    {
      slug: 'platform-extras',
      lead: 'What does the app offer beyond a normal AI chat?',
      body: 'Some platforms now include live AI cams, interactive videos, shorts, roulette, episodic stories, and other features that make the app feel more like a full entertainment platform.',
      bodyExtra:
        'We check whether a live AI cam is available and record any other extras that are worth knowing about. Only Live Cam affects this subscore. Other extras are included in the review but do not affect the score.',
      measures: ['Live Cam', 'Other Extras'],
      methodologyLinkLabel: 'View Platform Extras methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Chat Features',
    paragraphs: [
      'We use a paid account and test every available chat feature.',
      'For media, we try each feature three times in separate chats. We send and request images, voice messages, videos, GIFs, and reactions to see how consistently they work.',
      'For interaction features, we start three phone calls on different days, test the available chat modes, and create group chats with different numbers of characters. We also check whether the AI can send multiple messages and whether it ever messages us first.',
      'We leave three active chats alone for seven days to test proactive messages.',
      'For controls, we try each action three times. This includes editing and deleting messages, regenerating replies, saving and editing memories, resetting conversations, and exporting chats.',
      'Finally, we test any live AI cam experience and record other notable extras with proof.',
    ],
  },
  whyWeTest: {
    title: 'Why we test chat features',
    lead: 'Chat technology is moving insanely fast.',
    paragraphs: [
      'In 2024, voice messages were still uncommon on AI girlfriend apps. By 2025, some platforms had full phone calls. Now, in 2026, we are already seeing live AI video cam experiences.',
      'New features can make the whole experience much more immersive. Instead of only reading text, you can hear your AI girlfriend\u2019s voice, receive photos and videos, talk on the phone, or have her message you first.',
      'These features also make the experience feel more personal. You can save memories, change the way the conversation works, start group roleplays, and fix replies when the AI gets something wrong.',
      'When an app keeps adding useful features that actually work, it is usually a good sign that the platform is still investing in new technology instead of falling behind the market.',
      'That does not mean every new feature is automatically good. Some sound impressive on the pricing page but barely work once you try them. That is why we test the features instead of only checking whether the app claims to have them.',
    ],
  },
  goodLooksLike: {
    title: 'What good Chat Features looks like',
    intro:
      'Strong chat features make the experience more immersive and give you more control over the conversation.',
    rows: [
      {
        slug: 'media',
        name: 'Media',
        weight: 30,
        description:
          'Images, voice messages, videos, GIFs, and reactions work properly inside the chat.',
      },
      {
        slug: 'interaction',
        name: 'Interaction',
        weight: 30,
        description:
          'Features such as voice calls, chat modes, group chats, double texting, and proactive messages make the conversation feel more alive.',
      },
      {
        slug: 'controls',
        name: 'Controls',
        weight: 30,
        description:
          'You can edit, delete, regenerate, reset, and export conversations, while also managing saved memories.',
      },
      {
        slug: 'platform-extras',
        name: 'Platform Extras',
        weight: 10,
        description:
          'Useful experiences beyond normal chat, such as live AI cam or other interactive features.',
      },
    ],
    goodOverall:
      'The app offers modern chat features that work reliably and improve the experience.',
    weakOverall:
      'Features are missing, regularly fail, or sound more impressive in marketing than they are in practice.',
  },
  scoreCalculation: {
    title: 'How the Chat Features score is calculated',
    intro: 'The Chat Features score is made up of four subscores.',
    weights: [
      { name: 'Media', weight: 30 },
      { name: 'Interaction', weight: 30 },
      { name: 'Controls', weight: 30 },
      { name: 'Platform Extras', weight: 10 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Chat Features score makes up 10% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'Chat features can be different depending on the device you use. A feature may be available on the website but missing from the iPhone or Android app.',
      'Some features are also released slowly. One user may get access before another user, even when they are on the same subscription.',
      'Having a feature does not always mean it is free or unlimited. Voice messages, calls, images, and videos may use credits. We test those costs separately under Pricing.',
      'This rating mainly looks at whether the chat features are available and work. The actual quality of generated images and videos is tested separately under Images and Video.',
      'Proactive messages are tested over seven days. An app may send messages less often, so a platform could support the feature even if none arrive during our test period.',
      'Bonus features also change quickly. Platforms may add, remove, or replace them without warning. Our results show what was available on the date we tested the app.',
    ],
  },
  related: [
    { label: 'Media Testing Methodology', href: testSubscoreUrl('chat-features', 'Media') },
    { label: 'Interaction Testing Methodology', href: testSubscoreUrl('chat-features', 'Interaction') },
    { label: 'Controls Testing Methodology', href: testSubscoreUrl('chat-features', 'Controls') },
    { label: 'Platform Extras Testing Methodology', href: testSubscoreUrl('chat-features', 'Platform Extras') },
    { label: 'Chat Testing Methodology', href: testCategoryUrl('chat') },
  ],
};

const images: TestCategoryMethodologyContent = {
  intro: [
    'The Images rating looks at the quality of the images you can generate and what the full generation experience is actually like.',
    'We check whether the images look good, follow your prompt, keep the same character, generate quickly, and work without wasting your credits on broken results.',
  ],
  subscores: [
    {
      slug: 'quality',
      lead: 'How good do the generated images actually look?',
      body: 'Nowadays, almost every image generator can create at least one impressive image. The real question is whether it can do that consistently.',
      bodyExtra:
        'We generate a full batch of images and check how realistic they look, whether they have obvious visual problems, how well they are framed, and the maximum resolution you can download.',
      measures: ['Realism', 'Visual Errors', 'Composition', 'Resolution'],
      methodologyLinkLabel: 'View Quality methodology',
    },
    {
      slug: 'accuracy',
      lead: 'Does the generator actually create what you asked for?',
      body: 'A beautiful image is not very useful when it ignores half of your prompt or turns your AI girlfriend into a completely different person.',
      bodyExtra:
        'We check whether the image includes the details you asked for, whether the face and body stay consistent, and whether image edits only change the part you wanted to change.',
      measures: [
        'Prompt Accuracy',
        'Character Consistency',
        'Face Consistency',
        'Body Consistency',
        'Style Consistency',
        'Editing Accuracy',
      ],
      methodologyLinkLabel: 'View Accuracy methodology',
    },
    {
      slug: 'experience',
      lead: 'How easy, fast, and reliable is the image generator?',
      body: 'Image generation should not feel like pulling a slot machine and hoping for the best.',
      bodyExtra:
        'We check how long images take to generate, how often generations fail, whether you can generate inside the chat or through a separate tool, and how much control you get over prompts and editing.',
      measures: [
        'Speed',
        'Failures',
        'Chat Generation',
        'Separate Generator',
        'Custom Prompts',
        'Image Editing',
        'NSFW Support',
      ],
      methodologyLinkLabel: 'View Experience methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Images',
    paragraphs: [
      'We use a paid account and test every image-generation tool available on the platform.',
      'First, we generate a fixed batch of 10 images. We rate every image for visual quality, prompt accuracy, composition, and major defects such as broken hands, damaged faces, extra limbs, or distorted backgrounds.',
      'We then upload a reference image and create five variations of the same character. We compare the face, body, and visual style to see whether the character still looks like the same person.',
      'We also complete 10 image-editing tasks. For each edit, we check whether the requested change was made without unnecessarily changing the face, body, pose, or background.',
      'Finally, we time the generation attempts, count failures, download the highest-resolution image, and test whether the platform supports custom prompts, in-chat generation, a separate generator, basic image editing, and NSFW images.',
    ],
  },
  whyWeTest: {
    title: 'Why we test images',
    lead: 'Images are one of the biggest reasons people sign up for AI girlfriend apps.',
    paragraphs: [
      'Along with chat, they are usually one of the most-used features. People want to see their AI girlfriend in different outfits, locations, poses, and scenarios instead of only reading text messages.',
      'The problem is that one good-looking image does not prove much anymore. Most modern generators can create something impressive when everything goes right. What matters is how often it goes right.',
      'Some apps create beautiful images but ignore important parts of your prompt. You might ask for a red dress and receive a white dress, a black dress, and basically every color except red.',
      'This becomes a much bigger problem when every image costs tokens. Each failed attempt means you need to generate again, and those retries can burn through your credits quickly.',
      'Whether the app is doing this on purpose or the generator is simply bad, the result is the same: you spend more money trying to get the image you originally asked for.',
      'That is why we generate a full batch instead of judging the app from one lucky result. We check quality, prompt accuracy, consistency, speed, failures, editing, and how easy the generator is to use.',
      'A good AI girlfriend app should not only create pretty images. It should create the image you asked for without making you waste half your tokens getting there.',
    ],
  },
  goodLooksLike: {
    title: 'What good Images looks like',
    intro:
      'A strong image generator creates good-looking images, follows your instructions, and does not waste your credits on constant retries.',
    rows: [
      {
        slug: 'quality',
        name: 'Quality',
        weight: 34,
        description:
          'Images look polished, are framed properly, and avoid obvious problems such as broken faces, hands, or backgrounds.',
      },
      {
        slug: 'accuracy',
        name: 'Accuracy',
        weight: 33,
        description:
          'The generator follows your prompt and keeps the same face, body, and visual style across different images and edits.',
      },
      {
        slug: 'experience',
        name: 'Experience',
        weight: 33,
        description:
          'Images generate quickly, failures are rare, and the tools are easy to use without removing useful creative control.',
      },
    ],
    goodOverall: 'The generator creates strong, accurate images quickly and consistently.',
    weakOverall:
      'Images regularly ignore the prompt, change the character, look broken, or require too many paid retries.',
  },
  scoreCalculation: {
    title: 'How the Images score is calculated',
    intro: 'The Images score is made up of three subscores.',
    weights: [
      { name: 'Quality', weight: 34 },
      { name: 'Accuracy', weight: 33 },
      { name: 'Experience', weight: 33 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Images score makes up 15% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'Image generation always has some randomness. The exact same prompt can produce a great result once and a bad result the next time. Testing a full batch helps reduce luck, but it cannot remove randomness completely.',
      'Results can also change depending on the character, visual style, pose, and prompt. A platform might be great at close-up portraits but much worse at full-body images or complicated scenes.',
      'A high Images score also does not mean every generation will be perfect. It means the platform performed well across our full set of tests.',
      'Image models change quickly. Platforms regularly update their generators, add new styles, or switch to a different model. Our results show how the generator performed on the date we tested it.',
      'This rating does not include how much each image costs. Image costs, token packages, and estimated monthly spending are tested separately under Pricing.',
    ],
  },
  related: [
    { label: 'Quality Testing Methodology', href: testSubscoreUrl('images', 'Quality') },
    { label: 'Accuracy Testing Methodology', href: testSubscoreUrl('images', 'Accuracy') },
    { label: 'Experience Testing Methodology', href: testSubscoreUrl('images', 'Experience') },
    { label: 'Video Testing Methodology', href: testCategoryUrl('video') },
  ],
};

const video: TestCategoryMethodologyContent = {
  intro: [
    'The Video rating looks at what the platform\u2019s video generator can actually do, how good the videos look, and whether the whole thing is easy to use.',
    'We check what types of videos you can create, how long they can be, whether they follow your prompt, and how often the character starts warping or turning into someone else.',
  ],
  subscores: [
    {
      slug: 'capabilities',
      lead: 'What can the video generator actually do?',
      body: 'The difference between AI girlfriend apps can be massive.',
      bodyExtra:
        'Some apps let you write your own prompt, turn images into videos, generate directly inside the chat, add audio, and create videos up to 60 seconds long. Others only give you one button that turns an image into a basic five-second animation. You cannot choose what happens, and you just have to hope the result looks good. We check exactly what the generator lets you create instead of only checking whether the app claims to have video.',
      measures: [
        'Text-to-Video',
        'Image-to-Video',
        'Chat Video',
        'Audio',
        'Maximum Length',
        'Maximum Resolution',
      ],
      methodologyLinkLabel: 'View Capabilities methodology',
    },
    {
      slug: 'quality',
      lead: 'How good do the finished videos actually look?',
      body: 'Video generation can go wrong in a lot more ways than image generation.',
      bodyExtra:
        'The character\u2019s face can change halfway through, hands can melt, clothing can suddenly disappear, and the background can start flickering like the entire room is having a breakdown. We check the movement, prompt accuracy, character consistency, visual errors, and whether the video stays stable from beginning to end.',
      measures: [
        'Motion',
        'Prompt Accuracy',
        'Character Consistency',
        'Visual Errors',
        'Frame Consistency',
      ],
      methodologyLinkLabel: 'View Quality methodology',
    },
    {
      slug: 'experience',
      lead: 'How easy and reliable is the video generator?',
      body: 'A video generator might produce great results, but that does not help much when every video takes 20 minutes, half the attempts fail, or you need to click through ten different screens just to start.',
      bodyExtra:
        'We check how long videos take, how often they fail, how easy the generator is to use, and whether you can quickly retry a bad result.',
      measures: ['Speed', 'Failures', 'Ease of Use', 'Regeneration'],
      methodologyLinkLabel: 'View Experience methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Video',
    paragraphs: [
      'We use a paid account and test every video option available on the platform.',
      'First, we test the Capabilities. We try creating videos from text prompts, source images, and directly inside the chat. We also check whether the videos can include speech, sound effects, or music.',
      'We record the longest video length available and generate one video at that setting to make sure it actually works. We also download the highest-quality result and record the exact resolution.',
      'For the Quality test, we generate three videos using the same prompt. We rate every video for movement, prompt accuracy, character consistency, visual errors, and stability from the first frame to the last.',
      'Finally, we test the full generation experience. We time the videos, count failed attempts, count how many steps it takes to start a generation, and try regenerating three finished videos.',
    ],
  },
  whyWeTest: {
    title: 'Why we test video',
    lead: 'Video is still a fairly new feature in AI girlfriend apps, and the difference between platforms is huge.',
    paragraphs: [
      'One app might let you create a 60-second video with your own prompt, audio, and a proper storyline. Another might only let you turn a photo into a five-second clip where the character slowly moves her head.',
      'Both apps can advertise that they offer \u201cvideo generation,\u201d but those are clearly not the same thing.',
      'The technology behind these generators also varies a lot. Some videos have smooth movement and keep the character looking the same from beginning to end. Others start well and then completely fall apart after a few seconds.',
      'You might see the face change, the body warp, the clothing switch, or random objects appear in the background.',
      'That is why video is worth testing as its own category. We want to show whether the feature is actually useful or whether it is just another shiny button added to the app so it looks more advanced.',
      'A good AI girlfriend video generator should give you enough control, create a usable result, and not make you waste credits retrying the same basic idea over and over again.',
    ],
  },
  goodLooksLike: {
    title: 'What good Video looks like',
    intro:
      'A strong video generator gives you useful creative control and produces stable videos that keep the character looking consistent.',
    rows: [
      {
        slug: 'capabilities',
        name: 'Capabilities',
        weight: 34,
        description:
          'The app supports useful options such as text-to-video, image-to-video, chat video, audio, longer clips, and good output resolution.',
      },
      {
        slug: 'quality',
        name: 'Quality',
        weight: 33,
        description:
          'Movement looks natural, the prompt is followed, and the character stays recognizable from the first frame to the last.',
      },
      {
        slug: 'experience',
        name: 'Experience',
        weight: 33,
        description:
          'Videos are easy to create, generation does not take forever, failures are limited, and bad results can be regenerated.',
      },
    ],
    goodOverall: 'The generator offers real control and creates stable, usable videos.',
    weakOverall:
      'It only animates an image with one button, produces very short clips, or regularly creates warped and broken results.',
  },
  scoreCalculation: {
    title: 'How the Video score is calculated',
    intro: 'The Video score is made up of three subscores.',
    weights: [
      { name: 'Capabilities', weight: 34 },
      { name: 'Quality', weight: 33 },
      { name: 'Experience', weight: 33 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Video score makes up 10% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'Video generation has a lot of randomness. The same prompt can produce a great video once and a completely broken one the next time.',
      'The result can also depend heavily on the source image. A clear portrait with a simple background may work much better than a full-body image with several people and lots of objects.',
      'Longer videos are not automatically better. The longer a video runs, the more time the generator has to change the face, warp the body, or break the background.',
      'Some features may also only be available on certain devices, browsers, or paid plans.',
      'Video models change quickly. Platforms regularly update their generators or switch to a different model. Our results show how the video generator performed on the date we tested the platform.',
      'This rating does not include how much each video costs. Video costs, token packages, and estimated monthly spending are tested separately under Pricing.',
    ],
  },
  related: [
    { label: 'Capabilities Testing Methodology', href: testSubscoreUrl('video', 'Capabilities') },
    { label: 'Quality Testing Methodology', href: testSubscoreUrl('video', 'Quality') },
    { label: 'Experience Testing Methodology', href: testSubscoreUrl('video', 'Experience') },
    { label: 'Images Testing Methodology', href: testCategoryUrl('images') },
  ],
};

const privacy: TestCategoryMethodologyContent = {
  intro: [
    'The Privacy rating looks at what happens to your chats, photos, personal data, and payment information after you sign up.',
    'We check how the app uses your data, how much control you have over it, whether your account is properly protected, and whether you can actually reach support when something goes wrong.',
  ],
  subscores: [
    {
      slug: 'data-use',
      lead: 'What happens to your chats, photos, and personal information?',
      body: 'Depending on the app, your conversations and images may be used to train its AI, reviewed by real people, or shared with other companies.',
      bodyExtra:
        'We read the privacy policy, terms, and help pages to find out exactly what the platform says it does with your data.',
      measures: ['Training', 'Human Review', 'Data Sharing', 'Advertising', 'Retention', 'Policy Clarity'],
      methodologyLinkLabel: 'View Data Use methodology',
    },
    {
      slug: 'user-control',
      lead: 'Can you delete or take back your data?',
      body: 'It is your information, so you should have some control over it.',
      bodyExtra:
        'We check whether you can delete chats, delete your account, request the removal of personal data, opt out of AI training, and download a copy of your information.',
      measures: [
        'Delete Chats',
        'Delete Account',
        'Delete Personal Data',
        'Training Opt-Out',
        'Export Data',
      ],
      methodologyLinkLabel: 'View User Control methodology',
    },
    {
      slug: 'security',
      lead: 'How well does the app protect your account and payment privacy?',
      body: 'AI girlfriend apps can hold extremely private chats, photos, and account information. A security problem could expose things you would never want made public.',
      bodyExtra:
        'We check what type of encryption the company confirms, whether two-factor authentication is available, what appears on your bank statement, and whether the platform has had any confirmed security incidents during the past five years.',
      measures: ['Encryption', 'Two-Factor Authentication', 'Billing Descriptor', 'Security Incidents'],
      methodologyLinkLabel: 'View Security methodology',
    },
    {
      slug: 'support',
      lead: 'Can you actually get help when something goes wrong?',
      body: 'Support becomes very important when you cannot delete your account, need help removing personal data, notice a strange payment, or think someone has accessed your account.',
      bodyExtra:
        'We contact support with a real question and check how easy they are to reach, how quickly they reply, and whether their answer is actually useful.',
      measures: [
        'Support Available',
        'Support Channels',
        'Ease of Contact',
        'Response Speed',
        'Helpfulness',
      ],
      methodologyLinkLabel: 'View Support methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Privacy',
    paragraphs: [
      'We use a paid test account and review the platform\u2019s privacy policy, terms, help pages, and account settings.',
      'First, we look for clear answers about AI training, human review, third-party sharing, advertising, and how long different types of data are stored.',
      'We then use the test account to try deleting chats, deleting the account, removing personal data, opting out of training, and exporting our information.',
      'For security, we check which types of encryption the company clearly confirms, try to enable two-factor authentication, and check whether the billing name is shown before payment.',
      'We also search for confirmed security incidents from the previous five years. We only count incidents supported by the company, a regulator, a court filing, or a reliable security report.',
      'Finally, we contact support with a real question and rate how easy it is to reach them, how quickly they reply, and whether the answer actually helps.',
    ],
  },
  whyWeTest: {
    title: 'Why we test privacy',
    lead: 'AI girlfriend apps are adult platforms, and people often share very private things with them.',
    paragraphs: [
      'This can include intimate conversations, personal photos, relationship details, and payment information. You probably would not want any of that read by strangers or leaked online.',
      'AI is also still a relatively unregulated industry. Privacy policies can be vague, and it is not always obvious what happens to your information after you press send.',
      'Depending on the platform, your chats or photos may be used to improve its AI, reviewed by employees or contractors, or shared with other companies. That does not always mean the app is doing something wrong, but you should know about it before signing up.',
      'Security matters just as much. We do not simply trust a sentence saying that an app is \u201csafe and secure.\u201d We check what protection the company actually confirms, whether you can protect your account with two-factor authentication, and whether there are any confirmed security incidents worth knowing about.',
      'A good AI girlfriend app should clearly explain what it does with your data, give you control over it, and protect the private information you share.',
    ],
  },
  goodLooksLike: {
    title: 'What good Privacy looks like',
    intro:
      'A strong privacy result means the app clearly explains what happens to your data and gives you useful ways to protect or remove it.',
    rows: [
      {
        slug: 'data-use',
        name: 'Data Use',
        weight: 31,
        description:
          'The company clearly explains whether chats and photos are used for AI training, reviewed by people, shared with other companies, or used for advertising.',
      },
      {
        slug: 'user-control',
        name: 'User Control',
        weight: 28,
        description:
          'You can delete chats and your account, request the removal of personal data, opt out of training, and export your information.',
      },
      {
        slug: 'security',
        name: 'Security',
        weight: 28,
        description:
          'The app protects accounts and payments, offers useful security controls, and has no serious recent security warning signs.',
      },
      {
        slug: 'support',
        name: 'Support',
        weight: 13,
        description:
          'Customer support is easy to reach, replies within a reasonable time, and actually helps with the problem.',
      },
    ],
    goodOverall:
      'The app is clear about its data practices, protects your account, and gives you control over your information.',
    weakOverall:
      'Policies are vague, important data controls are missing, or the platform has serious security concerns.',
  },
  scoreCalculation: {
    title: 'How the Privacy score is calculated',
    intro: 'The Privacy score is made up of four subscores.',
    weights: [
      { name: 'Data Use', weight: 31 },
      { name: 'User Control', weight: 28 },
      { name: 'Security', weight: 28 },
      { name: 'Support', weight: 13 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Privacy score makes up 10% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'We cannot look inside a company\u2019s private systems. We can only test the controls available to users and check what the company clearly says in its policies and help pages.',
      'When a company does not explain something, we record it as Unknown. Unknown does not automatically mean the app is unsafe, but it also does not give us proof that your data is protected.',
      'Privacy policies can change at any time. Our results show what the platform said and offered on the date we tested it.',
      'Not finding a past security incident does not guarantee that a platform will never have one. It only means we did not find a confirmed incident within the period we checked.',
      'Support is tested using one real request. Your experience may be different depending on the question, time of day, or support agent.',
    ],
  },
  related: [
    { label: 'Data Use Testing Methodology', href: testSubscoreUrl('privacy', 'Data Use') },
    { label: 'User Control Testing Methodology', href: testSubscoreUrl('privacy', 'User Control') },
    { label: 'Security Testing Methodology', href: testSubscoreUrl('privacy', 'Security') },
    { label: 'Support Testing Methodology', href: testSubscoreUrl('privacy', 'Support') },
    { label: 'Pricing Testing Methodology', href: testCategoryUrl('pricing') },
  ],
};

const pricing: TestCategoryMethodologyContent = {
  intro: [
    'The Pricing rating looks at what you pay, what you get, and what the app really costs after regular use.',
    'We check the subscription price, what is included, how much extra features cost, what you can try for free, and whether the billing rules are clear and fair.',
  ],
  subscores: [
    {
      slug: 'plan-value',
      lead: 'What do you actually get with the subscription?',
      body: 'A cheap monthly price does not always mean good value.',
      bodyExtra:
        'Some subscriptions include unlimited chat, images, voice messages, and plenty of credits. Others give you access to the app but still charge extra for nearly everything you actually want to use. We check the price, included credits, included features, usage limits, and how much you save by paying annually.',
      measures: [
        'Monthly Price',
        'Annual Price',
        'Included Features',
        'Included Credits',
        'Plan Limits',
        'Annual Discount',
      ],
      methodologyLinkLabel: 'View Plan Value methodology',
    },
    {
      slug: 'usage-costs',
      lead: 'How much does the app cost when you actually use it?',
      body: 'This is where many AI girlfriend apps become much more expensive than they first appear.',
      bodyExtra:
        'An app might advertise a cheap monthly subscription, but then charge extra tokens for images, videos, voice messages, and phone calls. You may only get one video before being asked to buy another token package. We calculate the cost of the main features and estimate what a regular user is likely to spend each month.',
      measures: [
        'Image Cost',
        'Video Cost',
        'Voice Cost',
        'Call Cost',
        'Top-Up Value',
        'Monthly Spend',
      ],
      methodologyLinkLabel: 'View Usage Costs methodology',
    },
    {
      slug: 'free-access',
      lead: 'Can you properly test the app before paying?',
      body: 'A free trial is not very useful when it only gives you three messages and blocks every important feature.',
      bodyExtra:
        'We check how much chat, image, video, voice, and character access you get for free. We also look at whether you need a credit card and how quickly the free access expires or resets.',
      measures: [
        'Free Chat',
        'Free Images',
        'Free Video',
        'Free Voice',
        'Free Characters',
        'Free Value',
        'Restrictions',
      ],
      methodologyLinkLabel: 'View Free Access methodology',
    },
    {
      slug: 'billing',
      lead: 'Are the prices and billing rules clear and fair?',
      body: 'You should know what you are paying for before entering your card details.',
      bodyExtra:
        'We check whether the app clearly explains its prices, extra paywalls, credit expiry, refund rules, cancellation process, and what appears on your bank statement.',
      measures: [
        'Pricing Clarity',
        'Paywalls',
        'Credit Expiry',
        'Refunds',
        'Cancellation',
        'Payment Privacy',
      ],
      methodologyLinkLabel: 'View Billing methodology',
    },
  ],
  howWeTest: {
    title: 'How we test Pricing',
    paragraphs: [
      'We record the full monthly and annual prices, included credits, plan limits, and every important feature included with the subscription.',
      'We then calculate the real cost of images, videos, voice messages, phone calls, and token top-ups.',
      'To keep comparisons fair, we use the same public units across every review: images are shown as cost per generation, videos as cost per 10 seconds, voice messages as cost per 10 seconds, and phone calls as cost per minute.',
      'We also use data from our hands-on reviews and at least 30 days of usage to see what the app actually costs over time. This helps us catch the upsells that are easy to miss when you first subscribe.',
      'We compare these costs across our other reviews and against the wider market, so you can see whether an app offers good value or is simply good at making itself look cheap.',
      'Finally, we test the free version, read the refund and credit-expiry policies, check how easy it is to cancel, and confirm whether the billing name is shown before payment.',
    ],
  },
  whyWeTest: {
    title: 'Why we test pricing',
    lead: 'Everyone wants to get good value for their money.',
    paragraphs: [
      'The problem is that AI girlfriend apps often look much cheaper than they really are. You might see a $12.99 monthly subscription and think that is the full cost, but the subscription may only unlock the app.',
      'Images cost tokens. Videos cost tokens. Voice messages cost tokens. Phone calls cost tokens. Once your included credits are gone, you need to buy another package.',
      'This means two apps with the same monthly price can have completely different real costs. One app might include enough credits for regular use. Another might only let you generate one video before asking you to pay again.',
      'Refunds are another big risk. Many AI girlfriend apps offer no refunds at all, even when you accidentally purchase an annual plan or realize the app is not what you expected.',
      'Free trials often do not help much either. Some are so limited that you cannot properly test the chat, images, or other important features before paying.',
      'That is why we look beyond the price shown on the homepage. We track what is included, what costs extra, and what you are likely to spend after using the app normally.',
    ],
  },
  goodLooksLike: {
    title: 'What good Pricing looks like',
    intro:
      'Good pricing means the app gives you real value after normal use, not only a cheap-looking subscription on the homepage.',
    rows: [
      {
        slug: 'plan-value',
        name: 'Plan Value',
        weight: 30,
        description:
          'The subscription price is reasonable and includes enough useful features, credits, and usage without constant extra payments.',
      },
      {
        slug: 'usage-costs',
        name: 'Usage Costs',
        weight: 35,
        description:
          'Images, videos, voice, calls, and token top-ups remain affordable when you use the app regularly.',
      },
      {
        slug: 'free-access',
        name: 'Free Access',
        weight: 20,
        description:
          'The free version gives you enough access to properly test the chat and important features before paying.',
      },
      {
        slug: 'billing',
        name: 'Billing',
        weight: 15,
        description:
          'Prices, credit expiry, refunds, cancellation, and payment privacy are explained clearly before checkout.',
      },
    ],
    goodOverall:
      'The app is fairly priced, clearly explains its costs, and remains affordable during normal use.',
    weakOverall:
      'The subscription only unlocks the app, most features cost extra, and the real monthly spend is much higher than advertised.',
  },
  scoreCalculation: {
    title: 'How the Pricing score is calculated',
    intro: 'The Pricing score is made up of four subscores.',
    weights: [
      { name: 'Plan Value', weight: 30 },
      { name: 'Usage Costs', weight: 35 },
      { name: 'Free Access', weight: 20 },
      { name: 'Billing', weight: 15 },
    ],
    footer:
      'Each subscore is calculated from the individual test results listed on its methodology page. The final Pricing score makes up 10% of the product\u2019s overall performance score.',
  },
  limitations: {
    title: 'Important limitations',
    paragraphs: [
      'Pricing can change quickly. Apps regularly change their subscription prices, token packages, included credits, and discounts. Our results show what was available on the date we tested the app.',
      'Your real monthly spending will depend on how you use the platform. Someone who mainly chats may spend much less than someone who generates images and videos every day.',
      'Our monthly-spend estimate uses the same regular-use example across every app. It is designed for comparison and may not match your exact usage.',
      'Annual plans can make the monthly price look cheaper, but they also lock you in for longer. We show the annual discount, but we do not assume that paying for a full year is always the better choice.',
      'Some prices and policies may only appear during checkout or after signing in. We use a paid account where needed, but regional prices, taxes, and app-store fees may still differ.',
    ],
  },
  related: [
    { label: 'Plan Value Testing Methodology', href: testSubscoreUrl('pricing', 'Plan Value') },
    { label: 'Usage Costs Testing Methodology', href: testSubscoreUrl('pricing', 'Usage Costs') },
    { label: 'Free Access Testing Methodology', href: testSubscoreUrl('pricing', 'Free Access') },
    { label: 'Billing Testing Methodology', href: testSubscoreUrl('pricing', 'Billing') },
    { label: 'Privacy Testing Methodology', href: testCategoryUrl('privacy') },
  ],
};

const byCategory: Partial<Record<string, TestCategoryMethodologyContent>> = {
  characters,
  customization,
  chat,
  'chat-features': chatFeatures,
  images,
  video,
  privacy,
  pricing,
};

export function getTestCategoryMethodology(
  categoryKey: string,
): TestCategoryMethodologyContent | undefined {
  return byCategory[categoryKey];
}

export function getTestCategorySubscoreContent(
  categoryKey: string,
  subscoreSlug: string,
): TestCategorySubscoreContent | undefined {
  return byCategory[categoryKey]?.subscores.find((s) => s.slug === subscoreSlug);
}
