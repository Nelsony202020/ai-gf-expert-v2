# Block markup contract — the shapes the OurDream article system expects

Taken verbatim from the shipped `ourdream-ai-comics.html`, which is the reference
implementation. Every guide uses these exact shapes so one stylesheet serves all four.
Copy the structure; replace only the text.

## `od-block--tip`

```html
<div class="od-block od-block--tip"><p class="od-block__kicker">Tip</p><p class="od-block__body">The existing sheet can be reused across future comics.</p><p class="od-block__body">So if you are creating a series with the same main character, you don’t have to start from zero every time.</p></div>
<hr />
```

## `od-block--important`

```html
<div class="od-block od-block--important">
<p class="od-block__kicker">Important</p>
<p class="od-block__body">One important thing to know: you currently need a desktop screen to create comics. The editor does not work on mobile yet, although finished comics can still be read on any screen.</p>
</div>
```

## `od-block--key-takeaway`

```html
<div class="od-steps__body"><p>Once your comic is finished, go through every page one final time.</p><p>You can use the <strong>Organize</strong> button to change the page order at any time.</p><p>Before publishing, I recommend checking:</p><ul><li>Your cover looks good.</li><li>Your title is readable.</li><li>Your pages are in the correct order.</li><li>Characters look consistent.</li><li>Speech bubbles contain the correct text.</li><li>Your comic name and description are filled in.</li><li>You added relevant tags.</li><li>You selected the correct Model Sheet versions.</li></ul><p>The beta testing guide recommends checking all of these things before sending your comic for public review.</p><div class="od-block od-block--key-takeaway"><p class="od-block__kicker">Key takeaway</p><p class="od-block__title">And that's basically it. You now have a full AI-generated comic without drawing a single panel yourself.</p></div></div>
</li>
```

## `od-block--my-take`

```html
<div class="od-block od-block--my-take"><p class="od-block__kicker">My take<span class="od-block__role">Herman Carter · Lead Reviewer</span></p><p class="od-block__body">So I would not assume it is allowed just because the generator accepts the prompt.</p><p class="od-block__body">I’m going to confirm this separately with OurDream AI before giving a definite answer.</p></div>
<h2 id="how-to-make-a-comic-with-ourdream-ai">How to Make a Comic With OurDream AI</h2>
```

## `od-block--what-i-learned`

```html
<div class="od-block od-block--what-i-learned"><p class="od-block__kicker">What I learned<span class="od-block__role">Herman Carter · Lead Reviewer</span></p><p class="od-block__body">During beta testing, we found that the automatic filter sometimes reacts to individual words instead of understanding the full story.</p><p class="od-block__body">For example, a completely normal fantasy battle could get blocked because you used a word like “killed” or certain weapon terms.</p></div>
<p>So if your harmless prompt gets blocked, don’t immediately throw the whole story away. Read it again and see if one specific word could be triggering the filter.</p>
```

## `od-block--quick-answer`

```html
(not used in the comics guide — see the CSS)
```

## `od-block--aige-test`

From the shipped prompt guide (the comics guide does not use this block).

```html
<div class="od-block od-block--aige-test">
<p class="od-block__kicker od-block__kicker--aige">AIGE test</p>
<p class="od-block__title">JSON prompt vs paragraph prompt</p>
<p class="od-block__subtitle">At first glance, the image made with the JSON prompt and the one made with the regular prompt look very similar. But when you look closer, the details are different.</p>
<div class="od-setup">
<p class="od-setup__title">Test setup</p>
<div class="od-setup__grid">
<div>
<div class="od-setup__row"><span class="od-setup__label">Generator</span><span class="od-setup__value">Vivid 2</span></div>
<div class="od-setup__row"><span class="od-setup__label">Aspect ratio</span><span class="od-setup__value">9:16</span></div>
</div>
<div>
<div class="od-setup__row"><span class="od-setup__label">Images</span><span class="od-setup__value">2 generated</span></div>
<div class="od-setup__row"><span class="od-setup__label">Picked</span><span class="od-setup__value">Best result from each</span></div>
</div>
</div>
</div>
<div class="od-compare-grid">
<figure>
  <img src="/guides/ourdream-ai-prompt-guide/casino-json-prompt.webp" alt="OurDream AI result from a detailed JSON prompt, recreating the casino pose with a sequined dress" width="768" height="1360" loading="lazy" decoding="async" />
  <figcaption>Result from the JSON prompt</figcaption>
</figure>
<figure>
  <img src="/guides/ourdream-ai-prompt-guide/casino-paragraph-prompt.webp" alt="OurDream AI result from a paragraph prompt, with a similar casino look but less accurate pose details" width="768" height="1360" loading="lazy" decoding="async" />
  <figcaption>Result from the paragraph prompt</figcaption>
</figure>
</div>
<p class="od-result-label">Result</p>
<p>The JSON version is much closer to the original image. Her right hand is placed correctly in her hair, and the overall pose is more accurate.</p>
<div class="od-block od-block--what-i-learned">
<p class="od-block__kicker">What I learned</p>
<p class="od-block__body">This is where JSON prompts can be useful. A regular prompt may get the general idea right, while a JSON prompt can give you more control over the smaller details.</p>
</div>
</div>
```

