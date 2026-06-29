import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEAMS, type TeamId } from '$lib/bracket/teams';
import { LOCALES, detectLocale } from './locales';
import { STRINGS, type Strings } from './strings';
import { localizedTeamName } from './team-names';

const teamIds = Object.keys(TEAMS) as TeamId[];

describe('detectLocale', () => {
  afterEach(() => vi.unstubAllGlobals());

  const cases: Array<[string[], string]> = [
    [['pt-BR'], 'pt-BR'],
    [['pt-PT'], 'pt-BR'], // any Portuguese variant maps to pt-BR
    [['es-MX', 'en-US'], 'es'],
    [['en-GB'], 'en'],
    [['fr-FR', 'de'], 'en'], // unsupported → default
    [[], 'en']
  ];

  for (const [languages, expected] of cases) {
    it(`maps ${JSON.stringify(languages)} → ${expected}`, () => {
      vi.stubGlobal('navigator', { languages, language: languages[0] ?? '' });
      expect(detectLocale()).toBe(expected);
    });
  }

  it('falls back to en when navigator is unavailable', () => {
    vi.stubGlobal('navigator', undefined);
    expect(detectLocale()).toBe('en');
  });
});

describe('UI strings', () => {
  const keys = Object.keys(STRINGS.en) as Array<keyof Strings>;

  for (const locale of LOCALES) {
    it(`${locale} defines every key with a non-empty value`, () => {
      for (const key of keys) {
        const value = STRINGS[locale][key];
        if (typeof value === 'function') {
          expect(value('X').length).toBeGreaterThan(0);
        } else {
          expect(value.length).toBeGreaterThan(0);
        }
      }
    });
  }
});

describe('localizedTeamName', () => {
  it('returns the English source name for the en locale', () => {
    for (const id of teamIds) {
      expect(localizedTeamName(id, 'en')).toBe(TEAMS[id].name);
    }
  });

  it('resolves a non-empty name for every team in every locale', () => {
    for (const locale of LOCALES) {
      for (const id of teamIds) {
        expect(localizedTeamName(id, locale).length).toBeGreaterThan(0);
      }
    }
  });

  it('translates known names', () => {
    expect(localizedTeamName('de', 'pt-BR')).toBe('Alemanha');
    expect(localizedTeamName('de', 'es')).toBe('Alemania');
    expect(localizedTeamName('br', 'pt-BR')).toBe('Brasil');
  });
});
