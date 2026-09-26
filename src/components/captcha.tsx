import React from 'react';

import { CaptchaFoxInstance, CaptchaFox as CaptchaFoxWidget } from '@captchafox/react';

import { logError } from '@/helpers/logger';
import { cn } from '@/lib/utils';

import CaptchaFox, { CaptchaFoxConf } from './captchaFox';
import ReCaptcha, { RecaptchaAction, ReCaptchaConf } from './reCaptcha';

export type WithCaptchaProps<T> = T & Partial<ReCaptchaConf & CaptchaFoxConf>;

export type WithCaptchaToken<T> = T & { captchaToken?: string };

type CaptchaProps = Omit<
    React.ComponentPropsWithoutRef<typeof CaptchaFoxWidget>,
    'sitekey' | 'mode'
>;

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

export type CaptchaProviderProps = WithCaptchaProps<{
    children: React.ReactNode;
    action: RecaptchaAction;
}>;

/** The configuration of a `CaptchaProvider`: which captcha protects which action. */
export type CaptchaConfig = Omit<CaptchaProviderProps, 'children'>;

type CaptchaFoxFieldProps = CaptchaProps & {
    instanceRef: React.Ref<CaptchaFoxInstance>;
    mode: NonNullable<CaptchaFoxConf['captchaFoxMode']>;
    sitekey: string;
};

/**
 * The CaptchaFox widget, with its error displayed under it.
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
            className={cn('[&_.cf-button]:!max-w-full', className)}
        />
    );
}

function CaptchaProvider({ children, action, ...options }: CaptchaProviderProps) {
    const captchaFoxInstanceRef = React.useRef<CaptchaFoxInstance>(null);

    const recaptchaSiteKey = options.recaptcha_enabled ? options.recaptcha_site_key : undefined;
    const captchaFoxSiteKey = options.captchaFoxEnabled ? options.captchaFoxSiteKey : undefined;
    const captchaFoxMode = options.captchaFoxMode ?? 'hidden';

    // memoized so that `Captcha` keeps its identity across renders: a component type created anew
    // on each render makes React remount the widget, which reloads it
    const value = React.useMemo<CaptchaValues>(() => {
        if (recaptchaSiteKey) {
            return {
                handler: (data, callback) =>
                    ReCaptcha.handle(
                        data,
                        { recaptcha_enabled: true, recaptcha_site_key: recaptchaSiteKey },
                        callback,
                        action
                    ),
            };
        }

        if (captchaFoxSiteKey) {
            return {
                handler: (data, callback) =>
                    CaptchaFox.handle(data, captchaFoxInstanceRef.current, callback),
                Captcha: props => (
                    <CaptchaFoxField
                        {...props}
                        instanceRef={captchaFoxInstanceRef}
                        mode={captchaFoxMode}
                        sitekey={captchaFoxSiteKey}
                    />
                ),
            };
        }

        return { handler: defaultHandler };
    }, [action, captchaFoxMode, captchaFoxSiteKey, recaptchaSiteKey]);

    return <CaptchaContext.Provider value={value}>{children}</CaptchaContext.Provider>;
}

/**
 * Protects its children with the captcha `captcha` configures, or leaves them as they are when it
 * is not given: they then keep the captcha of the enclosing `CaptchaProvider`, if any.
 *
 * Useful for a request of its own nested in a protected form, e.g. sending a new verification
 * code, whose endpoint expects another captcha action than the form's.
 */
function CaptchaBoundary({
    captcha,
    children,
}: React.PropsWithChildren<{ captcha?: CaptchaConfig }>) {
    if (!captcha) return <>{children}</>;
    return <CaptchaProvider {...captcha}>{children}</CaptchaProvider>;
}

export { useCaptcha, CaptchaProvider, CaptchaBoundary };
