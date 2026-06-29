import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { TEAMS, type TeamId } from './teams';

const teamIds = Object.keys(TEAMS) as TeamId[];

const flagsDir = fileURLToPath(
  new URL('../../../node_modules/flag-icons/flags/1x1/', import.meta.url)
);
const flagsSource = readFileSync(
  fileURLToPath(new URL('./flags.ts', import.meta.url)),
  'utf8'
);

describe('flag assets', () => {
  it('every team has a flag SVG on disk', () => {
    const missing = teamIds.filter((id) => !existsSync(`${flagsDir}${id}.svg`));
    expect(missing).toEqual([]);
  });

  // The `import.meta.glob` in flags.ts must enumerate flag codes as a literal
  // string, so it can drift from teams.ts. This guards that the brace list is
  // exactly the set of TeamIds — no missing flags, no dead entries.
  it('the flags.ts flag glob lists exactly the current teams', () => {
    const match = flagsSource.match(/flags\/1x1\/\{([^}]+)\}\.svg/);
    expect(match, 'could not find the flag glob pattern in flags.ts').not.toBeNull();

    const globIds = match![1].split(',').map((s: string) => s.trim());
    expect([...globIds].sort()).toEqual([...teamIds].sort());
  });
});
