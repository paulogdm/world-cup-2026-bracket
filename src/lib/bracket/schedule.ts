// Static venue/date/time for each knockout match, keyed by the bracket match id
// from `structure.ts` (R32-01 … F). The data lives in `schedule.json`.
//
// Each app match id maps to the REAL FIFA match it represents (see `fifaMatch`):
//   - Round of 32: matched by the actual fixture (the two teams in teams.ts),
//     so e.g. Brazil vs Japan (R32-09) resolves to match 76 at NRG Stadium.
//   - Round of 16+: matched by the real bracket feed (winner-of-X vs winner-of-Y),
//     which is why the app's slot order does NOT equal the FIFA match number order.
//
// Kickoff is stored as a single UTC instant plus the venue's IANA timezone, so
// both the venue-local time and the viewer's local time are derived with `Intl`
// in the active UI locale (see `formatKickoff`).

import scheduleData from './schedule.json';

export interface MatchSchedule {
  fifaMatch: number;
  round: string; // canonical English label (reference; UI translates by match id)
  utc: string; // kickoff instant, e.g. '2026-07-04T21:00:00Z'
  tzName: string; // venue IANA timezone, e.g. 'America/Chicago'
  stadium: string;
  city: string;
  country: string; // 'USA' | 'Canada' | 'Mexico'
}

export const matchSchedule = scheduleData as Record<string, MatchSchedule>;

export function scheduleFor(matchId: string): MatchSchedule | undefined {
  return matchSchedule[matchId];
}

export interface FormattedKickoff {
  date: string; // e.g. 'Mon, Jun 29'
  time: string; // e.g. '12:00 PM CDT'
}

/**
 * Format a kickoff instant for display. Pass `timeZone` (an IANA name) to show
 * the venue-local time; omit it to use the viewer's own timezone. `locale` is a
 * BCP-47 tag (the app's current locale) so weekday/month/clock all localize.
 * Returns null on the server or for an invalid instant — caller should guard.
 */
export function formatKickoff(
  utc: string,
  locale: string,
  timeZone?: string
): FormattedKickoff | null {
  try {
    const d = new Date(utc);
    if (Number.isNaN(d.getTime())) return null;
    const date = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone
    }).format(d);
    const time = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone
    }).format(d);
    return { date, time };
  } catch {
    return null;
  }
}
