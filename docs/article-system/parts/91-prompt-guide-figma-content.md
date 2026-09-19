# OurDream AI Prompt Guide — Figma content extraction

Source: Figma file `iaUwrRvpkEq7RrBpPLxA6j`
Desktop frame `316:3506` → Main container `316:3531` (740 × 17360, x=190 y=56)
Mobile frame `316:4531` (not extracted here)

All strings below are VERBATIM from Figma — curly quotes, arrows, capitalisation,
typos and spacing are preserved as-is. Do not normalise them when building.

---

## 1. Ordered map — the 112 direct children of Main (`316:3531`)

```
  0  316:3533         Article / Header
  1  316:3552         Paragraph
  2  316:3553         Paragraph
  3  316:3554         Section space
  4  316:3555         H2
  5  316:3556         Paragraph
  6  316:3557         Article / Step-by-Step Workflow
  7  316:3616         Paragraph
  8  316:3617         Paragraph
  9  316:3618         Article / Key Takeaway
 10  316:3626         Paragraph
 11  316:3627         Section space
 12  316:3628         H2
 13  316:3629         Paragraph
 14  316:3630         Paragraph
 15  316:3631         Section space
 16  316:3632         H3
 17  316:3633         Paragraph
 18  316:3634         Article / Important
 19  316:3641         Article / Comparison A/B
 20  316:3661         Section space
 21  316:3662         H3
 22  316:3663         Paragraph
 23  316:3664         Paragraph
 24  316:3665         Article / Prompt Structure
 25  316:3711         Paragraph
 26  316:3712         Paragraph
 27  316:3713         Article / Prompt Comparison
 28  316:3736         Section space
 29  316:3737         H3
 30  316:3738         Paragraph
 31  316:3739         Paragraph
 32  316:3740         Article / Prompt Structure
 33  316:3784         Article / Tip
 34  316:3791         Section space
 35  316:3792         H3
 36  316:3793         Paragraph
 37  316:3794         Paragraph
 38  316:3795         Paragraph
 39  316:3796         List
 40  316:3817         Paragraph
 41  316:3818         Article / Prompt
 42  316:3829         Paragraph
 43  316:3830         Paragraph
 44  316:3831         Figure — writing-style — single W
 45  316:3834         Section space
 46  316:3835         H2
 47  316:3836         Paragraph
 48  316:3837         Paragraph
 49  316:3838         Paragraph
 50  316:3839         Paragraph
 51  316:3840         Figure — casino-original — single 
 52  316:3843         Paragraph
 53  316:3844         Long prompt — collapsed
 54  316:3865         Paragraph
 55  316:3866         Article / Prompt (code)
 56  316:3878         Article / AIGE Test
 57  316:3956         Section space
 58  316:3957         H2
 59  316:3958         Paragraph
 60  316:3959         Paragraph
 61  316:3960         Paragraph
 62  316:3961         Paragraph
 63  316:3962         Article / Step-by-Step Workflow
 64  316:4019         Article / AIGE Test
 65  316:4138         Paragraph
 66  316:4139         Section space
 67  316:4140         H2
 68  316:4141         Paragraph
 69  316:4142         Section space
 70  316:4143         H3
 71  316:4144         Paragraph
 72  316:4145         Paragraph
 73  316:4146         Article / Prompt
 74  316:4157         Paragraph
 75  316:4158         Paragraph
 76  316:4159         Section space
 77  316:4160         H3
 78  316:4161         Paragraph
 79  316:4162         Paragraph
 80  316:4163         Article / Tip
 81  316:4170         Section space
 82  316:4171         H3
 83  316:4172         Paragraph
 84  316:4173         Paragraph
 85  316:4174         Paragraph
 86  316:4175         Paragraph
 87  316:4176         Section space
 88  316:4177         H3
 89  316:4178         Paragraph
 90  316:4179         Article / Prompt Comparison
 91  316:4202         Section space
 92  316:4203         H3
 93  316:4204         Paragraph
 94  316:4205         Paragraph
 95  316:4206         Paragraph
 96  316:4207         Section space
 97  316:4208         H3
 98  316:4209         Article / What I Learned
 99  316:4217         Article / Comparison A/B
100  316:4237         Paragraph
101  316:4238         Article / Key Takeaway
102  316:4246         Section space
103  316:4247         H2
104  316:4248         Paragraph
105  316:4249         Paragraph
106  316:4250         Article / Step-by-Step Workflow
107  316:4335         Section space
108  316:4336         H2
109  316:4337         FAQ
110  316:4418         Section space
111  316:4419         Article / Related Guides
```