## `od-ab`

```html
<div class="od-ab">
<div class="od-ab__options">
<div class="od-ab__card"><p class="od-ab__head"><span class="od-ab__badge">A</span>Comic Page</p><p class="od-ab__body">A Comic Page is a normal AI-generated page. You choose how many panels you want and which layout to use, then tell the AI what should happen in each panel.</p></div>
<div class="od-ab__card"><p class="od-ab__head"><span class="od-ab__badge">B</span>Cover Page</p><p class="od-ab__body">A Cover Page is usually used for the front cover of your comic. It has separate fields for the title, subtitle, and “Written by” text, which are added directly to the generated image.</p></div>
</div>
<div class="od-ab__verdict"><p class="od-ab__verdict-label">Good to know</p><p class="od-ab__verdict-text">But Cover Pages are not only for covers. You can also use them whenever you want one big full-page image, such as a dramatic scene, a chapter opening, or a “Coming Next” page.</p></div>
</div>
```

## `od-structure`

```html
<div class="od-structure">
<p class="od-structure__label">Remove the reference when you change</p>
<div class="od-structure__chips">
<span class="od-chip-wrap"><span class="od-chip">Location</span><span class="od-chip-arrow" aria-hidden="true"></span></span>
<span class="od-chip-wrap"><span class="od-chip">Time of day</span><span class="od-chip-arrow" aria-hidden="true"></span></span>
<span class="od-chip-wrap"><span class="od-chip">Outfit</span><span class="od-chip-arrow" aria-hidden="true"></span></span>
<span class="od-chip-wrap"><span class="od-chip">Scene</span><span class="od-chip-arrow" aria-hidden="true"></span></span>
<span class="od-chip-wrap"><span class="od-chip">Overall visual style</span></span>
</div>
</div>
```

## `od-prompt-compare`

```html
<div class="od-prompt-compare" data-od-copy-root>
<div class="od-prompt-card">
<p class="od-prompt-card__label">DON’T</p>
<p class="od-prompt-card__text">Top panel: Sarah sits at the bar.<br>Bottom-right panel: The man talks to her.</p>
</div>
<div class="od-prompt-compare__arrow" aria-hidden="true"></div>
<div class="od-prompt-card od-prompt-card--yes">
<div class="od-prompt-card__bar">
<p class="od-prompt-card__label">BY PANEL NUMBER</p>
<button type="button" class="od-copy" data-od-copy>Copy</button>
</div>
<p class="od-prompt-card__text" data-od-copy-text>Panel 01: Sarah sits at the bar holding a cocktail.<br>Panel 02: A man sits down next to her and starts talking to her.<br>Panel 03: Sarah smiles at him and leans closer.</p>
</div>
</div>
```

## `od-cheat`

```html
<div class="od-cheat">
<div class="od-cheat__head"><span class="od-cheat__label">Comic style cheat sheet</span></div>
<div class="od-cheat__groups">
<div class="od-cheat-group"><p class="od-cheat-group__title">For anime comics, there are currently eight art styles:</p><ul class="od-cheat-group__terms"><li>OD Comics</li><li>Manga BW Inks</li><li>Hand Painted Manga</li><li>Neon Comics</li><li>Film Noir Comics</li><li>1970’s Underground</li><li>Vintage News Prints</li><li>Flat Inks</li></ul></div>
<div class="od-cheat-group"><p class="od-cheat-group__title">For realistic comics, you can choose between five different camera styles:</p><ul class="od-cheat-group__terms"><li>Default</li><li>Hard Flash</li><li>Monochrome</li><li>Smartphone</li><li>Amateur</li></ul></div>
</div>
</div>
```

