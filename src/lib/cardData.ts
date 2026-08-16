import { DevCard, Gem, Noble, Cost } from "./types";

const GEMS: Gem[] = ["white", "blue", "green", "red", "black"];

function rngFrom(seed: number) {
  // simple deterministic PRNG (mulberry32) so the "deck" is stable across server restarts
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// NOTE: costs/points below are PLACEHOLDER values generated procedurally to match
// Splendor's overall structure (card counts per tier, point distribution, bonus colors).
// Swap this file out with your own researched/entered values when ready —
// the engine only cares about the shape (tier, bonus, points, cost), not these numbers.

function genTierCards(tier: 1 | 2 | 3, count: number, seed: number): DevCard[] {
  const rand = rngFrom(seed);
  const cards: DevCard[] = [];
  const pointRanges: Record<1 | 2 | 3, [number, number]> = {
    1: [0, 1],
    2: [1, 3],
    3: [3, 5],
  };
  const costRanges: Record<1 | 2 | 3, [number, number]> = {
    1: [1, 4],
    2: [3, 6],
    3: [3, 7],
  };
  for (let i = 0; i < count; i++) {
    const bonus = GEMS[Math.floor(rand() * GEMS.length)];
    const [pMin, pMax] = pointRanges[tier];
    const points = Math.floor(rand() * (pMax - pMin + 1)) + pMin;
    const [cMin, cMax] = costRanges[tier];
    const numColors = tier === 1 ? 2 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 3);
    const cost: Cost = {};
    const shuffledGems = [...GEMS].sort(() => rand() - 0.5);
    for (let c = 0; c < numColors; c++) {
      const g = shuffledGems[c];
      if (g === bonus && rand() < 0.3) continue; // occasionally skip own-color cost
      cost[g] = Math.floor(rand() * (cMax - cMin + 1)) + cMin;
    }
    cards.push({
      id: `t${tier}-${i}`,
      tier,
      bonus,
      points,
      cost,
    });
  }
  return cards;
}

export function generateDeck(): Record<1 | 2 | 3, DevCard[]> {
  return {
    1: genTierCards(1, 40, 1001),
    2: genTierCards(2, 30, 2002),
    3: genTierCards(3, 20, 3003),
  };
}

export function generateNobles(): Noble[] {
  const rand = rngFrom(9009);
  const nobles: Noble[] = [];
  for (let i = 0; i < 10; i++) {
    const req: Cost = {};
    const shuffled = [...GEMS].sort(() => rand() - 0.5);
    const numColors = 3;
    for (let c = 0; c < numColors; c++) {
      req[shuffled[c]] = 3 + Math.floor(rand() * 2); // 3-4
    }
    nobles.push({ id: `noble-${i}`, points: 3, requirement: req });
  }
  return nobles;
}
