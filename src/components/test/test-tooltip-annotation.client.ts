type Side = 'left' | 'right' | 'above';

type ConnectorPair = { n: string; side: Side };

const DEFAULT_CONNECTOR_PAIRS: ConnectorPair[] = [
  { n: '1', side: 'left' },
  { n: '2', side: 'right' },
  { n: '3', side: 'left' },
  { n: '4', side: 'right' },
];

function readConnectorPairs(root: HTMLElement): ConnectorPair[] {
  const raw = root.dataset.annotationConnectors;
  if (!raw) return DEFAULT_CONNECTOR_PAIRS;

  try {
    const parsed = JSON.parse(raw) as ConnectorPair[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CONNECTOR_PAIRS;
  } catch {
    return DEFAULT_CONNECTOR_PAIRS;
  }
}

function relRect(el: Element, root: DOMRect) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left - root.left,
    top: rect.top - root.top,
    right: rect.right - root.left,
    bottom: rect.bottom - root.top,
    width: rect.width,
    height: rect.height,
  };
}

function panelRect(tooltip: Element, canvasRect: DOMRect) {
  const panel = tooltip.querySelector('.ratings-tooltip-panel') ?? tooltip;
  return relRect(panel, canvasRect);
}

function anchorPoint(side: Side, rect: ReturnType<typeof relRect>) {
  if (side === 'above') {
    return { x: rect.left + rect.width * 0.18, y: rect.bottom };
  }

  const y = rect.top + rect.height / 2;
  return side === 'left' ? { x: rect.right, y } : { x: rect.left, y };
}

function targetPoint(
  side: Side,
  targetRect: ReturnType<typeof relRect>,
  borderRect: ReturnType<typeof relRect>,
) {
  if (side === 'above') {
    const targetX = targetRect.left + targetRect.width / 2;
    return {
      x: Math.min(Math.max(targetX, borderRect.left), borderRect.right),
      y: borderRect.top,
    };
  }

  const y = targetRect.top + targetRect.height / 2;
  return side === 'left'
    ? { x: borderRect.left, y }
    : { x: borderRect.right, y };
}

const CONNECTOR_DOT_R = 2.5;
const CONNECTOR_LANE_OFFSET = 10;

function abovePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  tooltipRect: ReturnType<typeof relRect>,
) {
  const routeY = tooltipRect.top - CONNECTOR_LANE_OFFSET;
  const hSign = end.x >= start.x ? 1 : -1;
  const vSignToRoute = routeY >= start.y ? 1 : -1;
  const vSignToEnd = end.y >= routeY ? 1 : -1;
  const radius = Math.min(
    7,
    Math.abs(end.x - start.x) * 0.35,
    Math.abs(routeY - start.y) * 0.45,
    Math.abs(end.y - routeY) * 0.45,
  );

  if (radius < 2.5) {
    return `M ${start.x} ${start.y} V ${routeY} H ${end.x} V ${end.y}`;
  }

  return [
    `M ${start.x} ${start.y}`,
    `V ${routeY - vSignToRoute * radius}`,
    `Q ${start.x} ${routeY} ${start.x + hSign * radius} ${routeY}`,
    `H ${end.x - hSign * radius}`,
    `Q ${end.x} ${routeY} ${end.x} ${routeY + vSignToEnd * radius}`,
    `V ${end.y}`,
  ].join(' ');
}

function elbowPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  gutterX: number,
) {
  const midX = gutterX;
  const hSign = midX >= start.x ? 1 : -1;
  const vSign = end.y >= start.y ? 1 : -1;
  const endHSign = end.x >= midX ? 1 : -1;
  const radius = Math.min(
    7,
    Math.abs(midX - start.x) * 0.45,
    Math.abs(end.y - start.y) * 0.45,
    Math.abs(end.x - midX) * 0.45,
  );

  if (radius < 2.5) {
    return `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`;
  }

  return [
    `M ${start.x} ${start.y}`,
    `H ${midX - hSign * radius}`,
    `Q ${midX} ${start.y} ${midX} ${start.y + vSign * radius}`,
    `V ${end.y - vSign * radius}`,
    `Q ${midX} ${end.y} ${midX + endHSign * radius} ${end.y}`,
    `H ${end.x}`,
  ].join(' ');
}

export function drawTooltipAnnotationConnectors(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.test-tooltip-annotation__svg');
  const tooltip = root.querySelector('[data-annotation-tooltip]');
  if (!svg || !tooltip) return;

  const isMobile = window.matchMedia('(max-width: 1023px)').matches;
  if (isMobile) {
    svg.replaceChildren();
    return;
  }

  const canvasRect = root.getBoundingClientRect();
  if (canvasRect.width <= 0 || canvasRect.height <= 0) return;

  svg.setAttribute('width', String(canvasRect.width));
  svg.setAttribute('height', String(canvasRect.height));
  svg.setAttribute('viewBox', `0 0 ${canvasRect.width} ${canvasRect.height}`);
  svg.replaceChildren();

  const connectorPairs = readConnectorPairs(root);
  const borderRect = panelRect(tooltip, canvasRect);
  const leftGutter = borderRect.left - CONNECTOR_LANE_OFFSET;
  const rightGutter = borderRect.right + CONNECTOR_LANE_OFFSET;

  connectorPairs.forEach(({ n, side }) => {
    const callout = root.querySelector(`[data-annotation-callout="${n}"]`);
    const target = root.querySelector(`[data-annotation-target="${n}"]`);
    if (!callout || !target) return;

    const calloutRect = relRect(callout, canvasRect);
    const targetRect = relRect(target, canvasRect);
    const start = anchorPoint(side, calloutRect);
    const end = targetPoint(side, targetRect, borderRect);
    const gutterX = side === 'left' ? leftGutter : side === 'right' ? rightGutter : 0;

    const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startDot.setAttribute('cx', String(start.x));
    startDot.setAttribute('cy', String(start.y));
    startDot.setAttribute('r', String(CONNECTOR_DOT_R));
    startDot.setAttribute('class', 'test-tooltip-annotation__dot');

    const endDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endDot.setAttribute('cx', String(end.x));
    endDot.setAttribute('cy', String(end.y));
    endDot.setAttribute('r', String(CONNECTOR_DOT_R));
    endDot.setAttribute('class', 'test-tooltip-annotation__dot test-tooltip-annotation__dot--end');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      side === 'above' ? abovePath(start, end, borderRect) : elbowPath(start, end, gutterX),
    );
    path.setAttribute('class', 'test-tooltip-annotation__path');

    svg.appendChild(path);
    svg.appendChild(startDot);
    svg.appendChild(endDot);
  });
}

export function initTooltipAnnotations() {
  document.querySelectorAll<HTMLElement>('[data-tooltip-annotation]').forEach((root) => {
    if (root.dataset.annotationBound === 'true') {
      drawTooltipAnnotationConnectors(root);
      return;
    }
    root.dataset.annotationBound = 'true';

    const redraw = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => drawTooltipAnnotationConnectors(root));
      });
    };

    redraw();
    window.setTimeout(redraw, 120);

    window.addEventListener('resize', redraw);
    new ResizeObserver(redraw).observe(root);

    root.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', redraw, { once: true });
    });

    document.fonts?.ready.then(redraw);
  });
}
