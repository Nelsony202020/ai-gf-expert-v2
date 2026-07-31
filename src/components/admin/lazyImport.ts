import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type ImportFactory<T> = () => Promise<{ default: T }>;

/** Lazy import with one retry — helps recover from stale Vite HMR module URLs in dev. */
export function lazyImport<T extends ComponentType<any>>(
  factory: ImportFactory<T>,
  _label: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      await new Promise((r) => setTimeout(r, 250));
      return factory();
    }
  });
}
