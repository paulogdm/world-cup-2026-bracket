// Bracket state: which side won each match, plus the querystring codec and the
// rules for advancing / re-picking teams.

import { MATCH_ORDER, finalChildren, matchById, nodeById } from './structure';
import type { TeamId } from './teams';

// Only decided matches appear. 0 = top/left input won, 1 = bottom/right input.
export type Picks = Record<string, 0 | 1>;

/** The team currently occupying a node, or undefined if not yet decided. */
export function resolveTeam(nodeId: string, picks: Picks): TeamId | undefined {
  const n = nodeById(nodeId);
  if (n.kind === 'leaf') return n.team;
  const p = picks[n.id];
  if (p === undefined) return undefined;
  return resolveTeam(p === 0 ? n.a! : n.b!, picks);
}

/** The champion, if the final has been decided. */
export function champion(picks: Picks): TeamId | undefined {
  const p = picks['F'];
  if (p === undefined) return undefined;
  return resolveTeam(finalChildren[p], picks);
}

/** Final-side node id (a semifinalist) that has been crowned, if any. */
export function championNode(picks: Picks): string | undefined {
  const p = picks['F'];
  return p === undefined ? undefined : finalChildren[p];
}

// ---- querystring codec --------------------------------------------------
// Each match is a base-3 digit: 0 = undecided, 1 = top won, 2 = bottom won.
// Packed little-endian into a BigInt, serialised as base-36.

export function encode(picks: Picks): string {
  let v = 0n;
  for (let i = MATCH_ORDER.length - 1; i >= 0; i--) {
    const p = picks[MATCH_ORDER[i]];
    const digit = p === undefined ? 0n : BigInt(p + 1);
    v = v * 3n + digit;
  }
  return v === 0n ? '' : v.toString(36);
}

export function decode(s: string): Picks {
  const picks: Picks = {};
  if (!s) return picks;
  let v = 0n;
  for (const ch of s) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d)) return {}; // corrupt input -> empty bracket
    v = v * 36n + BigInt(d);
  }
  // Only the first MATCH_ORDER.length base-3 digits are read; any extra
  // magnitude from an over-large value is simply ignored.
  for (const id of MATCH_ORDER) {
    const digit = Number(v % 3n);
    v /= 3n;
    if (digit === 1) picks[id] = 0;
    else if (digit === 2) picks[id] = 1;
  }
  return sanitize(picks);
}

/**
 * Drop any pick that doesn't correspond to a real, resolvable result — i.e. a
 * match flagged decided while the side it "won" has no team yet (an orphan from
 * a hand-edited URL). Processed in round order so a later round is validated
 * against the already-cleaned earlier rounds. The teams themselves are never
 * stored in the URL, so this is the only inconsistency tampering can introduce;
 * here we normalise it away.
 */
export function sanitize(picks: Picks): Picks {
  const clean: Picks = {};
  for (const id of MATCH_ORDER) {
    const side = picks[id];
    if (side === undefined) continue;
    const m = matchById(id);
    const child = side === 0 ? m.a : m.b;
    if (resolveTeam(child, clean) !== undefined) clean[id] = side;
  }
  return clean;
}

// ---- advancing / re-picking ---------------------------------------------
export interface PickResult {
  picks: Picks;
  cleared: string[]; // match ids whose result was invalidated (for the flash cue)
}

/**
 * Ancestor matches that actually consumed `matchId`'s winner — i.e. walk up the
 * tree only while each parent's chosen side flows through the branch we're
 * about to change, and stop as soon as a parent picked the *other* side (its
 * result is unaffected, so nothing above it changes either). This is what keeps
 * an edit in one branch from wiping unrelated branches.
 */
function dependentAncestors(picks: Picks, matchId: string): string[] {
  const result: string[] = [];
  let childNode = matchById(matchId).outId;
  while (childNode) {
    const parentId = nodeById(childNode).parentMatch;
    if (!parentId) break;
    const side = picks[parentId];
    if (side === undefined) break; // parent not decided -> nothing above depends
    const parent = matchById(parentId);
    const pickedNode = side === 0 ? parent.a : parent.b;
    if (pickedNode !== childNode) break; // parent took the sibling branch -> stop
    result.push(parentId);
    childNode = parent.outId;
  }
  return result;
}

/**
 * Clicking `nodeId` selects that team as the winner of its parent match.
 * - Clicking the already-selected team de-selects it (a handy undo).
 * - Changing an existing pick clears only the downstream picks that actually
 *   depended on the old winner.
 * Returns null when the click is a no-op (empty node, or the centre/final).
 */
export function applyPick(picks: Picks, nodeId: string): PickResult | null {
  const node = nodeById(nodeId);
  const parent = node.parentMatch;
  const side = node.side;
  if (!parent || side === undefined) return null; // nothing above this node
  if (resolveTeam(nodeId, picks) === undefined) return null; // no team here yet

  const current = picks[parent];
  if (current === side) return deselect(picks, parent);

  // Changing an existing pick invalidates the ancestors that consumed the old
  // winner (computed against the current picks, before we overwrite them).
  const cleared = current === undefined ? [] : dependentAncestors(picks, parent);
  const next: Picks = { ...picks };
  next[parent] = side;
  for (const id of cleared) delete next[id];
  return { picks: next, cleared };
}

function deselect(picks: Picks, matchId: string): PickResult {
  const cleared = [matchId, ...dependentAncestors(picks, matchId)];
  const next: Picks = { ...picks };
  for (const id of cleared) delete next[id];
  return { picks: next, cleared };
}

/**
 * Derive picks from a map of real-world results (matchId -> winning team).
 * Processed in round order so a later round can reference an earlier winner.
 * Entries that don't match the current participants are skipped.
 */
export function picksFromResults(results: Record<string, TeamId>): Picks {
  const picks: Picks = {};
  for (const id of MATCH_ORDER) {
    const want = results[id];
    if (!want) continue;
    const m = matchById(id);
    if (resolveTeam(m.a, picks) === want) picks[id] = 0;
    else if (resolveTeam(m.b, picks) === want) picks[id] = 1;
  }
  return picks;
}
