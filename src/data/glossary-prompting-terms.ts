export type GlossarySeedTerm = {
  term: string;
  category: string;
  aliases?: string[];
  displayAliases?: string[];
  ctaLabel: string;
  tooltipDefinition: string;
  fullExplanation: string;
};

/** Prompting glossary terms (also overlay InstantDB at build so they ship with the site). */
export const PROMPTING_GLOSSARY_TERMS: GlossarySeedTerm[] = [
  {
    term: 'Text-to-Video',
    category: 'Video',
    aliases: ['text to video', 'text2video', 'T2V'],
    displayAliases: ['text2video', 'T2V'],
    ctaLabel: 'How text-to-video works →',
    tooltipDefinition:
      'A video generation method where the AI creates the entire video from your written prompt.',
    fullExplanation: `Text-to-video creates a video without using a starting image.

You describe what you want to happen, and the AI creates both the scene and the movement.

Your prompt can include things like:

- who is in the video
- what they are doing
- where they are
- how they move
- how the camera moves
- how the scene ends

Because the AI has to create everything from scratch, it can be harder to get a very specific result compared with image-to-video.

Example: A woman walks along a tropical beach at sunset. Her dress moves in the wind while the camera slowly follows her from behind.`,
  },
  {
    term: 'Image-to-Video',
    category: 'Video',
    aliases: ['image to video', 'img2video', 'I2V'],
    displayAliases: ['img2video', 'I2V'],
    ctaLabel: 'How image-to-video works →',
    tooltipDefinition:
      'A video generation method where you start with an image and use a prompt to tell the AI how it should move.',
    fullExplanation: `Image-to-video turns an existing image into a video.

You first give the AI the starting image. Then you describe what should happen in the video.

For example, you can tell the character to smile, turn around, walk forward, move their hair, or look toward the camera.

Because the starting image already shows the character, clothing, pose, and location, the AI has fewer things to create from scratch.

This usually gives you more control than text-to-video.

Example: She slowly turns toward the camera, smiles and brushes her hair behind her ear. The camera slowly moves closer.`,
  },
  {
    term: 'Character Prompts',
    category: 'Characters',
    aliases: ['character prompt', 'character prompting'],
    displayAliases: [],
    ctaLabel: 'What character prompts are →',
    tooltipDefinition:
      'Instructions used to build an AI character, including things like appearance, personality, background, and behavior.',
    fullExplanation: `Character prompts are the instructions that tell the AI who your character is.

They can describe things like:

- physical appearance
- personality
- background
- behavior
- relationship with the user
- how the character should talk

Character prompts are usually more detailed than normal image prompts because you are building the character itself, not just one image.

It is also important to separate **permanent details** from temporary ones. For example, “has blue eyes” makes sense as part of the character. “Wearing a nurse uniform” normally does not, because you may want the character to wear something different later.

Example: Confident, playful and slightly sarcastic. She loves traveling, going to restaurants and teasing the user. She has long blonde hair and blue eyes.`,
  },
  {
    term: 'Character Reference Sheet',
    category: 'Characters',
    aliases: ['character sheet', 'reference sheet', 'character reference'],
    displayAliases: ['character sheet', 'reference sheet'],
    ctaLabel: 'What a character reference sheet is →',
    tooltipDefinition:
      'An image that shows what your AI character looks like so the AI can keep the same identity in future generations.',
    fullExplanation: `A character reference sheet is a visual guide for your AI character.

Instead of explaining the character's appearance every time, you give the AI an image that shows what the character should look like.

This can help keep things like the face, hair, and other important features more consistent between generations.

A reference sheet is mainly about **identity**. It does not mean you want to copy the same pose, clothing, or background every time.

Example: You could use a clear reference image of your character, then generate a completely new image of that same character sitting at a beach club.`,
  },
  {
    term: 'OOC (Out of Character)',
    category: 'Chat',
    aliases: ['OOC', 'Out of Character', 'out of character', 'OOC command', 'OOC commands'],
    displayAliases: ['OOC', 'Out of Character'],
    ctaLabel: 'What OOC commands do →',
    tooltipDefinition:
      'An OOC command lets you give the AI instructions without making them part of the roleplay. Example: (OOC: Keep your replies short and playful.)',
    fullExplanation: `OOC stands for **Out of Character**.

It lets you speak directly to the AI instead of speaking to the character inside the roleplay.

You can use OOC commands when you want to change how the AI responds without making that instruction part of the story.

For example, you can use it to:

- make replies shorter
- change the writing style
- make the character more playful
- move the story forward
- correct something the AI misunderstood

Example command: (OOC: Keep your replies short and playful.)

The AI should understand this as an instruction about how to respond, instead of treating it as something you actually said to the character.`,
  },
  {
    term: 'JSON Prompts',
    category: 'Images',
    aliases: ['JSON prompt', 'JSON prompting', 'structured prompt', 'structured prompts'],
    displayAliases: ['structured prompts'],
    ctaLabel: 'What JSON prompts are →',
    tooltipDefinition:
      'A structured way to organize an AI prompt into separate sections like subject, pose, clothing, lighting, and camera.',
    fullExplanation: `JSON prompts are structured prompts that break your instructions into separate parts.

Instead of writing everything in one long paragraph, you can organize details like:

- subject
- pose
- expression
- clothing
- location
- lighting
- camera angle
- composition
- visual style

For example, instead of writing:

A blonde woman sitting at a cafe in Paris holding coffee in her left hand during golden hour.

You could write:

\`\`\`json
{
  "subject": "blonde woman",
  "location": "outdoor cafe in Paris",
  "pose": "sitting at a table",
  "action": "holding coffee in her left hand",
  "lighting": "golden hour"
}
\`\`\`

The idea is simple: **each detail gets its own place.**

This can be useful when you want more control over small details, especially when trying to recreate a specific pose, image, camera angle, or style.

JSON prompts are not automatically better, though. Some AI generators respond better to normal paragraph prompts, so it is worth testing both.`,
  },
];
