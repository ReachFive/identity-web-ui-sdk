declare global {
    interface Window {
        grecaptcha: {
            execute(siteKey: string, action: { action: string }): PromiseLike<string>;
        }
    }
}

export interface ReCaptchaConf {
    recaptcha_enabled: boolean
    recaptcha_site_key?: string
}

export default class ReCaptcha {
     static getRecaptchaToken = async (siteKey: string, action: string) => {
        return await window.grecaptcha.execute(siteKey, {action: action})
    }

    static handle = async <T extends { captchaToken?: string }, R = {}>(data: T, conf: ReCaptchaConf, callback: (data: T) => Promise<R>, action: string) => {
        if (conf.recaptcha_enabled)
        {
            try {
                const captchaToken = await this.getRecaptchaToken(conf.recaptcha_site_key ?? '', action)
                return callback({...data, captchaToken})
            } catch(_error) {
                return Promise.reject({errorUserMsg: "Error recaptcha", errorMessageKey: "recaptcha.error"})
            }
        }
        else {
            return callback(data)
        }
    }
}

export function importGoogleRecaptchaScript(site_key?: string) {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=" + site_key;
    document.body.appendChild(script);
}

export function extractCaptchaTokenFromData<T extends { captchaToken?: string }>(data: T) {
    const token = data.captchaToken
    delete data.captchaToken
    return token
}

export type WithCaptchaToken<T> = T & { captchaToken?: string }
