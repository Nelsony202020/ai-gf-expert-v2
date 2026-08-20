/**
 * Minimum-cost credit package combination (unbounded knapsack / coin change).
 * Finds the cheapest way to buy at least `shortfall` credits from active packs.
 */

export interface CreditPackageInput {
  name?: string;
  active?: boolean;
  price?: number | null;
  baseCredits?: number | null;
  bonusCredits?: number | null;
  tokenAmount?: number | null;
}

export interface PackagePurchaseLine {
  name: string;
  credits: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PackageComboResult {
  requiredCredits: number;
  purchasedCredits: number;
  leftoverCredits: number;
  topUpCost: number;
  packages: PackagePurchaseLine[];
  impossible: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function packageTotalCredits(pkg: CreditPackageInput): number | null {
  const base =
    pkg.baseCredits != null && Number.isFinite(Number(pkg.baseCredits))
      ? Number(pkg.baseCredits)
      : null;
  if (base !== null) {
    const bonus =
      pkg.bonusCredits != null && Number.isFinite(Number(pkg.bonusCredits))
        ? Number(pkg.bonusCredits)
        : 0;
    return base + bonus;
  }
  return pkg.tokenAmount != null && Number.isFinite(Number(pkg.tokenAmount))
    ? Number(pkg.tokenAmount)
    : null;
}

type Pack = { name: string; credits: number; price: number };

function activePacks(packages: CreditPackageInput[]): Pack[] {
  const out: Pack[] = [];
  for (const pkg of packages) {
    if (pkg.active === false) continue;
    const credits = packageTotalCredits(pkg);
    const price = pkg.price != null && Number.isFinite(Number(pkg.price)) ? Number(pkg.price) : null;
    if (credits == null || credits <= 0 || price == null || price < 0) continue;
    out.push({
      name: String(pkg.name ?? `${credits} credits`).trim() || `${credits} credits`,
      credits,
      price,
    });
  }
  out.sort((a, b) => a.price - b.price || a.credits - b.credits);
  return out;
}

export function solveMinCostPackageCombo(
  shortfall: number,
  packages: CreditPackageInput[],
): PackageComboResult {
  const required = Math.max(0, Math.ceil(shortfall));
  if (required <= 0) {
    return {
      requiredCredits: 0,
      purchasedCredits: 0,
      leftoverCredits: 0,
      topUpCost: 0,
      packages: [],
      impossible: false,
    };
  }

  const packs = activePacks(packages);
  if (packs.length === 0) {
    return {
      requiredCredits: required,
      purchasedCredits: 0,
      leftoverCredits: 0,
      topUpCost: 0,
      packages: [],
      impossible: true,
    };
  }

  const maxCredits = Math.max(...packs.map((p) => p.credits));
  const capacity = required + maxCredits;
  const INF = Number.POSITIVE_INFINITY;
  const minCost = new Float64Array(capacity + 1);
  const prevCredit = new Int32Array(capacity + 1);
  const prevPack = new Int32Array(capacity + 1);
  minCost.fill(INF);
  prevCredit.fill(-1);
  prevPack.fill(-1);
  minCost[0] = 0;

  for (let c = 0; c <= capacity; c++) {
    if (minCost[c]! >= INF) continue;
    for (let i = 0; i < packs.length; i++) {
      const pack = packs[i]!;
      const next = c + pack.credits;
      if (next > capacity) continue;
      const cost = minCost[c]! + pack.price;
      if (cost < minCost[next]! - 1e-12) {
        minCost[next] = cost;
        prevCredit[next] = c;
        prevPack[next] = i;
      }
    }
  }

  let bestCredits = -1;
  let bestCost = INF;
  for (let c = required; c <= capacity; c++) {
    const cost = minCost[c]!;
    if (cost < bestCost - 1e-12) {
      bestCost = cost;
      bestCredits = c;
    } else if (Math.abs(cost - bestCost) <= 1e-12 && (bestCredits < 0 || c < bestCredits)) {
      bestCredits = c;
    }
  }

  if (bestCredits < 0 || bestCost >= INF) {
    return {
      requiredCredits: required,
      purchasedCredits: 0,
      leftoverCredits: 0,
      topUpCost: 0,
      packages: [],
      impossible: true,
    };
  }

  const counts = new Map<number, number>();
  let cursor = bestCredits;
  while (cursor > 0) {
    const packIdx = prevPack[cursor]!;
    const prev = prevCredit[cursor]!;
    if (packIdx < 0 || prev < 0) break;
    counts.set(packIdx, (counts.get(packIdx) ?? 0) + 1);
    cursor = prev;
  }

  const lines: PackagePurchaseLine[] = [];
  for (const [idx, quantity] of counts) {
    const pack = packs[idx]!;
    lines.push({
      name: pack.name,
      credits: pack.credits,
      unitPrice: pack.price,
      quantity,
      lineTotal: round2(pack.price * quantity),
    });
  }
  lines.sort((a, b) => b.credits - a.credits || a.unitPrice - b.unitPrice);

  return {
    requiredCredits: required,
    purchasedCredits: bestCredits,
    leftoverCredits: bestCredits - required,
    topUpCost: round2(bestCost),
    packages: lines,
    impossible: false,
  };
}
