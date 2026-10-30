import { describe, expect, test } from '@jest/globals';
import i18next from 'i18next';

import { UserError, widgetErrorMessage } from '../../src/helpers/errors';

const i18n = i18next.createInstance();
void i18n.init({
    lng: 'en',
    resources: { en: { translation: { 'error.invalidGrant': 'Your session has expired.' } } },
});
const t = i18n.getFixedT('en');

describe('widgetErrorMessage', () => {
    test('an Error shows its message', () => {
        expect(widgetErrorMessage(new UserError('Access denied'), t)).toBe('Access denied');
    });

    test('an API error shows its user message first', () => {
        expect(
            widgetErrorMessage(
                {
                    error: 'invalid_grant',
                    errorDescription: 'The access token is not fresh enough',
                    errorUserMsg: "Le jeton d'accès n'est pas assez récent.",
                    errorMessageKey: 'error.invalidGrant',
                },
                t
            )
        ).toBe("Le jeton d'accès n'est pas assez récent.");
    });

    test('an API error without a user message shows its translated message key', () => {
        expect(
            widgetErrorMessage(
                {
                    error: 'invalid_grant',
                    errorDescription: 'The access token is not fresh enough',
                    errorMessageKey: 'error.invalidGrant',
                },
                t
            )
        ).toBe('Your session has expired.');
    });

    test('an API error whose message key is not translated shows its description', () => {
        expect(
            widgetErrorMessage(
                {
                    error: 'unexpected_error',
                    errorDescription: 'Boom',
                    errorMessageKey: 'error.unknown',
                },
                t
            )
        ).toBe('Boom');
    });

    test('an API error with none of them shows its error code', () => {
        expect(
            widgetErrorMessage({ error: 'invalid_grant', errorMessageKey: 'error.unknown' }, t)
        ).toBe('invalid_grant');
    });

    test('without translations, the message key is skipped', () => {
        expect(
            widgetErrorMessage({
                error: 'invalid_grant',
                errorDescription: 'Boom',
                errorMessageKey: 'error.invalidGrant',
            })
        ).toBe('Boom');
    });

    test('anything else stays generic', () => {
        expect(widgetErrorMessage({ foo: 'bar' }, t)).toBe('Unexpected error');
    });
});

describe('UserError.fromAppError', () => {
    const appError = {
        errorId: '',
        error: 'invalid_grant',
        errorDescription: 'Boom',
        errorMessageKey: 'error.invalidGrant',
    };

    test('takes the message of the API error, its message key translated', () => {
        expect(UserError.fromAppError(appError, t).message).toBe('Your session has expired.');
    });

    test('without translations, skips the message key', () => {
        expect(UserError.fromAppError(appError).message).toBe('Boom');
    });
});
