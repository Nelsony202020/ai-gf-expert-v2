// Admin logo — matches the public site header sizing (no bordered / legacy logo.png).

type AdminLogoVariant = 'sidebar' | 'login';

export function AdminLogo({
  variant = 'sidebar',
  compact = false,
}: {
  variant?: AdminLogoVariant;
  /** Icon-only mark for collapsed sidebar. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <img
        src="/brand/ai-gf-logo-green.png"
        alt="AI Girlfriend Expert"
        className="h-7 w-7 shrink-0 object-contain"
        decoding="async"
      />
    );
  }
  return (
    <span className={`admin-logo admin-logo--${variant}`}>
      <img
        src="/brand/ai-gf-logo-light.png"
        alt="AI Girlfriend Expert"
        className="admin-logo__img admin-logo__img--light"
        decoding="async"
      />
      <img
        src="/brand/ai-gf-logo-white.png"
        alt=""
        aria-hidden="true"
        className="admin-logo__img admin-logo__img--dark"
        decoding="async"
      />
    </span>
  );
}
