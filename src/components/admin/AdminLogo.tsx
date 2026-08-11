// Admin logo — same Girlfriend Expert marks as the public site header.

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
        src="/brand/herman-main-icon.svg"
        alt="Girlfriend Expert AI"
        className="h-7 w-7 shrink-0 object-contain"
        decoding="async"
      />
    );
  }
  return (
    <span className={`admin-logo admin-logo--${variant}`}>
      <img
        src="/brand/girlfriend-expert-logo.png"
        alt="Girlfriend Expert AI"
        className="admin-logo__img admin-logo__img--light"
        decoding="async"
      />
      <img
        src="/brand/girlfriend-expert-logo-white.png"
        alt=""
        aria-hidden="true"
        className="admin-logo__img admin-logo__img--dark"
        decoding="async"
      />
    </span>
  );
}