### Geometry summary (from `get_metadata` on `316:3531`)

Every direct child is `x=0, width=740` **except**:

| index | node | x | width | note |
|---|---|---|---|---|
| 51 | `316:3840` Figure — casino-original | 180 | **380** | centred "medium" figure — intentional per the Image + Caption component doc |

Section-space heights: `28` before every H2, `8` before every H3 — consistent throughout.

`316:3844` (Long prompt — collapsed) is a 740 × **520** clipping frame; the
`Article / Prompt (code)` instance inside it is 740 × **6107** and is deliberately
cropped by the fade + "Show full prompt" overlay.

---

## 2. Per-block text content, in Figma order

Only the non-plain children are documented (i.e. everything whose name is not
`Paragraph`, `H2`, `H3`, `H4` or `Section space`). 27 blocks.

---

### [0] `316:3533` — Article / Header

| role | text |
|---|---|
| breadcrumb 1 | `Home` |
| breadcrumb 2 | `Guides` |
| breadcrumb 3 (current) | `OurDream AI Prompt Guide` |
| title (H1) | `OurDream AI Prompt Guide` |
| meta — author | `Herman Carter` |
| meta — date | `· September 10, 2026` |

Notes: the component ships with an optional one-sentence description and a read
time; **both are hidden in this instance**. The meta date string includes the
leading middle dot and space (`· September 10, 2026`). Avatar = `Brand / Avatar Herman`, 28px.

---

### [6] `316:3557` — Article / Step-by-Step Workflow (4 steps, title-only)

| step | node | number | step title | step body | example | image |
|---|---|---|---|---|---|---|
| 1 | `316:3558` | `1` | `You tell OurDream what you want` | *(description hidden)* | — | no |
| 2 | `316:3574` | `2` | `The AI reads your prompt` | *(description hidden)* | — | no |
| 3 | `316:3588` | `3` | `It creates the result based on your instructions` | *(description hidden)* | — | no |
| 4 | `316:3602` | `4` | `If the result is wrong, you change the prompt and try again` | *(description hidden)* | — | no |

- Connector is ON for steps 1–3, OFF for step 4 (correct per component rule).
- No step has media.
- Step 4's hidden props carry whitespace-only overrides: `description=" "`, `example=" "`.

---

### [9] `316:3618` — Article / Key Takeaway

| role | text |
|---|---|
| label | `Key takeaway` |
| body | `Prompt quality isn’t about stuffing in more keywords. It’s about giving the right information to the right generator.` |

Icon: `Icon / badge-check`. Pink accent bar on the left.

---

### [18] `316:3634` — Article / Important

| role | text |
|---|---|
| label | `Important` |
| body | `The important thing to remember is that character prompts should describe permanent features, not temporary ones.` |