## `od-steps`

```html
<ol class="od-steps">
<li id="step-1-open-the-comic-generator">
<p class="od-steps__title">Open the Comic Generator</p>
<div class="od-steps__body"><p>First, open the OurDream AI Comic Studio.</p><p>One important thing: you need to use a desktop or laptop. You currently cannot create comics on mobile. You can read finished comics on your phone, but the actual Comic Studio editor requires a bigger screen.</p><figure class="od-steps__media"><img src="/guides/ourdream-ai-comics/comic-studio-hub.webp" alt="The OurDream Comics hub, with the Create a new comic button highlighted" width="820" height="524" loading="lazy" decoding="async" /><figcaption>The Comics hub — “Create a new comic” starts a new project.</figcaption></figure></div>
</li>
<li id="step-2-create-a-new-comic">
<p class="od-steps__title">Create a New Comic</p>
<div class="od-steps__body"><p>Create a new comic and start setting up your story.</p><p>You don't need to have the entire comic planned before you start. You can keep adding, editing, and moving pages around later.</p><p>Your comic also gets its own name, description, and tags. These are used when your comic appears on the public Comics page.</p><figure class="od-steps__media"><img src="/guides/ourdream-ai-comics/new-comic-empty.webp" alt="An empty new comic prompting you to select anime characters" width="820" height="524" loading="lazy" decoding="async" /><figcaption>A new comic starts empty and asks you to pick its cast.</figcaption></figure></div>
</li>
<li id="step-3-add-your-characters">
<p class="od-steps__title">Add Your Characters</p>
<div class="od-steps__body"><p>Next, choose the characters that will appear in your story.</p><p>You can add a maximum of <strong>three characters</strong> to one comic. These can be your own OurDream AI characters or community characters.</p><p>Adding a character costs <strong>20 DreamCoins</strong> because OurDream AI creates something called a Model Sheet for that character.</p><p>If you only need a random background character for one scene, you can also use a character image as a reference instead of creating a full Model Sheet.</p></div>
</li>
<li id="step-4-generate-your-character-model-sheets">
<p class="od-steps__title">Generate Your Character Model Sheets</p>
<div class="od-steps__body"><p>This part is important.</p><p>A Model Sheet is basically the reference OurDream AI uses to remember what your character looks like across different comic pages.</p><p>The Model Sheet is created from the character's profile image. If your character looks wrong on the Model Sheet, I recommend fixing this <strong>before</strong> you start generating your comic. Otherwise, you could end up fixing the same problem on every page.</p><p>You can regenerate a Model Sheet for 20 DreamCoins, and every version you generate is saved so you can switch back to an older version later.</p><p>Also, if you use the same character in another comic later, you don't need to pay for another Model Sheet. The existing one can be reused.</p><figure class="od-steps__media"><img src="/guides/ourdream-ai-comics/model-sheets-generating.webp" alt="The comic overview showing a character model sheet generating" width="820" height="524" loading="lazy" decoding="async" /><figcaption>Model sheets generate in the background once characters are added.</figcaption></figure></div>
</li>
<li id="step-5-create-your-cover">
<p class="od-steps__title">Create Your Cover</p>
<div class="od-steps__body"><p>Now you can create the cover of your comic.</p><p>The Cover Page has three text fields:</p><ul><li>Title — maximum 30 characters</li><li>Subtitle — maximum 45 characters</li><li>Written by — maximum 40 characters</li></ul><p>OurDream AI adds these directly to the generated cover image. You can also leave them blank if you would rather create the text another way.</p><p>You can also use a Cover Page later in your comic when you want one big full-page image instead of multiple panels. For example, you could use one for a dramatic reveal or the start of a new chapter.</p><figure class="od-steps__media"><img src="/guides/ourdream-ai-comics/cover-page-editor.webp" alt="The cover page open in the comic editor beside its prompt panel" width="820" height="524" loading="lazy" decoding="async" /><figcaption>The cover page in the editor, with its own prompt panel.</figcaption></figure></div>
</li>
<li id="step-6-choose-your-comic-layout">
<p class="od-steps__title">Choose Your Comic Layout</p>
<div class="od-steps__body"><p>For normal comic pages, you first choose how many panels you want.</p><p>OurDream AI currently has layouts for <strong>2, 3, 4, and 5 panels</strong>.</p><p>There are quite a few options, but you don't need to overthink it.</p><p>For example:</p><ul><li>Rows work well for normal conversations.</li><li>Diagonal panels feel more active and work well for action or arguments.</li><li>Splash Top works well when one big moment is followed by smaller reactions.</li><li>Tall Left works well when two characters are confronting each other.</li><li>Stagger works well when a scene keeps getting more intense.</li></ul><p>You can change the layout from page to page, so your entire comic doesn't need to use the same one.</p><figure class="od-steps__media"><img src="/guides/ourdream-ai-comics/panel-layout-picker.webp" alt="The panel count and layout picker open on a comic page" width="820" height="524" loading="lazy" decoding="async" /><figcaption>Panel count and layout are chosen per page.</figcaption></figure></div>
</li>
<li id="step-7-write-your-page-prompt">
<p class="od-steps__title">Write Your Page Prompt</p>
<div class="od-steps__body"><p>This is where you tell OurDream AI what should happen on the page.</p><p>The most important tip is to describe every panel by number.</p><p>Don't write:</p><div class="od-prompt" data-od-copy-root><div class="od-prompt__bar"><span class="od-prompt__label">Prompt</span><button type="button" class="od-copy" data-od-copy>Copy</button></div><pre data-od-copy-text>Top panel: The woman enters the bar.</pre></div><p>Instead write:</p><div class="od-prompt" data-od-copy-root><div class="od-prompt__bar"><span class="od-prompt__label">Prompt</span><button type="button" class="od-copy" data-od-copy>Copy</button></div><pre data-od-copy-text>Panel 01: The woman enters the bar.</pre></div><p>Then continue with Panel 02, Panel 03, and so on.</p><p>OurDream AI understands panel numbers much better than descriptions like "top left" or "bottom right."</p><p>I also recommend keeping the entire page prompt under around <strong>200 words</strong>. Longer prompts make it more likely that the AI starts ignoring parts of your instructions.</p><p>Be specific about what you actually want to see. Describe the character, pose, outfit, camera angle, lighting, and important background details instead of just saying something like "romantic room."</p><p>I'll go much deeper into prompting later in this guide because this is probably the biggest difference between getting a good comic and getting complete AI nonsense.</p></div>
</li>
<li id="step-8-generate-your-comic-page">
<p class="od-steps__title">Generate Your Comic Page</p>
<div class="od-steps__body"><p>Once your prompt and layout are ready, generate the page.</p><p>Generating one comic page currently costs <strong>20 DreamCoins</strong>. Regenerating the entire page also costs another 20 DreamCoins.</p><p>Don't panic if it takes longer than a normal OurDream AI image. According to the beta testing guide, comic pages and Model Sheets normally take longer to generate.</p><p>Once the page appears, check every panel before moving on.</p><p>Look at things like:</p><ul><li>Is the correct character in each panel?</li><li>Are their clothes correct?</li><li>Did their pose suddenly change?</li><li>Does the background make sense?</li><li>Are there any weird AI mistakes?</li></ul><p>Fixing these problems now is much easier than noticing them five pages later.</p></div>
</li>
<li id="step-9-add-dialogue-and-speech-bubbles">
<p class="od-steps__title">Add Dialogue and Speech Bubbles</p>
<div class="od-steps__body"><p>I recommend generating the artwork <strong>without dialogue first</strong> and adding your speech bubbles afterward.</p><p>OurDream AI has a separate speech balloon editor where you can drag bubbles onto the finished page and type exactly what you want your characters to say.</p><p>This works much better than asking the image generator to create text because AI-generated dialogue can get shortened, changed, or completely messed up.</p><p>You can add normal speech bubbles, thought bubbles, captions, shout bubbles, and text boxes.</p><p>Adding and saving speech balloons currently costs <strong>0 DreamCoins</strong>.</p><p>One thing to remember: each speech bubble has a maximum of <strong>150 characters</strong>. Keep the dialogue short and natural instead of trying to squeeze an entire paragraph into one bubble.</p><figure class="od-steps__media"><img src="/guides/ourdream-ai-comics/speech-balloons.webp" alt="A generated comic page with speech balloons being placed" width="820" height="524" loading="lazy" decoding="async" /><figcaption>Speech balloons are dragged onto the page, then aimed and typed.</figcaption></figure></div>
</li>
<li id="step-10-edit-any-mistakes">
<p class="od-steps__title">Edit Any Mistakes</p>
<div class="od-steps__body"><p>You will probably need to fix something. That's normal with AI comics.</p><p>OurDream AI gives you two main editing tools: the <strong>Brush Editor</strong> and <strong>Layers</strong>.</p><p>The Brush Editor is useful when one specific part of the image is wrong. You select the area and tell the AI what you want there instead.</p><p>For example, if the background is wrong, tell it what background you want rather than simply saying "remove the background."</p><p>The testing guide found that edits work much better when you tell the AI what to <strong>create</strong>, rather than what to delete.</p><p>Layers give you more control. They can separate things like characters, backgrounds, furniture, and objects so you can move, resize, hide, or edit them individually. You can even generate completely new objects as new layers.</p><p>Don't go crazy editing the same image, though. The guide found that after around three edits, the results start becoming less reliable.</p></div>
</li>
<li id="step-11-add-more-pages">
<p class="od-steps__title">Add More Pages</p>
<div class="od-steps__body"><p>Once you're happy with the first page, create the next one and continue your story.</p><p>OurDream AI automatically uses the previous page as a reference. This helps keep the same characters, location, and overall look between pages.</p><p>This is useful when the story continues in the same room.</p><p>But if your characters suddenly move from a bedroom to a beach, remove the previous-page reference. Otherwise, parts of the bedroom can start appearing in your beach scene.</p><p>The same applies when changing outfits, locations, time of day, or making a major scene change.</p></div>
</li>
<li id="step-12-organize-and-publish-your-comic">
<p class="od-steps__title">Organize and Publish Your Comic</p>
<div class="od-steps__body"><p>Once your comic is finished, go through every page one final time.</p><p>You can use the <strong>Organize</strong> button to change the page order at any time.</p><p>Before publishing, I recommend checking:</p><ul><li>Your cover looks good.</li><li>Your title is readable.</li><li>Your pages are in the correct order.</li><li>Characters look consistent.</li><li>Speech bubbles contain the correct text.</li><li>Your comic name and description are filled in.</li><li>You added relevant tags.</li><li>You selected the correct Model Sheet versions.</li></ul><p>The beta testing guide recommends checking all of these things before sending your comic for public review.</p><div class="od-block od-block--key-takeaway"><p class="od-block__kicker">Key takeaway</p><p class="od-block__title">And that's basically it. You now have a full AI-generated comic without drawing a single panel yourself.</p></div></div>
</li>
</ol>
```

