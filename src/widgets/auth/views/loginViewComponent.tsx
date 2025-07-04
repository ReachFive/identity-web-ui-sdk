import { AuthOptions, LoginWithPasswordParams } from '@reachfive/identity-core';
import React, { useLayoutEffect } from 'react';
import styled from 'styled-components';

import { Alternative, Heading, Link, Separator } from '../../../components/miscComponent';

import checkboxField from '../../../components/form/fields/checkboxField';
import identifierField from '../../../components/form/fields/identifierField';
import { simpleField } from '../../../components/form/fields/simpleField';
import simplePasswordField from '../../../components/form/fields/simplePasswordField';
import { createForm } from '../../../components/form/formComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import { importGoogleRecaptchaScript } from '../../../components/reCaptcha';

import { getCaptchaHandler, type WithCaptchaToken } from '../../../components/captcha';

import { FaSelectionViewState } from '../../stepUp/mfaStepUpWidget';

import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';
import { useSession } from '../../../contexts/session';

import { enrichLoginEvent, specializeIdentifierData } from '../../../helpers/utils';

import R5CaptchaFox, { CaptchaFoxMode } from '../../../components/captchaFox';
import type { OnError, OnSuccess } from '../../../types';

type Floating = { floating?: boolean };

const ResetCredentialWrapper = styled.div.withConfig({
    shouldForwardProp: prop => !['floating'].includes(prop),
})<Floating>`
    margin-bottom: ${props => props.theme.spacing}px;
    text-align: right;
    ${props =>
        props.floating &&
        `
        position: absolute;
        right: 0;
    `};
`;

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
    showAccountRecovery?: boolean;
    showIdentifier?: boolean;
    showRememberMe?: boolean;
}

export const LoginForm = createForm<LoginFormData, LoginFormOptions>({
    prefix: 'r5-login-',
    fields({
        allowCustomIdentifier,
        allowAuthentMailPhone = true,
        enablePasswordAuthentication = true,
        canShowPassword,
        defaultIdentifier,
        showIdentifier = true,
        showRememberMe,
        showForgotPassword,
        showAccountRecovery = false,
        i18n,
        config,
    }) {
        return [
            ...(allowAuthentMailPhone
                ? [
                      identifierField(
                          {
                              defaultValue: defaultIdentifier,
                              withPhoneNumber: showIdentifier && config.sms,
                              required: !allowCustomIdentifier,
                              autoComplete: 'username webauthn',
                          },
                          config
                      ),
                  ]
                : []),
            ...(allowCustomIdentifier && allowAuthentMailPhone
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
            ...(enablePasswordAuthentication && showForgotPassword && !showAccountRecovery
                ? [
                      {
                          staticContent: (
                              <ResetCredentialWrapper
                                  key="forgot-password"
                                  floating={showRememberMe}
                              >
                                  <Link target="forgot-password">
                                      {i18n('login.forgotPasswordLink')}
                                  </Link>
                              </ResetCredentialWrapper>
                          ),
                      },
                  ]
                : []),
            ...(showAccountRecovery
                ? [
                      {
                          staticContent: (
                              <ResetCredentialWrapper
                                  key="account-recovery"
                                  floating={showRememberMe}
                              >
                                  <Link target="account-recovery">
                                      {i18n('accountRecovery.title')}
                                  </Link>
                              </ResetCredentialWrapper>
                          ),
                      },
                  ]
                : []),
            ...(showRememberMe
                ? [
                      checkboxField({
                          key: 'auth.persistent',
                          label: 'rememberMe',
                          defaultValue: false,
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
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * Boolean that specifies whether CaptchaFox is enabled or not.
     */
    captchaFoxEnabled?: boolean;
    /**
     * The SITE key that comes from your [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys) setup.
     * This must be paired with the appropriate secret key that you received when setting up CaptchaFox.
     */
    captchaFoxSiteKey?: string;
    /**
     * Define how CaptchaFox is displayed (hidden|inline|popup)/ Default to hidden.
     */
    captchaFoxMode?: CaptchaFoxMode;
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
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: LoginViewProps) => {
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
                    });
                }
                return enrichLoginEvent(res, 'password', specializedIdentifierData);
            });
    };

    const defaultIdentifier = session?.lastLoginType === 'password' ? session.email : undefined;

    const captchaFox = new R5CaptchaFox(captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey);
    const handleLogin = getCaptchaHandler(
        {
            recaptchaEnabled: recaptcha_enabled,
            recaptchaSiteKey: recaptcha_site_key,
            captchaFoxEnabled: captchaFoxEnabled,
            captchaFoxInstance: captchaFox,
        },
        callback
    );

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
            <LoginForm
                showLabels={showLabels}
                showRememberMe={showRememberMe}
                showForgotPassword={allowForgotPassword}
                showAccountRecovery={allowAccountRecovery}
                canShowPassword={canShowPassword}
                defaultIdentifier={defaultIdentifier}
                allowCustomIdentifier={allowCustomIdentifier}
                allowAuthentMailPhone={allowAuthentMailPhone}
                handler={data => handleLogin(data, 'login')}
                captchaFox={captchaFox}
                onSuccess={res => {
                    console.log('Auth result');
                    onSuccess({ name: 'login', ...res });
                }}
                onError={onError}
            />
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
