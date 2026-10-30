import { describe, expect, test } from '@jest/globals';

import { UserError, widgetErrorMessage } from '../../src/helpers/errors';

describe('widgetErrorMessage', () => {
    test('an Error shows its message', () => {
        expect(widgetErrorMessage(new UserError('Access denied'))).toBe('Access denied');
    });

    test('an API error shows its user message first', () => {
        expect(
            widgetErrorMessage({
                error: 'insufficient_authentication',
                errorDescription: 'The access token is not fresh enough',
                errorUserMsg: "Le jeton d'accès n'est pas assez récent.",
            })
        ).toBe("Le jeton d'accès n'est pas assez récent.");
    });

    test('an API error without a user message shows its description', () => {
        expect(widgetErrorMessage({ error: 'unexpected_error', errorDescription: 'Boom' })).toBe(
            'Boom'
        );
    });

    test('an API error with neither shows its error code', () => {
        expect(
            widgetErrorMessage({ error: 'invalid_grant', errorMessageKey: 'error.invalidGrant' })
        ).toBe('invalid_grant');
    });

    test('anything else stays generic', () => {
        expect(widgetErrorMessage({ foo: 'bar' })).toBe('Unexpected error');
    });
});