## `od-faq`

```html
<div class="od-faq">
<details class="od-faq__item" id="is-ourdream-ai-comics-free">
<summary class="od-faq__q">Is OurDream AI Comics Free?</summary>
<div class="od-faq__a"><p>Not really.</p><p>Generating characters, Model Sheets, pages, edits, Layers, and videos all use DreamCoins.</p><p>For example, one normal comic page currently costs <strong>20 DreamCoins</strong> to generate.</p><p>The beta guide does not confirm whether you also need a specific paid subscription to access Comic Studio, so I would verify that separately before saying that a subscription is required.</p></div>
</details>
<details class="od-faq__item" id="can-ourdream-ai-comics-generate-nsfw-comics">
<summary class="od-faq__q">Can OurDream AI Comics Generate NSFW Comics?</summary>
<div class="od-faq__a"><p>Yes.</p><p>OurDream AI Comics supports NSFW and adult content.</p><p>The Comic Studio generator can be more sensitive to explicit prompts than the normal OurDream AI image generator, though, so some adult scenes may need extra generations or edits.</p><p>All characters in sexual content must clearly be adults.</p></div>
</details>
<details class="od-faq__item" id="can-you-make-hentai-with-ourdream-ai">
<summary class="od-faq__q">Can You Make Hentai With OurDream AI?</summary>
<div class="od-faq__a"><p>Yes.</p><p>You can use the anime comic styles to create adult anime and hentai-style stories.</p><p>You can build the story over several pages, use the same characters, change outfits, add dialogue, and create explicit adult scenes.</p><p>Just remember that the same OurDream AI moderation rules still apply.</p></div>
</details>
<details class="od-faq__item" id="faq-can-you-use-copyrighted-characters">
<summary class="od-faq__q">Can You Use Copyrighted Characters?</summary>
<div class="od-faq__a"><p>I could not find a clear answer to this in OurDream AI's moderation policy or Community Guidelines.</p><p>They explain rules around harmful, illegal, exploitative, and sexual content, but they do not clearly say whether you are allowed to make a comic using an existing copyrighted character.</p><p>So I would not assume that characters like Scooby-Doo, Batman, or existing anime characters are allowed until OurDream AI confirms it.</p></div>
</details>
<details class="od-faq__item" id="how-many-characters-can-you-add">
<summary class="od-faq__q">How Many Characters Can You Add?</summary>
<div class="od-faq__a"><p>You can add up to <strong>three characters</strong> to one comic.</p><p>Each new character normally generates a Model Sheet so the AI can keep that character looking similar across your comic.</p><p>If you only need a small side character for one scene, you can also use a character image as a manual reference instead of creating a full Model Sheet.</p></div>
</details>
<details class="od-faq__item" id="can-you-make-ourdream-ai-comics-on-mobile">
<summary class="od-faq__q">Can You Make OurDream AI Comics on Mobile?</summary>
<div class="od-faq__a"><p>No.</p><p>At the time of writing, Comic Studio requires a desktop-sized screen.</p><p>You can <strong>read finished comics on mobile</strong>, but you cannot create or edit them there.</p></div>
</details>
<details class="od-faq__item" id="how-much-does-one-comic-page-cost">
<summary class="od-faq__q">How Much Does One Comic Page Cost?</summary>
<div class="od-faq__a"><p>One comic page currently costs <strong>20 DreamCoins</strong> to generate.</p><p>Regenerating that page costs another <strong>20 DreamCoins</strong>.</p><p>So if you keep pressing regenerate until you finally get the perfect ass angle, those DreamCoins can disappear pretty quickly.</p></div>
</details>
<details class="od-faq__item" id="can-you-turn-ourdream-ai-comics-into-videos">
<summary class="od-faq__q">Can You Turn OurDream AI Comics Into Videos?</summary>
<div class="od-faq__a"><p>Yes.</p><p>You can take a finished comic page and animate it with OurDream AI's Cinematic image-to-video model.</p><p>The video generator uses the comic page as a visual storyboard and can also read the dialogue from your speech bubbles.</p></div>
</details>
<details class="od-faq__item" id="how-long-are-ourdream-ai-comic-videos">
<summary class="od-faq__q">How Long Are OurDream AI Comic Videos?</summary>
<div class="od-faq__a"><p>Comic videos are currently <strong>10 seconds long</strong>.</p><p>They are generated in a horizontal format and cost <strong>500 DreamCoins</strong> each.</p><p>That makes video one of the most expensive parts of creating a comic, so I would make sure the page looks good before animating it.</p></div>
</details>
<details class="od-faq__item" id="can-you-edit-an-ourdream-ai-comic-after-generating-it">
<summary class="od-faq__q">Can You Edit an OurDream AI Comic After Generating It?</summary>
<div class="od-faq__a"><p>Yes.</p><p>You have several ways to edit a finished page.</p><p>You can use the <strong>Brush Editor</strong> to fix one specific area, or create <strong>Layers</strong> if you want more control over individual characters, backgrounds, and objects.</p><p>You can also regenerate an entire page if too many things are wrong.</p><p>Personally, if one small thing looks bad, I would edit it.</p><p>If half the page looks like the AI had a stroke, just regenerate it.</p></div>
</details>
</div>
```

