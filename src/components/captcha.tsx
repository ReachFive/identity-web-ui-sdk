import React, { ComponentType, useEffect, useRef } from 'react';

import { CaptchaFoxInstance, CaptchaFox as CaptchaFoxWidget } from '@captchafox/react';
import type { WidgetDisplayMode } from '@captchafox/types';
import styled from 'styled-components';

import CaptchaFox, { CaptchaFoxConf } from './captchaFox';
import ReCaptcha, { importGoogleRecaptchaScript, ReCaptchaConf } from './reCaptcha';
import ReCaptchaEnterprise, { importGoogleRecaptchaEnterpriseScript } from './reCaptchaEnterprise';

import type { CaptchaOperation } from './captchaOperation';

const StyledCaptchaFoxWidget = styled(CaptchaFoxWidget)`
    margin-bottom: ${props => props.theme.spacing}px;
`;

/**
 * Which captcha protects a widget's calls, and the settings that provider needs.
 */
export type CaptchaOptions =
    | {
          provider: 'recaptcha';
          /**
           * The SITE key from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create)
           * setup, paired with the secret key configured on the ReachFive client.
           */
          siteKey: string;
      }
    | {
          provider: 'recaptcha_enterprise';
          /**
           * The SITE key of the reCAPTCHA Enterprise key, from the Google Cloud console. Score-based
           * web keys and Universal keys share this one integration; which of the two a key is only
           * changes how the assessment is scored server side.
           */
          siteKey: string;
          /**
           * Set when the Universal key has AutoExecute enabled, so the reCAPTCHA library attaches
           * the token to the requests it intercepts and the SDK must not fetch one of its own.
           */
          autoExecute?: boolean;
      }
    | {
          provider: 'captchafox';
          /**
           * The SITE key from your
           * [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys)
           * setup, paired with the secret key configured on the ReachFive client.
           */
          siteKey: string;
          /** How the widget is displayed. Defaults to `hidden`. */
          mode?: WidgetDisplayMode;
      };

/**
 * The per-provider options that predate {@link CaptchaOptions}. Kept to delay breaking change;
 * {@link resolveCaptchaOptions} is the only thing that reads them.
 */
export type DeprecatedCaptchaConf = Partial<ReCaptchaConf & CaptchaFoxConf>;

export type WithCaptchaProps<T> = T & { captcha?: CaptchaOptions } & DeprecatedCaptchaConf;

export type WithCaptchaToken<T> = T & { captchaToken?: string };

/**
 * Narrows widget options down to the captcha that should run.
 *
 * The deprecated options let several providers be enabled at once and a provider be enabled with no
 * site key, neither of which means anything; resolving them here keeps those cases from reaching
 * the rest of the code, and keeps the precedence between them in one place rather than spread over
 * a chain of conditionals.
 */
export function resolveCaptchaOptions(
    options: DeprecatedCaptchaConf & { captcha?: CaptchaOptions }
): CaptchaOptions | undefined {
    if (options.captcha) return options.captcha;

    if (options.recaptcha_enabled && options.recaptcha_site_key) {
        return { provider: 'recaptcha', siteKey: options.recaptcha_site_key };
    }

    if (options.captchaFoxEnabled && options.captchaFoxSiteKey) {
        return {
            provider: 'captchafox',
            siteKey: options.captchaFoxSiteKey,
            mode: options.captchaFoxMode,
        };
    }

    return undefined;
}

export type CaptchaValues = {
    handler: <T, R>(data: T, callback: (data: T) => Promise<R>) => Promise<R>;
    Captcha?: ComponentType;
};

const defaultHandler = <T, R>(data: T, callback: (data: T) => Promise<R>) => callback(data);

export const CaptchaContext = React.createContext<CaptchaValues>({
    handler: defaultHandler,
});

export const useCaptcha = () => {
    return React.useContext(CaptchaContext);
};

export type CaptchaProviderProps = {
    children: React.ReactNode;
    /**
     * What the surrounding widget is about to do. Fixed by each widget rather than exposed as an
     * option, and folded into the settings of the providers that have a use for it — each of which
     * translates it into its own action vocabulary.
     */
    operation: CaptchaOperation;
    captcha?: CaptchaOptions;
};

export const CaptchaProvider = ({ children, operation, captcha }: CaptchaProviderProps) => {
    const captchaFoxInstanceRef = useRef<CaptchaFoxInstance>(null);

    // Start the provider's script as the widget appears, so it is ready by the time the user submits.
    useEffect(() => {
        const load =
            captcha?.provider === 'recaptcha'
                ? importGoogleRecaptchaScript
                : captcha?.provider === 'recaptcha_enterprise'
                  ? importGoogleRecaptchaEnterpriseScript
                  : undefined;

        if (load && captcha) {
            void load(captcha.siteKey).catch(() => {
                // Reported to the user by the handler if they go on to submit.
            });
        }
    }, [captcha]);

    switch (captcha?.provider) {
        case 'recaptcha': {
            const settings = { siteKey: captcha.siteKey, operation };
            const handler = <T, R>(data: T, callback: (data: T) => Promise<R>) =>
                ReCaptcha.handle(data, settings, callback);

            return (
                <CaptchaContext.Provider value={{ handler }}>{children}</CaptchaContext.Provider>
            );
        }

        case 'recaptcha_enterprise': {
            const settings = {
                siteKey: captcha.siteKey,
                autoExecute: captcha.autoExecute,
                operation,
            };
            const handler = <T, R>(data: T, callback: (data: T) => Promise<R>) =>
                ReCaptchaEnterprise.handle(data, settings, callback);

            return (
                <CaptchaContext.Provider value={{ handler }}>{children}</CaptchaContext.Provider>
            );
        }

        // No operation: CaptchaFox challenges the user rather than scoring what they are doing.
        case 'captchafox': {
            const { siteKey, mode } = captcha;
            const handler = async <T, R>(data: T, callback: (data: T) => Promise<R>) =>
                CaptchaFox.handle(data, captchaFoxInstanceRef.current, callback);

            return (
                <CaptchaContext.Provider
                    value={{
                        handler,
                        Captcha: () => (
                            <StyledCaptchaFoxWidget
                                ref={captchaFoxInstanceRef}
                                sitekey={siteKey}
                                mode={mode ?? 'hidden'}
                                className="[&_.cf-button]:!max-w-full"
                            />
                        ),
                    }}
                >
                    {children}
                </CaptchaContext.Provider>
            );
        }

        default:
            return (
                <CaptchaContext.Provider value={{ handler: defaultHandler }}>
                    {children}
                </CaptchaContext.Provider>
            );
    }
};
