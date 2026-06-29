// Builds the knockout tree and its radial geometry from the seeding in
// `teams.ts`. Everything downstream (state, rendering) reads from here so the
// bracket has a single source of truth.

import { LEFT_HALF, RIGHT_HALF, type TeamId } from './teams';

export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'F';
export const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', 'F'];
type PlacedRound = Exclude<Round, 'F'> | 'LEAF';
const BRACKET_ROUNDS: Exclude<Round, 'F'>[] = ['R32', 'R16', 'QF', 'SF'];

export interface BracketNode {
  id: string;
  kind: 'leaf' | 'match';
  round: Round | 'LEAF';
  team?: TeamId; // leaves only — fixed team
  a?: string; // match only — child node ids
  b?: string;
  x: number;
  y: number;
  r: number; // flag circle radius
  parentMatch?: string; // the match this node feeds into
  side?: 0 | 1; // which input of the parent match
}

export interface MatchDef {
  id: string;
  round: Round;
  a: string; // child node id (top/left input)
  b: string; // child node id (bottom/right input)
  outId: string | null; // output node id; null for the final (champion = centre)
}

// ---- geometry constants -------------------------------------------------
export const VW = 880;
export const VH = 980;
export const CX = 440;
export const CY = 490;
const MAXR = 380;
const LEAF_ANGLE_STEP = 360 / (LEFT_HALF.length + RIGHT_HALF.length);
const TOP_AXIS = 90;

const RADIUS_FRACTION: Record<PlacedRound, number> = {
  LEAF: 1.0,
  R32: 0.8,
  R16: 0.62,
  QF: 0.45,
  SF: 0.3
};

const FLAG_RADIUS: Record<PlacedRound, number> = {
  LEAF: 27,
  R32: 23,
  R16: 21,
  QF: 20,
  // The two semifinalists are the finalists — the championship contenders — so
  // their circles are the largest on the board to draw the eye to the final pick.
  SF: 30
};

const deg2rad = (d: number) => (d * Math.PI) / 180;

// ---- build --------------------------------------------------------------
const nodes = new Map<string, BracketNode>();
const angleOf = new Map<string, number>(); // degrees, internal bookkeeping
const matches: MatchDef[] = [];

function place(angleDeg: number, fraction: number, flagR: number) {
  const a = deg2rad(angleDeg);
  const r = fraction * MAXR;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a), r: flagR };
}

function assignLeaves(half: 'L' | 'R', leaves: readonly TeamId[]) {
  leaves.forEach((team, i) => {
    const angle =
      half === 'R'
        ? TOP_AXIS - LEAF_ANGLE_STEP / 2 - LEAF_ANGLE_STEP * i
        : TOP_AXIS + LEAF_ANGLE_STEP / 2 + LEAF_ANGLE_STEP * i;
    const id = `leaf-${team}`;
    angleOf.set(id, angle);
    nodes.set(id, {
      id,
      kind: 'leaf',
      round: 'LEAF',
      team,
      ...place(angle, RADIUS_FRACTION.LEAF, FLAG_RADIUS.LEAF)
    });
  });
}

const counters: Record<Round, number> = { R32: 1, R16: 1, QF: 1, SF: 1, F: 1 };
const pad = (n: number) => String(n).padStart(2, '0');

function buildHalf(half: 'L' | 'R', leaves: readonly TeamId[]): string {
  assignLeaves(half, leaves);
  let level = leaves.map((t) => `leaf-${t}`);

  for (const round of BRACKET_ROUNDS) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const aId = level[i];
      const bId = level[i + 1];
      const id = `${round}-${pad(counters[round]++)}`;
      const angle = (angleOf.get(aId)! + angleOf.get(bId)!) / 2;
      angleOf.set(id, angle);
      nodes.set(id, {
        id,
        kind: 'match',
        round,
        a: aId,
        b: bId,
        ...place(angle, RADIUS_FRACTION[round], FLAG_RADIUS[round])
      });
      matches.push({ id, round, a: aId, b: bId, outId: id });

      nodes.get(aId)!.parentMatch = id;
      nodes.get(aId)!.side = 0;
      nodes.get(bId)!.parentMatch = id;
      nodes.get(bId)!.side = 1;
      next.push(id);
    }
    level = next;
  }
  return level[0]; // the semifinalist for this half
}

