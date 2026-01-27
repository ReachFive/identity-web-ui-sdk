import React, { useLayoutEffect } from 'react';

import { AuthOptions, LoginWithPasswordParams } from '@reachfive/identity-core';

import {
    CaptchaProvider,
    WithCaptchaProps,
    type WithCaptchaToken,
} from '../../../components/captcha';
import checkboxField from '../../../components/form/fields/checkboxField';
import identifierField from '../../../components/form/fields/identifierField';
import { simpleField } from '../../../components/form/fields/simpleField';
import simplePasswordField from '../../../components/form/fields/simplePasswordField';
import { createForm } from '../../../components/form/formComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import { Alternative, Heading, Link, Separator } from '../../../components/miscComponent';
import { importGoogleRecaptchaScript } from '../../../components/reCaptcha';
import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';
import { useSession } from '../../../contexts/session';
import { enrichLoginEvent, specializeIdentifierData } from '../../../helpers/utils';
import { FaSelectionViewState } from '../../stepUp/mfaStepUpWidget';

import type { OnError, OnSuccess } from '../../../types';

export type LoginFormData =
    | {
          identifier: string;
          password: string;
      }
    | {
          customIdentifier: string;
          password: string;
      };

export interface LoginFormOptions {
    allowCustomIdentifier?: boolean;
    allowAuthentMailPhone?: boolean;
    canShowPassword?: boolean;
    defaultIdentifier?: string;
    enablePasswordAuthentication?: boolean;
    showEmail?: boolean;
    showForgotPassword?: boolean;
    showIdentifier?: boolean;
    showRememberMe?: boolean;
    allowWebAuthnLogin?: boolean;
}

