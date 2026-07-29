# AI GF Expert — Complete Methodology Export

- **Exported:** 2026-07-29T10:56:24.450Z
- **Methodology version:** v3.1
- **Source:** InstantDB (active methodology version)
- **Calculation engine:** calc-1.0
- **Categories:** 8 | **Evidence definitions:** 153

> **Note:** Public `/test` pages use `src/data/methodology.ts` (stale). This export reflects the **live scoring system** and **admin guided testing** workflow.

---

# Scoring engine reference (calc-1.0)

## Hierarchy
1. Each evidence answer → normalized **0–10** via `scoringRule`
2. Subscore = weighted average of scorable evidence in that subscore
3. Category = weighted average of subscores
4. Overall = weighted average of categories

## General rules
- **Not Applicable** evidence is removed; remaining weights in the subscore are **re-scaled proportionally**
- **Unknown** (privacy) can be excluded from score; elsewhere Unknown scores **0**, never treated as Yes
- **Manual override** (0–10 + reason) replaces calculated score when set
- Publish blocks only when required evidence has **no recorded answer**; manual-scoring items with answers may warn but not block

## Special scoring cases (engine.ts)
- **resolution / maximum-resolution**: text map — 480p=4, 720p=6, 1080p=8, 4k=10
- **mode-types**: average of mode ratings (good=10, partial=5, poor=0); N/A when ≤1 chat mode
- **chat-modes**: band scoring on mode count when status=yes
- **free-plan**: no=NA (neutral); yes=10; limited=7
- **free-trial**: no=0
- **live-cam** (bonus-only): no=NA; yes=10; limited=6
- **support-available / support-channels**: reference notes, excluded from score
- **support-reach/speed/helpfulness**: NA when support-available=no
- **edit-memories**: 0 when save-memories=no
- **Privacy unknown**: excluded from score (not counted as 0)
- Capability-gated tests: N/A when product Setup capability is explicitly false


---

# Sample sizes (admin testing)

```json
{
  "characterReview": 25,
  "chatConversations": 5,
  "chatRepliesPerChat": 20,
  "imageBatch": 10,
  "imageConsistency": 5,
  "videoBatch": 3,
  "refusalPrompts": 25,
  "speedTestReplies": 25,
  "chatReplyTotal": 100
}
```

# Guided test sessions

## characters
### Library variety (`library-tags`)
Open the character library once. Count characters in each category below.
Evidence slugs: female-count, male-count, anime-female-count, anime-male-count, transgender-count, non-binary-count, other-count, styles, ethnicities, personalities, scenarios

### Finding characters (`finding-characters`)
Try filters, categories, search, and 10 quick browsing tasks.
Evidence slugs: filters, categories, search, browsing

### Character quality check (`character-sample-review`)
Review one sample group of characters. Set the sample size once, then answer every question for that same group.
Sample size field: How many characters did you review? (default 25)
Evidence slugs: duplicates, originality, profile-quality, visual-quality

## customization
### Appearance options (`appearance-options`)
Open the character creator once and count every appearance option in this order.
Evidence slugs: ethnicity, age, eye-color, body-type, breast-size, hair-style, hair-color, outfits

### Personality & voice options (`personality-options`)
In the character creator: count personality, relationship/chat style, occupation, kink options, and voice options.
Evidence slugs: creator-personalities, traits, interests, relationship, kink-options, role, voice

### Creator control (`creator-control`)
Make 5 test characters. Use them for every question in this section.
Evidence slugs: custom-prompts, editing, preview

## chat
### Chat understanding (`chat-understanding`)
Evidence slugs: memory, relevance, context, instructions, roleplay-accuracy

### Chat quality (`chat-realism`)
Use the same 5 chats as the understanding test. Fill in the table — one row per chat.
Evidence slugs: naturalness, personality, roleplay, initiative, emotion, style

### Chat problems & speed (`chat-reliability`)
Use the same chats again. Also run the refusal test and speed test where asked.
Evidence slugs: repetition, refusals, reply-speed, errors, consistency, recovery

## chat-features
### In-chat media (3 attempts each) (`chat-media`)
Try each media type three times in separate chats and record the outcome.
Evidence slugs: images-sent, images-received, voice-sent, voice-received, chat-video, gifs, reactions

### Interaction features (`chat-interaction`)
Voice calls, chat modes, group chats, double texting, and proactive messages.
Evidence slugs: voice-calls, chat-modes, mode-types, group-chat, double-texting, proactive-messages

### Message & memory controls (3 attempts each) (`chat-controls`)
Try each control three times: editing, deleting, regenerating, memories, reset and export.
Evidence slugs: edit-messages, delete-messages, regenerate-replies, save-memories, edit-memories, reset-chat, export-chat

### Bonus features (`platform-extras`)
Does the app have bonus features beyond normal chat? If yes, note AI cam models and any other extras with proof.
Evidence slugs: platform-extras-list, live-cam

## images
### Generation experience & tools (`image-experience`)
Speed, failures, where generation is available, prompting, editing, and NSFW rules.
Evidence slugs: speed, failures, chat-generation, separate-generator, custom-prompts, image-editing, nsfw-support, resolution

### Image editing accuracy (`image-editing-test`)
Try editing generated images and record how accurately edits are applied.
Evidence slugs: editing-accuracy

### 10 images (`image-batch-review`)
Evidence slugs: realism, visual-errors, composition, prompt-accuracy

### Character consistency (`image-consistency`)
Evidence slugs: character-consistency, face-consistency, body-consistency, style-consistency

## video
### Video capabilities (`video-capabilities`)
What video features exist: text-to-video, image-to-video, chat video, audio, length and resolution.
Evidence slugs: text-to-video, image-to-video, chat-video, audio, maximum-length

### Generation experience (`video-experience`)
Speed, failures, ease of use, and regeneration.
Evidence slugs: speed, failures, ease-of-use, regeneration, maximum-resolution

### 3 videos (`video-batch-review`)
Evidence slugs: motion, accuracy, character-consistency, visual-errors, frame-consistency

## privacy
### Policy & data-use review (`policy-review`)
Read the privacy policy, terms and help pages once, then answer all of these.
Evidence slugs: human-review, data-sharing, advertising, retention, policy-clarity

### User data controls (test account) (`data-controls`)
Use the test account to try deleting, exporting and opting out.
Evidence slugs: delete-chats, delete-account, delete-personal-data, training, training-opt-out, export-data

### Security & billing (`security-billing`)
Encryption, two-factor authentication, billing descriptor, and security incidents.
Evidence slugs: encryption, two-factor-authentication, billing-descriptor, security-incidents

### Customer support (`customer-support`)
Contact support once with a real question. Rate how easy it was to reach them, how fast they replied, and how helpful the answer was — use your overall impression, not exact seconds.
Evidence slugs: support-available, support-channels, support-reach, support-speed, support-helpfulness

## pricing
### Plan inclusions & limits (`pricing-plan-value`)
Record which features are included and usage limits. Plan prices and credits come from the Pricing tab.
Evidence slugs: included-features, plan-limits

### Free access (`pricing-free-access`)
Record what users get without paying: messages, images, video, voice, characters, and free trial without credit card.
Evidence slugs: free-chat, free-characters, free-images, free-video, free-voice, free-value

### Billing & policies (`pricing-billing`)
Record pricing clarity, credit expiry, refunds, and easy cancellation. Payment privacy comes from the Pricing tab.
Evidence slugs: pricing-clarity, credit-expiry, refunds, cancellation

# Worksheet grids (one table → multiple scores)

## Chat understanding (`chat-understanding`)
Open 5 new chats with 5 different characters. Use the same script in every chat. Record one row per chat.
Rows: 5 × Chat
- **Facts remembered** (`memory`, count max 5) — How many of the 5 facts did the AI remember in this chat? (0–5)
- **Direct answers** (`relevance`, count max 5) — How many of the 5 direct questions got a straight, on-topic answer? (0–5)
- **Used earlier context** (`context`, pass) — Did the AI correctly use earlier messages in this chat when it mattered?
- **Rules followed** (`instructions`, count max 3) — How many of the 3 rules did it follow? (0–3)
- **Roleplay checks passed** (`roleplay-accuracy`, count max 5) — How many of the 5 roleplay checks passed? (0–5)

## How to score chat quality (`chat-realism`)
Rows: 5 × Chat
- **Natural /20** (`naturalness`, count max 20) — Replies that sound human.
- **Kept traits** (`personality`, pass) — Character stayed in character.
- **Roleplay /5** (`roleplay`, count max 5) — Roleplay checks passed.
- **Initiative /10** (`initiative`, count max 10) — Times it moved the conversation forward.
- **Emotion /5** (`emotion`, count max 5) — Emotional moments handled well.
- **On-style /20** (`style`, count max 20) — Replies matched character style.

## 10 images (`image-batch-review`)
Generate 10 test images with the same prompt. Upload and rate each one of them.
Rows: 10 × Image
- **Visual quality** (`realism`, count max 5) — 5 = highly realistic, no defects; 1 = broken/unusable.
- **Prompt accuracy** (`prompt-accuracy`, count max 5) — 5 = followed nearly everything; 1 = barely followed.
- **Composition** (`composition`, count max 5) — 5 = excellent framing; 1 = unusable composition.
- **Defects** (`visual-errors`, pass) — Auto-calculated from ratings + defect checklist.

## Character consistency (`image-consistency`)
Upload a reference portrait first, then upload each variation. Rate face, body, and style consistency against the reference.
Rows: 5 × Image
- **Face** (`face-consistency`, tri) — Does the face match the reference?
- **Body** (`body-consistency`, tri) — Does the body match the reference?
- **Style** (`style-consistency`, tri) — Does the art style match the reference?
- **Overall** (`character-consistency`, avg_tri max 5) — Auto-calculated from face, body, and style.

## 3 videos (`video-batch-review`)
Generate 3 test videos with the same prompt. Upload and rate each one.
Rows: 3 × Video
- **Motion quality** (`motion`, count max 5) — 5 = natural and smooth; 1 = broken.
- **Prompt accuracy** (`accuracy`, count max 5) — 5 = followed nearly everything; 1 = barely followed.
- **Character consistency** (`character-consistency`, count max 5) — 5 = identity stayed consistent; 1 = unrecognizable.
- **Visual stability** (`frame-consistency`, count max 5) — 5 = stable throughout; 1 = severely broken.
- **Usable** (`visual-errors`, pass) — Auto-calculated from ratings + defects.

# Chat understanding test script

```
FACTS TO GIVE
- My name is Herman.
- I live in Bangkok.
- My favorite food is pizza.
- I have a dog named Milo.
- I work at night.

RULES
- Call me Herman.
- Keep replies under three sentences.
- Do not use emojis.

DIRECT QUESTIONS
- What would you do on a rainy date?
- What is your favorite kind of movie?
- How would you cheer me up after a bad day?
- What would you cook for dinner?
- Where would you take me on vacation?

ROLEPLAY PROMPT
"Let's roleplay that we are meeting for the first time at a quiet hotel bar. You are confident but slightly nervous. Stay in character and describe actions in italics."

ROLEPLAY CHECKS
- Started the scenario correctly
- Stayed in character
- Remembered the setting
- Responded appropriately to actions
- Did not contradict or break the scene

MEMORY QUESTIONS
- What is my name?
- Where do I live?
- What is my favorite food?
- What is my dog called?
- When do I work?
```

# UI & workflow notes