const leftSF = buildHalf('L', LEFT_HALF);
const rightSF = buildHalf('R', RIGHT_HALF);

// The final joins the two halves horizontally across the centre trophy.
matches.push({ id: 'F', round: 'F', a: leftSF, b: rightSF, outId: null });
nodes.get(leftSF)!.parentMatch = 'F';
nodes.get(leftSF)!.side = 0;
nodes.get(rightSF)!.parentMatch = 'F';
nodes.get(rightSF)!.side = 1;

// ---- exported views -----------------------------------------------------
export const allNodes: BracketNode[] = [...nodes.values()];

const matchMap = new Map(matches.map((m) => [m.id, m]));

export function getMatchById(id: string): MatchDef | undefined {
  return matchMap.get(id);
}

export function matchById(id: string): MatchDef {
  const match = getMatchById(id);
  if (!match) throw new Error(`Unknown match id: ${id}`);
  return match;
}

export function nodeById(id: string): BracketNode {
  const node = nodes.get(id);
  if (!node) throw new Error(`Unknown node id: ${id}`);
  return node;
}

export const finalChildren: [string, string] = [leftSF, rightSF];

// Stable order used to encode/decode the querystring. Round by round so a
// match always comes after the matches that feed it.
export const MATCH_ORDER: string[] = (() => {
  const order: string[] = [];
  for (const round of ROUND_ORDER) {
    for (const m of matches) if (m.round === round) order.push(m.id);
  }
  return order;
})();

// Connectors: two branches per match, child node -> output node.
// For the final, the output is the centre trophy.
export interface Connector {
  matchId: string;
  side: 0 | 1;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  path: string;
}

function polarPoint(angle: number, radius: number) {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle)
  };
}

function connectorPath(c: Omit<Connector, 'path'>): string {
  const startAngle = Math.atan2(CY - c.y1, c.x1 - CX);
  const endAngle = Math.atan2(CY - c.y2, c.x2 - CX);
  const startRadius = Math.hypot(c.x1 - CX, c.y1 - CY);
  const endRadius = Math.hypot(c.x2 - CX, c.y2 - CY);

  if (endRadius < 1) {
    const control = polarPoint(startAngle, startRadius * 0.42);
    return `M ${c.x1} ${c.y1} Q ${control.x} ${control.y} ${c.x2} ${c.y2}`;
  }

  const bendRadius = (startRadius + endRadius) / 2;
  const startBend = polarPoint(startAngle, bendRadius);
  const endBend = polarPoint(endAngle, bendRadius);
  const rawDelta = endAngle - startAngle;
  const delta = Math.atan2(Math.sin(rawDelta), Math.cos(rawDelta));
  const sweep = delta < 0 ? 1 : 0;

  return [
    `M ${c.x1} ${c.y1}`,
    `L ${startBend.x} ${startBend.y}`,
    `A ${bendRadius} ${bendRadius} 0 0 ${sweep} ${endBend.x} ${endBend.y}`,
    `L ${c.x2} ${c.y2}`
  ].join(' ');
}

export const connectors: Connector[] = matches.flatMap((m) => {
  const out = m.outId ? nodes.get(m.outId)! : { x: CX, y: CY };
  const a = nodes.get(m.a)!;
  const b = nodes.get(m.b)!;
  const connectorA = { matchId: m.id, side: 0 as const, x1: a.x, y1: a.y, x2: out.x, y2: out.y };
  const connectorB = { matchId: m.id, side: 1 as const, x1: b.x, y1: b.y, x2: out.x, y2: out.y };
  return [
    { ...connectorA, path: connectorPath(connectorA) },
    { ...connectorB, path: connectorPath(connectorB) }
  ];
});
