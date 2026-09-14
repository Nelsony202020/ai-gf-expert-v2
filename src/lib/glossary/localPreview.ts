import { slugifyGlossaryAnchor, type GlossaryEntryRecord, type GlossaryTipTapDoc } from './types';

function doc(...paragraphs: string[]): GlossaryTipTapDoc {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  };
}

/** Local-only stand-in when InstantDB credentials are missing. Not used in production. */
export function localPreviewEntries(): GlossaryEntryRecord[] {
  const now = Date.now();
  const rows: Array<
    Pick<
      GlossaryEntryRecord,
      'term' | 'tooltipDefinition' | 'aliases' | 'displayAliases' | 'category' | 'fullDefinition'
    >
  > = [
    {
      term: 'Character Prompts',
      category: 'Characters',
      aliases: ['character prompt', 'character prompting'],
      displayAliases: [],
      tooltipDefinition:
        'Character prompts are the instructions that tell the AI who your character is.',
      fullDefinition: doc(
        'Character prompts are the instructions that tell the AI who your character is.',
        'They can describe physical appearance, personality, background, behavior, relationship with the user, and how the character should talk.',
        'Example: Confident, playful and slightly sarcastic. She loves traveling, going to restaurants and teasing the user. She has long blonde hair and blue eyes.',
      ),
    },
    {
      term: 'Character Reference Sheet',
      category: 'Images',
      aliases: ['character ref sheet', 'character reference image'],
      displayAliases: ['character sheet', 'reference sheet'],
      tooltipDefinition: 'A character reference sheet is a visual guide for your AI character.',
      fullDefinition: doc(
        'A character reference sheet is a visual guide for your AI character.',
        'A reference sheet is mainly about identity. It does not mean you want to copy the same pose, clothing, or background every time.',
      ),
    },
    {
      term: 'Image-to-Video',
      category: 'Video',
      aliases: ['img2video', 'I2V', 'image to video'],
      displayAliases: ['img2video', 'I2V'],
      tooltipDefinition: 'Image-to-video turns an existing image into a video.',
      fullDefinition: doc(
        'Image-to-video turns an existing image into a video.',
        'You start from a still image, then describe the motion you want.',
      ),
    },
    {
      term: 'JSON Prompts',
      category: 'Images',
      aliases: ['JSON prompt', 'json prompt', 'json prompts'],
      displayAliases: ['structured prompts'],
      tooltipDefinition:
        'JSON prompts are structured prompts that break your instructions into separate parts.',
      fullDefinition: doc(
        'JSON prompts are structured prompts that break your instructions into separate parts.',
        'Instead of writing everything in one long paragraph, you can organize details like subject, pose, lighting, and camera.',
      ),
    },
    {
      term: 'OOC (Out of Character)',
      category: 'Chat',
      aliases: ['OOC', 'Out of Character', 'out of character'],
      displayAliases: ['OOC', 'Out of Character'],
      tooltipDefinition: 'OOC stands for Out of Character.',
      fullDefinition: doc(
        'OOC stands for Out of Character.',
        'Example command: (OOC: Keep your replies short and playful.)',
      ),
    },
    {
      term: 'Text-to-Video',
      category: 'Video',
      aliases: ['text2video', 'T2V', 'text to video'],
      displayAliases: ['text2video', 'T2V'],
      tooltipDefinition: 'Text-to-video creates a video without using a starting image.',
      fullDefinition: doc(
        'Text-to-video creates a video without using a starting image.',
        'Example: A woman walks along a tropical beach at sunset. Her dress moves in the wind while the camera slowly follows her from behind.',
      ),
    },
  ];

  return rows.map((row, i) => ({
    id: `local-preview-${i}`,
    term: row.term,
    anchor: slugifyGlossaryAnchor(row.term),
    tooltipDefinition: row.tooltipDefinition,
    ctaLabel: '',
    fullDefinition: row.fullDefinition,
    aliases: row.aliases,
    displayAliases: row.displayAliases,
    category: row.category,
    status: 'published',
    autoTooltip: true,
    scope: 'site',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  }));
}
