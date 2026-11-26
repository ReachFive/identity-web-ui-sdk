import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import { stepUpFactors } from '../../../src/widgets/stepUp/factors';

describe('stepUpFactors', () => {
    // jsdom has no WebAuthn
    beforeEach(() => {
        Object.defineProperty(window, 'PublicKeyCredential', {
            value: class {},
            configurable: true,
        });
    });

    afterEach(() => {
        Reflect.deleteProperty(window, 'PublicKeyCredential');
    });

    test.each([
        [
            ['sms', 'email'],
            ['email', 'sms'],
        ],
        [['email', 'totp'], ['email']],
        [['webauthn'], []],
    ])('%j gives the code factors %j', (amr, codeFactors) => {
        expect(stepUpFactors(amr, { webAuthn: true })).toStrictEqual({
            passkey: amr.includes('webauthn'),
            codeFactors,
        });
    });

    test('offers the passkey when webauthn is in amr and enabled', () => {
        expect(stepUpFactors(['webauthn', 'email'], { webAuthn: true })).toStrictEqual({
            passkey: true,
            codeFactors: ['email'],
        });
    });

    test('hides the passkey when webAuthn is disabled', () => {
        expect(stepUpFactors(['webauthn', 'email'], { webAuthn: false })).toStrictEqual({
            passkey: false,
            codeFactors: ['email'],
        });
    });

    test('hides the passkey from a browser without WebAuthn', () => {
        Reflect.deleteProperty(window, 'PublicKeyCredential');

        expect(stepUpFactors(['webauthn', 'email'], { webAuthn: true })).toStrictEqual({
            passkey: false,
            codeFactors: ['email'],
        });
    });
});
