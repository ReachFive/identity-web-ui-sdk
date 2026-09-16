import React from 'react';

import { CaptchaFoxInstance, CaptchaFox as CaptchaFoxWidget } from '@captchafox/react';
import type { WidgetDisplayMode } from '@captchafox/types';

import { logError } from '@/helpers/logger';
import { cn } from '@/lib/utils';

import CaptchaFox, { CaptchaFoxConf } from './captchaFox';
import ReCaptcha, { importGoogleRecaptchaScript, ReCaptchaConf } from './reCaptcha';

import type { CaptchaOperation } from './captchaOperation';

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

type CaptchaProps = Omit<
    React.ComponentPropsWithoutRef<typeof CaptchaFoxWidget>,
    'sitekey' | 'mode'
>;

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
    Captcha?: React.ComponentType<CaptchaProps>;
};

const defaultHandler = <T, R>(data: T, callback: (data: T) => Promise<R>) => callback(data);

export const CaptchaContext = React.createContext<CaptchaValues>({
    handler: defaultHandler,
});

function useCaptcha() {
    return React.useContext(CaptchaContext);
}

export type CaptchaConfig = {
    /**
     * What the surrounding widget is about to do. Fixed by each widget rather than exposed as an
     * option, and folded into the settings of the providers that have a use for it — each of which
     * translates it into its own action vocabulary.
     */
    operation: CaptchaOperation;
    captcha?: CaptchaOptions;
};

type CaptchaFoxFieldProps = CaptchaProps & {
    instanceRef: React.Ref<CaptchaFoxInstance>;
    mode: NonNullable<CaptchaFoxConf['captchaFoxMode']>;
    sitekey: string;
};

/**
 * The CaptchaFox widget.
 */
function CaptchaFoxField({
    className,
    instanceRef,
    mode,
    onError,
    ...props
}: CaptchaFoxFieldProps) {
    const handleError: CaptchaProps['onError'] = cause => {
        logError(cause ?? 'CaptchaFox error');
        onError?.(cause);
    };

    return (
        <CaptchaFoxWidget
            {...props}
            ref={instanceRef}
            mode={mode}
            onError={handleError}
            className={cn('[&_.cf-button]:!max-w-full mb-4', className)}
        />
    );
}

function CaptchaProvider({ children, operation, captcha }: React.PropsWithChildren<CaptchaConfig>) {
    const captchaFoxInstanceRef = React.useRef<CaptchaFoxInstance>(null);

    // Start the provider's script as the widget appears, so it is ready by the time the user submits.
    React.useEffect(() => {
        if (captcha?.provider === 'recaptcha') {
            void importGoogleRecaptchaScript(captcha.siteKey).catch(() => {
                // Reported to the user by the handler if they go on to submit.
            });
        }
    }, [captcha]);

    // memoized to keeps its identity across renders
    const value = React.useMemo<CaptchaValues>(() => {
        switch (captcha?.provider) {
            case 'recaptcha': {
                const settings = { siteKey: captcha.siteKey, operation };
                return {
                    handler: (data, callback) => ReCaptcha.handle(data, settings, callback),
                };
            }

            // No operation: CaptchaFox challenges the user rather than scoring what they are doing.
            case 'captchafox': {
                const { siteKey, mode } = captcha;
                return {
                    handler: (data, callback) =>
                        CaptchaFox.handle(data, captchaFoxInstanceRef.current, callback),
                    Captcha: props => (
                        <CaptchaFoxField
                            {...props}
                            instanceRef={captchaFoxInstanceRef}
                            mode={mode ?? 'hidden'}
                            sitekey={siteKey}
                        />
                    ),
                };
            }

            default:
                return { handler: defaultHandler };
        }
    }, [captcha, operation]);

    return <CaptchaContext.Provider value={value}>{children}</CaptchaContext.Provider>;
}

/** Wrap its children with captcha provider if configured, or leaves them untouch. */
function CaptchaBoundary({
    captcha,
    children,
}: React.PropsWithChildren<{ captcha?: CaptchaConfig }>) {
    if (!captcha) return <>{children}</>;
    return <CaptchaProvider {...captcha}>{children}</CaptchaProvider>;
}

export { useCaptcha, CaptchaProvider, CaptchaBoundary };