- **Combined controls** (no standalone row): mode-types, live-cam, support-channels
- **Auto-filled from Pricing tab** (hidden in testing UI): monthly-price, annual-price, annual-discount, included-credits, voice-cost, call-cost, top-up-value, image-cost, video-cost, monthly-spend, payment-privacy
- **Capability gating** (hidden when Setup capability = false):
  - `chat-features|voice-calls` → `capVoiceCalls`
  - `chat-features|voice-sent` → `capVoiceMessages`
  - `chat-features|voice-received` → `capVoiceMessages`
  - `chat-features|group-chat` → `capGroupChat`
  - `chat-features|chat-modes` → `capCustomScenarios`
  - `chat-features|mode-types` → `capCustomScenarios`
  - `chat-features|images-sent` → `capInChatImages`
  - `chat-features|images-received` → `capInChatImages`
  - `chat-features|chat-video` → `capVideoGeneration`
  - `chat-features|edit-memories` → `capMemoryInjection`
  - `chat-features|save-memories` → `capLongTermMemory`
  - `images|chat-generation` → `capInChatImages`
  - `images|separate-generator` → `capDedicatedImageGenerator`
  - `images|image-editing` → `capImageGeneration`
  - `images|custom-prompts` → `capImageGeneration`
  - `video|text-to-video` → `capVideoGeneration`
  - `video|image-to-video` → `capVideoGeneration`
  - `video|chat-video` → `capInChatImages`
- **Pricing checklist gating** (included-features options):
  - "Image generation" → `capImageGeneration`
  - "Image editing" → `capImageGeneration`
  - "Video generation" → `capVideoGeneration`
  - "Voice messages" → `capVoiceMessages`
  - "Voice calls" → `capVoiceCalls`
  - "Memory controls" → `capLongTermMemory`

---

# Full methodology tree (live definitions)

# Characters (`characters`) — 10% of overall
Measures the platform’s ready-made character library.

## Variety (`variety`) — 34% of Characters
Breadth of the character library: total amount plus the range of styles, genders, ethnicities, personalities and scenarios available.

### Female characters (`female-count`)
- **Weight:** 18% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤10 → 2/10; ≤30 → 4/10; ≤80 → 6/10; ≤120 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: how many female?
- **Tester hint:** Count ready-made female characters in the library.
- **Public description:** female characters in the library
- **How tested:**
  Count female characters in the library.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Styles (`styles`)
- **Weight:** 17% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤1 → 2/10; ≤2 → 4/10; ≤3 → 6/10; ≤4 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: which art styles?
- **Tester hint:** Tick each style offered (realistic, anime, 2D, etc.).
- **Public description:** realistic, anime, fantasy and other styles
- **What we measure:** Record which visual styles (realistic, anime, 2D, 3D…) the library offers.
- **How tested:**
  Count the number of clearly different visual styles available in the library.
- **Result format:** Number of styles and a list of the available styles.
- **Options:** [{"label":"Realistic","value":"Realistic"},{"label":"Anime","value":"Anime"},{"label":"2D / cartoon","value":"2D / cartoon"},{"label":"3D render","value":"3D render"},{"label":"Fantasy","value":"Fantasy"}]

### Male characters (`male-count`)
- **Weight:** 7% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤5 → 2/10; ≤15 → 4/10; ≤30 → 6/10; ≤50 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: how many male?
- **Tester hint:** Count ready-made male characters in the library.
- **Public description:** male characters in the library
- **How tested:**
  Count male characters in the library.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Anime female (`anime-female-count`)
- **Weight:** 18% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤10 → 2/10; ≤30 → 4/10; ≤80 → 6/10; ≤120 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: how many anime female?
- **Tester hint:** Count anime-style female characters.
- **Public description:** anime-style female characters
- **How tested:**
  Count anime-style female characters.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Ethnicities (`ethnicities`)
- **Weight:** 17% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤3 → 1/10; ≤5 → 2/10; ≤7 → 3/10; ≤10 → 5/10; ≤15 → 7/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: which ethnicities?
- **Tester hint:** Tick each ethnicity option in the library.
- **Public description:** number of represented ethnicities
- **How tested:**
  Count the ethnicity categories shown by the platform.
  Do not guess the ethnicity of individual characters based on appearance.
- **Result format:** Number of ethnicity categories and a list of the available categories.

### Anime male (`anime-male-count`)
- **Weight:** 7% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤5 → 2/10; ≤15 → 4/10; ≤30 → 6/10; ≤50 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: how many anime male?
- **Tester hint:** Count anime-style male characters.
- **Public description:** anime-style male characters
- **How tested:**
  Count anime-style male characters.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Personalities (`personalities`)
- **Weight:** 16% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤2 → 2/10; ≤5 → 4/10; ≤10 → 6/10; ≤20 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: which personalities?
- **Tester hint:** Tick each personality type offered.
- **Public description:** number of distinct personality types
- **How tested:**
  Count the personality categories or personality filters offered by the platform.
  Do not count two labels separately when they clearly mean the same thing.
- **Result format:** Number of personality types.

### Transgender (`transgender-count`)
- **Weight:** 11% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤3 → 4/10; ≤10 → 6/10; ≤25 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: how many transgender?
- **Tester hint:** Count transgender characters if offered.
- **Public description:** transgender characters
- **How tested:**
  Count transgender characters.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Scenarios (`scenarios`)
- **Weight:** 16% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤2 → 2/10; ≤5 → 4/10; ≤10 → 6/10; ≤20 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: which scenarios?
- **Tester hint:** Tick each roleplay scenario type.
- **Public description:** number of relationship and roleplay types
- **How tested:**
  Count the available relationship, story and roleplay categories.
- **Result format:** Number of scenarios and a list of the available types.

### Non-binary (`non-binary-count`)
- **Weight:** 4% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤2 → 4/10; ≤5 → 6/10; ≤15 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: how many non-binary?
- **Tester hint:** Count non-binary characters if offered.
- **Public description:** non-binary characters
- **How tested:**
  Count non-binary characters.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Other (`other-count`)
- **Weight:** 4% of Variety
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤2 → 4/10; ≤5 → 6/10; ≤15 → 8/10; ≤999999 → 10/10
- **Test session:** Library variety
- **Tester question:** Characters: how many other?
- **Tester hint:** Count any other gender/category bucket not listed above.
- **Public description:** other gender/category characters
- **How tested:**
  Count other gender/category characters.
- **Result format:** Number of characters.
- **Public result template:** {value}

## Discovery (`discovery`) — 33% of Characters
How easily users can find a suitable character using filters, categories, search and guided browsing tasks.

### Filters (`filters`)
- **Weight:** 25% of Discovery
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤3 → 4/10; ≤6 → 6/10; ≤10 → 8/10; ≤999999 → 10/10
- **Test session:** Finding characters
- **Tester question:** Characters: how many filters?
- **Tester hint:** Count every filter in the character library.
- **Public description:** number of useful character filters
- **What we measure:** Record every filter control available in the character library.
- **How tested:**
  Count filters that help users narrow the character library.
  Do not count sorting options, such as newest or most popular, as filters.
- **Result format:** Number of useful filters.

### Categories (`categories`)
- **Weight:** 25% of Discovery
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤3 → 4/10; ≤6 → 6/10; ≤10 → 8/10; ≤999999 → 10/10
- **Test session:** Finding characters
- **Tester question:** Characters: how many groups?
- **Tester hint:** Count categories that organize characters.
- **Public description:** number of useful browsing categories
- **How tested:**
  Count the categories that lead to meaningfully different groups of characters.
- **Result format:** Number of useful categories.

### Search (`search`)
- **Weight:** 25% of Discovery
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Finding characters
- **Tester question:** Characters: does search work?
- **Tester hint:** Search 3 names and 3 keywords. Did you find them?
- **Public description:** character search available
- **How tested:**
  Search for three existing character names and three general keywords.
  Record Yes when all six searches work.
  Record Limited when search exists but some searches fail or only names can be searched.
  Record No when no search is available.
- **Result format:** Yes, Limited or No.

### Browsing (`browsing`)
- **Weight:** 25% of Discovery
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Finding characters
- **Tester question:** Characters: easy to browse?
- **Tester hint:** Do 10 browsing tasks. Answer Yes if browsing is easy overall, No if not. Add task details in the note.
- **Public description:** how easy it is to find a suitable character
- **How tested:**
  Complete the 10 fixed browsing tasks in the testing guide.
  Record Yes when browsing is easy overall (most tasks completed smoothly).
  Record No when browsing is difficult or many tasks fail.
  Add task details in the internal note if helpful.
- **Result format:** Yes or No.

## Quality (`quality`) — 33% of Characters
Quality of the library itself: duplicates, originality, profile completeness and visual quality across a 50-character sample.

### Duplicates (`duplicates`)
- **Weight:** 25% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10 (inverted)
- **Test session:** Character quality check
- **Tester question:** Characters: any duplicates?
- **Tester hint:** In your sample above, count near-copy profiles. Only enter the number found.
- **Public description:** duplicate or near-duplicate characters
- **What we measure:** Review a sample of characters and count profiles that repeat another character’s image, name, description, personality, or scenario.
- **How tested:**
  Review 50 characters.
  Count a character as a duplicate when it has nearly the same image, name, description, personality and scenario as another character.
- **Result format:** Number and percentage of duplicates within the 50-character sample.
- **Sample size (DB field):** 25
- **Calculation method:** {"kind":"ratio","invert":true,"numeratorLabel":"Duplicate profiles found","denominatorLabel":"Profiles reviewed"}
- **Example answer:** 3 duplicates in 50 profiles → 6%

### Originality (`originality`)
- **Weight:** 25% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Character quality check
- **Tester question:** Characters: how unique?
- **Tester hint:** In your sample, count that feel original.
- **Public description:** how distinct the characters are
- **How tested:**
  Review the same 50 characters.
  Give each character one point for each of the following:
  * Distinct appearance
  * Distinct personality
  * Distinct scenario
  A character passes when it receives at least two out of three points.
- **Result format:** Percentage of characters that pass.
- **Sample size (DB field):** 25
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Characters passing (2 of 3 points)","denominatorLabel":"Characters reviewed (50)"}

### Profile Quality (`profile-quality`)
- **Weight:** 25% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Character quality check
- **Tester question:** Characters: good profiles?
- **Tester hint:** In your sample, count complete useful profiles.
- **Public description:** quality and completeness of character profiles
- **How tested:**
  Review the same 50 characters.
  Check whether each profile contains:
  * Name
  * Clear description
  * Personality information
  * Relationship or scenario information
  * Example dialogue or opening message
  Each completed item is worth one point.
- **Result format:** Average profile completeness percentage.
- **Sample size (DB field):** 25
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Profile checks passed","denominatorLabel":"Total checks (50 × 5 = 250)"}

### Visual Quality (`visual-quality`)
- **Weight:** 25% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Character quality check
- **Tester question:** Characters: good photos?
- **Tester hint:** In your sample, count clear good profile photos.
- **Public description:** consistency and quality of character images
- **How tested:**
  Review the main profile image of the same 50 characters.
  Give each image one point for:
  * Clear face
  * Clear body
  * No major anatomy errors
  * No obvious image damage
  * Good overall presentation
- **Result format:** Average percentage of visual-quality checks passed.
- **Sample size (DB field):** 25
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Image checks passed","denominatorLabel":"Total checks (50 × 5 = 250)"}

# Customization (`customization`) — 15% of overall
Measures how much control users have when creating their own character.

## Appearance (`appearance`) — 34% of Customization
Appearance options available when creating a character: gender, age, ethnicity, face, hair, body and clothing.

### Age (`age`)
- **Weight:** 15% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤2 → 4/10; ≤5 → 6/10; ≤10 → 8/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: age options?
- **Tester hint:** Count age choices (or min/max adult age).
- **Public description:** available age options
- **How tested:**
  Count the selectable adult age options or record the minimum and maximum adult age allowed.
- **Result format:** Number of age options or available age range.

### Ethnicity (`ethnicity`)
- **Weight:** 14% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤2 → 1/10; ≤4 → 2/10; ≤5 → 3/10; ≤8 → 6/10; ≤12 → 8/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: ethnicity options?
- **Tester hint:** Count ethnicity choices in the creator.
- **Public description:** available ethnicity options
- **How tested:**
  Count all selectable ethnicity options.
- **Result format:** Number of options and a list of the available options.

### Eye color (`eye-color`)
- **Weight:** 12% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤2 → 1/10; ≤3 → 2/10; ≤5 → 4/10; ≤10 → 7/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: eye color options?
- **Tester hint:** Count eye color choices in the creator.
- **Public description:** eye color options
- **How tested:**
  Count eye color options.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Body type (`body-type`)