Icon: `Icon / alert`. Background: `score/mid-soft` (#ffedd5).

---

### [19] `316:3641` — Article / Comparison A/B

| role | text |
|---|---|
| card title | *(hidden — no title present)* |
| option A letter | `A` |
| option A label | `Temporary detail` |
| option A body | `For example, if you add “wearing a hospital uniform” to the character prompt, OurDream may keep trying to generate that outfit later, even when you want your character to wear something different.` |
| option B letter | `B` |
| option B label | `Permanent feature` |
| option B body | `Something like “big blue eyes” makes much more sense because that is a feature you normally want the character to keep.` |
| verdict | *(hidden — no verdict line present)* |
| "Best for" line | *(hidden — not present on either panel)* |

---

### [24] `316:3665` — Article / Prompt Structure

| role | text |
|---|---|
| label | `Image prompt structure` |
| chip 1 | `subject` |
| chip 2 | `action/pose` |
| chip 3 | `environment` |
| chip 4 | `clothing/props` |
| chip 5 | `lighting` |
| chip 6 | `composition` |
| chip 7 | `visual style` |
| chip 8 | *(hidden; override value is a single space `" "`)* |

Chips are joined by `Icon / arrow-right` separators (rendered as →).
Chip 5 (`lighting`) is **not overridden** — it is the component's default value.

---

### [27] `316:3713` — Article / Prompt Comparison

| role | text |
|---|---|
| side A label (muted, ×) | `NO STRUCTURE` |
| side A prompt | `A woman at the beach at sunset wearing a black dress, cinematic, sitting down, beautiful lighting, realistic photo.` |
| side B label (pink, ✓) | `WITH STRUCTURE` |
| side B copy action | `Copy` |
| side B prompt | `Woman → sitting on the sand → tropical beach at sunset → black summer dress → warm golden-hour lighting → medium shot, eye level → realistic photography` |
| note line underneath | `The second version gives the same basic idea, but each part of the prompt has a clear purpose.` |

The arrows inside side B's prompt are real `→` (U+2192) characters in the text string.

---

### [32] `316:3740` — Article / Prompt Structure

| role | text |
|---|---|
| label | `Video prompt template` |
| chip 1 | `starting state` |
| chip 2 | `subject movement` |
| chip 3 | `expression/action` |
| chip 4 | `camera movement` |
| chip 5 | `pacing` |
| chip 6 | `ending state` |
| chip 7 | *(hidden; override value `" "`)* |
| chip 8 | *(hidden; override value `" "`)* |

---

### [33] `316:3784` — Article / Tip

| role | text |
|---|---|
| label | `Tip` |
| body | `When generating videos on OurDream AI you can actually pick from text-to-video or image-to-video. The second option is recommended, as it’s significantly easier to get what you want.` |

Icon: `Icon / bulb`.

---

### [39] `316:3796` — List (5 bulleted items)

| # | node | text |
|---|---|---|
| 1 | `316:3800` | `make replies shorter or longer` |
| 2 | `316:3804` | `change the tone of the conversation` |
| 3 | `316:3808` | `move the story forward` |
| 4 | `316:3812` | `tell the AI to focus on a specific detail` |
| 5 | `316:3816` | `correct something the AI misunderstood` |

Style: Article/Body Desktop (Inter 18 / 31). Bullet = 6px ellipse.

---

### [41] `316:3818` — Article / Prompt (Kind = Text)

| role | text |
|---|---|
| label | `OOC command` |
| copy action | `Copy` |
| body (prompt) | `(OOC: Keep your replies short and playful.)` |

---

### [44] `316:3831` — Figure — writing-style — single W (Article / Image + Caption)

| role | text |
|---|---|
| caption | `Writing style and chat controls inside OurDream AI` |

Wide figure: 740 × 497.

---

### [51] `316:3840` — Figure — casino-original — single (Article / Image + Caption)

| role | text |
|---|---|
| caption | `Original image. Source: Pinterest` |

Medium/centred figure: 380 × 499 at x=180.
Layer name has a **trailing space**: `Figure — casino-original — single `.

---

### [53] `316:3844` — Long prompt — collapsed

Wrapper frame (740 × 520, clipping) containing:

**a) `316:3845` — Article / Prompt (code)**

| role | text |
|---|---|
| label | `JSON prompt` |
| copy action | `Copy` |
| body | see full text below |

**b) `316:3859` — Fade + Show full prompt** (gradient overlay to `#f7f7f6`)

| role | text |
|---|---|
| button label (`316:3860`) | `Show full prompt` |

Button: secondary pill, 173 × 40, with `Icon / chevron-down`.

**Full body text (mono, Geist Mono 14/23), verbatim:**

Blank separator lines in the Figma text are not empty — each contains a single
zero-width space (U+200B). They are shown here as blank lines.

