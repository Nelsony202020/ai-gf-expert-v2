/** Explorer / directory payment filter ids (pay-card, pay-paypal, …). */
export type ExplorerPaymentId =
  | 'pay-card'
  | 'pay-paypal'
  | 'pay-crypto'
  | 'pay-crypto-only'
  | 'pay-discreet';

export type PaymentProfileLike = {
  creditCard?: boolean;
  debitCard?: boolean;
  paypal?: boolean;
  crypto?: boolean;
  cryptoOnly?: boolean;
  discreetBilling?: boolean;
};

/** Build directory payment badges + filter tags from admin payment profile. */
export function buildExplorerPaymentsFromProfile(
  profile?: PaymentProfileLike | null,
): ExplorerPaymentId[] {
  if (!profile) return [];

  const payments: ExplorerPaymentId[] = [];

  if (profile.cryptoOnly) {
    if (profile.crypto) payments.push('pay-crypto');
    payments.push('pay-crypto-only');
    return payments;
  }

  if (profile.creditCard || profile.debitCard) payments.push('pay-card');
  if (profile.paypal) payments.push('pay-paypal');
  if (profile.crypto) payments.push('pay-crypto');
  if (profile.discreetBilling) payments.push('pay-discreet');

  return payments;
}