- **Weight:** 12% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤2 → 2/10; ≤4 → 4/10; ≤5 → 6/10; ≤8 → 8/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: body type options?
- **Tester hint:** Count body type presets and controls.
- **Public description:** body type options
- **How tested:**
  Count body type options.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Breast size (`breast-size`)
- **Weight:** 11% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤2 → 2/10; ≤4 → 4/10; ≤6 → 6/10; ≤10 → 8/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: breast size options?
- **Tester hint:** Count breast size choices if offered.
- **Public description:** breast size options
- **How tested:**
  Count breast size options.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Hair style (`hair-style`)
- **Weight:** 11% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤3 → 1/10; ≤6 → 3/10; ≤12 → 5/10; ≤25 → 7/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: hair style options?
- **Tester hint:** Count hairstyle choices.
- **Public description:** hairstyle options
- **How tested:**
  Count hairstyle options.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Hair color (`hair-color`)
- **Weight:** 11% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤5 → 2/10; ≤20 → 4/10; ≤50 → 6/10; ≤100 → 8/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: hair color options?
- **Tester hint:** Count hair color choices.
- **Public description:** hair color options
- **How tested:**
  Count hair color options.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Outfits (`outfits`)
- **Weight:** 11% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤5 → 2/10; ≤15 → 4/10; ≤25 → 6/10; ≤35 → 7/10; ≤50 → 8/10; ≤999999 → 10/10
- **Test session:** Appearance options
- **Tester question:** Creator: outfit options?
- **Tester hint:** Count clothing and outfit choices.
- **Public description:** clothing and outfit options
- **How tested:**
  Count clothing and outfit options.
- **Result format:** Number of characters.
- **Public result template:** {value}

### Personalities (`creator-personalities`)
- **Weight:** 11% of Appearance
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤3 → 2/10; ≤6 → 4/10; ≤10 → 6/10; ≤15 → 8/10; ≤999999 → 10/10
- **Test session:** Personality & voice options
- **Tester question:** Creator: personality options?
- **Tester hint:** Count personality choices when creating a character.
- **Public description:** personality options in the creator
- **How tested:**
  Count personality options in the creator.
- **Result format:** Number of characters.
- **Public result template:** {value}

## Personality (`personality`) — 33% of Customization
Personality-building options: traits, interests, communication styles, relationship types, roles and voices.

### Traits (`traits`)
- **Weight:** 17% of Personality
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤5 → 2/10; ≤10 → 4/10; ≤20 → 6/10; ≤40 → 8/10; ≤999999 → 10/10
- **Test session:** Personality & voice options
- **Tester question:** Creator: personality traits?
- **Tester hint:** Count personality trait options.
- **Public description:** available personality traits
- **How tested:**
  Count all selectable personality traits.
  Also record the maximum number of traits that can be selected for one character.
- **Result format:** Number of available traits and maximum selectable traits.

### Interests (`interests`)
- **Weight:** 17% of Personality
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤5 → 2/10; ≤10 → 4/10; ≤20 → 6/10; ≤40 → 8/10; ≤999999 → 10/10
- **Test session:** Personality & voice options
- **Tester question:** Creator: interest options?
- **Tester hint:** Count hobby/interest options for characters.
- **Public description:** available interests and hobbies
- **How tested:**
  Count all selectable interests.
  Also test whether users can enter a custom interest.
- **Result format:** Number of available interests and custom entry Yes/No.

### Relationship (`relationship`)
- **Weight:** 17% of Personality
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤4 → 2/10; ≤8 → 4/10; ≤12 → 6/10; ≤20 → 8/10; ≤999999 → 10/10
- **Test session:** Personality & voice options
- **Tester question:** Creator: relationship / chat style?
- **Tester hint:** Count relationship type and chat-style options combined.
- **Public description:** available relationship types
- **How tested:**
  Count all selectable relationship types.
  Examples include girlfriend, boyfriend, friend, spouse, dominant and romantic partner.
- **Result format:** Number of relationship types.

### Role (`role`)
- **Weight:** 16% of Personality
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤5 → 2/10; ≤15 → 4/10; ≤25 → 6/10; ≤40 → 8/10; ≤999999 → 10/10
- **Test session:** Personality & voice options
- **Tester question:** Creator: occupation options?
- **Tester hint:** Count occupation or job/role options for characters.
- **Public description:** available occupations and backgrounds
- **How tested:**
  Count all preset roles, occupations or backgrounds.
  Also test whether users can enter a custom role.
- **Result format:** Number of preset roles and custom role Yes/No.

### Voice (`voice`)
- **Weight:** 16% of Personality
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤3 → 2/10; ≤6 → 4/10; ≤9 → 5/10; ≤15 → 7/10; ≤999999 → 10/10
- **Test session:** Personality & voice options
- **Tester question:** Creator: voice options?
- **Tester hint:** Count voice choices for characters.
- **Public description:** number of available voice options
- **How tested:**
  Count the selectable voices.
  Test three voices to confirm that the options produce noticeably different voices.
- **Result format:** Number of voices and whether voice previews are available.

### Kink options (`kink-options`)
- **Weight:** 10% of Personality
- **Required:** no
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤3 → 3/10; ≤6 → 6/10; ≤9 → 9/10; ≤999999 → 10/10
- **Test session:** Personality & voice options
- **Tester question:** Creator: kink options?
- **Tester hint:** Count kink or intimacy preference options if offered.
- **Public description:** kink or intimacy preference options
- **How tested:**
  Count kink or intimacy preference options in the character creator.
- **Result format:** Number of options.
- **Public result template:** {value}

## Control (`control`) — 33% of Customization
Depth of creator control: custom prompts, later editing, precision of controls, preset-plus-prompt combinations and previews.

### Custom Prompts (`custom-prompts`)
- **Weight:** 20% of Control
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Creator control
- **Tester question:** Creator: custom character accurate?
- **Tester hint:** Make 5 characters from your own written description. Count how many matched what you asked for.
- **Public description:** custom text prompt available
- **How tested:**
  Create five characters using a custom text instruction.
  Record Yes when custom instructions are available and accepted for all five characters.
  Record Limited when custom instructions are available but have major restrictions.
  Record No when users cannot enter custom instructions.
- **Result format:** Yes, Limited or No.

### Editing (`editing`)
- **Weight:** 20% of Control
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Creator control
- **Tester question:** Creator: edit after creating?
- **Tester hint:** Make 5 characters, then try to change them. Count how many let you edit.
- **Public description:** character can be edited later
- **How tested:**
  Create five characters.
  After creation, try to change:
  * Appearance
  * Personality
  * Relationship
  * Voice
  * Name
- **Result format:** Number and percentage of areas that can be edited.
- **Calculation method:** {"kind":"checklist","items":["Appearance","Personality","Relationship","Voice","Name"]}

### Preview (`preview`)
- **Weight:** 20% of Control
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Creator control
- **Tester question:** Creator: preview before save?
- **Tester hint:** Make 5 characters. Before finishing each one, check if you can see a picture or description first — without burning all your tokens.
- **Public description:** character can be previewed before creation
- **How tested:**
  Create five characters and check whether a visual or written preview appears before final confirmation.
- **Result format:** Yes, Limited or No.

# Chat (`chat`) — 20% of overall
Measures the quality of the actual conversation. This rating covers conversation quality only; image sharing, voice messages, calls and other tools are scored under Chat Features.

## Understanding (`understanding`) — 34% of Chat
How well the AI understands the user: memory, relevance, multi-message context, instruction following and roleplay accuracy.

### Memory (`memory`)
- **Weight:** 20% of Understanding
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat understanding
- **Tester question:** Chat: remembers facts?
- **Tester hint:** Use the table — 5 chats, 5 facts each.
- **Public description:** percentage of tested facts remembered
- **How tested:**
  Introduce five facts in each of the 10 conversations.
  Examples include:
  * User’s name
  * User’s job
  * User’s favorite food
  * User’s planned trip
  * User’s relationship preference
  Test each fact again after 10 AI replies.
  This produces 50 memory tests.
- **Result format:** Number and percentage of the 50 facts remembered correctly.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Facts remembered","denominatorLabel":"Facts planted (50)"}

### Relevance (`relevance`)
- **Weight:** 20% of Understanding
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat understanding
- **Tester question:** Chat: answers questions?
- **Tester hint:** Use the table — 5 chats, 5 questions each.
- **Public description:** percentage of prompts answered correctly
- **How tested:**
  Use five direct questions in each of the 10 conversations.
  The reply passes when it clearly answers the question without changing the subject.
  This produces 50 relevance tests.
- **Result format:** Number and percentage of relevant answers.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Questions answered directly","denominatorLabel":"Questions asked (50)"}

### Context (`context`)
- **Weight:** 20% of Understanding
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat understanding
- **Tester question:** Chat: uses earlier messages?
- **Tester hint:** Use the table — tick if each chat used context correctly.
- **Public description:** ability to follow a conversation across multiple messages
- **How tested:**
  Include one five-message story or task in each of the 10 conversations.
  The character must correctly use information from the beginning, middle and end of the conversation.
  This produces 10 context tests.
- **Result format:** Number and percentage of context tests completed correctly.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Context tests passed","denominatorLabel":"Context tests (10)"}

### Instructions (`instructions`)
- **Weight:** 20% of Understanding
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat understanding
- **Tester question:** Chat: follows your rules?
- **Tester hint:** Use the table — rules followed per chat.
- **Public description:** ability to follow specific requests
- **How tested:**
  Give three clear instructions in each of the 10 conversations.
  Examples include:
  * Reply using only two sentences.
  * Ask one question at the end.
  * Stay in the selected role.
  This produces 30 instruction tests.
- **Result format:** Number and percentage of instructions followed correctly.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Instructions followed","denominatorLabel":"Instructions given (30)"}

### Roleplay Accuracy (`roleplay-accuracy`)
- **Weight:** 20% of Understanding
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat understanding
- **Tester question:** Chat: roleplay correct?
- **Tester hint:** Use the table — roleplay checks per chat.
- **Public description:** ability to understand and maintain a scenario
- **How tested:**
  Use one fixed roleplay scenario in each of the 10 conversations.
  The character must correctly maintain:
  * Its assigned role
  * The user’s role
  * The setting
  * The relationship
  * The main situation
  Each conversation receives one point for each item.
- **Result format:** Percentage of the 50 roleplay checks passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Scenario checks passed","denominatorLabel":"Total checks (50)"}

## Realism (`realism`) — 33% of Chat
How natural and human the conversation feels: naturalness, personality consistency, roleplay quality, initiative, emotion and style.

### Naturalness (`naturalness`)
- **Weight:** 17% of Realism
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat quality
- **Tester question:** Chat: sounds natural?
- **Tester hint:** Use the table — count natural replies per chat (of ~20).
- **Public description:** how natural the conversation feels
- **How tested:**
  Review all 200 AI replies.
  Check each reply for:
  * Natural wording
  * Appropriate response length
  * Logical conversational flow
  * No robotic or template-like language
  Each reply passes when it meets at least three of the four checks.
- **Result format:** Percentage of the 200 replies that pass.
- **Sample size (DB field):** 100
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Natural replies","denominatorLabel":"Replies reviewed (200)"}

### Personality (`personality`)
- **Weight:** 17% of Realism
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat quality
- **Tester question:** Chat: keeps personality?
- **Tester hint:** Use the table — tick if character stayed in character.
- **Public description:** consistency of the selected personality
- **How tested:**
  Give each of the 10 tested characters three clear personality traits.
  Review all 20 replies in each conversation.
  A conversation passes when the character keeps at least two of the three traits throughout the conversation.
- **Result format:** Number and percentage of the 10 conversations that pass.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Conversations keeping 2+ traits","denominatorLabel":"Conversations (10)"}

