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

export type CaptchaConfig = WithCaptchaProps<{
    action: RecaptchaAction;
}>;

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
            className={cn('[&_.cf-button]:!max-w-full', className)}
        />
    );
}

function CaptchaProvider({ children, action, ...options }: React.PropsWithChildren<CaptchaConfig>) {
    const captchaFoxInstanceRef = React.useRef<CaptchaFoxInstance>(null);

    const recaptchaSiteKey = options.recaptcha_enabled ? options.recaptcha_site_key : undefined;
    const captchaFoxSiteKey = options.captchaFoxEnabled ? options.captchaFoxSiteKey : undefined;
    const captchaFoxMode = options.captchaFoxMode ?? 'hidden';

    // memoized to keeps its identity across renders
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

/** Wrap its children with captcha provider if configured, or leaves them untouch. */
function CaptchaBoundary({
    captcha,
    children,
}: React.PropsWithChildren<{ captcha?: CaptchaConfig }>) {
    if (!captcha) return <>{children}</>;
    return <CaptchaProvider {...captcha}>{children}</CaptchaProvider>;
}

export { useCaptcha, CaptchaProvider, CaptchaBoundary };
