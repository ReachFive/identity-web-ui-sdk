import { AppError } from '@/helpers/errors';
import { WithCaptchaToken } from './captcha';

declare global {
    interface Window {
        grecaptcha: {
            execute(siteKey: string, action: { action: string }): PromiseLike<string>;
        };
    }
}

export type RecaptchaAction =
    | 'signup'
    | 'login'
    | 'update_email'
    | 'passwordless_email'
    | 'passwordless_phone'
    | 'verify_passwordless_sms'
    | 'account_recovery'
    | 'password_reset_requested';

export interface ReCaptchaConf {
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key: string;
}

export default class ReCaptcha {
    static getRecaptchaToken = async (siteKey: string, action: RecaptchaAction) => {
        return await window.grecaptcha.execute(siteKey, { action: action });
    };

    static handle = async <T, R = {}>(
        data: T,
        conf: ReCaptchaConf,
        callback: (data: WithCaptchaToken<T>) => Promise<R>,
        action: RecaptchaAction
    ) => {
        if (conf.recaptcha_enabled) {
            try {
                const captchaToken = await this.getRecaptchaToken(
                    conf.recaptcha_site_key ?? '',
                    action
                );
                return callback({ ...data, captchaToken, captchaProvider: 'recaptcha' });
            } catch (_error) {
                return Promise.reject({
                    errorId: '',
                    error: 'Recaptcha error',
                    errorDescription: 'Recaptcha error',
                    errorMessageKey: 'recaptcha.error',
                } satisfies AppError);
            }
        } else {
            return callback({ ...data, captchaToken: undefined });
        }
    };
}

export function importGoogleRecaptchaScript(site_key?: string) {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=' + site_key;
    document.body.appendChild(script);
}

export function extractCaptchaTokenFromData<T extends { captchaToken?: string }>(data: T) {
    const token = data.captchaToken;
    delete data.captchaToken;
    return token;
}
