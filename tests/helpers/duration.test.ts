import { describe, expect, test } from '@jest/globals';

import { formatDays } from '../../src/helpers/duration';

describe('formatDays', () => {
    test.each([
        [90, 'en', '90 days'],
        [1, 'en', '1 day'],
        // French separates the number and the unit with a no-break space
        [90, 'fr', '90\u00a0jours'],
    ])('formats %i days in %s', (days, language, expected) => {
        expect(formatDays(days, language)).toBe(expected);
    });
});
