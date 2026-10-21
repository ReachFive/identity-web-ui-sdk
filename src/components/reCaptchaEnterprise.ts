import { logError } from '@/helpers/logger';

import { WithCaptchaToken } from './captcha';
import { captchaUnavailable, checkboxNotTicked } from './captchaError';
import { importCaptchaScript } from './captchaScript';

import type { CaptchaOperation } from './captchaOperation';

/**
 * Where the token comes from: `checkbox` makes the user tick a widget, `autoExecute` leaves the
 * token to the reCAPTCHA library. Unset, the SDK gets one in the background.
 */
export type ReCaptchaEnterpriseMode = 'checkbox' | 'autoExecute';

/** The runtime, once `enterprise.js` has defined it. Callers run inside a `try`. */
const api = () => {
    const enterprise = window.grecaptcha?.enterprise;
    if (!enterprise) throw new Error('reCAPTCHA Enterprise is not loaded');
    return enterprise;
};

const whenReady = () => new Promise<void>(resolve => api().ready(() => resolve()));

/**
 * Score-based web keys and Universal keys are loaded the same way; only the assessment differs.
 *
 * A checkbox key takes the other half of the library: `render=explicit` carries no site key,
 * because the key is given to `render()` along with the element the widget goes into. Google
 * answers the score URL with an HTML error page for a checkbox key, so the two cannot be swapped.
 */
export function importGoogleRecaptchaEnterpriseScript(
    siteKey: string,
    mode?: ReCaptchaEnterpriseMode
): Promise<void> {
    // `enterprise.js` defines `ready` when it runs and fetches what defines `execute` and `render`
    // separately, so `ready` is the mark of a script that has run. This is only read when a tag
    // with the same `src` is already in the page, and `whenReady` waits for the rest.
    const isLoaded = () => typeof window.grecaptcha?.enterprise?.ready === 'function';

    if (mode === 'checkbox') {
        return importCaptchaScript({
            src: 'https://www.google.com/recaptcha/enterprise.js?render=explicit',
            isLoaded,
            whenReady,
        });
    }

    return importCaptchaScript({
        src: `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`,
        isLoaded,
        whenReady,
    });
}

/**
 * The actions reCAPTCHA Enterprise sends.
 */
export type RecaptchaEnterpriseAction =
    | 'signup'
    | 'password_login'
    | 'passwordless'
    | 'forgot_password'
    | 'update_email';

/**
 * Several operations share an endpoint, and so share an action.
 */
const actions: Record<CaptchaOperation, RecaptchaEnterpriseAction> = {
    signup: 'signup',
    login: 'password_login',
    update_email: 'update_email',
    passwordless_email: 'passwordless',
    passwordless_phone: 'passwordless',
    verify_passwordless_sms: 'passwordless',
    verify_passwordless_magic_link: 'passwordless',
    account_recovery: 'forgot_password',
    forgot_password: 'forgot_password',
};

export type ReCaptchaEnterpriseCheckboxSettings = {
    siteKey: string;
    operation: CaptchaOperation;
};

export type ReCaptchaEnterpriseTokenSettings = {
    siteKey: string;
    operation: CaptchaOperation;
    /**
     * `checkbox` is not one of these: it has its own path, and
     * {@link ReCaptchaEnterprise.handle} would ask for a score token from a key that has none.
     */
    mode?: 'autoExecute';
};

export default class ReCaptchaEnterprise {
    static getToken = async (siteKey: string, action: RecaptchaEnterpriseAction) => {
        await importGoogleRecaptchaEnterpriseScript(siteKey);
        return await api().execute(siteKey, { action });
    };

    static handle = async <T, R = {}>(
        data: T,
        { siteKey, mode, operation }: ReCaptchaEnterpriseTokenSettings,
        callback: (data: WithCaptchaToken<T>) => Promise<R>
    ) => {
        try {
            // With AutoExecute the reCAPTCHA library attaches a token to the requests it has been
            // configured to protect: we mustn't initiate fetching a token.
            if (mode === 'autoExecute') {
                await importGoogleRecaptchaEnterpriseScript(siteKey);
                return callback({ ...data, captchaProvider: 'recaptcha_enterprise' });
            }

            const captchaToken = await this.getToken(siteKey, actions[operation]);
            return callback({ ...data, captchaToken, captchaProvider: 'recaptcha_enterprise' });
        } catch (_error) {
            return Promise.reject(captchaUnavailable());
        }
    };

    /**
     * Puts the checkbox in `container` and returns the id the other widget calls take.
     */
    static renderCheckbox = async (
        container: HTMLElement,
        { siteKey, operation }: ReCaptchaEnterpriseCheckboxSettings
    ) => {
        await importGoogleRecaptchaEnterpriseScript(siteKey, 'checkbox');
        return api().render(container, {
            sitekey: siteKey,
            action: actions[operation],
        });
    };

    static handleCheckbox = async <T, R = {}>(
        data: T,
        widgetId: number | null,
        callback: (data: WithCaptchaToken<T>) => Promise<R>
    ) => {
        if (widgetId === null) {
            return Promise.reject(captchaUnavailable());
        }

        let captchaToken: string;
        try {
            captchaToken = api().getResponse(widgetId);
        } catch (_error) {
            return Promise.reject(captchaUnavailable());
        }

        if (!captchaToken) {
            return Promise.reject(checkboxNotTicked());
        }

        try {
            return await callback({
                ...data,
                captchaToken,
                captchaProvider: 'recaptcha_enterprise',
            });
        } finally {
            // A token is single use: without a reset the next attempt sends a spent one and the
            // assessment comes back DUPE. A throw here would replace the callback's own outcome.
            try {
                api().reset(widgetId);
            } catch (error) {
                logError(error instanceof Error ? error : 'reCAPTCHA Enterprise reset failed');
            }
        }
    };
}
