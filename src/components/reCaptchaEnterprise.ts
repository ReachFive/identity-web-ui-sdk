import { UserError } from '@/helpers/errors';

import { WithCaptchaToken } from './captcha';
import { importCaptchaScript } from './captchaScript';

import type { CaptchaOperation } from './captchaOperation';

/**
 * Score-based web keys and Universal keys are loaded the same way; only the assessment differs.
 */
export function importGoogleRecaptchaEnterpriseScript(siteKey: string): Promise<void> {
    return importCaptchaScript({
        src: `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`,
        isLoaded: () => typeof window.grecaptcha?.enterprise?.execute === 'function',
        whenReady: () =>
            new Promise(resolve => window.grecaptcha.enterprise.ready(() => resolve())),
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

export type ReCaptchaEnterpriseSettings = {
    siteKey: string;
    operation: CaptchaOperation;
    autoExecute?: boolean;
};

export default class ReCaptchaEnterprise {
    static getToken = async (siteKey: string, action: RecaptchaEnterpriseAction) => {
        await importGoogleRecaptchaEnterpriseScript(siteKey);
        return await window.grecaptcha.enterprise.execute(siteKey, { action });
    };

    static handle = async <T, R = {}>(
        data: T,
        { siteKey, autoExecute, operation }: ReCaptchaEnterpriseSettings,
        callback: (data: WithCaptchaToken<T>) => Promise<R>
    ) => {
        // With AutoExecute the reCAPTCHA library attaches a token to the requests it has been
        // configured to protect: we mustn't initiate fetching a token.
        if (autoExecute) {
            await importGoogleRecaptchaEnterpriseScript(siteKey);
            return callback({ ...data, captchaProvider: 'recaptcha_enterprise' });
        }

        try {
            const captchaToken = await this.getToken(siteKey, actions[operation]);
            return callback({ ...data, captchaToken, captchaProvider: 'recaptcha_enterprise' });
        } catch (_error) {
            return Promise.reject(
                UserError.fromAppError({
                    errorId: '',
                    error: 'Recaptcha error',
                    errorDescription: 'Recaptcha error',
                    errorMessageKey: 'recaptcha.error',
                })
            );
        }
    };
}
