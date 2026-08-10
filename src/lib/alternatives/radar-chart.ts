/** Radar chart helpers for alternatives score comparison. */

export const RADAR_CATEGORY_KEYS = [
  'characters',
  'customization',
  'chat',
  'images',
  'video',
  'privacy',
  'pricing',
] as const;

export type RadarCategoryKey = (typeof RADAR_CATEGORY_KEYS)[number];

export const RADAR_CATEGORY_LABELS: Record<RadarCategoryKey, string> = {
  characters: 'Characters',
  customization: 'Customization',
  chat: 'Chat',
  images: 'Images',
  video: 'Video',
  privacy: 'Privacy',
  pricing: 'Pricing',
};

export interface RadarSeries {
  name: string;
  color: string;
  scores: number[];
  highlight?: boolean;
}

export interface RadarChartModel {
  categories: RadarCategoryKey[];
  labels: string[];
  series: RadarSeries[];
}

const DEFAULT_COLORS = ['#db2777', '#7c3aed', '#2563eb', '#16a34a'];

export function buildRadarChartModel(
  sourceName: string,
  sourceScores: Record<string, number | null>,
  peers: Array<{ name: string; scores: Record<string, number | null> }>,
): RadarChartModel {
  const categories = [...RADAR_CATEGORY_KEYS];
  const labels = categories.map((k) => RADAR_CATEGORY_LABELS[k]);

  const series: RadarSeries[] = [
    {
      name: sourceName,
      color: DEFAULT_COLORS[0],
      scores: categories.map((k) => sourceScores[k] ?? 0),
      highlight: true,
    },
    ...peers.slice(0, 3).map((peer, i) => ({
      name: peer.name,
      color: DEFAULT_COLORS[i + 1] ?? '#64748b',
      scores: categories.map((k) => peer.scores[k] ?? 0),
    })),
  ];

  return { categories, labels, series };
}

export function radarPoint(score: number, index: number, total: number, cx: number, cy: number, radius: number) {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;
  const r = (Math.min(Math.max(score, 0), 10) / 10) * radius;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export function radarPolygonPoints(scores: number[], cx: number, cy: number, radius: number): string {
  return scores
    .map((score, i) => {
      const p = radarPoint(score, i, scores.length, cx, cy, radius);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');
}

export function radarAxisPoint(index: number, total: number, cx: number, cy: number, radius: number) {
  return radarPoint(10, index, total, cx, cy, radius);
}

export function radarLabelPoint(index: number, total: number, cx: number, cy: number, radius: number) {
  return radarPoint(10, index, total, cx, cy, radius + 22);
}
