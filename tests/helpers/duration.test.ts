import { describe, expect, test } from '@jest/globals';

import { formatDays } from '../../src/helpers/duration';

describe('formatDays', () => {
    test.each([
        [90, 'en', /^90\s+days$/],
        [1, 'en', /^1\s+day$/],
        // `\s` also covers the no-break space some locales put before the unit
        [90, 'fr', /^90\s+jours$/],
    ])('formats %i days in %s', (days, language, expected) => {
        expect(formatDays(days, language)).toMatch(expected);
    });
});
