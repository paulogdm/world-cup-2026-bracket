// Turns the canonical `matchScores` config into positioned labels for the
// bracket. Scores are real-world results (posterity), so a label is emitted
// only when the match currently shows the exact two teams that really played
// it — re-picking an upstream result changes the participants and the score
// falls away rather than being attached to a matchup that never occurred.

import { defaultResults, matchScores } from './config';
import { CX, CY, matchById, nodeById } from './structure';
import { picksFromResults, resolveTeam, type Picks } from './state';

// The winner picks implied by the real results — used to orient each score to
// the right flag and to know which teams the score genuinely belongs to.
const canonicalPicks = picksFromResults(defaultResults);

// BracketSvg sizes each pill from its own text, so a three-character score like
// "2–0" lands ~29px wide; half of that is what a label has to clear to sit
// beside an obstacle rather than on it.
const PILL_HALF_W = 14.5;

/**
 * The semi-finals settle who plays for the cup, so their scores are drawn at
 * double size. Clearance scales with it (see below), so the bigger pill still
 * sits clear of the finalist's flag.
 */
const SF_SCALE = 2;

export interface ScoreLabel {
  matchId: string;
  x: number;
  y: number;
  /** e.g. "2–1", ordered to read against the two flags' on-screen layout. */
  text: string;
  /** Pill size multiplier: 1 for most rounds, larger for the semi-finals. */
  scale: number;
}

function parse(raw: string): { winner: number; loser: number } | null {
  const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(raw.trim());
  if (!m) return null;
  return { winner: Number(m[1]), loser: Number(m[2]) };
}

const EN_DASH = '–';

/** Positioned score labels for every real match still shown with its real teams. */
export function scoreLabelsFor(picks: Picks): ScoreLabel[] {
  const labels: ScoreLabel[] = [];

  for (const [matchId, raw] of Object.entries(matchScores)) {
    // The Final is the exception: its winner isn't seated beside a connector but
    // crowned at the centre of the board, wearing the champion flag writ large
    // with the trophy above it. A normal score pill lands dead-centre on that
    // flag — a small stamp cluttering the celebration — so the Final gets no
    // label here. The centre champion treatment (the "big one") is untouched.
    if (matchId === 'F') continue;

    const parsed = parse(raw);
    if (!parsed) continue;

    const winnerSide = canonicalPicks[matchId];
    if (winnerSide === undefined) continue; // no recorded winner -> can't orient

    const m = matchById(matchId);
    const realA = resolveTeam(m.a, canonicalPicks);
    const realB = resolveTeam(m.b, canonicalPicks);
    const shownA = resolveTeam(m.a, picks);
    const shownB = resolveTeam(m.b, picks);
    // Only annotate the matchup that actually happened.
    if (!shownA || !shownB || shownA !== realA || shownB !== realB) continue;

    // Goals per bracket side (a = top/left input, b = bottom/right input).
    const aGoals = winnerSide === 0 ? parsed.winner : parsed.loser;
    const bGoals = winnerSide === 0 ? parsed.loser : parsed.winner;

    const na = nodeById(m.a);
    const nb = nodeById(m.b);
    // Read the pair intuitively: left→right when the flags are spread mostly
    // horizontally, top→bottom when they're stacked. Radial layout means neither
    // is guaranteed, so pick whichever axis separates them more.
    const horizontal = Math.abs(na.x - nb.x) >= Math.abs(na.y - nb.y);
    const [first, second] = horizontal
      ? na.x <= nb.x
        ? [aGoals, bGoals]
        : [bGoals, aGoals]
      : na.y <= nb.y
        ? [aGoals, bGoals]
        : [bGoals, aGoals];

    // Default: the midpoint of the two flags, sitting on the connector.
    let x = (na.x + nb.x) / 2;
    let y = (na.y + nb.y) / 2;

    // Outer ring (R32): the two flags are the biggest and most tightly packed,
    // so the midpoint lands right between them. Push the label outward along the
    // match's radial bisector, clear of both flag circles, into the corona
    // outside the ring where there's open space.
    if (m.round === 'R32') {
      const dx = x - CX;
      const dy = y - CY;
      const len = Math.hypot(dx, dy) || 1;
      // Outer edge of a leaf flag = its centre distance + its radius; sit just
      // beyond it so the pill never kisses a circle.
      const flagEdge = Math.hypot(na.x - CX, na.y - CY) + na.r;
      const target = flagEdge + 12;
      x = CX + (dx / len) * target;
      y = CY + (dy / len) * target;
    }

    // Semi-finals: the winner of an SF is a finalist, and its seat — the node
    // this match feeds, which shares the match id — sits on the very bisector
    // the midpoint lands on, wearing the biggest flag on the board. The label
    // would print on top of it. Both seats sit on the horizontal axis, so this
    // slides the pill sideways, outward past the flag's edge, into the open gap
    // between the finalist and the two quarter-finalists feeding it.
    if (m.round === 'SF') {
      const seat = nodeById(matchId);
      const dx = seat.x - CX;
      const dy = seat.y - CY;
      const len = Math.hypot(dx, dy) || 1;
      // Clear the flag edge by half the (double-size) pill's width — so it's the
      // pill's inner edge, not its centre, that lands past the flag — plus a gap
      // of the same order, leaving it beside the finalist rather than kissing it.
      const target = len + seat.r + PILL_HALF_W * SF_SCALE + 13;
      x = CX + (dx / len) * target;
      y = CY + (dy / len) * target;
    }

    const scale = m.round === 'SF' ? SF_SCALE : 1;
    labels.push({ matchId, x, y, scale, text: `${first}${EN_DASH}${second}` });
  }

  return labels;
}
