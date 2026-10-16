import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import ReCaptchaEnterprise, {
    importGoogleRecaptchaEnterpriseScript,
} from '@/components/reCaptchaEnterprise';

import type { CaptchaOperation } from '@/components/captchaOperation';

const execute = jest.fn<(siteKey: string, action: { action: string }) => Promise<string>>();
const render =
    jest.fn<(container: HTMLElement | string, parameters: { sitekey: string }) => number>();
const getResponse = jest.fn<(widgetId: number) => string>();
const reset = jest.fn<(widgetId: number) => void>();

beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue('a-token');
    render.mockReset();
    render.mockReturnValue(7);
    getResponse.mockReset();
    reset.mockReset();

    window.grecaptcha = {
        execute: jest.fn(),
        enterprise: {
            ready: (callback: () => void) => callback(),
            execute,
            render,
            getResponse,
            reset,
        },
    } as unknown as Window['grecaptcha'];
});

afterEach(() => {
    // The fake runtime is global: leaving it makes a later test look loaded when it is not.
    delete (window as Partial<Window>).grecaptcha;
});

/** Stands in for a script that has already loaded, so the loader resolves without a network call. */
function pretendScriptIsLoaded(siteKey: string) {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
    document.body.appendChild(script);
}

/** The explicit-render script carries no site key, so one tag serves every checkbox key. */
const explicitScript = 'https://www.google.com/recaptcha/enterprise.js?render=explicit';

function pretendExplicitScriptIsLoaded() {
    const script = document.createElement('script');
    script.src = explicitScript;
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
            { siteKey, operation: 'login', mode: 'autoExecute' },
            data => Promise.resolve(data)
        );

        expect(execute).not.toHaveBeenCalled();
        expect(sent).toEqual({ captchaProvider: 'recaptcha_enterprise' });
    });
});

describe('checkbox keys', () => {
    test('load the script with render=explicit rather than with the site key', async () => {
        const loading = importGoogleRecaptchaEnterpriseScript('key-checkbox-script', 'checkbox');

        const sources = Array.from(document.querySelectorAll('script')).map(script => script.src);
        expect(sources).toContain(explicitScript);
        expect(sources).not.toContain(
            'https://www.google.com/recaptcha/enterprise.js?render=key-checkbox-script'
        );

        // jsdom fetches nothing, so the load event the loader waits on has to be fired here.
        const injected = document.querySelector<HTMLScriptElement>(
            `script[src="${explicitScript}"]`
        );
        injected?.onload?.(new Event('load'));
        await loading;
    });

    test('render the widget with the site key and the operation action', async () => {
        pretendExplicitScriptIsLoaded();
        const container = document.createElement('div');

        await expect(
            ReCaptchaEnterprise.renderCheckbox(container, {
                siteKey: 'key-checkbox',
                operation: 'login',
            })
        ).resolves.toBe(7);

        expect(render).toHaveBeenCalledWith(container, {
            sitekey: 'key-checkbox',
            action: 'password_login',
        });
    });

    test('refuse an unticked box without calling the API', async () => {
        getResponse.mockReturnValue('');
        const callback = jest.fn<(data: unknown) => Promise<unknown>>();

        await expect(ReCaptchaEnterprise.handleCheckbox({}, 7, callback)).rejects.toThrow(
            'Please tick the reCAPTCHA box.'
        );
        expect(callback).not.toHaveBeenCalled();
    });

    test('pass a ticked box through and reset it, so a second attempt mints a new token', async () => {
        getResponse.mockReturnValue('checkbox-token');

        const sent = await ReCaptchaEnterprise.handleCheckbox({ email: 'a@b.c' }, 7, data =>
            Promise.resolve(data)
        );

        expect(sent).toEqual({
            email: 'a@b.c',
            captchaToken: 'checkbox-token',
            captchaProvider: 'recaptcha_enterprise',
        });
        expect(reset).toHaveBeenCalledWith(7);
    });

    test('reset the box when the call it protects fails', async () => {
        getResponse.mockReturnValue('checkbox-token');

        await expect(
            ReCaptchaEnterprise.handleCheckbox({}, 7, () => Promise.reject(new Error('rejected')))
        ).rejects.toThrow('rejected');
        expect(reset).toHaveBeenCalledWith(7);
    });

    test('refuse to submit before the widget has rendered', async () => {
        const callback = jest.fn<(data: unknown) => Promise<unknown>>();

        await expect(ReCaptchaEnterprise.handleCheckbox({}, null, callback)).rejects.toThrow(
            'Recaptcha error'
        );
        expect(callback).not.toHaveBeenCalled();
    });
});
