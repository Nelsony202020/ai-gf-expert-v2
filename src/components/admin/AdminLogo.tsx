// Admin logo — matches the public site header sizing (no bordered / legacy logo.png).

type AdminLogoVariant = 'sidebar' | 'login';

export function AdminLogo({ variant = 'sidebar' }: { variant?: AdminLogoVariant }) {
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