### Roleplay (`roleplay`)
- **Weight:** 17% of Realism
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat quality
- **Tester question:** Chat: good roleplay?
- **Tester hint:** Use the table — roleplay score per chat.
- **Public description:** quality of the roleplay
- **How tested:**
  Review the 10 roleplay conversations.
  Give one point for each of these:
  * Stays in character
  * Adds useful details
  * Responds to the user’s actions
  * Keeps the story consistent
  * Moves the scenario forward
- **Result format:** Percentage of the 50 roleplay checks passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Roleplay checks passed","denominatorLabel":"Total checks (50)"}

### Initiative (`initiative`)
- **Weight:** 17% of Realism
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat quality
- **Tester question:** Chat: takes initiative?
- **Tester hint:** Use the table — times it moved the conversation forward.
- **Public description:** asks questions and moves the conversation forward
- **How tested:**
  Use 10 open-ended messages in each of the 10 conversations.
  This creates 100 chances for initiative.
  A reply passes when the character does at least one of the following:
  * Asks a relevant question
  * Adds a useful new detail
  * Suggests a logical next action
- **Result format:** Number and percentage of the 100 replies showing useful initiative.
- **Sample size (DB field):** 50
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Initiative moments","denominatorLabel":"Opportunities (100)"}

### Emotion (`emotion`)
- **Weight:** 16% of Realism
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat quality
- **Tester question:** Chat: handles emotions?
- **Tester hint:** Use the table — emotional moments handled well.
- **Public description:** responds appropriately to the user’s tone
- **How tested:**
  Use five emotional situations in each of the 10 conversations.
  Use these situations:
  * Happy
  * Sad
  * Angry
  * Nervous
  * Romantic
  This produces 50 emotional-response tests.
  A reply passes when it correctly recognizes and responds to the emotional situation.
- **Result format:** Number and percentage of appropriate responses.
- **Sample size (DB field):** 25
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Emotional cues handled well","denominatorLabel":"Cues tested (50)"}

### Style (`style`)
- **Weight:** 16% of Realism
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat quality
- **Tester question:** Chat: right tone/style?
- **Tester hint:** Use the table — replies that match the character style.
- **Public description:** maintains the selected communication style
- **How tested:**
  Select one communication style for each of the 10 conversations.
  Review the 20 replies in each conversation.
  A reply passes when it clearly matches the selected style.
- **Result format:** Percentage of the 200 replies that maintain the selected style.
- **Sample size (DB field):** 100
- **Calculation method:** {"kind":"ratio","numeratorLabel":"On-style replies","denominatorLabel":"Replies reviewed (200)"}

## Reliability (`reliability`) — 33% of Chat
Technical dependability of the chat: repetition, unnecessary refusals, reply speed, errors, consistency and recovery from misunderstandings.

### Repetition (`repetition`)
- **Weight:** 17% of Reliability
- **Required:** yes
- **Measurement:** count (per 50 replies)
- **Scoring rule:** bands: ≤0 → 10/10; ≤1 → 9/10; ≤2 → 8/10; ≤4 → 6/10; ≤7 → 4/10; ≤12 → 2/10; ≤999999 → 0/10
- **Test session:** Chat problems & speed
- **Tester question:** Chat: repeats itself?
- **Tester hint:** In your 100 test replies, count repetition problems.
- **Public description:** repeated responses
- **How tested:**
  Review all 200 AI replies.
  Count replies that repeat the same sentence, idea or response structure without a clear reason.
- **Result format:** Number of repeated replies per 200 replies and per 50 replies.
- **Sample size (DB field):** 100

### Refusals (`refusals`)
- **Weight:** 17% of Reliability
- **Required:** yes
- **Measurement:** count (per 50 prompts)
- **Scoring rule:** bands: ≤0 → 10/10; ≤1 → 9/10; ≤2 → 8/10; ≤4 → 6/10; ≤7 → 4/10; ≤12 → 2/10; ≤999999 → 0/10
- **Test session:** Chat problems & speed
- **Tester question:** Chat: refuses too much?
- **Tester hint:** Try 25 different prompts. Count how many got refused.
- **Public description:** unnecessary refusals
- **How tested:**
  Send 50 allowed prompts that do not break the platform’s rules.
  Count how many are refused without a valid reason.
- **Result format:** Number of unnecessary refusals per 50 allowed prompts.
- **Sample size (DB field):** 25

### Speed (`reply-speed`)
- **Weight:** 17% of Reliability
- **Required:** yes
- **Measurement:** seconds (seconds)
- **Scoring rule:** bands: ≤2 → 10/10; ≤4 → 8/10; ≤6 → 6/10; ≤10 → 4/10; ≤20 → 2/10; ≤999999 → 0/10
- **Test session:** Chat problems & speed
- **Tester question:** Chat: reply speed?
- **Tester hint:** Time 25 replies. Enter median seconds to respond.
- **Public description:** median reply time
- **How tested:**
  Time 50 replies.
  Start the timer when the message is sent.
  Stop the timer when the full reply has finished appearing.
- **Result format:** Median reply time in seconds.
- **Sample size (DB field):** 25

### Errors (`errors`)
- **Weight:** 17% of Reliability
- **Required:** yes
- **Measurement:** count (per 50 replies)
- **Scoring rule:** bands: ≤0 → 10/10; ≤1 → 9/10; ≤2 → 8/10; ≤4 → 6/10; ≤7 → 4/10; ≤12 → 2/10; ≤999999 → 0/10
- **Test session:** Chat problems & speed
- **Tester question:** Chat: errors or crashes?
- **Tester hint:** In 100 test replies, count errors or broken replies.
- **Public description:** broken, incomplete or unrelated responses
- **How tested:**
  Review all 200 AI replies.
  Count replies that are:
  * Cut off
  * Broken
  * Nonsensical
  * Empty
  * Unrelated to the conversation
- **Result format:** Number of errors per 200 replies and per 50 replies.
- **Sample size (DB field):** 100

### Consistency (`consistency`)
- **Weight:** 16% of Reliability
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10 (inverted)
- **Test session:** Chat problems & speed
- **Tester question:** Chat: contradicts itself?
- **Tester hint:** In 5 chats, count times it contradicted earlier facts.
- **Public description:** contradictory responses
- **How tested:**
  Introduce five fixed facts in each of the 10 conversations.
  Check whether the character later contradicts any of these facts.
  This produces 50 consistency checks.
- **Result format:** Number and percentage of contradictions.
- **Sample size (DB field):** 25
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Contradictions found","denominatorLabel":"Statements checked (50)"}

### Recovery (`recovery`)
- **Weight:** 16% of Reliability
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Chat problems & speed
- **Tester question:** Chat: recovers from mistakes?
- **Tester hint:** Correct the AI 5 times when it messes up. Count successes.
- **Public description:** ability to correct a misunderstanding
- **How tested:**
  Create one clear misunderstanding in each of the 10 conversations.
  Correct the character immediately afterward.
  The test passes when the character understands the correction and responds correctly within its next two replies.
- **Result format:** Number and percentage of the 10 recovery tests passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Successful recoveries","denominatorLabel":"Recovery tests (10)"}

# Chat Features (`chat-features`) — 10% of overall
Measures what users can do inside the chat, including optional platform extras such as live cam.

## Media (`media`) — 30% of Chat Features
Media that can be exchanged inside the chat: images, voice messages, videos, GIFs and message reactions.

### Images Sent (`images-sent`)
- **Weight:** 7% of Media
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** In-chat media (3 attempts each)
- **Tester question:** Chat: images sent?
- **Tester hint:** Send three different image files in three separate chats.
- **Public description:** users can send images
- **How tested:**
  Send three different image files in three separate chats.
- **Result format:** Yes when all three work, Limited when only some work or restrictions are important, and No when none work.

### Images Received (`images-received`)
- **Weight:** 21% of Media
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** In-chat media (3 attempts each)
- **Tester question:** Chat: images received?
- **Tester hint:** Request one image in three separate chats.
- **Public description:** characters can send images
- **How tested:**
  Request one image in three separate chats.
- **Result format:** Yes when images are received in all three tests, Limited when only some work or restrictions apply, and No when none work.

### Voice Sent (`voice-sent`)
- **Weight:** 7% of Media
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** In-chat media (3 attempts each)
- **Tester question:** Chat: voice sent?
- **Tester hint:** Send three voice messages in three separate chats.
- **Public description:** users can send voice messages
- **How tested:**
  Send three voice messages in three separate chats.
- **Result format:** Yes, Limited or No.

### Voice Received (`voice-received`)
- **Weight:** 23% of Media
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** In-chat media (3 attempts each)
- **Tester question:** Chat: voice received?
- **Tester hint:** Request a voice reply in three separate chats.
- **Public description:** characters can send voice messages
- **How tested:**
  Request a voice reply in three separate chats.
- **Result format:** Yes, Limited or No.

### Chat Video (`chat-video`)
- **Weight:** 20% of Media
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** In-chat media (3 attempts each)
- **Tester question:** Chat: chat video?
- **Tester hint:** Request one video in three separate chats.
- **Public description:** videos can be received or generated inside chat
- **How tested:**
  Request one video in three separate chats.
- **Result format:** Yes, Limited or No.

### GIFs (`gifs`)
- **Weight:** 2% of Media
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** In-chat media (3 attempts each)
- **Tester question:** Chat: gifs?
- **Tester hint:** Try to send and receive one GIF in three separate chats.
- **Public description:** GIF support
- **How tested:**
  Try to send and receive one GIF in three separate chats.
- **Result format:** Yes, Limited or No.

### Reactions (`reactions`)
- **Weight:** 20% of Media
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** In-chat media (3 attempts each)
- **Tester question:** Chat: reactions?
- **Tester hint:** Try to react to three separate messages.
- **Public description:** emojis and message reactions
- **How tested:**
  Try to react to three separate messages.
- **Result format:** Yes, Limited or No.

## Interaction (`interaction`) — 30% of Chat Features
Interactive capabilities: voice calls, chat modes, group chats, double texting and proactive messages.

### Voice Calls (`voice-calls`)
- **Weight:** 27% of Interaction
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Interaction features
- **Tester question:** Chat: voice calls?
- **Tester hint:** Start three voice calls on three different days.
- **Public description:** live voice calling
- **How tested:**
  Start three voice calls on three different days.
  Record whether each call connects and its maximum permitted length.
- **Result format:** Number of successful calls out of three and Yes, Limited or No.

### Chat Modes (`chat-modes`)
- **Weight:** 22% of Interaction
- **Required:** yes
- **Measurement:** boolean (count)
- **Scoring rule:** bands: ≤0 → 0/10; ≤1 → 3/10; ≤2 → 5/10; ≤4 → 6/10; ≤6 → 7/10; ≤9 → 8/10; ≤999999 → 10/10
- **Test session:** Interaction features
- **Tester question:** Chat: different chat modes?
- **Tester hint:** Yes/No first. If yes, count how many modes exist, then test and rate two of them.
- **Public description:** number of available chat modes
- **How tested:**
  Count the selectable chat modes that visibly change how the chat works.
- **Result format:** Number of chat modes.

### Mode Types (`mode-types`)
- **Weight:** 17% of Interaction
- **Required:** yes
- **Measurement:** structured
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Interaction features
- **Testing UI:** hidden (combined control)
- **Tester question:** Chat: how well do modes work?
- **Tester hint:** Filled automatically when you rate two modes above.
- **Public description:** available types of chat modes
- **How tested:**
  Open and test each available mode with five messages.
- **Result format:** Number of working modes and a list of the available types.

### Group Chat (`group-chat`)
- **Weight:** 5% of Interaction
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Interaction features
- **Tester question:** Chat: group chat?
- **Tester hint:** Create three group chats.
- **Public description:** multiple characters in one chat
- **How tested:**
  Create three group chats.
  Try adding two, three and four AI characters.
- **Result format:** Yes, Limited or No, plus the maximum number of characters supported.

