import React, { ComponentType, useRef } from 'react';

import { type CaptchaFoxInstance, CaptchaFox as CaptchaFoxWidget } from '@captchafox/react';
import styled from 'styled-components';

import CaptchaFox, { type CaptchaFoxConf } from './captchaFox';
import ReCaptcha, { type RecaptchaAction, type ReCaptchaConf } from './reCaptcha';

const StyledCaptchaFoxWidget = styled(CaptchaFoxWidget)`
    margin-bottom: ${props => props.theme.spacing}px;
`;

export type WithCaptchaProps<T> = T & Partial<ReCaptchaConf & CaptchaFoxConf>;

export type WithCaptchaToken<T> = T & { captchaToken?: string };

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

export type CaptchaProviderProps = WithCaptchaProps<{
    children: React.ReactNode;
    action: RecaptchaAction;
}>;

export const CaptchaProvider = ({ children, action, ...options }: CaptchaProviderProps) => {
    const captchaFoxInstanceRef = useRef<CaptchaFoxInstance>(null);

    if (options.recaptcha_enabled && options.recaptcha_site_key) {
        const handler = <T, R>(data: T, callback: (data: T) => Promise<R>) =>
            ReCaptcha.handle(
                data,
                { recaptcha_enabled: true, recaptcha_site_key: options.recaptcha_site_key! },
                callback,
                action
            );

        return <CaptchaContext.Provider value={{ handler }}>{children}</CaptchaContext.Provider>;
    }

    if (options.captchaFoxEnabled && options.captchaFoxSiteKey) {
        const handler = async <T, R>(data: T, callback: (data: T) => Promise<R>) =>
            CaptchaFox.handle(data, captchaFoxInstanceRef.current, callback);

        return (
            <CaptchaContext.Provider
                value={{
                    handler,
                    Captcha: () => (
                        <StyledCaptchaFoxWidget
                            ref={captchaFoxInstanceRef}
                            sitekey={options.captchaFoxSiteKey!}
                            mode={options.captchaFoxMode ?? 'hidden'}
                            className="[&_.cf-button]:!max-w-full"
                        />
                    ),
                }}
            >
                {children}
            </CaptchaContext.Provider>
        );
    }

    return (
        <CaptchaContext.Provider
            value={{
                handler: defaultHandler,
            }}
        >
            {children}
        </CaptchaContext.Provider>
    );
};
