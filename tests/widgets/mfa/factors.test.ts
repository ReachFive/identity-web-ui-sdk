import { describe, expect, test } from '@jest/globals';

import { factorChoices, maskPhoneNumber, sendsNoCode } from '../../../src/widgets/mfa/factors';

import type { MfaProfile } from '../../../src/widgets/mfa/factors';
import type {
    ListedCredential,
    PasskeyCredential,
} from '../../../src/widgets/mfa/passkeyCredential';

const allOn = {
    webAuthn: true,
    mfaEmailEnabled: true,
    mfaSmsEnabled: true,
    mfaWebauthnEnabled: true,
};
const profile: MfaProfile = { email: 'alice@example.com' };

const passkey: PasskeyCredential = {
    type: 'webauthn',
    id: 'pk-1',
    friendlyName: 'MacBook',
    createdAt: '2025-01-01',
};
const emailCredential: ListedCredential = {
    type: 'email',
    email: 'alice@example.com',
    friendlyName: 'alice@example.com',
    createdAt: '2025-01-01',
};

describe('factorChoices', () => {
    test('addable lists passkey first, then email, then sms', () => {
        expect(factorChoices(allOn, [], profile).addable).toEqual(['passkey', 'email', 'sms']);
    });

    test('passkey is not addable once the user has one', () => {
        const choices = factorChoices(allOn, [passkey], profile);
        expect(choices.passkeyCount).toBe(1);
        expect(choices.addable).not.toContain('passkey');
    });

    test('passkey is not addable when the WebAuthn feature is off', () => {
        const choices = factorChoices({ ...allOn, webAuthn: false }, [], profile);
        expect(choices.addable).toEqual(['email', 'sms']);
    });

    test.each([false, undefined])(
        'passkey is not addable when mfaWebauthnEnabled is %s',
        mfaWebauthnEnabled => {
            const choices = factorChoices({ ...allOn, mfaWebauthnEnabled }, [], profile);
            expect(choices.addable).toEqual(['email', 'sms']);
        }
    );

    test('an enabled factor is not addable', () => {
        const choices = factorChoices(allOn, [emailCredential], profile);
        expect(choices.enabled).toEqual([emailCredential]);
        expect(choices.addable).not.toContain('email');
    });

    test('email is not addable when the profile has no email', () => {
        expect(factorChoices(allOn, [], {}).addable).toEqual(['passkey', 'sms']);
    });
});

describe('sendsNoCode', () => {
    test('email follows emailVerified', () => {
        expect(sendsNoCode('email', { emailVerified: true })).toBe(true);
        expect(sendsNoCode('email', { emailVerified: false })).toBe(false);
        expect(sendsNoCode('email', {})).toBe(false);
    });

    test('sms is true only for the verified profile phone number', () => {
        const verified = { phoneNumber: '+33612345678', phoneNumberVerified: true };
        expect(sendsNoCode('sms', verified, '+33612345678')).toBe(true);
        expect(sendsNoCode('sms', verified, '+33600000000')).toBe(false);
        expect(sendsNoCode('sms', verified)).toBe(false);
        expect(
            sendsNoCode('sms', { ...verified, phoneNumberVerified: false }, '+33612345678')
        ).toBe(false);
    });
});

describe('maskPhoneNumber', () => {
    test('keeps the last two digits', () => {
        expect(maskPhoneNumber('+33 6 12 34 56 78')).toBe('••78');
        expect(maskPhoneNumber('+1 (415) 555-0199')).toBe('••99');
    });
});