### Double Texting (`double-texting`)
- **Weight:** 15% of Interaction
- **Required:** yes
- **Measurement:** boolean (per 100 user messages)
- **Scoring rule:** bands: ≤0 → 0/10; ≤5 → 4/10; ≤15 → 7/10; ≤999999 → 10/10
- **Test session:** Interaction features
- **Tester question:** Chat: double texting?
- **Tester hint:** Does the AI send multiple messages when replying, or put everything in one bubble?
- **Public description:** character can send multiple messages
- **How tested:**
  In a normal chat, send one message and wait without replying.
  Record Yes when the character sometimes sends two or more separate messages before you reply.
  Record No when it always waits for your next message.
- **Result format:** Yes or No.

### Proactive Messages (`proactive-messages`)
- **Weight:** 14% of Interaction
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Interaction features
- **Tester question:** Chat: messages you first?
- **Tester hint:** Leave chats idle a few days. Does the AI ever message you without you writing first?
- **Public description:** character messages you first without prompting
- **How tested:**
  Keep three active chats open for seven days.
  Do not send messages during the test period.
  Count all messages sent by the characters without a new user message.
- **Result format:** Number of proactive messages during seven days.

## Controls (`controls`) — 30% of Chat Features
User controls over the conversation: editing, deleting, regenerating, memory management, resetting and exporting chats.

### Edit Messages (`edit-messages`)
- **Weight:** 15% of Controls
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Message & memory controls (3 attempts each)
- **Tester question:** Chat: edit messages?
- **Tester hint:** Try to edit three previously sent messages.
- **Public description:** previously sent messages can be edited
- **How tested:**
  Try to edit three previously sent messages.
- **Result format:** Number of successful edits out of three and Yes, Limited or No.

### Delete Messages (`delete-messages`)
- **Weight:** 15% of Controls
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Message & memory controls (3 attempts each)
- **Tester question:** Chat: delete messages?
- **Tester hint:** Try to delete three individual messages.
- **Public description:** individual messages can be deleted
- **How tested:**
  Try to delete three individual messages.
- **Result format:** Number of successful deletions out of three and Yes, Limited or No.

### Regenerate Replies (`regenerate-replies`)
- **Weight:** 14% of Controls
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Message & memory controls (3 attempts each)
- **Tester question:** Chat: regenerate replies?
- **Tester hint:** Try to regenerate three AI replies.
- **Public description:** AI replies can be regenerated
- **How tested:**
  Try to regenerate three AI replies.
- **Result format:** Number of successful regenerations out of three and Yes, Limited or No.

### Save Memories (`save-memories`)
- **Weight:** 14% of Controls
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Message & memory controls (3 attempts each)
- **Tester question:** Chat: save memories?
- **Tester hint:** Try to manually save three separate memories.
- **Public description:** memories can be saved manually
- **How tested:**
  Try to manually save three separate memories.
- **Result format:** Number successfully saved out of three and Yes, Limited or No.

### Edit Memories (`edit-memories`)
- **Weight:** 14% of Controls
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Message & memory controls (3 attempts each)
- **Tester question:** Chat: edit memories?
- **Tester hint:** Try to view, edit and delete saved memories. If save is unavailable, answer No.
- **Public description:** saved memories can be viewed, edited and deleted
- **How tested:**
  Try to view, edit and delete three saved memories.
- **Result format:** Number of supported actions and Yes, Limited or No.

### Reset Chat (`reset-chat`)
- **Weight:** 14% of Controls
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Message & memory controls (3 attempts each)
- **Tester question:** Chat: reset chat?
- **Tester hint:** Try to reset three separate conversations.
- **Public description:** conversations can be reset
- **How tested:**
  Try to reset three separate conversations.
- **Result format:** Number of successful resets out of three and Yes, Limited or No.

### Export Chat (`export-chat`)
- **Weight:** 14% of Controls
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Message & memory controls (3 attempts each)
- **Tester question:** Chat: export chat?
- **Tester hint:** Try to export three conversations.
- **Public description:** conversations can be exported
- **How tested:**
  Try to export three conversations.
- **Result format:** Number of successful exports out of three, available file formats and Yes, Limited or No.

## Platform Extras (`platform-extras`) — 10% of Chat Features
Optional experiences beyond standard chat. Only live cam affects the score; other extras are noted for the review.

### Live Cam (`live-cam`)
- **Weight:** 100% of Platform Extras
- **Required:** no
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Bonus features
- **Testing UI:** hidden (combined control)
- **Public description:** live webcam-style character experience
- **How tested:**
  Check whether the platform offers a live cam or webcam-style experience with a character on video.
  Record Yes or No only.
- **Result format:** Yes or No.

### Platform Extras List (`platform-extras-list`)
- **Weight:** 0% of Platform Extras
- **Required:** no
- **Measurement:** structured
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Bonus features
- **Tester question:** Bonus features?
- **Tester hint:** AI Cam Models first, then Bonus features Yes/No. If yes, add More bonus features with name, description, and proof.
- **Public description:** other notable platform extras
- **How tested:**
  List any other extras worth mentioning in the review (shorts, roulette, interactive video, episodic series, etc.).
  One short name per row with an optional note.
  This list does not affect the score.
- **Result format:** List of extra feature names and optional notes.

# Images (`images`) — 15% of overall
Measures image quality and the image-generation experience.

## Quality (`quality`) — 34% of Images
Visual quality of generated images: realism, visual errors, detail, composition and maximum resolution.

### Realism (`realism`)
- **Weight:** 20% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** 10 images
- **Tester question:** Images: visual quality?
- **Tester hint:** Rate each image 1–5 in the batch test worksheet.
- **Public description:** how realistic the images look
- **How tested:**
  Review all 20 images.
  Give each image one point for:
  * Realistic face
  * Realistic body
  * Realistic hands
  * Realistic lighting
  * Realistic background
- **Result format:** Percentage of the 100 realism checks passed.
- **Sample size (DB field):** 20
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Realism checks passed","denominatorLabel":"Total checks (20 × 5 = 100)"}

### Visual Errors (`visual-errors`)
- **Weight:** 20% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10 (inverted)
- **Test session:** 10 images
- **Tester question:** Images: defects?
- **Tester hint:** Defect rate is calculated from your ratings and defect checklist.
- **Public description:** images with anatomy or visual problems
- **How tested:**
  Review all 20 images.
  Count an image as having an error when it contains at least one major issue, such as:
  * Extra limb
  * Missing limb
  * Broken hand
  * Damaged face
  * Merged objects
  * Broken clothing
  * Distorted background
- **Result format:** Number and percentage of images with at least one major error.
- **Sample size (DB field):** 20
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Images with a major error","denominatorLabel":"Images reviewed (20)"}

### Composition (`composition`)
- **Weight:** 20% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** 10 images
- **Tester question:** Images: composition?
- **Tester hint:** Rate framing and subject placement 1–5 per image.
- **Public description:** framing and presentation
- **How tested:**
  Review all 20 images.
  Give each image one point for:
  * Subject is fully visible as requested
  * No accidental cropping
  * Correct subject placement
  * Clear background
  * Balanced framing
- **Result format:** Percentage of the 100 composition checks passed.
- **Sample size (DB field):** 20
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Composition checks passed","denominatorLabel":"Total checks (20 × 5 = 100)"}

### Resolution (`resolution`)
- **Weight:** 20% of Quality
- **Required:** yes
- **Measurement:** enum
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Generation experience & tools
- **Tester question:** Images: max resolution?
- **Tester hint:** Select the highest resolution you can generate (480p–4K).
- **Public description:** maximum output resolution
- **How tested:**
  Download the highest-quality image available.
  Record its exact width and height in pixels.
- **Result format:** Maximum image resolution.

## Accuracy (`accuracy`) — 33% of Images
How accurately images follow prompts and preserve the character: prompt accuracy, character/face/body/style consistency and editing accuracy.

### Prompt Accuracy (`prompt-accuracy`)
- **Weight:** 17% of Accuracy
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** 10 images
- **Tester question:** Images: prompt accuracy?
- **Tester hint:** Rate how closely each image matched the prompt (1–5).
- **Public description:** percentage of instructions followed
- **How tested:**
  Give every one of the 10 prompts five required elements.
  Because each prompt is used twice, this produces 100 required-element checks.
- **Result format:** Number and percentage of required elements produced correctly.
- **Sample size (DB field):** 20
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Required elements present","denominatorLabel":"Total elements (20 × 5 = 100)"}

### Character Consistency (`character-consistency`)
- **Weight:** 17% of Accuracy
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Character consistency
- **Tester question:** Images: overall consistency?
- **Tester hint:** Auto-calculated from face, body, and style ratings in the worksheet.
- **Public description:** preservation of the same character
- **How tested:**
  Generate 10 images of the same character.
  Give each image one point for preserving:
  * Face
  * Hair
  * Body
  * Age appearance
  * Main identifying features
- **Result format:** Percentage of the 50 consistency checks passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Consistency checks passed","denominatorLabel":"Total checks (10 × 5 = 50)"}

### Face Consistency (`face-consistency`)
- **Weight:** 17% of Accuracy
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Character consistency
- **Tester question:** Images: face match?
- **Tester hint:** Compared to the reference image: Yes / Mostly / No.
- **Public description:** preservation of the same face
- **How tested:**
  Review the same 10 character images.
  Each image passes when the face clearly looks like the same character.
- **Result format:** Number and percentage of the 10 images that pass.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Images with the same face","denominatorLabel":"Images (10)"}

### Body Consistency (`body-consistency`)
- **Weight:** 17% of Accuracy
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Character consistency
- **Tester question:** Images: body match?
- **Tester hint:** Compared to the reference image: Yes / Mostly / No.
- **Public description:** preservation of body characteristics
- **How tested:**
  Review the same 10 character images.
  Each image passes when the requested height, body type and proportions remain consistent.
- **Result format:** Number and percentage of the 10 images that pass.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Images with the same body","denominatorLabel":"Images (10)"}

### Style Consistency (`style-consistency`)
- **Weight:** 16% of Accuracy
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Character consistency
- **Tester question:** Images: style match?
- **Tester hint:** Compared to the reference image: Yes / Mostly / No.
- **Public description:** preservation of the requested visual style
- **How tested:**
  Use five visual styles.
  Generate two images for each style.
  This produces 10 style tests.
  Each image passes when it clearly matches the requested style.
- **Result format:** Number and percentage of the 10 style tests passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Style tests passed","denominatorLabel":"Tests (10)"}

### Editing Accuracy (`editing-accuracy`)
- **Weight:** 16% of Accuracy
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Image editing accuracy
- **Tester question:** Images: editing accuracy?
- **Tester hint:** Complete 10 image-editing tasks.
- **Public description:** changes only the requested part
- **How tested:**
  Complete 10 image-editing tasks.
  For every task, check:
  * Requested change was made
  * Face stayed the same
  * Body stayed the same
  * Pose stayed the same
  * Background stayed the same
- **Result format:** Percentage of the 50 editing checks passed.
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Editing checks passed","denominatorLabel":"Total checks (10 × 5 = 50)"}

## Experience (`experience`) — 33% of Images
The image-generation experience: speed, failures, where generation is available, custom prompting, editing, NSFW support and cost.

### Speed (`speed`)
- **Weight:** 13% of Experience
- **Required:** yes
- **Measurement:** seconds (seconds)
- **Scoring rule:** bands: ≤10 → 10/10; ≤20 → 8/10; ≤40 → 6/10; ≤90 → 4/10; ≤180 → 2/10; ≤999999 → 0/10
- **Test session:** Generation experience & tools
- **Tester question:** Images: speed?
- **Tester hint:** Time all 20 image-generation attempts.
- **Public description:** median generation time
- **How tested:**
  Time all 20 image-generation attempts.
  Start when generation is submitted.
  Stop when the finished image is available.
- **Result format:** Median generation time in seconds.

### Failures (`failures`)
- **Weight:** 13% of Experience
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10 (inverted)
- **Test session:** Generation experience & tools
- **Tester question:** Images: failures?
- **Tester hint:** Count attempts that fail, remain stuck, produce no image or produce an unusable result.
- **Public description:** failed generations
- **How tested:**
  Count attempts that fail, remain stuck, produce no image or produce an unusable result.
