/** Directory payment ids derived from admin payment profile fields. */
export type ExplorerPaymentId =
  | 'pay-card'
  | 'pay-paypal'
  | 'pay-crypto'
  | 'pay-crypto-only'
  | 'pay-apple'
  | 'pay-google'
  | 'pay-wechat'
  | 'pay-alipay'
  | 'pay-bank'
  | 'pay-discover'
  | 'pay-discreet';

export type DirectoryPaymentIconType =
  | 'card'
  | 'paypal'
  | 'crypto'
  | 'apple'
  | 'google'
  | 'wechat'
  | 'alipay'
  | 'bank'
  | 'discover';

export type PaymentProfileLike = {
  creditCard?: boolean;
  debitCard?: boolean;
  paypal?: boolean;
  crypto?: boolean;
  cryptoOnly?: boolean;
  applePay?: boolean;
  googlePay?: boolean;
  wechatPay?: boolean;
  alipay?: boolean;
  bankTransfer?: boolean;
  discoverPay?: boolean;
  discreetBilling?: boolean;
};

/** Display order for payment method icons on directory cards and rows. */
export const DIRECTORY_PAYMENT_DISPLAY_ORDER: ExplorerPaymentId[] = [
  'pay-card',
  'pay-paypal',
  'pay-apple',
  'pay-google',
  'pay-crypto',
  'pay-wechat',
  'pay-alipay',
  'pay-bank',
  'pay-discover',
];

const PAYMENT_ID_TO_ICON: Record<ExplorerPaymentId, DirectoryPaymentIconType | null> = {
  'pay-card': 'card',
  'pay-paypal': 'paypal',
  'pay-crypto': 'crypto',
  'pay-crypto-only': 'crypto',
  'pay-apple': 'apple',
  'pay-google': 'google',
  'pay-wechat': 'wechat',
  'pay-alipay': 'alipay',
  'pay-bank': 'bank',
  'pay-discover': 'discover',
  'pay-discreet': null,
};

/** Build directory payment badges from admin payment profile. */
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
  if (profile.applePay) payments.push('pay-apple');
  if (profile.googlePay) payments.push('pay-google');
  if (profile.crypto) payments.push('pay-crypto');
  if (profile.wechatPay) payments.push('pay-wechat');
  if (profile.alipay) payments.push('pay-alipay');
  if (profile.bankTransfer) payments.push('pay-bank');
  if (profile.discoverPay) payments.push('pay-discover');
  if (profile.discreetBilling) payments.push('pay-discreet');

  return payments;
}

/** Map stored payment ids to unique icon types for display. */
export function getDirectoryPaymentIconTypes(paymentIds: string[]): DirectoryPaymentIconType[] {
  const seen = new Set<DirectoryPaymentIconType>();
  const icons: DirectoryPaymentIconType[] = [];

  DIRECTORY_PAYMENT_DISPLAY_ORDER.forEach((id) => {
    if (!paymentIds.includes(id)) return;
    const icon = PAYMENT_ID_TO_ICON[id];
    if (!icon || seen.has(icon)) return;
    seen.add(icon);
    icons.push(icon);
  });

  return icons;
}
