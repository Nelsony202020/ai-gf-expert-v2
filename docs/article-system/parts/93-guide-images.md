# 93 — Guide images: what to place and where

13 annotated `.webp` files are already committed under `public/guides/`.
Nothing needs downloading. Each one is 1640px wide, sized to display at 820.

Read `92-block-markup-contract.md` first. The markup below already follows it:
a bare `<figure>` with explicit `width`/`height`, `loading="lazy"`,
`decoding="async"` and a `<figcaption>`.

**Do not** wrap these in `.od-steps__media` — none of them sit inside a Step.
**Do not** change any sentence in the guides. These are additions only.
**Do not** set a height on the images in CSS.

---

## COMICS — src/content/guides/ourdream-ai-comics.html

### How to Prompt OurDream AI Comics

```html
<figure><img src="/guides/ourdream-ai-comics/comic-page-prompt.webp" alt="A page prompt in the OurDream comic editor beside the three-panel page it produced" width="820" height="400" loading="lazy" decoding="async" /><figcaption>One prompt covers the whole page. The panels are numbered inside it.</figcaption></figure>
```

### How to Add Text and Speech Bubbles

```html
<figure><img src="/guides/ourdream-ai-comics/comic-speech-balloons.webp" alt="The speech balloon panel in OurDream Comics showing the Speech, Caption, Thought and Shout types" width="820" height="631" loading="lazy" decoding="async" /><figcaption>Drag a balloon onto the page, then drag the pink dot to aim the tail.</figcaption></figure>
```

### OurDream AI Comic Layouts

```html
<figure><img src="/guides/ourdream-ai-comics/comic-layouts-compared.webp" alt="Three OurDream comic page layouts compared: three-panel diagonal, four-panel diagonal and four-panel strip top" width="820" height="402" loading="lazy" decoding="async" /><figcaption>The same page in three different layouts.</figcaption></figure>
```

### OurDream AI Comic Layouts  (second figure, lower in the section)

```html
<figure><img src="/guides/ourdream-ai-comics/comic-layout-picker.webp" alt="The OurDream page editor layout picker showing page type, panel count and layout options" width="820" height="922" loading="lazy" decoding="async" /><figcaption>Page type, panel count and layout. The layout choices change with the panel count.</figcaption></figure>
```

### How to Edit OurDream AI Comics

```html
<figure><img src="/guides/ourdream-ai-comics/comic-edit-layers.webp" alt="The Layers panel in the OurDream comic editor, with each character in each panel listed as its own layer" width="820" height="925" loading="lazy" decoding="async" /><figcaption>Every character in every panel is a separate layer.</figcaption></figure>
```

### How to Turn an OurDream AI Comic Into a Video

```html
<figure><img src="/guides/ourdream-ai-comics/comic-animate-page.webp" alt="The Animate This Page dialog in OurDream Comics, turning a comic page into a ten second clip" width="820" height="560" loading="lazy" decoding="async" /><figcaption>One finished page becomes a ten second clip for 500 DreamCoins.</figcaption></figure>
```

### How to Publish an OurDream AI Comic

```html
<figure><img src="/guides/ourdream-ai-comics/comic-pages-overview.webp" alt="The OurDream comic overview showing the cover, numbered pages and the Publish button" width="820" height="305" loading="lazy" decoding="async" /><figcaption>Cover first, then numbered pages. Publish shares it to the community.</figcaption></figure>
```

### What Can You Generate With OurDream AI Comics?

```html
<figure><img src="/guides/ourdream-ai-comics/comic-community-examples.webp" alt="Comics published by the OurDream community, showing page counts and view counts" width="820" height="244" loading="lazy" decoding="async" /><figcaption>Comics published by other people. Cover art blurred.</figcaption></figure>
```

---

## IMAGE GENERATOR — src/content/guides/ourdream-ai-image-generator.html

### How to Generate an Image

```html
<figure><img src="/guides/ourdream-ai-image-generator/image-generator-create.webp" alt="The OurDream image generator panel showing the Character, Pose, Outfit and Scene presets and the generate button" width="820" height="1177" loading="lazy" decoding="async" /><figcaption>Only Character is required. Everything else is optional.</figcaption></figure>
```

### Choose Your Image Generator

```html
<figure><img src="/guides/ourdream-ai-image-generator/image-generator-models.webp" alt="The OurDream generator picker showing Dreamy, Vivid 1.0 and Vivid 2.0 with their descriptions" width="820" height="463" loading="lazy" decoding="async" /><figcaption>The three generators, with OurDream's own descriptions.</figcaption></figure>
```