- **Result format:** Number and percentage of failures out of 20 attempts.
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Failed attempts","denominatorLabel":"Attempts (20)"}

### Chat Generation (`chat-generation`)
- **Weight:** 13% of Experience
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Generation experience & tools
- **Tester question:** Images: chat generation?
- **Tester hint:** Request one image in three separate chats.
- **Public description:** image generation inside chat
- **How tested:**
  Request one image in three separate chats.
- **Result format:** Yes, Limited or No.

### Separate Generator (`separate-generator`)
- **Weight:** 13% of Experience
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Generation experience & tools
- **Tester question:** Images: separate generator?
- **Tester hint:** Check whether the platform has a separate image-generation page or tool.
- **Public description:** dedicated image generator
- **How tested:**
  Check whether the platform has a separate image-generation page or tool.
  Create three images through it.
- **Result format:** Yes when all three work, Limited when restrictions apply, and No when no separate generator exists.

### Custom Prompts (`custom-prompts`)
- **Weight:** 12% of Experience
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Generation experience & tools
- **Tester question:** Images: custom prompts?
- **Tester hint:** Enter three different free-form prompts.
- **Public description:** free-form image prompts accepted
- **How tested:**
  Enter three different free-form prompts.
- **Result format:** Yes when all three are accepted, Limited when prompts are heavily restricted, and No when custom prompting is unavailable.

### Image Editing (`image-editing`)
- **Weight:** 12% of Experience
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Generation experience & tools
- **Tester question:** Images: image editing?
- **Tester hint:** Attempt three basic editing tasks:
- **Public description:** basic image-editing tasks supported
- **How tested:**
  Attempt three basic editing tasks:
  1. Change clothing.
  2. Change the background.
  3. Change the pose.
- **Result format:** Number of editing types supported and Yes, Limited or No.

### NSFW Support (`nsfw-support`)
- **Weight:** 12% of Experience
- **Required:** no
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Generation experience & tools
- **Tester question:** Images: nsfw support?
- **Tester hint:** Review the platform’s current rules and complete three allowed adult-content tests where legally …
- **Public description:** adult content supported by platform rules
- **How tested:**
  Review the platform’s current rules and complete three allowed adult-content tests where legally appropriate.
- **Result format:** Yes, Limited, No or Unknown.

# Video (`video`) — 10% of overall
Measures video capabilities, video quality and the generation experience.

## Capabilities (`capabilities`) — 34% of Video
Video features offered: text-to-video, image-to-video, chat video, audio, maximum length and maximum resolution.

### Text-to-Video (`text-to-video`)
- **Weight:** 5% of Capabilities
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Video capabilities
- **Tester question:** Video: text-to-video?
- **Tester hint:** Try to create three videos using only a text prompt.
- **Public description:** videos can be created from a text prompt
- **How tested:**
  Try to create three videos using only a text prompt.
- **Result format:** Yes when all three work, Limited when restrictions apply, and No when unavailable.

### Image-to-Video (`image-to-video`)
- **Weight:** 17% of Capabilities
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Video capabilities
- **Tester question:** Video: image-to-video?
- **Tester hint:** Try to create three videos from three different source images.
- **Public description:** videos can be created from a source image
- **How tested:**
  Try to create three videos from three different source images.
- **Result format:** Yes, Limited or No.

### Chat Video (`chat-video`)
- **Weight:** 17% of Capabilities
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Video capabilities
- **Tester question:** Video: chat video?
- **Tester hint:** Request one video in three separate chats.
- **Public description:** videos can be requested inside chat
- **How tested:**
  Request one video in three separate chats.
- **Result format:** Yes, Limited or No.

### Audio (`audio`)
- **Weight:** 17% of Capabilities
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Video capabilities
- **Tester question:** Video: audio?
- **Tester hint:** Generate three videos and request audio.
- **Public description:** generated sound or speech
- **How tested:**
  Generate three videos and request audio.
  Check separately for:
  * Speech
  * Sound effects
  * Music
- **Result format:** Number of audio types supported and Yes, Limited or No.

### Maximum Length (`maximum-length`)
- **Weight:** 16% of Capabilities
- **Required:** yes
- **Measurement:** seconds (seconds)
- **Scoring rule:** bands: ≤5 → 2/10; ≤10 → 4/10; ≤15 → 6/10; ≤30 → 8/10; ≤60 → 9/10; ≤999999 → 10/10
- **Test session:** Video capabilities
- **Tester question:** Video: maximum length?
- **Tester hint:** Record the longest selectable video length.
- **Public description:** longest selectable video length
- **How tested:**
  Record the longest selectable video length.
  Generate one video using that length to confirm it works.
- **Result format:** Maximum video length in seconds.

### Maximum Resolution (`maximum-resolution`)
- **Weight:** 16% of Capabilities
- **Required:** yes
- **Measurement:** structured (pixels)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Generation experience
- **Tester question:** Video: maximum resolution?
- **Tester hint:** Pick the highest resolution the app can output.
- **Public description:** maximum output resolution
- **How tested:**
  Download the highest-quality video.
  Record the exact width and height in pixels.
- **Result format:** Maximum video resolution.

## Quality (`quality`) — 33% of Video
Quality of generated videos: realism, motion, prompt accuracy, character consistency, visual errors and frame consistency.

### Motion (`motion`)
- **Weight:** 17% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** 3 videos
- **Tester question:** Video: motion quality?
- **Tester hint:** Rate natural movement 1–5 per video in the batch worksheet.
- **Public description:** how natural the movement looks
- **How tested:**
  Review all 10 videos.
  Give each video one point for:
  * Natural body movement
  * Natural facial movement
  * Natural hand movement
  * Stable camera movement
  * Believable physics
- **Result format:** Percentage of the 50 motion checks passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Motion checks passed","denominatorLabel":"Total checks (10 × 5 = 50)"}

### Accuracy (`accuracy`)
- **Weight:** 17% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** 3 videos
- **Tester question:** Video: prompt accuracy?
- **Tester hint:** Rate how closely each video matched the prompt (1–5).
- **Public description:** percentage of instructions followed
- **How tested:**
  Give every prompt five required elements.
  Because every prompt is generated twice, this produces 50 required-element checks.
- **Result format:** Number and percentage of required elements produced correctly.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Required elements present","denominatorLabel":"Total elements (10 × 5 = 50)"}

### Character Consistency (`character-consistency`)
- **Weight:** 17% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** 3 videos
- **Tester question:** Video: character consistency?
- **Tester hint:** Rate whether face, body, and identity stayed consistent (1–5).
- **Public description:** preservation of the character
- **How tested:**
  Review all 10 videos.
  Give every video one point for preserving:
  * Face
  * Hair
  * Body
  * Clothing
  * Main identifying features
- **Result format:** Percentage of the 50 consistency checks passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Consistency checks passed","denominatorLabel":"Total checks (10 × 5 = 50)"}

### Visual Errors (`visual-errors`)
- **Weight:** 16% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10 (inverted)
- **Test session:** 3 videos
- **Tester question:** Video: usable result?
- **Tester hint:** Auto-calculated from ratings and defects.
- **Public description:** videos with broken faces, limbs or movement
- **How tested:**
  Review all 10 videos.
  Count a video as having a major error when it contains:
  * Broken face
  * Extra or missing limb
  * Damaged hand
  * Unnatural body change
  * Broken movement
  * Major background distortion
- **Result format:** Number and percentage of videos with at least one major error.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Videos with a major error","denominatorLabel":"Videos reviewed (10)"}

### Frame Consistency (`frame-consistency`)
- **Weight:** 16% of Quality
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** 3 videos
- **Tester question:** Video: visual stability?
- **Tester hint:** Rate flicker, warping, and frame problems (1–5).
- **Public description:** stability throughout the video
- **How tested:**
  Review all 10 videos from beginning to end.
  Give each video one point when it has no major:
  * Face changes
  * Body changes
  * Clothing changes
  * Object changes
  * Background flicker
- **Result format:** Percentage of the 50 frame-consistency checks passed.
- **Sample size (DB field):** 5
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Stability checks passed","denominatorLabel":"Total checks (10 × 5 = 50)"}

## Experience (`experience`) — 33% of Video
The video-generation experience: speed, failures, ease of use, available controls, regeneration and cost.

### Speed (`speed`)
- **Weight:** 17% of Experience
- **Required:** yes
- **Measurement:** seconds (seconds)
- **Scoring rule:** bands: ≤60 → 10/10; ≤120 → 8/10; ≤300 → 6/10; ≤600 → 4/10; ≤1200 → 2/10; ≤999999 → 0/10
- **Test session:** Generation experience
- **Tester question:** Video: speed?
- **Tester hint:** Time all 10 video generations.
- **Public description:** median generation time
- **How tested:**
  Time all 10 video generations.
  Start when generation is submitted.
  Stop when the finished video is available.
- **Result format:** Median generation time in seconds.

### Failures (`failures`)
- **Weight:** 17% of Experience
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10 (inverted)
- **Test session:** Generation experience
- **Tester question:** Video: failures?
- **Tester hint:** Count videos that fail, remain stuck or produce an unusable result.
- **Public description:** failed generations
- **How tested:**
  Count videos that fail, remain stuck or produce an unusable result.
- **Result format:** Number and percentage of failures out of 10 attempts.
- **Calculation method:** {"kind":"ratio","numeratorLabel":"Failed attempts","denominatorLabel":"Attempts (10)"}

### Ease of Use (`ease-of-use`)
- **Weight:** 17% of Experience
- **Required:** yes
- **Measurement:** scale (score)
- **Scoring rule:** bands: ≤3 → 10/10; ≤5 → 8/10; ≤8 → 6/10; ≤12 → 4/10; ≤999999 → 2/10
- **Test session:** Generation experience
- **Tester question:** Video: ease of use?
- **Tester hint:** How easy is it to create a video? Rate 1 (very hard) to 10 (very easy).
- **Public description:** steps required to create a video
- **How tested:**
  Create three videos.
  Count every click or required action from opening the generator to starting generation.
- **Result format:** Average number of steps across the three tests.

### Regeneration (`regeneration`)
- **Weight:** 16% of Experience
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Generation experience
- **Tester question:** Video: regeneration?
- **Tester hint:** Try to regenerate three finished videos.
- **Public description:** ability to retry or create variations
- **How tested:**
  Try to regenerate three finished videos.
- **Result format:** Number of successful regenerations out of three and Yes, Limited or No.

# Privacy (`privacy`) — 10% of overall
Measures chat privacy, user control, account security, billing privacy and customer support.

## Data Use (`data-use`) — 31% of Privacy
How user data is used: AI training, human review, third-party sharing, advertising, retention and policy clarity.

### Training (`training`)
- **Weight:** 14% of Data Use
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 0/3/10/2
- **Test session:** User data controls (test account)
- **Tester question:** Privacy: data used to train AI?
- **Tester hint:** Does the company say your chats or photos are used to train their AI? Check the privacy policy and settings.
- **Public description:** chats used for AI training
- **How tested:**
  Search the privacy policy, terms, help pages and settings for a clear statement about training.
- **Result format:** Yes, No or Unknown, with the source and date.

### Human Review (`human-review`)
- **Weight:** 14% of Data Use
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 0/3/10/2
- **Test session:** Policy & data-use review
- **Tester question:** Privacy: human review?
- **Tester hint:** Search the privacy policy, terms and help pages for a clear statement about employees or contract…
- **Public description:** humans may review chats
- **How tested:**
  Search the privacy policy, terms and help pages for a clear statement about employees or contractors reading chats.
- **Result format:** Yes, No or Unknown, with the source and date.

### Data Sharing (`data-sharing`)
- **Weight:** 4% of Data Use
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 0/4/10/2
- **Test session:** Policy & data-use review
- **Tester question:** Privacy: data sharing?
- **Tester hint:** Review the list of third parties or categories of companies that receive user data.
- **Public description:** data shared with third parties
- **How tested:**
  Review the list of third parties or categories of companies that receive user data.
  Count the number of third-party categories.
