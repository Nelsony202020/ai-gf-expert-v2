# Prompt Vault — images + persistent paste link

## Images (prompt-vault-images.zip, manifest.csv)

- manifest.csv checked row by row against the vault data (id, name, exact prompt, generator,
  result number, file present, real WebP dimensions = manifest width/height).
  **Result: 97 image rows for 94 prompts. No prompt without an image, no image row without
  a prompt, no mismatched name / prompt / generator.**
- p045, p047, p049: `-2` files are result 2 (stored on result rows p046, p048, p050).
- Originals uploaded unchanged to Bunny Storage at `/prompt-vault/<filename>`. Responsive
  sizes come from Bunny Optimizer at request time (`?width=171|342|384|768` on cards,
  `358|472|716|944` in the detail view, WebP, quality 82) — checked live.
- Each `promptVaultResults` row now has `imagePath`, `width`, `height` in InstantDB; the page
  sets width/height on every `<img>`, lazy-loads everything except the three hero examples.
- `scripts/attach-prompt-vault-images.ts <folder>` does all of the above and refuses to run on
  any mismatch; re-run it for future batches.
- Note: p126 and p127 (Vivid 3) are 1024 × 1024, not 4:5. Cards keep the locked 4:5 box and
  crop them with object-fit: cover (centre crop). Supply 4:5 versions if the crop is wrong.

## "Paste it in OurDream →" — split from the Copied timer

- Copied checkmark: feedback, unchanged — ~2s, then "Copy prompt".
- Paste link: no timer. It replaces the model tag on the card copied last and stays there.
  Copying another prompt (card or detail view) moves it; exactly one card shows it.
- It stays through scrolling, filtering and search while that card is rendered; if the card is
  filtered out, no link shows anywhere.
- Real `<a>`: focusable only while shown, hover underline, pink focus ring, darker active.
  Clicking it opens OurDream in a new tab and changes nothing on the card or the clipboard.
- Footer row height is fixed (30px desktop, 40px mobile) — measured identical before/after.
- Labels: desktop "Paste it in OurDream →", mobile and hero cards "Open OurDream →".
  Normal link, no sponsored rel, no disclosure.