```
Create a highly realistic 4:5 vertical social-media photograph closely matching the supplied reference image.

The subject is an adult woman seated sideways on a cream-and-red padded casino chair inside a busy casino gaming floor.

COMPOSITION AND POSE

She sits sideways with her hips angled away from the camera while rotating her upper torso and face back toward the camera.

Her right arm is raised, with the elbow extending outward above shoulder level. Her right hand rests naturally in her hair around the crown/back of her head.

Her left shoulder sits slightly lower. Her left arm falls naturally downward, with her hand resting lightly near her forward thigh.

Her fingers should look relaxed and anatomically correct.

Both legs are bent while seated and extend diagonally toward the lower-left portion of the frame. The lower legs and feet are outside the crop.

Her head is turned toward the camera with a very slight tilt toward the raised arm and a subtly lowered chin.

The posture should feel relaxed and naturally posed rather than rigid.

EXPRESSION

She looks directly toward the camera.

Use:
- relaxed eyes
- subtle cheek lift
- relaxed eyebrows
- small closed-mouth smile
- slight natural asymmetry in the smile
- no visible teeth

FACE

Match the visible facial structure in the reference image closely.

Important characteristics:
- soft oval-to-heart facial outline
- cheek region slightly wider than the jaw
- gradually tapered lower face
- softly rounded, slightly pointed chin
- medium-sized horizontally elongated eyes
- subtly elevated outer eye corners
- medium-thickness groomed eyebrows with gentle arches
- narrow-to-medium straight-looking nose
- softly defined rounded nose tip
- medium-width mouth
- lower lip moderately fuller than upper lip
- soft cupid's bow
- natural left-right facial differences

Preserve the original proportions and feature spacing.

Do not artificially enlarge the eyes, reduce the nose, enlarge the lips, sharpen the jaw, or make the face perfectly symmetrical.

SKIN

Use a warm medium-light to medium tan appearance with golden tones influenced by casino lighting.

Preserve realistic:
- skin texture
- subtle tonal variation
- mild under-eye shading
- slight natural skin sheen
- different illumination across the face, shoulders, arms and legs
- warm light mixed with cool blue reflections

Avoid excessively smooth or plastic-looking skin.

MAKEUP

Polished evening makeup with moderate intensity:
- even complexion
- subtle warm cheek definition
- peachy warm blush
- neutral brown/taupe eye makeup
- dark upper lash definition
- medium-to-long dark lashes
- groomed brown-toned eyebrows
- nude-pink lips
- subtle satin/gloss finish

Keep the makeup natural-looking and believable.

HAIR

Very long, dense blonde hair extending approximately to the waist.

Hair characteristics:
- light golden and beige blonde tones
- darker blonde/light-brown roots
- dimensional highlights and lowlights
- near-center part
- large loose S-shaped waves
- moderate volume at the crown
- several distinct locks falling over both shoulders
- long strands hanging across the front of the torso
- natural irregular strands around the face and crown
- the raised hand slightly lifts and compresses the hair around the crown

Do not turn the hair into one uniform mass. Preserve individual locks, uneven strand placement and realistic gravity.

WARDROBE

She wears an elegant fitted black sleeveless sequined cocktail dress.

Dress characteristics:
- high round neckline
- sleeveless construction
- fitted silhouette
- black stretch backing fabric
- dense reflective black sequins
- blue, cyan, green and silver reflections caused by surrounding casino lights
- realistic fabric tension around the seated waist and hips
- subtle natural folds from sitting
- no visible logos

Accessories:
- delicate necklace
- thin metallic ring on the lowered hand

CASINO ENVIRONMENT

Recreate an authentic indoor casino slot-machine area.

Several large vertically oriented slot machines stand immediately behind the subject.

Important details:
- tall black gaming cabinets
- intense electric-blue illuminated borders
- large colorful displays
- blue aquatic and diamond-inspired graphics
- large jackpot-style numerical displays
- colorful illuminated upper screens
- cyan and blue interface graphics
- glossy black gaming consoles
- touchscreen control panels
- illuminated buttons and payment controls
- additional colorful gaming machines deeper in the room
- empty padded casino chairs
- cream upholstery with red accents
- dark burgundy patterned casino carpet
- geometric faceted ceiling panels in muted warm beige/pink tones
- dark gaps between machine rows
- beverage cans on the gaming console at the right
- small transparent cup containing an orange-colored drink

The environment should remain visually busy and authentic rather than simplified.

FRAMING

Vertical 4:5 composition.

Frame approximately from above the illuminated gaming displays down to below the subject's knees.

The subject sits around the middle of the image.

Her face is located in the upper-middle region.

Large slot machines fill most of the upper background.

The casino chair remains clearly visible behind and underneath her.

Another casino chair is partially visible along the left side.

Part of the gaming console remains visible on the right.

Keep very little empty space.

CAMERA

Make the photograph resemble a genuine image taken by another person using a modern smartphone rear camera.

Camera characteristics:
- photographer approximately 1.5–2 meters away
- camera slightly above the seated subject's eye level
- mild downward viewing angle
- approximately 24–30 mm full-frame-equivalent perspective
- moderately wide smartphone framing
- subtle foreground perspective enlargement
- minimal facial distortion
- relatively sharp background
- no artificial portrait blur

LIGHTING

Use authentic mixed casino lighting.

Combine:
- warm overhead ambient illumination
- bright blue and cyan slot-machine light
- electric-blue LED borders
- warm golden-orange illumination across exposed skin
- cooler blue reflections along the hair, dress and silhouette
- soft frontal ambient facial illumination
- deeper shadows within the hair and beneath the arms
- bright irregular reflections across the sequins
- glossy reflections across gaming-machine surfaces

The white balance should remain naturally mixed rather than perfectly corrected.

IMAGE CHARACTERISTICS

The finished result should resemble an authentic smartphone photograph posted to social media.

Preserve:
- vivid blue and cyan casino illumination
- warm skin rendering
- computational HDR appearance
- local tone mapping
- moderate smartphone sharpening
- slight reduction of very fine texture
- deep environmental shadows
- very bright LED highlights
- mild wide-angle perspective
- subtle social-media compression
- uneven real-world illumination
- natural shoulder-height difference
- slight facial asymmetry
- irregular hair placement
- realistic hand anatomy
- realistic wrist positions
- seated fabric tension
- irregular sequin reflections
- environmental clutter
- screen reflections
- objects partially cut by the edges of the frame

Avoid:
- studio lighting
- heavy background blur
- perfectly symmetrical facial features
- exaggerated facial proportions
- artificial skin smoothing
- generic simplified hair
- changing which arm is raised
- visible teeth
- invented tattoos or piercings
- matte-looking dress fabric
- empty or overly clean casino surroundings
- cinematic studio-style grading

FINAL RESULT

Produce a realistic casino-night social-media portrait matching the supplied reference as closely as possible in composition, pose, facial proportions, expression, hairstyle, black sequined dress, blue-lit casino surroundings, mixed warm-and-cool lighting, camera perspective and natural smartphone-photo imperfections.
```

