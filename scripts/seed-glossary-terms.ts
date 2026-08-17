/**
 * Seed the first batch of public glossary terms.
 * Run: npx tsx scripts/seed-glossary-terms.ts
 *
 * Upserts by `anchor` — safe to re-run.
 */
import { getDb, id, isDbConfigured, tx } from '../src/lib/db/server';
import { slugifyGlossaryAnchor, type GlossaryTipTapDoc } from '../src/lib/glossary/types';

type SeedTerm = {
  term: string;
  category: string;
  aliases?: string[];
  /** Public “Other names” line; defaults to aliases when omitted. */
  displayAliases?: string[];
  ctaLabel: string;
  tooltipDefinition: string;
  fullExplanation: string;
};

function textNode(text: string) {
  return { type: 'text' as const, text };
}

function paragraph(...lines: string[]) {
  const content: Array<{ type: string; text?: string }> = [];
  lines.forEach((line, i) => {
    if (i > 0) content.push({ type: 'hardBreak' });
    if (line) content.push(textNode(line));
  });
  return { type: 'paragraph' as const, content: content.length ? content : [textNode('')] };
}

function bulletList(items: string[]) {
  return {
    type: 'bulletList' as const,
    content: items.map((item) => ({
      type: 'listItem' as const,
      content: [paragraph(item)],
    })),
  };
}

/** Convert markdown-ish explanation text into a TipTap doc. */
function explanationToDoc(raw: string): GlossaryTipTapDoc {
  const blocks = raw
    .trim()
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const content: unknown[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const bulletLines = lines.filter((l) => l.startsWith('- '));
    if (bulletLines.length > 0 && bulletLines.length === lines.length) {
      content.push(bulletList(bulletLines.map((l) => l.replace(/^- /, '').trim())));
      continue;
    }
    if (bulletLines.length > 0 && lines.length > bulletLines.length) {
      const intro = lines.filter((l) => !l.startsWith('- '));
      if (intro.length) content.push(paragraph(...intro));
      content.push(bulletList(bulletLines.map((l) => l.replace(/^- /, '').trim())));
      continue;
    }
    content.push(paragraph(...lines));
  }

  return { type: 'doc', content: content as GlossaryTipTapDoc['content'] };
}