export const LoginForm = createForm<LoginFormData, LoginFormOptions>({
    prefix: 'r5-login-',
    fields({
        allowWebAuthnLogin,
        allowCustomIdentifier = true,
        allowAuthentMailPhone = true,
        canShowPassword,
        defaultIdentifier,
        showIdentifier = true,
        showRememberMe,
        i18n,
        config,
    }) {
        const hasIdentifierField = allowAuthentMailPhone && (config.loginTypeAllowed.email || config.loginTypeAllowed.phoneNumber || allowWebAuthnLogin)
        return [
            ...(hasIdentifierField
                ? [
                      identifierField(
                          {
                              defaultValue: defaultIdentifier,
                              withPhoneNumber: showIdentifier && config.loginTypeAllowed.phoneNumber,
                              required: !allowCustomIdentifier,
                              autoComplete: 'username webauthn',
                          },
                          config
                      ),
                  ]
                : []),
            ...(allowCustomIdentifier && hasIdentifierField
                ? [
                      {
                          staticContent: <Separator text={i18n('or')} />,
                      },
                  ]
                : []),
            ...(allowCustomIdentifier
                ? [
                      simpleField({
                          key: 'customIdentifier',
                          type: 'text',
                          label: 'customIdentifier',
                          placeholder: i18n('customIdentifier'),
                          required: false,
                      }),
                  ]
                : []),
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

export type LoginViewProps = {
    /**
     * @deprecated
     */
    acceptTos?: boolean;
    /**
     * Boolean that specifies whether an additional field for the custom identifier is shown.
     *
     * @default false
     */
    allowCustomIdentifier?: boolean;
    /**
     * Boolean that specifies if the forgot password option is enabled.
     *
     * If the `allowLogin` and `allowSignup` properties are set to `false`, the forgot password feature is enabled even if `allowForgotPassword` is set to `false`.
     *
     * @default true
     */
    allowForgotPassword?: boolean;
    /**
     * Boolean that specifies if the account recovery is enabled.
     *
     * @default false
     */
    allowAccountRecovery?: boolean;
    /**
     * Boolean that specifies whether signup is enabled.
     *
     * @default true
     */
    allowSignup?: boolean;
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Whether or not to provide the display password in clear text option.
     *
     * @default false
     */
    canShowPassword?: boolean;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Whether the Remember me checkbox is displayed on the login view. Affects user session duration.
     *
     * The account session duration configured in the ReachFive Console (Settings  Security  SSO) applies when:
     * - The checkbox is hidden from the user
     * - The checkbox is visible and selected by the user
     *
     * If the checkbox is visible and not selected by the user, the default session duration of 1 day applies.
     *
     * @default false
     */
    showRememberMe?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
    /**
     * If `allowCustomIdentifier` property is `true` then the email and phoneNumber fields can be hidden by specifying the `allowAuthentMailPhone` property to `false`.
     * @default true
     */
    allowAuthentMailPhone?: boolean;
    /**
     * Boolean that specifies whether a device can be trusted during step up.
     *
     * @default false
     */
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
};

export const LoginView = ({
    acceptTos,
    allowForgotPassword = true,
    allowSignup = true,
    allowWebAuthnLogin,
    allowAccountRecovery = false,
    auth,
    canShowPassword = false,
    socialProviders,
    allowCustomIdentifier = false,
    showLabels = false,
    showRememberMe = false,
    recaptcha_enabled = false,
    recaptcha_site_key,
    captchaFoxEnabled = false,
    captchaFoxSiteKey,
    captchaFoxMode = 'hidden',
    allowAuthentMailPhone = true,
    allowTrustDevice,
    action,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: WithCaptchaProps<LoginViewProps>) => {
    const i18n = useI18n();
    const coreClient = useReachfive();
    const { goTo } = useRouting();
    const session = useSession();

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    const controller = new AbortController();
    const signal = controller.signal;

    React.useEffect(() => {
        if (allowWebAuthnLogin) {
            coreClient
                .loginWithWebAuthn({
                    conditionalMediation: 'preferred',
                    auth: {
                        ...auth,
                    },
                    signal: signal,
                })
                .catch(onError);
        }
    }, [coreClient, auth, allowWebAuthnLogin, signal]);

    const callback = (data: WithCaptchaToken<LoginFormData>) => {
        const specializedIdentifierData = specializeIdentifierData<LoginWithPasswordParams>(data);
        const { auth: dataAuth, ...specializedData } = specializedIdentifierData;
        return coreClient
            .loginWithPassword({
                ...specializedData,
                action,
                auth: {
                    ...dataAuth,
                    ...auth,
                },
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

    const defaultIdentifier = session?.lastLoginType === 'password' ? session.email : undefined;

    return (
        <div>
            <Heading>{i18n('login.title')}</Heading>
            {socialProviders && socialProviders.length > 0 && (
                <SocialButtons
                    providers={socialProviders}
                    auth={auth}
                    acceptTos={acceptTos}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            )}
            {socialProviders && socialProviders.length > 0 && <Separator text={i18n('or')} />}
            <CaptchaProvider
                recaptcha_enabled={recaptcha_enabled}
                recaptcha_site_key={recaptcha_site_key}
                captchaFoxEnabled={captchaFoxEnabled}
                captchaFoxSiteKey={captchaFoxSiteKey}
                captchaFoxMode={captchaFoxMode}
                action="login"
            >
                <LoginForm
                    showLabels={showLabels}
                    showRememberMe={showRememberMe}
                    showForgotPassword={allowForgotPassword}
                    canShowPassword={canShowPassword}
                    defaultIdentifier={defaultIdentifier}
                    allowCustomIdentifier={allowCustomIdentifier}
                    allowAuthentMailPhone={allowAuthentMailPhone}
                    handler={callback}
                    onSuccess={res => {
                        onSuccess({ name: 'login', ...res });
                    }}
                    onError={onError}
                />
            </CaptchaProvider>
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
            {allowSignup && (
                <Alternative>
                    <span>{i18n('login.signupLinkPrefix')}</span>
                    &nbsp;
                    <Link target="signup" controller={controller}>
                        {i18n('login.signupLink')}
                    </Link>
                </Alternative>
            )}
        </div>
    );
};

export default LoginView;