Characters to preserve exactly: the apostrophes in `cupid's bow` and
`subject's eye level` / `subject's knees` are **straight** apostrophes (`'`),
unlike the curly `’` used elsewhere in the article. The en-dashes in
`1.5–2 meters` and `24–30 mm` are real en-dashes (U+2013).

---

### [55] `316:3866` — Article / Prompt (code)

| role | text |
|---|---|
| label | `Paragraph prompt` |
| copy action | `Copy` |
| body | see below |

```
Create a realistic vertical 4:5 photo of an adult woman sitting sideways on a cream-and-red casino chair in front of bright blue-lit slot machines. She’s wearing a fitted black sleeveless sequined cocktail dress, with very long blonde hair with darker roots and loose waves falling over both shoulders. Her right arm is raised with her hand in her hair, while her left hand rests naturally near her thigh. She turns her upper body and face toward the camera and gives a small relaxed closed-mouth smile. Keep the casino busy and authentic, with tall slot machines, blue LED borders, colorful jackpot screens, patterned carpet, other chairs, drink cans and a small cup on the machine console. The lighting should feel like real casino lighting, with warm golden light on her skin mixed with strong blue and cyan reflections from the machines. Make it look like a genuine smartphone photo taken by another person from slightly above eye level, with a relatively sharp background, mild wide-angle perspective, realistic skin texture, natural facial asymmetry, loose hair strands, small fabric folds, and normal social-media image processing.
```

Single paragraph, no line breaks. `She’s` uses a curly apostrophe.
Rendered as mono (Geist Mono 14/23) even though the content is prose.

---

### [56] `316:3878` — Article / AIGE Test (2 results)

| role | text |
|---|---|
| kicker / badge label | `AIGE test` |
| title | `JSON prompt vs paragraph prompt` |
| intro (one-line setup) | `At first glance, the image made with the JSON prompt and the one made with the regular prompt look very similar. But when you look closer, the details are different.` |
| test-setup heading | `Test setup` |
| setup row 1 key | `Generator` |
| setup row 1 value | `Vivid 2` |
| setup row 2 key | `Aspect ratio` |
| setup row 2 value | `9:16` |
| setup row 3 key | `Images` |
| setup row 3 value | `2 generated` |
| setup row 4 key | `Picked` |
| setup row 4 value | `Best result from each` |
| result tile A — letter | `A` |
| result tile A — winner badge | `Better result` |
| result tile A — caption | `Result from the JSON prompt` |
| result tile B — letter | `B` |
| result tile B — winner badge | *(not present)* |
| result tile B — caption | `Result from the paragraph prompt` |
| result label | `Result` |
| result body | `The JSON version is much closer to the original image. Her right hand is placed correctly in her hair, and the overall pose is more accurate.` |
| what-I-learned label | `What I learned` |
| what-I-learned body | `This is where JSON prompts can be useful. A regular prompt may get the general idea right, while a JSON prompt can give you more control over the smaller details.` |

Result tiles are 328 × 437 each (two per row). Card is 740 × 1079.
The setup row whose **layer** is named `Row — Character` actually shows the key `Picked`.

---

### [63] `316:3962` — Article / Step-by-Step Workflow (4 steps, all with Example)