const TERMS: SeedTerm[] = [
  {
    term: 'Unfiltered Roleplay',
    category: 'Chat',
    aliases: ['NSFW Roleplay', 'Adult Roleplay'],
    ctaLabel: 'How unfiltered roleplay works →',
    tooltipDefinition:
      'Roleplay that allows sexual and other adult topics with fewer restrictions. You may also see it called NSFW roleplay or adult roleplay.',
    fullExplanation: `Unfiltered roleplay basically means you can have adult or sexual chats without the AI constantly blocking the conversation.

You may also see apps call this NSFW roleplay or adult roleplay. They usually mean the same thing, although every app has its own rules.

The quality can be very different between apps. Some simply allow sexting and NSFW images. Better ones can actually follow a scenario, remember what is going on, stay in character, and react naturally to what you do.

Some apps, like Nectar AI, have ready-made NSFW roleplays. One is “Late Rent Payment”: you play the landlord, the AI plays a tenant who can’t pay the rent, and the roleplay goes from there.

Keep in mind that “unfiltered” does not mean absolutely anything is allowed. Most platforms still have rules around certain content.`,
  },
  {
    term: 'Femboy',
    category: 'Characters',
    ctaLabel: 'What femboy means →',
    tooltipDefinition:
      'A male character with a feminine look or style. This can include feminine clothes, hairstyles, voices, or personality traits.',
    fullExplanation: `A femboy is a male character who looks or acts more feminine.

This can mean feminine clothing, makeup, hairstyles, body language, voice, or personality.

On AI girlfriend apps, femboy is usually just a character category or tag that helps you find this type of character.

Some apps have large dedicated femboy sections, while others mix them in with the rest of their male characters.`,
  },
  {
    term: 'Futanari',
    category: 'Characters',
    aliases: ['Futa'],
    ctaLabel: 'What futanari means →',
    tooltipDefinition:
      'An adult anime term for feminine fictional characters with both male and female sexual anatomy. It is often shortened to “futa.”',
    fullExplanation: `Futanari, often shortened to futa, is mainly used in adult anime, manga, games, and similar fictional content.

It normally refers to a feminine character who has both male and female sexual anatomy.

On AI girlfriend apps, you will usually find it as a character tag or category. Anime-focused platforms can sometimes have hundreds or even thousands of these characters.

It is mainly a fictional adult-content term and should not be confused with transgender or intersex people.`,
  },
  {
    term: 'Cuckold',
    category: 'Chat',
    ctaLabel: 'What cuckold roleplay means →',
    tooltipDefinition:
      'An adult fantasy where someone’s partner is sexually involved with another person. It can also include jealousy, sharing, or humiliation.',
    fullExplanation: `Cuckold is an adult fantasy where your partner is sexually involved with someone else.

Depending on the scenario, you might watch, know about it, encourage it, or be part of the situation.

Some cuckold roleplays are mainly about sharing a partner. Others focus more on jealousy, humiliation, dominance, or submission.

On AI girlfriend apps, you will normally see cuckold used as a character tag or ready-made roleplay scenario.`,
  },
  {
    term: 'Kinks',
    category: 'Chat',
    ctaLabel: 'What kinks mean →',
    tooltipDefinition:
      'Sexual interests or fantasies outside normal romantic or sexual activity, such as domination, submission, fetishes, or specific roleplay scenarios.',
    fullExplanation: `A kink is basically a specific sexual interest or fantasy.

This can include things like domination, submission, fetishes, unusual scenarios, or very specific character types.

AI girlfriend apps often use kinks as tags so you can quickly find characters that match what you are into.

Some apps only have a few broad categories. Others have hundreds of very specific ones.

More kink options do not automatically mean better roleplay, though. The AI still needs to understand the scenario and stay in character.`,
  },
  {
    term: 'In-chat Video Generator',
    category: 'Video',
    ctaLabel: 'How in-chat video works →',
    tooltipDefinition:
      'A video generator built into the chat, so you can create or receive AI videos without leaving the conversation.',
    fullExplanation: `An in-chat video generator lets you generate videos without leaving your chat.

For example, you might be roleplaying with a character and ask her to send you a video. The video then appears directly inside the conversation.

This feels much more natural than leaving the chat, opening a separate video generator, and starting again there.

Some apps use an image of your character and animate it. Others use information from the conversation to decide what the video should show.

These videos usually cost tokens, so it is worth checking how much each generation costs.`,
  },
  {
    term: 'In-chat Image Generator',
    category: 'Images',
    ctaLabel: 'How in-chat images work →',
    tooltipDefinition:
      'An image generator built into the chat, so you can create or receive images of your AI character without leaving the conversation.',
    fullExplanation: `An in-chat image generator lets you generate images directly inside your conversation.

For example, if your AI girlfriend says she is at the beach, you might ask her to send you a picture from the beach.

Some apps can even send images automatically based on what is happening in the roleplay.

This makes image generation feel much more connected to the chat instead of being a completely separate feature.

The image quality, speed, accuracy, and token cost can vary a lot between apps.`,
  },
  {
    term: 'Image Generator',
    category: 'Images',
    ctaLabel: 'How AI image generators work →',
    tooltipDefinition:
      'A tool that creates AI images from your instructions. You can normally change things like the outfit, pose, location, and style.',
    fullExplanation: `An image generator lets you create new pictures of your AI character.

You normally select a character and then tell the AI what you want to see.

For example:

- Different clothes
- A different pose
- A beach or bedroom
- A certain facial expression
- A different camera angle

Some apps give you a simple text box where you type what you want. Others use buttons and dropdowns.

A good image generator should not only make attractive images. It should also actually follow what you asked for.

That is why we test things like image quality, speed, ease of use, and prompt adherence.

Image generation also commonly uses tokens.`,
  },
  {
    term: 'Video Generator',
    category: 'Video',
    ctaLabel: 'How AI video generators work →',
    tooltipDefinition:
      'A tool that creates short AI videos. Most AI girlfriend apps do this by taking an existing image and turning it into a moving clip.',
    fullExplanation: `A video generator creates short AI videos of your character.

On most AI girlfriend apps, this works through image-to-video.

You choose an existing image, and the AI turns it into a short moving video.

Some apps also let you write what you want the character to do. Others simply animate the image automatically and give you almost no control.

Video quality can vary massively between apps. We look at things like:

- Movement
- Visual glitches
- Character consistency
- Generation speed
- Video length
- How much control you get

Videos are also usually one of the most expensive features on token-based apps.`,
  },
  {
    term: 'Basic Plan',
    category: 'Pricing',
    ctaLabel: 'How basic plans work →',
    tooltipDefinition:
      'The cheapest paid subscription an app offers. It normally gives you fewer tokens or features than the more expensive plans.',
    fullExplanation: `A basic plan is normally the cheapest paid subscription an AI girlfriend app offers.

It gives you more than the free version, but usually less than the more expensive plans.

A basic plan might give you:

- Fewer monthly tokens
- Fewer image generations
- Fewer videos
- Limited voice features
- Fewer AI models
- Lower usage limits

The important thing is not to look at the monthly price alone.

A $10 subscription might sound cheap, but if you burn through your included tokens in a few days and need to buy more, the real monthly cost can be much higher.

That is why our pricing sections look at both the subscription price and how much regular use actually costs.`,
  },
  {
    term: 'Crunchyroll',
    category: 'General',
    ctaLabel: 'What Crunchyroll is →',
    tooltipDefinition:
      'A popular anime streaming service. When I compare an AI girlfriend app to Crunchyroll, I usually mean it has a huge anime-style character library.',
    fullExplanation: `Crunchyroll is one of the biggest streaming services for anime.

I sometimes mention it in reviews when an AI girlfriend app has a huge anime character library.

If I say:

“It feels like browsing Crunchyroll.”

I do not mean the platforms work the same way.

I simply mean there are anime characters everywhere, with lots of different genres, styles, and personalities.

If you love anime, that is probably a good thing. If you only want realistic AI characters, it probably is not the app for you.`,
  },
  {
    term: 'Isekai',
    category: 'General',
    ctaLabel: 'What isekai means →',
    tooltipDefinition:
      'An anime genre where the main character ends up in another world, usually a fantasy world with magic, monsters, and adventures.',
    fullExplanation: `Isekai is an anime genre where the main character ends up in another world.

They might get transported there, summoned, reborn, or even trapped inside a game.

These worlds usually have things like:

- Magic
- Monsters
- Adventurers
- Kingdoms
- Quests
- RPG-style stories

On AI girlfriend apps, an isekai roleplay often puts you inside that world.

You might play as an adventurer, meet different characters, fight enemies, build relationships, and decide where the story goes next.

It feels much more like playing a game than having a normal chatbot conversation.`,
  },
  {
    term: 'Temperature',
    category: 'Chat',
    ctaLabel: 'How temperature changes replies →',
    tooltipDefinition:
      'A setting that controls how predictable or creative the AI is. Lower usually means more consistent replies, while higher can make replies more random and creative.',
    fullExplanation: `Temperature controls how predictable the AI's replies are.

A lower temperature normally gives you safer and more consistent answers.

A higher temperature gives the AI more freedom to come up with different ideas and responses.

For example:

Lower temperature:
More predictable, focused, and consistent.

Higher temperature:
More creative, surprising, and sometimes more fun.

But higher is not always better.

Push it too high and the AI can start saying random things, forgetting what is happening, or giving replies that make less sense.

For roleplay, a slightly higher temperature can make the character feel more creative. A lower setting can make conversations more stable.`,
  },
  {
    term: 'Response Length',
    category: 'Chat',
    ctaLabel: 'How response length works →',
    tooltipDefinition:
      "A setting that controls how long the AI's replies are, from short text-message style answers to long roleplay responses.",
    fullExplanation: `Response length controls how long your AI girlfriend's replies can be.

A short setting might give you something like:

“Yeah, I’d love to. What time?”

A longer setting might give you several paragraphs with dialogue, actions, thoughts, and descriptions.

Short replies can feel better for casual chatting.

Long replies can be much better for detailed roleplay.

But longer does not always mean better. Some AI models just use the extra space to say a lot without actually saying anything useful.`,
  },
  {
    term: 'LLM',
    category: 'Chat',
    ctaLabel: 'What an LLM does →',
    tooltipDefinition:
      'LLM stands for Large Language Model. It is basically the AI brain behind the chat that reads your messages and writes the replies.',
    fullExplanation: `LLM stands for Large Language Model.

The easiest way to think about it is:

It is the AI brain behind the chat.

You send a message, the LLM reads the conversation, and then it decides what your AI character should say next.

Different LLMs can feel completely different.

One might be great at NSFW roleplay but bad at normal conversation. Another might sound much more natural but be less creative.

The LLM can affect things like:

- How natural the chat feels
- Roleplay quality
- Creativity
- How repetitive the AI gets
- How well it follows instructions
- How well it stays in character

Some AI girlfriend apps even let you choose which LLM you want to use.`,
  },
  {
    term: 'CFG',
    category: 'Images',
    ctaLabel: 'How CFG affects images →',
    tooltipDefinition:
      'An image setting that controls how closely the AI tries to follow your prompt. Higher CFG usually means it tries harder to follow your instructions.',
    fullExplanation: `CFG is a setting used by some AI image generators.

The easy explanation is:

It controls how strongly the AI should listen to your prompt.

If CFG is lower, the AI has more freedom to decide what the image should look like.

If CFG is higher, it tries harder to include the things you asked for.

For example, if you ask for:

A woman in a red dress on a beach.

A higher CFG can push the generator to pay more attention to the red dress and beach.

That does not mean you should always turn CFG all the way up.

Too high can sometimes make images look worse or unnatural.

Most beginners do not need to worry much about this setting unless their images keep ignoring the prompt.`,
  },
  {
    term: 'Steps',
    category: 'Images',
    ctaLabel: 'How generation steps work →',
    tooltipDefinition:
      'A setting that controls how many processing rounds the AI uses to create an image. More steps can improve quality, but they also take longer.',
    fullExplanation: `Steps are basically how many rounds the AI goes through while creating your image.

The image starts as noise and slowly gets turned into the final picture.

More steps give the AI more time to clean up and improve the image.

But more is not always better.

At some point, adding extra steps barely changes the image and only makes you wait longer.

Different AI models also work best with different amounts of steps.

If the app controls this automatically, you normally do not need to worry about it.`,
  },
  {
    term: 'Creativity',
    category: 'Chat',
    ctaLabel: 'What creativity changes →',
    tooltipDefinition:
      "A setting that controls how creative and unpredictable the AI's replies are. Higher creativity usually means more varied replies.",
    fullExplanation: `Creativity controls how much freedom the AI gets when writing a reply.

A lower setting normally makes the AI more predictable.

A higher setting can make the character come up with more surprising ideas, reactions, and roleplay directions.

That can be great if you want the AI to help move the story forward instead of waiting for you to do everything.

But too much creativity can also make the chat weird.

The character might suddenly add random details, change the story, or say something that does not fit the conversation.

Also keep in mind that every app handles this setting differently. There is no single standard for what “creativity” means.`,
  },
  {
    term: 'RPG',
    category: 'Chat',
    aliases: ['Open-world RPG'],
    ctaLabel: 'How RPG roleplay works →',
    tooltipDefinition:
      'RPG stands for role-playing game. In AI chat, it means you are part of a bigger story where you can explore, make choices, and interact with different characters.',
    fullExplanation: `RPG stands for role-playing game.

On an AI girlfriend app, this means the chat works more like a game or interactive story.

Instead of just texting one character, you might:

- Explore different locations
- Meet new characters
- Complete quests
- Fight enemies
- Make decisions
- Build relationships
- Change where the story goes

An open-world RPG gives you even more freedom.

Instead of following one fixed story, you can decide what you want to do and where you want to go.

Some AI girlfriend apps have full RPG experiences. Others just add a few RPG-style features to normal chats.`,
  },
  {
    term: 'Prompt Adherence',
    category: 'Images',
    ctaLabel: 'How we test prompt adherence →',
    tooltipDefinition:
      'How well the AI follows what you asked for. If you request a specific outfit, pose, or location, good prompt adherence means those things actually show up.',
    fullExplanation: `Prompt adherence simply means:

Did the AI actually listen to what you asked for?

For example, you ask for:

A woman wearing a blue skirt with white stripes on a beach.

A generator with good prompt adherence should give you:

- A blue skirt
- White stripes
- A beach

A bad one might give you a red skirt, forget the stripes, or put her inside a bedroom.

This is important because an image can look amazing and still be a bad result if it ignores half your prompt.

That is why we test both image quality and prompt adherence.

Looking good is not enough. The AI also needs to listen to you.`,
  },
];