### How Remix Works

```html
<figure><img src="/guides/ourdream-ai-image-generator/image-remix-panel.webp" alt="The actions panel on a finished OurDream image showing Remix, Edit Image, Speech and Enhance" width="820" height="712" loading="lazy" decoding="async" /><figcaption>What you can do with a finished image.</figcaption></figure>
```

---

## PROMPT GUIDE — src/content/guides/ourdream-ai-prompt-guide.html

### Common OurDream AI Prompting Mistakes  →  under 'Making Your Prompt Too Vague'

```html
<figure><img src="/guides/ourdream-ai-prompt-guide/prompt-vague-vs-specific.webp" alt="Two OurDream AI beach images, one from the vague prompt woman at the beach and one from a detailed prompt specifying pose, outfit, lighting and camera angle" width="820" height="522" loading="lazy" decoding="async" /><figcaption>The same subject from a vague prompt and a specific one.</figcaption></figure>
```

### Common OurDream AI Prompting Mistakes  →  under 'Using the Same Prompt Style for Every Generator'

```html
<figure><img src="/guides/ourdream-ai-prompt-guide/prompt-dreamy-vs-vivid.webp" alt="The same OurDream prompt run on the Dreamy and Vivid 2.0 generators, producing a medium shot and a full body wide shot" width="820" height="657" loading="lazy" decoding="async" /><figcaption>One prompt, two generators. Dreamy kept it close; Vivid went wide.</figcaption></figure>
```

---

## PROMPT GUIDE — the workflow section

`src/content/guides/ourdream-ai-prompt-guide.html`, section **My OurDream AI
Prompting Workflow**.

Three images, not six. Steps 1, 5 and 6 get nothing on purpose — 1 and 5 would
be more pictures of a chat window, and 6 has nothing to photograph.

### At the very top of the section, before Step 1

```html
<figure><img src="/guides/ourdream-ai-prompt-guide/prompt-workflow-loop.webp" alt="A diagram of the six step OurDream prompting workflow, with an arrow looping from step five back to step four" width="820" height="601" loading="lazy" decoding="async" /><figcaption>The whole workflow. Steps 4 and 5 repeat until the result is right.</figcaption></figure>
```

This one carries the section. The text describes six steps in a line; the real
shape is a loop between 4 and 5, and only a diagram can show that.

### Inside Step 2 — "I Ask ChatGPT to Turn It Into a Prompt"

This one sits **inside** the step, so it needs the step wrapper:

```html
<figure class="od-steps__media"><img src="/guides/ourdream-ai-prompt-guide/workflow-chatgpt-prompt.webp" alt="A ChatGPT conversation turning a plain description into an image prompt for OurDream AI, with an optional negative prompt" width="820" height="469" loading="lazy" decoding="async" /><figcaption>The description goes in, a ready prompt comes out — plus a negative prompt.</figcaption></figure>
```

### Inside Step 4 — "I Test the Prompt in OurDream"

Also inside a step:

```html
<figure class="od-steps__media"><img src="/guides/ourdream-ai-prompt-guide/workflow-ourdream-result.webp" alt="The ChatGPT written prompt pasted into the OurDream image generator, and the two images it produced" width="820" height="505" loading="lazy" decoding="async" /><figcaption>The same prompt pasted into OurDream, and what it gave back.</figcaption></figure>
```

**Note on these two:** unlike every other image in this document, these two sit
inside `.od-steps` list items, so they use `class="od-steps__media"`. Check
`92-block-markup-contract.md` for where exactly inside the `<li>` it goes — the
comics guide has working examples.

These were shot in a real ChatGPT session and a real OurDream generation, using
the same cafe description throughout, so the three images tell one continuous
story.

---

## Two facts to add to the copy

Both read off the live OurDream interface. Neither is in the guides today.

1. A video clip costs **500 DreamCoins** for 10 seconds and uses your characters
   and the finished page as reference.
2. The **layout options change with the panel count**. 3 panels gives Diagonal,
   Rows, Splash top and Tall left. 4 panels gives Diagonal, Grid, Stagger and
   Strip top.

Do not invent any other figures — only these two were verified.

## Before you call it done

- Both `<ImageLightbox />` and `<GlossaryTooltipInit …>` are mounted on every
  guide page you touch.
- Every new image opens in the lightbox.
- Screenshot each guide at 1440 and 390 and confirm no image is squashed.
- Text diff before and after: only additions, no sentence changed.