| step | node | number | step title | step body | example label | example text | image |
|---|---|---|---|---|---|---|---|
| 1 | `316:3963` | `1` | `Basic` | *(hidden)* | `Example` | `woman with blonde hair in sundress` | no |
| 2 | `316:3977` | `2` | `Specific` | *(hidden)* | `Example` | `woman with blonde hair in sundress sitting at a cafe in paris and sipping a coffee` | no |
| 3 | `316:3991` | `3` | `Structured` | *(hidden)* | `Example` | `woman with blonde hair in sundress sitting at a cafe in paris and sipping a sparkling water, while golden hour, man on motorcycle driving by, muscular black man sitting next to her, menu on table` | no |
| 4 | `316:4005` | `4` | `Very Long` | *(hidden)* | `Example` | `woman with blonde hair in a sundress, sitting at an outdoor cafe in Paris, sipping sparkling water from a glass in her left hand, right hand resting on the table, muscular black man sitting beside her, menu lying on the table, man riding a motorcycle past the cafe in the background, warm golden hour sunlight, medium shot, eye-level camera, realistic photography` | no |

- Connector ON for 1–3, OFF for 4.
- No step has media.
- Examples 1–3 use lowercase `paris`; example 4 uses `Paris`.

---

### [64] `316:4019` — Article / AIGE Test (4 results)

| role | text |
|---|---|
| kicker / badge label | `AIGE test` |
| title | `Prompt detail test` |
| intro (one-line setup) | *(hidden — not present)* |
| test-setup block | *(hidden — not present)* |
| result tile A — letter | `A` |
| result tile A — caption | `Basic prompt result` |
| result tile B — letter | `B` |
| result tile B — caption | `Specific prompt result` |
| result tile C — letter | `C` |
| result tile C — caption | `Structured prompt result` |
| result tile D — letter | `D` |
| result tile D — caption | `Very long prompt result` |
| winner badge | *(none — no tile is marked "Better result")* |
| result label | `Result` |
| result body | `OurDream is better at understanding simple prompts than I expected. You don’t need to make every prompt extremely detailed.` |
| what-I-learned label | `What I learned` |
| what-I-learned body | `Add details when you actually care about them. The more specific you are, the more control you have, but you also give the AI more things it can get wrong.` |

Four 328 × 437 tiles wrapping 2-per-row. Card is 740 × 1348.

---

### [73] `316:4146` — Article / Prompt (Kind = Text)

| role | text |
|---|---|
| label | `Too vague` |
| copy action | `Copy` |
| body (prompt) | `woman at the beach` |

---

### [80] `316:4163` — Article / Tip

| role | text |
|---|---|
| label | `Tip` |
| body | `Start with the important details first. You can always add more if the first result is missing something.` |

---

### [90] `316:4179` — Article / Prompt Comparison

| role | text |
|---|---|
| side A label (muted, ×) | `IMAGE PROMPT` |
| side A prompt | `blonde woman on a beach, black dress, sunset` |
| side B label (pink, ✓) | `VIDEO PROMPT` |
| side B copy action | `Copy` |
| side B prompt | `She slowly walks toward the camera while her dress moves in the wind. She then looks over her shoulder as the camera follows her.` |
| note line underneath | `Think of an image prompt as describing a photo and a video prompt as giving directions for a short scene.` |

---

### [98] `316:4209` — Article / What I Learned

| role | text |
|---|---|
| label | `What I learned` |
| byline / meta | `Herman Carter · Lead Reviewer` |
| body | `One of the biggest things I learned while testing OurDream is that different image generators can respond differently to the exact same prompt style.` |

Avatar: `Brand / Avatar Herman`, 32px.

---

### [99] `316:4217` — Article / Comparison A/B

| role | text |
|---|---|
| card title | *(hidden — no title present)* |
| option A letter | `A` |
| option A label | `Vivid 1 and Vivid 2` |
| option A body | `For example, I tested JSON prompts with Vivid 1 and Vivid 2, and both followed them surprisingly well. I could give very detailed instructions and still get an accurate result.` |
| option B letter | `B` |
| option B label | `Dreamy` |
| option B body | `I then tried similar JSON prompts with the default Dreamy generator. The results were much less accurate and the image quality was worse. Dreamy actually worked better for me when I turned the same instructions into a normal paragraph prompt.` |
| verdict | *(hidden — no verdict line present)* |
| "Best for" line | *(hidden — not present on either panel)* |

---

### [101] `316:4238` — Article / Key Takeaway

| role | text |
|---|---|
| label | `Key takeaway` |
| body | `There is no single prompt format that works best with every OurDream model.` |

---

### [106] `316:4250` — Article / Step-by-Step Workflow (6 steps, multi-paragraph bodies)

Blank lines inside step bodies are real paragraph breaks in the Figma text
(rendered with a zero-width space on the empty line).