## `od-figure-grid`

```html
<div class="od-figure-grid">
<figure><img src="/guides/ourdream-ai-comics/anime-art-styles.webp" alt="The eight anime art styles available in OurDream AI Comic Studio" width="602" height="401" loading="lazy" decoding="async" /><figcaption>Anime art styles</figcaption></figure>
<figure><img src="/guides/ourdream-ai-comics/realistic-camera-styles.webp" alt="The five realistic camera styles available in OurDream AI Comic Studio" width="602" height="401" loading="lazy" decoding="async" /><figcaption>Realistic camera styles</figcaption></figure>
</div>
```

## `od-process`

```html
<div class="od-process">
<p class="od-process__label">Five things per panel<a class="od-cite" href="#sources" aria-label="Footnote 1: MrGeekStar’s OurDream Comic Studio Field Guide">¹</a></p>
<ol class="od-process__steps"><li><span class="od-process__num">1</span><span class="od-process__text">Who is in the panel?</span></li><li><span class="od-process__num">2</span><span class="od-process__text">What are they doing?</span></li><li><span class="od-process__num">3</span><span class="od-process__text">Where are they?</span></li><li><span class="od-process__num">4</span><span class="od-process__text">What does the camera show?</span></li><li><span class="od-process__num">5</span><span class="od-process__text">What important detail needs to stay consistent?</span></li></ol>
</div>
```

