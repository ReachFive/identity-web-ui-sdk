import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import ReCaptchaEnterprise from '@/components/reCaptchaEnterprise';

import type { CaptchaOperation } from '@/components/captchaOperation';

const execute = jest.fn<(siteKey: string, action: { action: string }) => Promise<string>>();

beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue('a-token');

    window.grecaptcha = {
        execute: jest.fn(),
        enterprise: {
            ready: (callback: () => void) => callback(),
            execute,
        },
    } as unknown as Window['grecaptcha'];
});

/** Stands in for a script that has already loaded, so the loader resolves without a network call. */
function pretendScriptIsLoaded(siteKey: string) {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
    document.body.appendChild(script);
}

describe('reCAPTCHA Enterprise actions', () => {
    // Named after the endpoint the assessment pins its expected action to, which is not the action
    // set classic reCAPTCHA sends. Several operations reach one endpoint and so share an action.
    const cases: [CaptchaOperation, string][] = [
        ['signup', 'signup'],
        ['login', 'password_login'],
        ['update_email', 'update_email'],
        ['passwordless_email', 'passwordless'],
        ['passwordless_phone', 'passwordless'],
        ['verify_passwordless_sms', 'passwordless'],
        ['verify_passwordless_magic_link', 'passwordless'],
        ['account_recovery', 'forgot_password'],
        ['forgot_password', 'forgot_password'],
    ];

    test.each(cases)('%s is sent as %s', async (operation, action) => {
        // A site key per case: the loader caches its work against the script URL.
        const siteKey = `key-${operation}`;
        pretendScriptIsLoaded(siteKey);

        await ReCaptchaEnterprise.handle({}, { siteKey, operation }, data => Promise.resolve(data));

        expect(execute).toHaveBeenCalledWith(siteKey, { action });
    });
});

describe('AutoExecute', () => {
    test('mints no token, leaving one for the reCAPTCHA library to attach', async () => {
        const siteKey = 'key-autoexecute';
        pretendScriptIsLoaded(siteKey);

        const sent = await ReCaptchaEnterprise.handle(
            {},
            { siteKey, operation: 'login', autoExecute: true },
            data => Promise.resolve(data)
        );

        expect(execute).not.toHaveBeenCalled();
        expect(sent).toEqual({ captchaProvider: 'recaptcha_enterprise' });
    });
});
