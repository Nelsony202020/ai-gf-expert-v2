import type { GuidedSession } from './GuidedTestingMode';

export interface CategoryCheckpointInfo {
  afterSessionIndex: number;
  completedCategoryName: string;
  nextCategoryName: string;
  nextSessionIndex: number;
}

/** Category transitions — checkpoint shown after the last session of each category. */
export function categoryCheckpoints(sessions: GuidedSession[]): CategoryCheckpointInfo[] {
  const out: CategoryCheckpointInfo[] = [];
  for (let i = 0; i < sessions.length - 1; i++) {
    if (sessions[i].cat.id !== sessions[i + 1].cat.id) {
      out.push({
        afterSessionIndex: i,
        completedCategoryName: String(sessions[i].cat.name),
        nextCategoryName: String(sessions[i + 1].cat.name),
        nextSessionIndex: i + 1,
      });
    }
  }
  return out;
}

export function checkpointAfterSession(
  sessionIndex: number,
  sessions: GuidedSession[],
): CategoryCheckpointInfo | null {
  return categoryCheckpoints(sessions).find((c) => c.afterSessionIndex === sessionIndex) ?? null;
}
