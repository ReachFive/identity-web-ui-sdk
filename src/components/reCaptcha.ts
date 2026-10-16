import { WithCaptchaToken } from './captcha';
import { captchaUnavailable } from './captchaError';
import { importCaptchaScript } from './captchaScript';

import type { CaptchaOperation } from './captchaOperation';

declare global {
    interface Window {
        // Defined by the script, so absent until it has loaded.
        grecaptcha?: {
            ready(callback: () => void): void;
            execute(siteKey: string, action: { action: string }): PromiseLike<string>;
            // Only present once `enterprise.js` has loaded; `api.js` does not define it.
            enterprise?: {
                ready(callback: () => void): void;
                execute(siteKey: string, action: { action: string }): PromiseLike<string>;
            };
        };
    }
}

/** The runtime, once `api.js` has defined it. Callers run inside a `try`. */
const api = () => {
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) throw new Error('reCAPTCHA is not loaded');
    return grecaptcha;
};

export type RecaptchaAction =
    | 'signup'
    | 'login'
    | 'update_email'
    | 'passwordless_email'
    | 'passwordless_phone'
    | 'account_recovery'
    | 'password_reset_requested';

export interface ReCaptchaConf {
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     *
     * @deprecated Use `captcha: { provider: 'recaptcha', siteKey }` instead. Selecting the provider
     * by name rules out enabling two captchas on the same widget.
     */
    recaptcha_enabled: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     *
     * @deprecated Use `captcha: { provider: 'recaptcha', siteKey }` instead.
     */
    recaptcha_site_key: string;
}

/**
 * The action classic reCAPTCHA sends for each operation. An identity mapping today, spelled out
 * rather than assumed so that adding an operation forces a decision about what this provider
 * reports, instead of silently inheriting a name its configuration may not allow.
 */
const actions: Record<CaptchaOperation, RecaptchaAction> = {
    signup: 'signup',
    login: 'login',
    update_email: 'update_email',
    passwordless_email: 'passwordless_email',
    passwordless_phone: 'passwordless_phone',
    account_recovery: 'account_recovery',
    forgot_password: 'password_reset_requested',
};

/**
 * What reCAPTCHA needs to get a token: the integrator's site key, and the operation the widget is
 * performing. The operation is fixed by the widget rather than exposed as an option — accounts are
 * expected to configure a matching action set in the console.
 */
export type ReCaptchaSettings = {
    siteKey: string;
    operation: CaptchaOperation;
};

export default class ReCaptcha {
    static getRecaptchaToken = async (siteKey: string, action: RecaptchaAction) => {
        return await api().execute(siteKey, { action: action });
    };

    static handle = async <T, R = {}>(
        data: T,
        { siteKey, operation }: ReCaptchaSettings,
        callback: (data: WithCaptchaToken<T>) => Promise<R>
    ) => {
        try {
            await importGoogleRecaptchaScript(siteKey);
            const captchaToken = await this.getRecaptchaToken(siteKey, actions[operation]);
            return callback({ ...data, captchaToken, captchaProvider: 'recaptcha' });
        } catch (_error) {
            return Promise.reject(captchaUnavailable());
        }
    };
}

export function importGoogleRecaptchaScript(siteKey: string): Promise<void> {
    return importCaptchaScript({
        src: `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`,
        // `api.js` defines `ready` on load and appends `recaptcha__en.js`, that defines `execute`.
        isLoaded: () => typeof window.grecaptcha?.ready === 'function',
        whenReady: () => new Promise(resolve => api().ready(() => resolve())),
    });
}
