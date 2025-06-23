import React, {useRef} from 'react'
import {CaptchaFox, CaptchaFoxInstance} from '@captchafox/react'


export default class R5CaptchaFox {
    private captchaRef: React.MutableRefObject<CaptchaFoxInstance | null> = useRef<CaptchaFoxInstance | null>(null);

    constructor(
        private captchaFoxEnabled: boolean,
        private captchaFoxSiteKey?: string,
    ) {
        this.captchaFoxEnabled = captchaFoxEnabled
        this.captchaFoxSiteKey = captchaFoxSiteKey
    }

    handle = async<T extends { captchaToken?: string }, R = {}>(
        data: T,
        callback: (data: T) => Promise<R>
    ) => {
        if(this.captchaFoxEnabled) {
            try {
                const captchaToken = await this.captchaRef.current?.execute()
                return callback({...data, captchaToken, captchaProvider: 'captchafox'});
            } catch(_error) {
                return Promise.reject({
                    errorUserMsg: 'Error captchaFox',
                    errorMessageKey: 'captchaFox.error',
                });
            }
        } else {
            return callback(data);
        }
    }

    render() {
        return this.captchaFoxEnabled ? (
                <CaptchaFox
                    sitekey={this.captchaFoxSiteKey!}
            ref={this.captchaRef}
        mode='hidden'
            />
    ) : null;
    }
}