**Step 1 — `316:4251`**
- step number: `1`
- step title: `I Explain What I Want to ChatGPT`
- step body:
```
I normally open a ChatGPT conversation and explain what I want using the voice button.

I prefer talking instead of typing because I naturally give a lot more detail. When I type, I tend to keep things short. When I talk, I explain the idea, what I want it to look like, what is important, and what I don’t want.

You don’t need to make it sound professional. Just explain the idea like you would explain it to another person.
```
- example: *(hidden)* · image: **no** · connector: ON

**Step 2 — `316:4265`**
- step number: `2`
- step title: `I Ask ChatGPT to Turn It Into a Prompt`
- step body:
```
Once ChatGPT understands what I want, I ask it to turn everything I said into a prompt for OurDream AI.

The prompt will look different depending on what I am creating. An image prompt should describe what you want to see, while a video prompt should focus much more on what happens and how things move.

If I am using a specific OurDream generator, I also tell ChatGPT which one I am using.
```
- example: *(hidden)* · image: **no** · connector: ON

**Step 3 — `316:4279`**
- step number: `3`
- step title: `I Add References When I Have Them`
- step body:
```
If I am trying to recreate a certain image, pose, style, or scene, I also upload the reference to ChatGPT.

This is especially useful when creating detailed image or video prompts because ChatGPT can help break down things that are easy to miss, like the camera angle, hand position, lighting, background, and composition.
```
- example: *(hidden)* · image: **no** · connector: ON

**Step 4 — `316:4293`**
- step number: `4`
- step title: `I Test the Prompt in OurDream`
- step body:
```
Then I paste the prompt into OurDream and generate.

I rarely expect the first generation to be perfect. I first look at what it got right and what it got wrong.
```
- example: *(hidden)* · image: **no** · connector: ON

**Step 5 — `316:4307`**
- step number: `5`
- step title: `I Fix Only What Went Wrong`
- step body:
```
If the result is almost right, I don’t start over.

For example, if everything looks good but the pose is wrong, I go back to ChatGPT and explain exactly what was wrong with the pose.

Then I update that part of the prompt and try again.

This makes it much easier to understand what is actually improving the result.
```
- example: *(hidden)* · image: **no** · connector: ON

**Step 6 — `316:4321`**
- step number: `6`
- step title: `I Save Prompts That Work`
- step body:
```
When I find a prompt structure that works well, I save it.

After a while, you start building your own templates for different things like images, videos, characters, and certain OurDream generators.

You don’t need to reinvent the prompt every single time.
```
- example: *(hidden; override value `" "`)* · image: **no** · connector: **OFF** (correct — last step)

---

### [109] `316:4337` — FAQ (8 items, all in the Expanded state)

Blank lines inside answers are real paragraph breaks.

**FAQ 1 — `316:4338`**
- question: `Do Longer Prompts Give Better Results?`
- answer:
```
Not always.

A longer prompt gives the AI more information, but it also gives it more things to get wrong.

Use enough detail to explain what you want. Don’t add details just to make the prompt longer.
```

**FAQ 2 — `316:4345`**
- question: `Should I Use JSON or Normal Prompts?`
- answer:
```
It depends on the generator.

In my testing, Vivid 1 and Vivid 2 worked very well with detailed JSON prompts. The default Dreamy generator was much less accurate with them and gave me better results with normal paragraph prompts.

So I wouldn’t say JSON is always better. Test both and see what works best with the generator you are using.
```

**FAQ 3 — `316:4351`**
- question: `Why Is OurDream Not Following My Prompt?`
- answer:
```
There can be a few reasons.

Your prompt may be too vague, you may be asking for too many things at once, or some of your instructions may conflict with each other.

It can also simply be the generator you are using. If the prompt looks good but the result keeps failing, try another generator or rewrite the same instructions in a different format.
```

**FAQ 4 — `316:4357`**
- question: `Should I Use the Same Prompt for Every OurDream Generator?`
- answer:
```
No.

Different generators can respond differently to the same prompt.

A prompt that works perfectly with Vivid 2 may not work as well with Dreamy. That is why I always test the prompt with the generator I actually plan to use.
```

**FAQ 5 — `316:4363`**
- question: `What Should I Do If My Image Is Almost Perfect?`
- answer:
```
Change only the part that is wrong.

If the outfit, background, and lighting are good but the hand position is wrong, only change the hand instruction.

If you rewrite everything, you may fix the hand but accidentally ruin everything else.
```

**FAQ 6 — `316:4369`**
- question: `Should I Put Outfits and Locations in My Character Prompt?`
- answer:
```
Usually not if they are temporary.

Things like eye color, hair, or other permanent features make sense in a character prompt.

An outfit, location, or situation can change, so those details are usually better added when creating the image or starting the scene.
```