## `od-sources`

```html
<div class="od-sources">
<p class="od-sources__intro">References used for research, testing and factual information in this guide.</p>
<ol class="od-sources__rows">
<li><span class="od-sources__num">01</span><span class="od-sources__text"><a class="od-sources__title" href="https://docs.google.com/" rel="noopener nofollow">MrGeekStar's OurDream Comic Studio Field Guide ↗</a><span class="od-sources__meta">MrGeekStar · Community field guide (v1.8, updated August 2026)</span><span class="od-sources__domain">docs.google.com</span></span></li>
</ol>
</div>
```

## `od-examples`

```html
<div class="od-examples">
<a class="od-example" href="https://ourdream.ai/comic-studio/a6dfef4e-b313-48d6-9a2a-78e7d37e923a/read" rel="noopener"><span class="od-example__text"><span class="od-example__category">Anime</span><span class="od-example__title">Example 1</span></span><span class="od-example__action">Open comic ↗</span></a>
<a class="od-example" href="https://ourdream.ai/comic-studio/a267e2c2-46a5-4f2f-9a00-4118b84a2df2/read" rel="noopener"><span class="od-example__text"><span class="od-example__category">Anime</span><span class="od-example__title">Example 2</span></span><span class="od-example__action">Open comic ↗</span></a>
<a class="od-example" href="https://ourdream.ai/comic-studio/1716335c-2643-4fd8-8703-49b10a058c92/read" rel="noopener"><span class="od-example__text"><span class="od-example__category">Anime</span><span class="od-example__title">Example 3</span></span><span class="od-example__action">Open comic ↗</span></a>
</div>
```

