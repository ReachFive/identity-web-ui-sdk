import React from "react"


export default class ReCaptcha {
     static getRecaptchaToken = async siteKey => {
        return await window.grecaptcha.execute(siteKey, {action: "submit"})
    }

    static handle = async (data, conf, callback) => {
        if (conf.recaptcha_enabled)
        {
            try {
                const captchaToken = await this.getRecaptchaToken(conf.recaptcha_site_key)
                return callback({...data, captchaToken})
            } catch(error) {
                return Promise.reject({errorUserMsg: "Error recaptcha"})
            }
        }
        else {
            return callback(data)
        }
    }
}

export function importGoogleRecaptchaScript(site_key){
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=" + site_key;
    document.body.appendChild(script);
}

export function extractCaptchaTokenFromData(data) {
    const token = data.captchaToken
    delete data.captchaToken
    return token
}
