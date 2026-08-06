/** Shared image frame styling for the review editor and public render. */

import type { CSSProperties } from 'react';

export function clampWidthPercent(value: unknown): number {
  return Math.min(100, Math.max(30, Number(value ?? 100)));
}

export function clampRadiusPercent(value: unknown): number {
  return Math.min(100, Math.max(0, Number(value ?? 0)));
}

export function clampFocusPercent(value: unknown): number {
  return Math.min(100, Math.max(0, Number(value ?? 50)));
}

export function isCircleCrop(radius: number): boolean {
  return radius >= 100;
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
      overflow: 'hidden',
    };
    if (isCircleCrop(radius)) {
      return { ...base, aspectRatio: '1 / 1', clipPath: `circle(50% at ${focusX}% ${focusY}%)` };
    }
    return { ...base, borderRadius: `${radius}%` };
  }

  const base: CSSProperties = {
    width: `${widthPercent}%`,
    maxWidth: '100%',
    marginInline: widthPercent < 100 ? 'auto' : undefined,
    overflow: 'hidden',
  };
  if (isCircleCrop(radius)) {
    return { ...base, aspectRatio: '1 / 1', clipPath: `circle(50% at ${focusX}% ${focusY}%)` };
  }
  return { ...base, borderRadius: `${radius}%` };
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
    return `${widthStyle}aspect-ratio:1/1;overflow:hidden;clip-path:circle(50% at ${focusX}% ${focusY}%);`;
  }
  return `${widthStyle}border-radius:${radius}%;overflow:hidden;`;
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