## `od-prompt`

```html
<div class="od-steps__body"><p>This is where you tell OurDream AI what should happen on the page.</p><p>The most important tip is to describe every panel by number.</p><p>Don't write:</p><div class="od-prompt" data-od-copy-root><div class="od-prompt__bar"><span class="od-prompt__label">Prompt</span><button type="button" class="od-copy" data-od-copy>Copy</button></div><pre data-od-copy-text>Top panel: The woman enters the bar.</pre></div><p>Instead write:</p><div class="od-prompt" data-od-copy-root><div class="od-prompt__bar"><span class="od-prompt__label">Prompt</span><button type="button" class="od-copy" data-od-copy>Copy</button></div><pre data-od-copy-text>Panel 01: The woman enters the bar.</pre></div><p>Then continue with Panel 02, Panel 03, and so on.</p><p>OurDream AI understands panel numbers much better than descriptions like "top left" or "bottom right."</p><p>I also recommend keeping the entire page prompt under around <strong>200 words</strong>. Longer prompts make it more likely that the AI starts ignoring parts of your instructions.</p><p>Be specific about what you actually want to see. Describe the character, pose, outfit, camera angle, lighting, and important background details instead of just saying something like "romantic room."</p><p>I'll go much deeper into prompting later in this guide because this is probably the biggest difference between getting a good comic and getting complete AI nonsense.</p></div>
</li>
```

## `od-calc`

```html
<div class="od-calc"><p>10 × 20 DC = 200 DreamCoins.</p></div>
<p>Realistically, I would budget a bit more because you probably aren't going to love every generation on the first try.</p>
```
