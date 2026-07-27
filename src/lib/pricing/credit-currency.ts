/** Fixed token lifetime — not configurable in admin. */
export const DEFAULT_TOKEN_EXPIRATION_PERIOD = '30 days';

export type CreditCurrencyLike = {
  displayName?: string;
  singular?: string;
  plural?: string;
  icon?: string;
  resetsMonthly?: boolean;
  rollsOver?: boolean;
  expires?: boolean;
  expirationPeriod?: string;
  expirationNotes?: string;
  purchasable?: boolean;
  earnable?: boolean;
  freeCreditNotes?: string;
};

/** Enforce sitewide token expiration defaults on read/write. */
export function withDefaultTokenExpiration<T extends CreditCurrencyLike>(
  currency: T,
): T & { expires: true; expirationPeriod: string; rollsOver: false; resetsMonthly: false } {
  return {
    ...currency,
    expires: true,
    expirationPeriod: DEFAULT_TOKEN_EXPIRATION_PERIOD,
    rollsOver: false,
    resetsMonthly: false,
  };
}
