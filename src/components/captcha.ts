import ReCaptcha, {RecaptchaAction} from './reCaptcha'
import R5CaptchaFox from './captchaFox'


export type CaptchaType = "recaptcha" | "captchafox";

export type WithCaptchaToken<T> = T & { captchaToken?: string };


interface CaptchaOptions {
    recaptchaEnabled: boolean;
    recaptchaSiteKey?: string;
    captchaFoxEnabled: boolean;
    captchaFoxInstance?: R5CaptchaFox;
}

export function getCaptchaHandler<T extends { captchaToken?: string}, R = any>(
    options: CaptchaOptions,
    callback: (data: T) => Promise<R>,
): (data: T, action: RecaptchaAction) => Promise<R> {
    return (data: T, action: RecaptchaAction) => {
        const {
            recaptchaEnabled,
            recaptchaSiteKey,
            captchaFoxEnabled,
            captchaFoxInstance,
        } = options;

        const sanitizedCaptchaFoxActivation = recaptchaEnabled ? false : captchaFoxEnabled

        if (recaptchaEnabled) {
            return ReCaptcha.handle(
                data,
                { recaptcha_enabled: recaptchaEnabled, recaptcha_site_key: recaptchaSiteKey! },
                callback,
                action
            );
        } else if (sanitizedCaptchaFoxActivation && captchaFoxInstance) {
            return captchaFoxInstance!.handle(data, callback);
        } else {
            return callback(data);
        }
    };
}