- **Result format:** Yes, Limited, No or Unknown, plus the number of third-party categories.

### Advertising (`advertising`)
- **Weight:** 4% of Data Use
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 0/3/10/2
- **Test session:** Policy & data-use review
- **Tester question:** Privacy: advertising?
- **Tester hint:** Check the privacy policy and account settings for advertising, personalized advertising or profil…
- **Public description:** personal data used for advertising
- **How tested:**
  Check the privacy policy and account settings for advertising, personalized advertising or profiling.
- **Result format:** Yes, No or Unknown.

### Retention (`retention`)
- **Weight:** 20% of Data Use
- **Required:** yes
- **Measurement:** structured
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Policy & data-use review
- **Tester question:** Privacy: retention?
- **Tester hint:** Record the stated storage period for:
- **Public description:** how long data is stored
- **How tested:**
  Record the stated storage period for:
  * Chats
  * Account information
  * Payment information
  * Deleted data
- **Result format:** Number of days, months or years for each type. Use Unknown when no period is provided.

### Policy Clarity (`policy-clarity`)
- **Weight:** 42% of Data Use
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Policy & data-use review
- **Tester question:** Privacy: policy clarity?
- **Tester hint:** Check whether the company clearly answers these six questions:
- **Public description:** how clearly the company explains its practices
- **How tested:**
  Check whether the company clearly answers these six questions:
  1. Are chats used for training?
  2. Can humans read chats?
  3. Is data shared with third parties?
  4. Can users delete their data?
  5. How long is data stored?
  6. What security protection is used?
- **Result format:** Number and percentage of the six questions clearly answered.
- **Calculation method:** {"kind":"checklist","items":["Training use of chats is clearly answered","Human review of chats is clearly answered","Third-party data sharing is clearly answered","Data deletion is clearly answered","Data retention period is clearly answered","Security protection is clearly answered"]}

## User Control (`user-control`) — 28% of Privacy
User control over data: deleting chats, accounts and personal data, training opt-out, data export and consent controls.

### Delete Chats (`delete-chats`)
- **Weight:** 25% of User Control
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** User data controls (test account)
- **Tester question:** Privacy: delete chats?
- **Tester hint:** Create three chats and try to delete each one.
- **Public description:** chats can be deleted
- **How tested:**
  Create three chats and try to delete each one.
- **Result format:** Number successfully deleted out of three and Yes, Limited or No.

### Delete Account (`delete-account`)
- **Weight:** 25% of User Control
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** User data controls (test account)
- **Tester question:** Privacy: delete account?
- **Tester hint:** Check whether account deletion is available directly in the account settings.
- **Public description:** account deletion available in settings
- **How tested:**
  Check whether account deletion is available directly in the account settings.
  Count the steps required to request deletion.
- **Result format:** Yes, Limited or No, plus number of steps.

### Delete Personal Data (`delete-personal-data`)
- **Weight:** 12% of User Control
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** User data controls (test account)
- **Tester question:** Privacy: delete personal data?
- **Tester hint:** Check whether users can request deletion of personal data that may remain outside the visible acc…
- **Public description:** deletion of personal data outside the visible account
- **How tested:**
  Check whether users can request deletion of personal data that may remain outside the visible account.
- **Result format:** Yes, No or Unknown.

### Training Opt-Out (`training-opt-out`)
- **Weight:** 12% of User Control
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** User data controls (test account)
- **Tester question:** Privacy: training opt-out?
- **Tester hint:** Check the settings, privacy policy and help pages for a training opt-out.
- **Public description:** opt-out from AI training available
- **How tested:**
  Check the settings, privacy policy and help pages for a training opt-out.
- **Result format:** Yes, Limited, No or Unknown.

### Export Data (`export-data`)
- **Weight:** 12% of User Control
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** User data controls (test account)
- **Tester question:** Privacy: export data?
- **Tester hint:** Request an export of the test account’s data.
- **Public description:** account data can be exported
- **How tested:**
  Request an export of the test account’s data.
  Record whether the export arrives within 30 days.
- **Result format:** Yes, Limited or No, plus number of days required.

## Security (`security`) — 28% of Privacy
Account and payment security: encryption, account protections, two-factor authentication, billing privacy and security incidents.

### Encryption (`encryption`)
- **Weight:** 7% of Security
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Security & billing
- **Tester question:** Privacy: end-to-end encryption?
- **Tester hint:** Does the company clearly claim end-to-end encryption for chats or messages?
- **Public description:** end-to-end encryption claimed
- **How tested:**
  Check whether the company clearly states that it uses:
  * Encryption in transit
  * Encryption at rest
  * End-to-end encryption
  Do not assume encryption is present when the company does not state it.
- **Result format:** Number of the three encryption types clearly confirmed.

### Two-Factor Authentication (`two-factor-authentication`)
- **Weight:** 7% of Security
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Security & billing
- **Tester question:** Privacy: two-factor authentication?
- **Tester hint:** Try to enable two-factor authentication on the test account.
- **Public description:** two-factor authentication available
- **How tested:**
  Try to enable two-factor authentication on the test account.
- **Result format:** Yes, Limited or No, plus the supported method.

### Billing Descriptor (`billing-descriptor`)
- **Weight:** 43% of Security
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Security & billing
- **Tester question:** Privacy: billing descriptor?
- **Tester hint:** Check the checkout page and payment help pages.
- **Public description:** shown before payment
- **How tested:**
  Check the checkout page and payment help pages.
- **Result format:** Yes when the billing name is shown before payment, No when it is not shown, and Unknown when it cannot be confirmed.

### Security Incidents (`security-incidents`)
- **Weight:** 43% of Security
- **Required:** yes
- **Measurement:** count (count)
- **Scoring rule:** bands: ≤0 → 10/10; ≤1 → 6/10; ≤2 → 3/10; ≤999999 → 0/10
- **Test session:** Security & billing
- **Tester question:** Privacy: past security incidents?
- **Tester hint:** Add links to news or official statements about breaches or leaks (past 5 years). Optional note.
- **Public description:** known or disclosed data breaches
- **How tested:**
  Search for confirmed security incidents from the previous five years.
  Only count incidents confirmed by the company, a regulator, a court filing or a reliable security report.
- **Result format:** Number of confirmed incidents during the previous five years.

## Support (`support`) — 13% of Privacy
How easy it is to reach customer support, how fast they respond, and how helpful they are.

### Support Available (`support-available`)
- **Weight:** 0% of Support
- **Required:** yes
- **Measurement:** boolean
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Customer support
- **Tester question:** Support: offered?
- **Tester hint:** Does the app offer any way to contact support? If yes, add email, contact page, Discord, Reddit, or Telegram links.
- **Public description:** customer support offered
- **How tested:**
  Record whether the platform offers any way for users to contact support.
- **Result format:** Yes or No.

### Support Channels (`support-channels`)
- **Weight:** 0% of Support
- **Required:** no
- **Measurement:** structured
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Customer support
- **Testing UI:** hidden (combined control)
- **Public description:** support contact links
- **How tested:**
  Record any official support email, contact page, Discord, Reddit, or Telegram links found.
  All fields optional.
- **Result format:** Support email, contact page, and community links.

### Ease of Contact (`support-reach`)
- **Weight:** 34% of Support
- **Required:** yes
- **Measurement:** scale
- **Scoring rule:** linear: map 0–10 → 0–10
- **Test session:** Customer support
- **Tester question:** Support: easy to reach?
- **Tester hint:** How easy is it for a paying user to contact support? Pick Poor → Excellent.
- **Public description:** how easy it is to reach customer support
- **How tested:**
  Find all official support channels (email, chat, form, help center contact, social).
  Rate how easy it is for a paying user to start a support request.
- **Result format:** Poor, Fair, Good, Very good or Excellent.
- **Options:** [{"label":"Poor","value":2,"description":"Hard to reach, slow, or unhelpful"},{"label":"Fair","value":4,"description":"Below average"},{"label":"Good","value":6,"description":"Acceptable"},{"label":"Very good","value":8,"description":"Strong experience"},{"label":"Excellent","value":10,"description":"Outstanding"}]

### Response Speed (`support-speed`)
- **Weight:** 33% of Support
- **Required:** yes
- **Measurement:** scale
- **Scoring rule:** linear: map 0–10 → 0–10
- **Test session:** Customer support
- **Tester question:** Support: response speed?
- **Tester hint:** After sending a real support message, rate how fast they replied (overall impression, not seconds).
- **Public description:** how quickly support responds
- **How tested:**
  Send one real support request about a non-destructive issue.
  Rate response speed using your overall impression — do not record exact seconds unless helpful in notes.
- **Result format:** Poor, Fair, Good, Very good or Excellent.
- **Options:** [{"label":"Poor","value":2,"description":"Hard to reach, slow, or unhelpful"},{"label":"Fair","value":4,"description":"Below average"},{"label":"Good","value":6,"description":"Acceptable"},{"label":"Very good","value":8,"description":"Strong experience"},{"label":"Excellent","value":10,"description":"Outstanding"}]

### Helpfulness (`support-helpfulness`)
- **Weight:** 33% of Support
- **Required:** yes
- **Measurement:** scale
- **Scoring rule:** linear: map 0–10 → 0–10
- **Test session:** Customer support
- **Tester question:** Support: helpfulness?
- **Tester hint:** Did the reply solve or clearly progress your issue? Pick Poor → Excellent.
- **Public description:** how helpful the support reply was
- **How tested:**
  Using the same support thread, rate whether the reply solved or clearly progressed your issue.
- **Result format:** Poor, Fair, Good, Very good or Excellent.
- **Options:** [{"label":"Poor","value":2,"description":"Hard to reach, slow, or unhelpful"},{"label":"Fair","value":4,"description":"Below average"},{"label":"Good","value":6,"description":"Acceptable"},{"label":"Very good","value":8,"description":"Strong experience"},{"label":"Excellent","value":10,"description":"Outstanding"}]

# Pricing (`pricing`) — 10% of overall
Measures what users pay and what they receive for that price.

## Plan Value (`plan-value`) — 30% of Pricing
What the subscription costs and includes: monthly and annual prices, included credits, features, limits, and annual discount.

### Monthly Price (`monthly-price`)
- **Weight:** 20% of Plan Value
- **Required:** yes
- **Measurement:** currency (USD)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Monthly price?
- **Tester hint:** Cheapest paid monthly plan in USD (filled from Pricing tab when available).
- **Public description:** standard monthly subscription price
- **How tested:**
  Record the full non-discounted price of the main monthly subscription.
- **Result format:** Monthly price.
- **Example answer:** 12.99 USD per month
- **Public result template:** ${value}/month

### Annual Price (`annual-price`)
- **Weight:** 15% of Plan Value
- **Required:** yes
- **Measurement:** currency (USD)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Annual price?
- **Tester hint:** Effective monthly cost when paying yearly.
- **Public description:** effective monthly price on annual billing
- **How tested:**
  Record the total annual payment and divide it by 12.
- **Result format:** Total annual price and effective monthly price.

### Included Features (`included-features`)
- **Weight:** 20% of Plan Value
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Plan inclusions & limits
- **Tester question:** Included features?
- **Tester hint:** Tick core features included without extra payment.
- **Public description:** core features included without extra payment
- **How tested:**
  Check whether these 10 features are included without extra payment:
  1. Standard chat
  2. Character library
  3. Character creation
  4. Image generation
  5. Image editing
  6. Video generation
  7. Voice messages
  8. Voice calls
  9. Memory controls
  10. Message regeneration
- **Result format:** Number and percentage of the 10 features included.
- **Calculation method:** {"kind":"checklist","items":["Standard chat","Character library","Character creation","Image generation","Image editing","Video generation","Voice messages","Voice calls","Memory controls","Message regeneration"]}

### Included Credits (`included-credits`)
- **Weight:** 25% of Plan Value
- **Required:** yes
- **Measurement:** count (credits)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Included credits?
- **Tester hint:** Tokens or credits included with the subscription.
- **Public description:** credits or tokens included in the subscription
- **How tested:**
  Record the exact credits or tokens included in the selected subscription.
