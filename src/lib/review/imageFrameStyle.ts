/** Shared image frame styling for the review editor and public render. */

import type { CSSProperties } from 'react';

export function clampWidthPercent(value: unknown): number {
  return Math.min(100, Math.max(30, Number(value ?? 100)));
}

/** Default corner radius for review article images (px). Missing values use this. */
export const DEFAULT_IMAGE_BORDER_RADIUS_PX = 12;

/**
 * Rounding intensity stored on image blocks (legacy field name: borderRadiusPercent).
 * 0–99 → pixel corner radius (even on any aspect ratio).
 * ≥100 → circle crop.
 * `null` / `undefined` → default 12px.
 */
export function clampRadiusPercent(value: unknown): number {
  if (value == null || value === '') return DEFAULT_IMAGE_BORDER_RADIUS_PX;
  return Math.min(100, Math.max(0, Number(value)));
}

export function clampFocusPercent(value: unknown): number {
  return Math.min(100, Math.max(0, Number(value ?? 50)));
}

export function isCircleCrop(radius: number): boolean {
  return radius >= 100;
}

/** Pixel corner radius for non-circle rounding. */
export function radiusToCss(radius: number): string {
  if (radius <= 0) return '0';
  if (isCircleCrop(radius)) return '9999px';
  return `${Math.round(radius)}px`;
}

export function figureFrameStyle(attrs: {
  widthPercent?: unknown;
  borderRadiusPercent?: unknown;
  clipFocusX?: unknown;
  clipFocusY?: unknown;
  rowCell?: boolean;
  rowWidth?: number;
}): CSSProperties {
  const widthPercent = attrs.rowCell
    ? clampWidthPercent(attrs.rowWidth ?? 50)
    : clampWidthPercent(attrs.widthPercent);
  const radius = clampRadiusPercent(attrs.borderRadiusPercent);
  const focusX = clampFocusPercent(attrs.clipFocusX);
  const focusY = clampFocusPercent(attrs.clipFocusY);

  if (attrs.rowCell) {
    const base: CSSProperties = {
      flex: `0 0 calc(${widthPercent}% - 6px)`,
      maxWidth: `calc(${widthPercent}% - 6px)`,
    };
    if (isCircleCrop(radius)) {
      return { ...base, aspectRatio: '1 / 1', overflow: 'hidden', clipPath: `circle(50% at ${focusX}% ${focusY}%)` };
    }
    return base;
  }

  const base: CSSProperties = {
    width: `${widthPercent}%`,
    maxWidth: '100%',
    marginInline: widthPercent < 100 ? 'auto' : undefined,
  };
  if (isCircleCrop(radius)) {
    return { ...base, aspectRatio: '1 / 1', overflow: 'hidden', clipPath: `circle(50% at ${focusX}% ${focusY}%)` };
  }
  return base;
}

/** Style for the media frame only (not figcaption). */
export function figureMediaFrameStyle(attrs: {
  borderRadiusPercent?: unknown;
  clipFocusX?: unknown;
  clipFocusY?: unknown;
}): CSSProperties {
  const radius = clampRadiusPercent(attrs.borderRadiusPercent);
  const focusX = clampFocusPercent(attrs.clipFocusX);
  const focusY = clampFocusPercent(attrs.clipFocusY);
  if (isCircleCrop(radius)) {
    return {
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      clipPath: `circle(50% at ${focusX}% ${focusY}%)`,
    };
  }
  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radiusToCss(radius),
  };
}

export function figureImageStyle(attrs: {
  borderRadiusPercent?: unknown;
  clipFocusX?: unknown;
  clipFocusY?: unknown;
}): CSSProperties {
  const radius = clampRadiusPercent(attrs.borderRadiusPercent);
  const focusX = clampFocusPercent(attrs.clipFocusX);
  const focusY = clampFocusPercent(attrs.clipFocusY);
  if (isCircleCrop(radius)) {
    return {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: `${focusX}% ${focusY}%`,
    };
  }
  return { display: 'block', width: '100%', height: 'auto' };
}

export function publicFigureStyle(attrs: {
  widthPercent?: unknown;
  borderRadiusPercent?: unknown;
  clipFocusX?: unknown;
  clipFocusY?: unknown;
  rowCell?: boolean;
}): string {
  const width = clampWidthPercent(attrs.widthPercent ?? (attrs.rowCell ? 50 : 100));
  const radius = clampRadiusPercent(attrs.borderRadiusPercent);
  const focusX = clampFocusPercent(attrs.clipFocusX);
  const focusY = clampFocusPercent(attrs.clipFocusY);
  const widthStyle = attrs.rowCell
    ? `flex:0 0 calc(${width}% - 6px);max-width:calc(${width}% - 6px);`
    : `width:${width}%;max-width:100%;margin-inline:${width < 100 ? 'auto' : '0'};`;
  if (isCircleCrop(radius)) {
    return `${widthStyle}aspect-ratio:1/1;`;
  }
  return widthStyle;
}

/** Inline style for the media frame wrapper (radius applies here, not on the figure). */
export function publicMediaFrameStyle(attrs: {
  borderRadiusPercent?: unknown;
  clipFocusX?: unknown;
  clipFocusY?: unknown;
}): string {
  const radius = clampRadiusPercent(attrs.borderRadiusPercent);
  const focusX = clampFocusPercent(attrs.clipFocusX);
  const focusY = clampFocusPercent(attrs.clipFocusY);
  if (isCircleCrop(radius)) {
    return `position:relative;overflow:hidden;width:100%;height:100%;clip-path:circle(50% at ${focusX}% ${focusY}%);`;
  }
  return `position:relative;overflow:hidden;border-radius:${radiusToCss(radius)};`;
}

export function publicImageStyle(attrs: {
  borderRadiusPercent?: unknown;
  clipFocusX?: unknown;
  clipFocusY?: unknown;
}): string {
  const radius = clampRadiusPercent(attrs.borderRadiusPercent);
  const focusX = clampFocusPercent(attrs.clipFocusX);
  const focusY = clampFocusPercent(attrs.clipFocusY);
  if (isCircleCrop(radius)) {
    return `width:100%;height:100%;object-fit:cover;object-position:${focusX}% ${focusY}%;display:block;`;
  }
  return 'width:100%;height:auto;display:block;';
}
