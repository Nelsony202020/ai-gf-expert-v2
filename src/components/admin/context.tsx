// Admin auth context — separate module so Layout HMR doesn't break the provider.

import { createContext, useContext } from 'react';

export interface Me {
  adminUserId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export const MeContext = createContext<Me | null>(null);

export function useMe(): Me {
  const me = useContext(MeContext);
  if (!me) throw new Error('useMe outside provider');
  return me;
}

export function useCan() {
  const me = useMe();
  return (permission: string) => me.permissions.includes(permission);
}
