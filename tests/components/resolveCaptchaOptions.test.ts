import { describe, expect, test } from '@jest/globals';

import { resolveCaptchaOptions } from '@/components/captcha';

describe('resolveCaptchaOptions', () => {
    test('returns nothing when no captcha is configured', () => {
        expect(resolveCaptchaOptions({})).toBeUndefined();
    });

    test('passes a tagged option straight through', () => {
        const captcha = { provider: 'recaptcha', siteKey: 'site' } as const;
        expect(resolveCaptchaOptions({ captcha })).toBe(captcha);
    });

    describe('deprecated options', () => {
        test('translates the reCAPTCHA options', () => {
            expect(
                resolveCaptchaOptions({ recaptcha_enabled: true, recaptcha_site_key: 'site' })
            ).toEqual({ provider: 'recaptcha', siteKey: 'site' });
        });

        test('translates the CaptchaFox options, carrying the display mode', () => {
            expect(
                resolveCaptchaOptions({
                    captchaFoxEnabled: true,
                    captchaFoxSiteKey: 'site',
                    captchaFoxMode: 'inline',
                })
            ).toEqual({ provider: 'captchafox', siteKey: 'site', mode: 'inline' });
        });

        test('ignores a provider enabled without a site key', () => {
            expect(resolveCaptchaOptions({ recaptcha_enabled: true })).toBeUndefined();
            expect(resolveCaptchaOptions({ captchaFoxEnabled: true })).toBeUndefined();
        });

        test('ignores a site key without the provider enabled', () => {
            expect(resolveCaptchaOptions({ recaptcha_site_key: 'site' })).toBeUndefined();
        });

        test('prefers the tagged option over the deprecated ones', () => {
            expect(
                resolveCaptchaOptions({
                    captcha: { provider: 'captchafox', siteKey: 'new' },
                    recaptcha_enabled: true,
                    recaptcha_site_key: 'old',
                })
            ).toEqual({ provider: 'captchafox', siteKey: 'new' });
        });

        // Two providers at once is not expressible through `captcha`, but the deprecated options
        // allow it, so the tie has to break somewhere. reCAPTCHA has always won.
        test('resolves two enabled providers to reCAPTCHA', () => {
            expect(
                resolveCaptchaOptions({
                    recaptcha_enabled: true,
                    recaptcha_site_key: 'recaptcha',
                    captchaFoxEnabled: true,
                    captchaFoxSiteKey: 'captchafox',
                })
            ).toEqual({ provider: 'recaptcha', siteKey: 'recaptcha' });
        });
    });
});
