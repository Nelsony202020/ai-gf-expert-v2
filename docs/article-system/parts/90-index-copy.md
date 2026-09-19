# 90 · Index copy — current → proposed

**Nothing here is live.** Every string in the "current" column is what ships today from
`src/data/guides.ts` (guide descriptions) and from the product records in InstantDB
(brand positioning lines). The "proposed" column is a draft for Nelson to approve or
redline; once approved, the guide descriptions are a one-file edit in `src/data/guides.ts`
and the brand lines are edited on the product records in Admin.

## Why these are being redrafted

The current descriptions answer *what is in this page*. A hub-index blurb has one job:
tell a reader who is scanning five titles which one solves their problem. That means
leading with the outcome, and using the words the reader already has ("my pictures come
out blurry"), not the words the product uses ("Dreamy vs Vivid").

Three rules applied to every proposed line:

1. **Payoff first.** The first four words say what the reader gets, not what the page contains.
2. **No feature lists without a reason to care.** A comma-separated run of product nouns
   ("Tags, weights, camera terms and negative prompts") is a table of contents.
3. **Same length band as today** (90–120 characters), so nothing reflows on the cards.

---

## A. Guide descriptions (`src/data/guides.ts` → `description`)

### 1. How to Choose an AI Girlfriend App — `/guides/how-to-choose-an-ai-girlfriend-app/`

| | |
|---|---|
| **Current** | Work out whether you are chat-first, media-first or balanced, then shortlist on tested results. |
| **Proposed** | Most people pick the wrong app for what they actually want. Two questions and a shortlist fixes that. |

*Why:* "chat-first, media-first or balanced" is our internal taxonomy — the reader does not
have those words yet. The proposed line names the mistake first, which is what makes
someone click.

### 2. OurDream AI Prompt Guide — `/guides/ourdream-ai-prompt/`

| | |
|---|---|
| **Current** | Prompts for characters, images, video and roleplay — with examples and the common mistakes. |
| **Proposed** | Get the character you pictured instead of the one you settled for. Prompts that worked, and why. |

*Why:* the current line lists four surfaces and two content types; it could describe any
prompt guide on the internet. The gap between the character you imagined and the one you
got is the actual problem this page solves.

### 3. How to Use OurDream AI Image Generator — `/guides/how-to-use-ourdream-ai-image-generator/`

| | |
|---|---|
| **Current** | Dreamy vs Vivid, Free Play, presets, Remix, inpainting and in-chat images. |
| **Proposed** | Which model to use for what, when Free Play is worth it, and how to fix an image you nearly like. |

*Why:* six product nouns and no verb. A reader who has not used OurDream does not know
what Dreamy, Vivid, Free Play or Remix are, so the line teaches them nothing and sells
them nothing. The proposal keeps two of the terms but attaches each to a decision.

### 4. OurDream AI Image Prompt Guide — `/guides/ourdream-ai-image-prompt/`

| | |
|---|---|
| **Current** | Tags, weights, camera terms and negative prompts, tested on Dreamy and Vivid. |
| **Proposed** | Why your images come out soft, and the tag order and weights that fix it on both models. |

*Why:* "tested on Dreamy and Vivid" is the strongest thing in the current line and it is
buried at the end. The symptom ("soft") is what a reader searches for.

### 5. OurDream AI Comics: How to Use the Comic Generator — `/guides/ourdream-ai-comics/`

| | |
|---|---|
| **Current** | Characters, model sheets, layouts, editing, video — and what a comic actually costs. |
| **Proposed** | Keep one character consistent across every panel — plus what a finished comic really costs. |

*Why:* character consistency across panels is the thing that goes wrong and the reason
this page exists. The cost clause is the second-best thing in the current line and worth
keeping; the other five nouns are contents.

---

## B. Brand positioning lines

These are the one-liners on the `/guides/` brand cards and in each `/reviews/` row. They
come from the product record's `tagline` (falling back to `directoryDescription`, then
`overallSummary`) — so changing them is an Admin edit on the product, not a code change.

Two of the five have outright errors that should be fixed regardless of whether the
rewrite is approved: **"customzation"** (Nectar) and **"with endless of possibilities"**
(GirlfriendGPT).

### OurDream AI — 8.8

| | |
|---|---|
| **Current** | Well-balanced AI girlfriend app thats good at everything |
| **Proposed** | The best all-rounder we have tested — strongest on images, with no weak category. |

*Why:* "good at everything" is the claim a reader discounts. "No weak category" is the
same claim stated as evidence, and it is what an 8.8 with a 9.6 image score actually means.
Also fixes the missing apostrophe in "thats".

### Candy AI — 7.8

| | |
|---|---|
| **Current** | Great images and interactive roleplay experience |
| **Proposed** | Images as good as the leader's, at a lower price — roleplay is the trade-off. |

*Why:* the current line is two adjectives and no comparison, so it does not help anyone
choose between Candy and OurDream. Naming the trade-off is what makes a positioning line
trustworthy. **Check before shipping:** confirm the price comparison against the live
pricing data.

### Nectar AI — 7.5

| | |
|---|---|
| **Current** | Fantastic NSFW roleplay but basic customzation. |
| **Proposed** | The best roleplay writing of the five, if you can live with a thin character editor. |

*Why:* the shape is already right — strength, then limit. The proposal fixes the
**"customzation"** typo, replaces "fantastic" with a ranked claim, and says what "basic
customization" costs the reader in practice.

### GirlfriendGPT — 7.7

| | |
|---|---|
| **Current** | Top-tier adult roleplay experience with endless of possibilities. |
| **Proposed** | The biggest character library here, and the most freedom in what you can ask for. |

*Why:* fixes **"with endless of possibilities"**. "Endless possibilities" is a claim with
no content; the character library size and the permissiveness are the two real reasons
someone picks this one — and the 9.1 Characters score supports the first.

### JuicyChat AI — 6.9

| | |
|---|---|
| **Current** | Biggest premium NSFW chatbot |
| **Proposed** | The largest community of the five — scores lowest on our tests, strongest on variety. |

*Why:* "biggest premium NSFW chatbot" is a superlative with no axis. At 6.9 — the lowest
score on the page — a line that only boasts reads as untrustworthy next to the chip.
Saying where it wins and where it loses is more persuasive than either alone.

---

## C. Notes for approval

- **Nothing is shipped.** `src/data/guides.ts` still carries the current descriptions
  verbatim, and no product record was touched.
- **The two typos** (`customzation`, `with endless of possibilities`) are worth fixing
  immediately even if the rewrites are rejected — they are visible on `/guides/`,
  `/reviews/` and the homepage.
- **Two proposed lines make comparative claims** that need checking against live data
  before they ship: Candy's price comparison, and JuicyChat's "largest community".
- **The `/reviews/` row anchor.** The single link to each review currently reads just the
  app name ("OurDream AI"). Making it read "OurDream AI Review" would give the page five
  descriptive anchors instead of five brand-name anchors. That is a copy change, so it is
  parked here rather than shipped.
