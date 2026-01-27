import React, { useLayoutEffect } from 'react';

import { type AuthOptions } from '@reachfive/identity-core';
import { LoginWithPasswordParams } from '@reachfive/identity-core/es/main/oAuthClient';

import { CaptchaProvider, WithCaptchaProps, WithCaptchaToken } from '../../../components/captcha';
import checkboxField from '../../../components/form/fields/checkboxField';
import identifierField from '../../../components/form/fields/identifierField';
import simplePasswordField from '../../../components/form/fields/simplePasswordField';
import { createForm } from '../../../components/form/formComponent';
import { Alternative, Heading, Link } from '../../../components/miscComponent';
import { importGoogleRecaptchaScript } from '../../../components/reCaptcha';
import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';
import { enrichLoginEvent, specializeIdentifierData } from '../../../helpers/utils';
import { FaSelectionViewState } from '../../stepUp/mfaStepUpWidget';

import type { OnError, OnSuccess } from '../../../types';

type LoginWithPasswordFormData = {
    identifier: string;
    password: string;
};

interface LoginWithPasswordFormProps {
    canShowPassword?: boolean;
    showRememberMe?: boolean;
    username?: string;
}

export const LoginWithPasswordForm = createForm<
    LoginWithPasswordFormData,
    LoginWithPasswordFormProps
>({
    prefix: 'r5-login-',
    fields({ username, showRememberMe, canShowPassword, config }) {
        return [
            identifierField(
                {
                    key: 'identifier',
                    defaultValue: username,
                    withPhoneNumber: config.loginTypeAllowed.phoneNumber,
                    readOnly: true,
                },
                config
            ),
            simplePasswordField({
                key: 'password',
                label: 'password',
                autoComplete: 'current-password',
                canShowPassword,
            }),
            ...(showRememberMe
                ? [
                      checkboxField({
                          key: 'auth.persistent',
                          label: 'rememberMe',
                          defaultValue: false,
                          required: false,
                      }),
                  ]
                : []),
        ];
    },
    submitLabel: 'login.submitLabel',
});

export interface LoginWithPasswordViewProps {
    allowForgotPassword?: boolean;
    allowAccountRecovery?: boolean;
    auth?: AuthOptions;
    canShowPassword?: boolean;
    showLabels?: boolean;
    showRememberMe?: boolean;
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Action used in template
     */
    action?: string;
}

export type LoginWithPasswordViewState = {
    username?: string;
};

export const LoginWithPasswordView = ({
    allowForgotPassword = true,
    allowAccountRecovery = false,
    auth,
    canShowPassword,
    recaptcha_enabled = false,
    recaptcha_site_key,
    captchaFoxEnabled = false,
    captchaFoxSiteKey,
    captchaFoxMode,
    showLabels,
    showRememberMe,
    allowTrustDevice,
    action,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: WithCaptchaProps<LoginWithPasswordViewProps>) => {
    const i18n = useI18n();
    const coreClient = useReachfive();
    const { goTo, params } = useRouting();
    const { username } = params as LoginWithPasswordViewState;

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    const callback = (data: WithCaptchaToken<LoginWithPasswordFormData>) => {
        const specializedIdentifierData = specializeIdentifierData<LoginWithPasswordParams>(data);
        const { auth: dataAuth, ...specializedData } = specializedIdentifierData;

        return coreClient
            .loginWithPassword({
                ...specializedData,
                auth: {
                    ...dataAuth,
                    ...auth,
                },
                action,
            })
            .then(res => {
                if (res?.stepUpToken) {
                    goTo<FaSelectionViewState>('fa-selection', {
                        token: res.stepUpToken,
                        amr: res.amr ?? [],
                        allowTrustDevice,
                        auth,
                    });
                }
                return enrichLoginEvent(res, 'password', specializedIdentifierData);
            });
    };

    return (
        <CaptchaProvider
            recaptcha_enabled={recaptcha_enabled}
            recaptcha_site_key={recaptcha_site_key}
            captchaFoxEnabled={captchaFoxEnabled}
            captchaFoxSiteKey={captchaFoxSiteKey}
            captchaFoxMode={captchaFoxMode}
            action="login"
        >
            <Heading>{i18n('login.title')}</Heading>
            <LoginWithPasswordForm
                username={username}
                showLabels={showLabels}
                showRememberMe={showRememberMe}
                canShowPassword={canShowPassword}
                handler={callback}
                onSuccess={res => onSuccess({ name: 'login', ...res })}
                onError={onError}
            />
            {allowForgotPassword && !allowAccountRecovery && (
                <Alternative>
                    <Link target="forgot-password">{i18n('login.forgotPasswordLink')}</Link>
                </Alternative>
            )}
            {allowAccountRecovery && (
                <Alternative>
                    <Link target="account-recovery">{i18n('accountRecovery.title')}</Link>
                </Alternative>
            )}
            <Alternative>
                <Link target="login-with-web-authn">
                    {i18n('login.password.userAnotherIdentifier')}
                </Link>
            </Alternative>
        </CaptchaProvider>
    );
};

export default LoginWithPasswordView;
