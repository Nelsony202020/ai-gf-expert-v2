// Pricing hub: subscription plans, credit packages, and payment methods.

import { useState } from 'react';
import { EntityPage } from '../EntityPage';
import {
  subscriptionPlansModule,
  creditPackagesModule,
  paymentProfilesModule,
} from '../modules';

const TABS = [
  { id: 'plans', label: 'Subscription plans' },
  { id: 'packages', label: 'Token / credit packages' },
  { id: 'payments', label: 'Payment methods' },
] as const;

export function PricingPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('plans');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'plans' && <EntityPage config={subscriptionPlansModule} />}
      {tab === 'packages' && <EntityPage config={creditPackagesModule} />}
      {tab === 'payments' && <EntityPage config={paymentProfilesModule} />}
    </div>
  );
}
