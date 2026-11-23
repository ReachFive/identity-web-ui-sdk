import { CaptchaFoxInstance } from '@captchafox/react';
import type { WidgetDisplayMode } from '@captchafox/types';

import { UserError } from '@/helpers/errors';
import { logError } from '@/helpers/logger';

import { WithCaptchaToken } from './captcha';

export interface CaptchaFoxConf {
    /**
     * Boolean that specifies whether CaptchaFox is enabled or not.
     *
     * @deprecated Use `captcha: { provider: 'captchafox', siteKey }` instead. Selecting the provider
     * by name rules out enabling two captchas on the same widget.
     */
    captchaFoxEnabled: boolean;
    /**
     * The SITE key that comes from your [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys) setup.
     * This must be paired with the appropriate secret key that you received when setting up CaptchaFox.
     *
     * @deprecated Use `captcha: { provider: 'captchafox', siteKey }` instead.
     */
    captchaFoxSiteKey: string;
    /**
     * Define how CaptchaFox is displayed (hidden|inline|popup)/ Default to hidden.
     *
     * @deprecated Use `captcha: { provider: 'captchafox', mode }` instead.
     */
    captchaFoxMode?: WidgetDisplayMode;
}

export default class CaptchaFox {
    static handle = async <T, R = {}>(
        data: T,
        instance: CaptchaFoxInstance | null,
        callback: (data: WithCaptchaToken<T>) => Promise<R>
    ) => {
        let captchaToken: string | undefined;
        try {
            captchaToken = await getToken(instance);
        } catch (_error) {
            return Promise.reject(
                UserError.fromAppError({
                    errorId: '',
                    error: 'CaptchaFox error',
                    errorDescription: 'CaptchaFox Error',
                    errorMessageKey: 'captchaFox.error',
                })
            );
        }

        try {
            return await callback({ ...data, captchaToken, captchaProvider: 'captchafox' });
        } finally {
            // A token is accepted only once: the next submit needs a new check.
            resetWidget(instance);
        }
    };
}

/**
 * In `inline` and `popup` mode the user has usually passed the check already, by ticking the
 * widget. `execute()` would start a second one, so it only runs when the widget holds no token.
 */
async function getToken(instance: CaptchaFoxInstance | null): Promise<string | undefined> {
    if (!instance) return undefined;
    return instance.getResponse() || instance.execute();
}

function resetWidget(instance: CaptchaFoxInstance | null) {
    try {
        instance?.reset();
    } catch (error) {
        logError(error instanceof Error ? error : 'CaptchaFox reset failed');
    }
}
