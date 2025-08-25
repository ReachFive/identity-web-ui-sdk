import { CaptchaFoxInstance } from '@captchafox/react';
import type { WidgetDisplayMode } from '@captchafox/types';

import { AppError } from '@/helpers/errors';

import { WithCaptchaToken } from './captcha';

export interface CaptchaFoxConf {
    /**
     * Boolean that specifies whether CaptchaFox is enabled or not.
     */
    captchaFoxEnabled: boolean;
    /**
     * The SITE key that comes from your [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys) setup.
     * This must be paired with the appropriate secret key that you received when setting up CaptchaFox.
     */
    captchaFoxSiteKey: string;
    /**
     * Define how CaptchaFox is displayed (hidden|inline|popup)/ Default to hidden.
     */
    captchaFoxMode?: WidgetDisplayMode;
}

export default class CaptchaFox {
    static handle = async <T, R = {}>(
        data: T,
        instance: CaptchaFoxInstance | null,
        callback: (data: WithCaptchaToken<T>) => Promise<R>
    ) => {
        try {
            const captchaToken = await instance?.execute();
            return callback({ ...data, captchaToken, captchaProvider: 'captchafox' });
        } catch (_error) {
            return Promise.reject({
                errorId: '',
                error: 'CaptchaFox error',
                errorDescription: 'CaptchaFox Error',
                errorMessageKey: 'captchaFox.error',
            } satisfies AppError);
        }
    };
}