**FAQ 7 — `316:4375`**
- question: `Do I Need to Know Prompt Engineering to Use OurDream AI?`
- answer:
```
No.

You can get good results with very simple prompts.

Prompting becomes more useful when you want more control over small details. You can also use ChatGPT to help turn a simple idea into a more detailed prompt.
```

**FAQ 8 — `316:4381`**
- question: `What Is the Biggest Prompting Mistake Beginners Make?`
- answer:
```
Trying to make the perfect prompt before generating anything.

Start with what you know you want, generate, look at the result, and then improve it.

It is usually much faster than spending ten minutes trying to write one massive prompt before you even know what the AI will get wrong.
```

Each item carries an `Icon / minus` (expanded state).

---

### [111] `316:4419` — Article / Related Guides

| role | text |
|---|---|
| heading | `Related OurDream guides` |
| row 1 title | `OurDream AI Image Prompt Guide` |
| row 1 meta (category) | `Prompts & Characters` |
| row 2 title | `How to Use OurDream AI Image Generator` |
| row 2 meta (category) | `Images, Video & Comics` |
| row 3 title | `OurDream AI Comics` |
| row 3 meta (category) | `Images, Video & Comics` |
| all-guides link | `Explore all OurDream AI guides` |

Each row is 740 × 56 with a trailing `Icon / arrow-right`; hairline top border on
the Rows container and a bottom border on each row.

---

## 3. Design notes / possible mistakes

1. **`316:3845` label says `JSON prompt` but the body is plain English prose**, not
   JSON — no braces, keys or quoting. Same wrapper, same component, and the
   surrounding AIGE test (`316:3878`) calls it "the JSON prompt". Either the label
   or the content is wrong.
2. **The two AIGE Test cards are structurally inconsistent.** `316:3878` has the
   one-line intro *and* the `Test setup` table; `316:4019` has neither, and no
   tile is marked `Better result` even though its Result line states a verdict.
3. **Layer/content mismatch in `316:3878`**: the setup row layer is named
   `Row — Character` but its visible key is `Picked`.
4. **Both `Article / Comparison A/B` instances have no title and no verdict line**
   (`316:3641`, `316:4217`), although the component's stated purpose is
   "two options side by side with a **clear verdict**".
5. **`316:4179` misuses `Article / Prompt Comparison`.** It compares an
   `IMAGE PROMPT` with a `VIDEO PROMPT` — neither is worse — but the component
   styles side A with an × icon and muted text and side B with a pink ✓ border.
   The component doc explicitly says "DO NOT USE … for two unrelated prompts."
6. **Whitespace-only prop overrides instead of hidden layers.** Several hidden
   slots carry a single space `" "` rather than being turned off:
   `316:3602` (`description`, `example`), `316:3665` (`item8`),
   `316:3740` (`item7`, `item8`), `316:4005` (`description`), `316:4321` (`example`).
   Generating these literally would emit stray empty nodes.
7. **`316:3665` chip 5 (`lighting`) is not overridden** — it is the component
   default that happened to fit. Worth confirming it is intentional.
8. **Label wording drift between the two Prompt Structure instances**:
   `Image prompt structure` vs `Video prompt template` — same component, two
   different nouns for the same slot.
9. **`316:3557` is a "Step-by-Step Workflow" with no step bodies at all** — all four
   steps are title-only, so it renders as a plain numbered list rather than a workflow.
10. **Layer name `Figure — casino-original — single ` has a trailing space.**
11. **Mixed apostrophe styles.** The article body uses curly `’` throughout, but the
    long mono prompt (`316:3845`) uses straight `'` in `cupid's bow`,
    `subject's eye level` and `subject's knees`.
12. **`paris` is lowercase** in workflow `316:3962` examples 1–3 but `Paris` in
    example 4 — the examples are meant to be a progression of the same prompt.
13. **`What I learned` appears three times** as a label — inside both AIGE Test
    cards (`316:3878`, `316:4019`) and as the standalone `Article / What I Learned`
    block (`316:4209`). Not necessarily wrong, but it is the same label at three
    different visual weights within one article.
14. **`316:3866` renders prose in Geist Mono.** It is an `Article / Prompt (code)`
    instance whose label is `Paragraph prompt`; the component doc reserves
    Kind=Code for "JSON/structured prompts (mono only here)".
15. **Width is consistent.** Nothing is drawn wider than the 740 column. The only
    off-column child is `316:3840` at x=180, width=380, which matches the
    Image + Caption component's "Medium ~380–520, centred" rule.