async function main() {
  if (!isDbConfigured()) {
    console.error('InstantDB is not configured. Set PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN.');
    process.exit(1);
  }

  const db = getDb();
  const { glossaryEntries } = await (db.query as any)({ glossaryEntries: {} });
  const existing = ((glossaryEntries as any[]) ?? []) as Array<{ id: string; anchor?: string; term?: string }>;
  const byAnchor = new Map(existing.map((row) => [String(row.anchor ?? ''), row]));

  const now = Date.now();
  let created = 0;
  let updated = 0;

  for (const term of TERMS) {
    const anchor = slugifyGlossaryAnchor(term.term);
    const aliases = term.aliases ?? [];
    const displayAliases = term.displayAliases ?? aliases;
    const fields = {
      term: term.term,
      anchor,
      tooltipDefinition: term.tooltipDefinition.trim(),
      ctaLabel: term.ctaLabel.trim(),
      fullDefinition: explanationToDoc(term.fullExplanation),
      aliases,
      displayAliases,
      category: term.category,
      status: 'published',
      autoTooltip: true,
      scope: 'reviews',
      publishedAt: now,
      updatedAt: now,
    };

    const prev = byAnchor.get(anchor);
    if (prev?.id) {
      await db.transact([tx.glossaryEntries[prev.id].update(fields)]);
      updated += 1;
      console.log(`updated  ${term.term} (${anchor})`);
    } else {
      const entryId = id();
      await db.transact([
        tx.glossaryEntries[entryId].update({
          ...fields,
          createdAt: now,
        }),
      ]);
      created += 1;
      console.log(`created  ${term.term} (${anchor})`);
    }
  }

  console.log(`\nDone. Created ${created}, updated ${updated}, total ${TERMS.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
