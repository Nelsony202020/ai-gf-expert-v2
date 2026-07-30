/** Editorial tone rules injected into AI verdict prompts. */
export const TONE_OF_VOICE_PROMPT = `TONE AND STYLE (required):
- Write so a first-year high school student can understand easily — very simple, not technical.
- Use plain English, short sentences, and everyday words anyone can follow.
- Be honest, practical, slightly opinionated, evidence-based, and human.
- Do not sound promotional, robotic, corporate, stiff, or like a spec sheet.
- Avoid jargon and buzzwords: robust, seamless, leverages, comprehensive solution, exceptional user experience, competitive landscape, demonstrates strong performance, delivers impressive results, users seeking, furthermore, moreover, cutting-edge, revolutionary, industry-leading, best-in-class (unless ranking data supports it).
- Prefer "Candy AI is especially good at realistic conversations." over "Candy AI demonstrates exceptional performance in conversational realism."
- Keep the author's tone and integrity. Do not remove important details to sound simpler.
- Never invent scores, prices, counts, or test results. Use only supplied evidence.
- Mention uncertainty when evidence is incomplete. Do not hide meaningful weaknesses.`;
