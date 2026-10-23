import React from 'react';

import { CaptchaFoxInstance, CaptchaFox as CaptchaFoxWidget } from '@captchafox/react';
import type { WidgetDisplayMode } from '@captchafox/types';

// Aliased: present module also exports a `CaptchaProvider` component.
import type { CaptchaProvider as ApiCaptchaProvider } from '@reachfive/identity-core';

import { logError } from '@/helpers/logger';
import { cn } from '@/lib/utils';

import CaptchaFox, { CaptchaFoxConf } from './captchaFox';
import ReCaptcha, { importGoogleRecaptchaScript, ReCaptchaConf } from './reCaptcha';
import ReCaptchaEnterprise, { importGoogleRecaptchaEnterpriseScript } from './reCaptchaEnterprise';

import type { CaptchaOperation } from './captchaOperation';
import type {
    ReCaptchaEnterpriseCheckboxSettings,
    ReCaptchaEnterpriseMode,
} from './reCaptchaEnterprise';

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
           * The SITE key of the reCAPTCHA Enterprise, web or universal key, from the Google Cloud console.
           */
          siteKey: string;
          /**
           * What token generation mode is used.
           * - unset, the token is generated in the background and sent in the request body.
           * - `autoExecute` is for a Universal key with AutoExecute enabled: the reCAPTCHA library attaches the token
           *   to the requests it intercepts, and the SDK fetches none of its own.
           * - `checkbox` is for a Web key configured for a checkbox challenge.
           */
          mode?: ReCaptchaEnterpriseMode;
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

/** Every captcha option a widget accepts, current and deprecated. */
/** Every captcha option `createClient` accepts, current and deprecated. */
export type CaptchaInput = { captcha?: CaptchaOptions } & DeprecatedCaptchaConf;

export type WithCaptchaProps<T> = T & { captcha?: CaptchaOptions };

export type WithCaptchaToken<T> = T & {
    captchaToken?: string;
    captchaProvider?: ApiCaptchaProvider;
};

type CaptchaProps = Omit<
    React.ComponentPropsWithoutRef<typeof CaptchaFoxWidget>,
    'sitekey' | 'mode'
>;

/**
 * Narrows widget options down to the captcha that should run.
 *
 * The deprecated options let several providers be enabled at once and a provider be enabled with no
 * site key, neither of which means anything; resolving them here keeps those cases from reaching
 * the rest of the code. The order of the branches below is the precedence integrations already
 * rely on, and has to stay that way for as long as these options are honoured.
 */
export function resolveCaptchaOptions(options: CaptchaInput): CaptchaOptions | undefined {
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

/** What a form may pass to the widget a provider puts in it. */
export type CaptchaWidgetProps = {
    className?: string;
    onError?: (cause?: string | Error) => void;
};

export type CaptchaValues = {
    handler: <T, R>(data: T, callback: (data: T) => Promise<R>) => Promise<R>;
    Captcha?: React.ComponentType<CaptchaWidgetProps>;
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

type ReCaptchaEnterpriseCheckboxProps = ReCaptchaEnterpriseCheckboxSettings & {
    /** Receives the widget id once rendered, and `null` once unmounted. */
    onWidgetIdChange: (widgetId: number | null) => void;
    className?: string;
    onError?: CaptchaWidgetProps['onError'];
};

/**
 * The "I'm not a robot" checkbox. It is rendered once into its own element and lives as long as
 * the form does; the id it is given is what the submit handler reads the token from.
 */
function ReCaptchaEnterpriseCheckbox({
    siteKey,
    operation,
    onWidgetIdChange,
    className,
    onError,
}: ReCaptchaEnterpriseCheckboxProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const renderedRef = React.useRef(false);

    React.useEffect(() => {
        const container = containerRef.current;
        // reCAPTCHA refuses a second render into the same element, and the effect runs twice under
        // StrictMode.
        if (!container || renderedRef.current) return;

        renderedRef.current = true;
        void ReCaptchaEnterprise.renderCheckbox(container, { siteKey, operation })
            .then(onWidgetIdChange)
            .catch((cause: unknown) => {
                logError(
                    cause instanceof Error
                        ? cause
                        : 'reCAPTCHA Enterprise checkbox failed to render'
                );
                onError?.(cause instanceof Error ? cause : String(cause));
                // Reported to the user by the handler if they go on to submit.
                renderedRef.current = false;
            });
    }, [siteKey, operation, onWidgetIdChange, onError]);

    return <div ref={containerRef} className={cn('mb-4', className)} />;
}

function CaptchaProvider({ children, operation, captcha }: React.PropsWithChildren<CaptchaConfig>) {
    const captchaFoxInstanceRef = React.useRef<CaptchaFoxInstance>(null);
    const recaptchaWidgetIdRef = React.useRef<number | null>(null);

    // Start the provider's script as the widget appears, so it is ready by the time the user submits.
    React.useEffect(() => {
        const load =
            captcha?.provider === 'recaptcha'
                ? () => importGoogleRecaptchaScript(captcha.siteKey)
                : captcha?.provider === 'recaptcha_enterprise'
                  ? () => importGoogleRecaptchaEnterpriseScript(captcha.siteKey, captcha.mode)
                  : undefined;

        if (load) {
            void load().catch(() => {
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

            case 'recaptcha_enterprise': {
                if (captcha.mode === 'checkbox') {
                    const { siteKey } = captcha;
                    const setWidgetId = (widgetId: number | null) => {
                        recaptchaWidgetIdRef.current = widgetId;
                    };
                    return {
                        handler: (data, callback) =>
                            ReCaptchaEnterprise.handleCheckbox(
                                data,
                                recaptchaWidgetIdRef.current,
                                callback
                            ),
                        Captcha: ({ className, onError }) => (
                            <ReCaptchaEnterpriseCheckbox
                                siteKey={siteKey}
                                operation={operation}
                                onWidgetIdChange={setWidgetId}
                                className={className}
                                onError={onError}
                            />
                        ),
                    };
                }

                const settings = {
                    siteKey: captcha.siteKey,
                    mode: captcha.mode,
                    operation,
                };
                return {
                    handler: (data, callback) =>
                        ReCaptchaEnterprise.handle(data, settings, callback),
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
