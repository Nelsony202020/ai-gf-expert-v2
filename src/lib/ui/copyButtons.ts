/**
 * The site's one copy-to-clipboard behaviour, shared by the OurDream guide articles
 * (`[data-od-copy]` prompt blocks) and the Character Prompt Vault.
 *
 * Moved here unchanged from ourdream-article.client.ts. The defaults reproduce the
 * article behaviour exactly (label swapped to "Copied", `data-copied` set, reverted
 * after 1600ms). Callers that draw their own copied state pass `swapLabel: false`
 * and react to `onCopied` / `onReset`.
 */
export interface CopyButtonOptions {
  /** Buttons to bind inside `root`. */
  selector?: string;
  /** Swap the button's text to "Copied" while copied (article behaviour). */
  swapLabel?: boolean;
  /** How long the copied state lasts. */
  durationMs?: number;
  /** Finds the text to copy for a button. */
  getText?: (button: HTMLButtonElement) => string | null | undefined;
  onCopied?: (button: HTMLButtonElement) => void;
  onReset?: (button: HTMLButtonElement) => void;
}

function defaultText(button: HTMLButtonElement): string | undefined {
  const target = button.closest('[data-od-copy-root]') ?? button.parentElement;
  const source =
    target?.querySelector<HTMLElement>('[data-od-copy-text]') ??
    target?.querySelector('pre, .od-prompt-card__text, .od-prompt__body');
  return source?.textContent?.trim();
}

export function bindCopyButtons(root: ParentNode, options: CopyButtonOptions = {}): void {
  const {
    selector = '[data-od-copy]',
    swapLabel = true,
    durationMs = 1600,
    getText = defaultText,
    onCopied,
    onReset,
  } = options;

  root.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    let timer: number | undefined;
    let original: string | null = null;
    button.addEventListener('click', async () => {
      const text = getText(button);
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        // Remember the label once, so a second click inside the window cannot
        // capture "Copied" as the label to restore.
        if (swapLabel && button.dataset.copied !== 'true') original = button.textContent;
        if (swapLabel) button.textContent = 'Copied';
        // The icon is a ::before mask keyed off this attribute, so it follows the
        // label rather than being clobbered by the textContent swap.
        button.dataset.copied = 'true';
        onCopied?.(button);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (swapLabel) button.textContent = original;
          delete button.dataset.copied;
          onReset?.(button);
        }, durationMs);
      } catch {
        /* ignore */
      }
    });
  });
}