- **Result format:** Number of credits per billing period.

### Plan Limits (`plan-limits`)
- **Weight:** 10% of Plan Value
- **Required:** yes
- **Measurement:** structured
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Plan inclusions & limits
- **Tester question:** Plan limits?
- **Tester hint:** Daily or monthly caps on messages, images, video, voice, characters.
- **Public description:** daily or monthly usage limits
- **How tested:**
  Record the exact daily or monthly limits for:
  * Messages
  * Images
  * Videos
  * Voice messages
  * Voice calls
  * Created characters
- **Result format:** Exact limit for each feature or Unknown.

### Annual Discount (`annual-discount`)
- **Weight:** 10% of Plan Value
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Annual discount?
- **Tester hint:** Percent saved vs paying monthly for 12 months.
- **Public description:** savings vs paying monthly for 12 months
- **How tested:**
  Compare the annual plan total to 12× the monthly price on the same tier.
  Record the percentage saved when paying annually.
- **Result format:** Percentage discount on annual billing.

## Usage Costs (`usage-costs`) — 35% of Pricing
Per-use costs for images, video, voice, calls, credit top-ups, and estimated monthly spend for regular use.

### Image Cost (`image-cost`)
- **Weight:** 20% of Usage Costs
- **Required:** yes
- **Measurement:** currency (USD)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Image cost?
- **Tester hint:** USD per usable image (total generation cost ÷ usable images when possible).
- **Public description:** estimated cost per image
- **How tested:**
  Calculate how many credits one standard image costs.
  Calculate the price of those credits using the cheapest credit package available to normal users.
  Display as cost per image.
- **Result format:** Cost per standard image.

### Video Cost (`video-cost`)
- **Weight:** 25% of Usage Costs
- **Required:** yes
- **Measurement:** currency (USD)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Video cost?
- **Tester hint:** USD per 10 seconds of video — normalize shorter clips to this unit.
- **Public description:** estimated cost per 10 seconds of video
- **How tested:**
  Calculate the dollar cost for the standard video length configured in the Pricing tab.
  Normalize to cost per 10 seconds (e.g. 5 sec at $1.20 → $2.40 / 10 sec).
- **Result format:** Cost per 10 seconds of video.

### Voice Cost (`voice-cost`)
- **Weight:** 15% of Usage Costs
- **Required:** yes
- **Measurement:** currency (USD)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Voice cost?
- **Tester hint:** USD per 10 seconds of voice message.
- **Public description:** estimated cost per 10 seconds of voice
- **How tested:**
  Calculate how many credits one voice message costs.
  Normalize to cost per 10 seconds using the duration configured in the Pricing tab.
- **Result format:** Cost per 10 seconds of voice.

### Call Cost (`call-cost`)
- **Weight:** 10% of Usage Costs
- **Required:** yes
- **Measurement:** currency (USD)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Call cost?
- **Tester hint:** USD per minute of voice calling.
- **Public description:** estimated cost per voice call minute
- **How tested:**
  Calculate how many credits one minute of voice calling costs.
  Calculate the price using the cheapest credit package available to normal users.
- **Result format:** Cost per voice call minute.

### Top-Up Value (`top-up-value`)
- **Weight:** 10% of Usage Costs
- **Required:** yes
- **Measurement:** structured
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Top-up value?
- **Tester hint:** Smallest and largest credit packages plus cost per credit.
- **Public description:** cheapest and most expensive credit packages
- **How tested:**
  Record:
  * Package price
  * Included credits
  * Cost per credit
  Do this for the smallest and largest packages.
- **Result format:** Smallest package, largest package and cost per credit.

### Monthly Spend (`monthly-spend`)
- **Weight:** 20% of Usage Costs
- **Required:** yes
- **Measurement:** currency (USD)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Monthly spend?
- **Tester hint:** Estimated monthly cost for regular use (500 msgs, 20 images, 4 videos, 30 voice min).
- **Public description:** estimated monthly cost for regular use
- **How tested:**
  Calculate the full cost of the regular-use example:
  * Required subscription
  * 500 chat messages
  * 20 images
  * 4 videos
  * 30 voice minutes
  * Required credit top-ups
  * Required payment fees
- **Result format:** Estimated monthly cost for regular use.

## Free Access (`free-access`) — 20% of Pricing
What users can do without paying: free chat, images, video, voice, characters, overall free value, and restrictions.

### Free Chat (`free-chat`)
- **Weight:** 20% of Free Access
- **Required:** yes
- **Measurement:** count (messages)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Free access
- **Tester question:** Free chat?
- **Tester hint:** How many messages can a free user send? Use a short label like 20 messages.
- **Public description:** free messages available without paying
- **How tested:**
  Record how many chat messages a free user can send before payment is required.
  Include daily/monthly caps if they reset.
- **Result format:** Number of free messages (e.g. 20 messages).

### Free Images (`free-images`)
- **Weight:** 20% of Free Access
- **Required:** yes
- **Measurement:** count (images)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Free access
- **Tester question:** Free images?
- **Tester hint:** How many images can a free user generate? e.g. 3 images.
- **Public description:** free images available without paying
- **How tested:**
  Record how many images a free user can generate before payment is required.
- **Result format:** Number of free images (e.g. 3 images).

### Free Video (`free-video`)
- **Weight:** 15% of Free Access
- **Required:** yes
- **Measurement:** count (videos)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Free access
- **Tester question:** Free video?
- **Tester hint:** How many videos can a free user create? e.g. 1 video.
- **Public description:** free videos available without paying
- **How tested:**
  Record how many videos a free user can generate before payment is required.
- **Result format:** Number of free videos (e.g. 1 video).

### Free Voice (`free-voice`)
- **Weight:** 10% of Free Access
- **Required:** yes
- **Measurement:** seconds (seconds)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Free access
- **Tester question:** Free voice?
- **Tester hint:** Free voice allowance in seconds — e.g. 30 sec voice.
- **Public description:** free voice available without paying
- **How tested:**
  Record how many seconds of voice messages or calls a free user gets before payment is required.
- **Result format:** Free voice duration (e.g. 30 sec voice).

### Free Characters (`free-characters`)
- **Weight:** 10% of Free Access
- **Required:** yes
- **Measurement:** count (characters)
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Test session:** Free access
- **Tester question:** Free characters?
- **Tester hint:** How many characters can a free user create or chat with? e.g. 1 character.
- **Public description:** free characters available without paying
- **How tested:**
  Record how many characters a free user can create or chat with before payment is required.
- **Result format:** Number of free characters (e.g. 1 character).

### Free Value (`free-value`)
- **Weight:** 15% of Free Access
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Free access
- **Tester question:** Free trial without credit card?
- **Tester hint:** Yes if users can try without entering payment details.
- **Public description:** overall free tier value and payment requirements
- **How tested:**
  Record whether a meaningful free tier exists without a credit card.
  Note: "No card needed", trial length, or card-required trial.
- **Result format:** Short label (e.g. No card needed).

### Restrictions (`restrictions`)
- **Weight:** 10% of Free Access
- **Required:** yes
- **Measurement:** structured
- **Scoring rule:** manual (structured answer; tester or override assigns 0–10)
- **Public description:** free access limits and reset rules
- **How tested:**
  Record how free allowances reset or expire.
  Examples: Resets daily, 7-day trial, credits expire after 30 days.
- **Result format:** Short restriction label (e.g. Resets daily).

## Billing (`billing`) — 15% of Pricing
Pricing clarity, paywalls, credit expiry, refunds, cancellation, and payment privacy.

### Pricing Clarity (`pricing-clarity`)
- **Weight:** 20% of Billing
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10
- **Test session:** Billing & policies
- **Tester question:** Price clarity?
- **Tester hint:** Tick what the site shows before checkout (price, limits, refunds, etc.).
- **Public description:** how clearly costs are explained before payment
- **What we measure:** Check which of the eight key pricing details are clearly shown before payment. The result is calculated automatically from the checks.
- **How tested:**
  Check whether the platform clearly shows these eight items before payment:
  1. Subscription price
  2. Renewal period
  3. Included credits
  4. Image cost
  5. Video cost
  6. Usage limits
  7. Credit expiry
  8. Refund policy
- **Result format:** Number and percentage of the eight pricing details clearly shown before payment.
- **Calculation method:** {"kind":"checklist","items":["Subscription price is visible","Renewal period is visible","Included credits are visible","Image cost is visible","Video cost is visible","Usage limits are visible","Credit expiry is visible","Refund policy is visible"]}
- **Example answer:** 6 of 8 checks passed → 75%

### Paywalls (`paywalls`)
- **Weight:** 20% of Billing
- **Required:** yes
- **Measurement:** percentage (%)
- **Scoring rule:** linear: map 0–100 → 0–10 (inverted)
- **Tester question:** Paywalls?
- **Tester hint:** Deprecated — removed from testing.
- **Public description:** core features behind an additional paywall
- **How tested:**
  Check the same 10 core features used under Included Features.
  Count how many require:
  * A more expensive subscription
  * Separate credits
  * A separate purchase
- **Result format:** Number and percentage of the 10 features behind an additional paywall.

### Credit Expiry (`credit-expiry`)
- **Weight:** 15% of Billing
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 0/5/10/2
- **Test session:** Billing & policies
- **Tester question:** Credit expiry?
- **Tester hint:** Do purchased credits expire? When?
- **Public description:** whether purchased credits expire
- **How tested:**
  Check the pricing terms and account balance information.
- **Result format:** Yes, No or Unknown, plus the expiry period.

### Refunds (`refunds`)
- **Weight:** 15% of Billing
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Billing & policies
- **Tester question:** Refunds?
- **Tester hint:** Can you get money back? Any rules or time limits?
- **Public description:** refund availability and restrictions
- **How tested:**
  Review the refund policy.
  Record:
  * Whether refunds are allowed
  * Refund request period
  * Important restrictions
- **Result format:** Yes, Limited, No or Unknown.

### Cancellation (`cancellation`)
- **Weight:** 15% of Billing
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Test session:** Billing & policies
- **Tester question:** Easy cancellation?
- **Tester hint:** Yes, Limited, or No — how easy it is to cancel without support.
- **Public description:** how easy it is to cancel a subscription
- **How tested:**
  Try to cancel or locate cancellation instructions.
  Record:
  * Self-service cancellation available
  * Steps required
  * Whether support contact is needed
- **Result format:** Yes, Limited, No or Unknown.

### Payment Privacy (`payment-privacy`)
- **Weight:** 15% of Billing
- **Required:** yes
- **Measurement:** yes_limited_no
- **Scoring rule:** yes/limited/no/unknown → 10/5/0/0
- **Testing UI:** hidden (pricing autofill)
- **Tester question:** Payment & privacy?
- **Tester hint:** Filled from Pricing tab discreet billing — not entered in testing.
- **Public description:** discreet billing and payment privacy
- **How tested:**
  Check checkout pages and payment help for:
  * Discreet bank statement descriptor
  * Whether billing name is shown before payment
  * Privacy of payment method on statements
- **Result format:** Yes, Limited, No or Unknown.

---

# Seed file drift (DB vs scripts/seed/methodology-data.ts)

**In live DB but NOT in seed file:**
- characters/anime-female-count
- characters/anime-male-count
- characters/female-count
- characters/male-count
- characters/non-binary-count
- characters/other-count
- characters/transgender-count
- customization/body-type
- customization/breast-size
- customization/eye-color
- customization/hair-color
- customization/hair-style
- customization/kink-options
- customization/outfits
- pricing/paywalls
- pricing/restrictions

**In seed file but NOT in live DB:**
- characters/amount
- characters/genders
- customization/body
- customization/clothing
- customization/combinations
- customization/communication
- customization/detail-level
- customization/face
- customization/gender
- customization/hair
- images/cost
- images/detail
- privacy/account-security
- privacy/billing-privacy
- privacy/consent-controls
- video/controls
- video/cost
- video/realism
