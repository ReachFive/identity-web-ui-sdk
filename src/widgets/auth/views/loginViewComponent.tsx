import React, { useLayoutEffect } from 'react';
import { AuthOptions } from '@reachfive/identity-core'
import { LoginWithPasswordParams } from '@reachfive/identity-core/es/main/oAuthClient'
import styled from 'styled-components';

import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';

import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import { createForm } from '../../../components/form/formComponent';
import simplePasswordField from '../../../components/form/fields/simplePasswordField';
import checkboxField from '../../../components/form/fields/checkboxField';
import identifierField from '../../../components/form/fields/identifierField';
import ReCaptcha, { importGoogleRecaptchaScript } from '../../../components/reCaptcha'
import { simpleField } from '../../../components/form/fields/simpleField';

import { FaSelectionViewState } from '../../stepUp/mfaStepUpWidget'

import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';
import { useSession } from '../../../contexts/session';

import { specializeIdentifierData } from '../../../helpers/utils';

const ForgotPasswordWrapper = styled.div<{ floating?: boolean }>`
    margin-bottom: ${props => props.theme.spacing}px;
    text-align: right;
    ${props => props.floating && `
        position: absolute;
        right: 0;
    `};
`;

export type LoginFormData = {
    identifier: string
    password: string
} | {
    customIdentifier: string
    password: string
}

export interface LoginFormOptions {
    allowCustomIdentifier?: boolean
    canShowPassword?: boolean
    defaultIdentifier?: string
    showEmail?: boolean
    showForgotPassword?: boolean
    showIdentifier?: boolean
    showRememberMe?: boolean
}

export const LoginForm = createForm<LoginFormData, LoginFormOptions>({
    prefix: 'r5-login-',
    fields({
        allowCustomIdentifier,
        canShowPassword,
        defaultIdentifier,
        showIdentifier = true,
        showRememberMe,
        showForgotPassword,
        i18n,
        config,
    }) {
        return [
            identifierField({
                defaultValue: defaultIdentifier,
                withPhoneNumber: showIdentifier && config.sms,
                required: !allowCustomIdentifier,
                autoComplete: 'username webauthn'
            },
            config),
            allowCustomIdentifier && {
                staticContent: (
                    <Separator text={i18n('or')} />
                )
            },
            allowCustomIdentifier && simpleField({key: 'customIdentifier', type: 'text', placeholder: i18n('customIdentifier'), required: false}),
            simplePasswordField({
                key: 'password',
                label: 'password',
                autoComplete: 'current-password',
                canShowPassword
            }),
            showForgotPassword && {
                staticContent: (
                    <ForgotPasswordWrapper key="forgot-password" floating={showRememberMe}>
                        <Link target="forgot-password">{i18n('login.forgotPasswordLink')}</Link>
                    </ForgotPasswordWrapper>
                )
            },
            showRememberMe && checkboxField({
                key: 'auth.persistent',
                label: 'rememberMe',
                defaultValue: false
            })
        ];
    },
    submitLabel: 'login.submitLabel'
});

export type LoginViewProps = {
    /**
     * @deprecated
     */
    acceptTos?: boolean
    /**
     * Boolean that specifies whether an additional field for the custom identifier is shown.
     *
     * @default false
     */
    allowCustomIdentifier?: boolean
    /**
     * Boolean that specifies if the forgot password option is enabled.
     *
     * If the `allowLogin` and `allowSignup` properties are set to `false`, the forgot password feature is enabled even if `allowForgotPassword` is set to `false`.
     *
     * @default true
     */
    allowForgotPassword?: boolean
    /**
     * Boolean that specifies whether signup is enabled.
     *
     * @default true
     */
    allowSignup?: boolean
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean
    /**
     * List of authentication options
     */
    auth?: AuthOptions
    /**
     * Whether or not to provide the display password in clear text option.
     *
     * @default false
     */
    canShowPassword?: boolean
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean
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
    showRememberMe?: boolean
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[]
}

export const LoginView = ({
    acceptTos,
    allowForgotPassword = true,
    allowSignup = true,
    allowWebAuthnLogin,
    auth,
    canShowPassword = false,
    socialProviders,
    allowCustomIdentifier = false,
    showLabels = false,
    showRememberMe = false,
    recaptcha_enabled = false,
    recaptcha_site_key,
}: LoginViewProps) => {
    const i18n = useI18n()
    const coreClient = useReachfive()
    const { goTo } = useRouting()
    const session = useSession()

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key)
    }, [recaptcha_site_key])

    const controller = new AbortController();
    const signal = controller.signal;
    React.useEffect(() => {
        if (allowWebAuthnLogin) {
            coreClient.loginWithWebAuthn({
                conditionalMediation: 'preferred',
                auth: {
                    ...auth
                },
                signal: signal
            }).catch(() => undefined)
        }
    }, [coreClient, auth, allowWebAuthnLogin, signal])

    const callback = (data: LoginFormData & { captchaToken?: string }) => {
        const { auth: dataAuth, ...specializedData} = specializeIdentifierData<LoginWithPasswordParams>(data);
        return coreClient.loginWithPassword({
            ...specializedData,
            auth: {
                ...dataAuth,
                ...auth,
            },
        })
            .then(res => res?.stepUpToken ? goTo<FaSelectionViewState>('fa-selection', {token: res.stepUpToken, amr: res.amr ?? []}) : res)
    }

    const defaultIdentifier = session?.lastLoginType === 'password' ? session.email : undefined;

    return (
        <div>
            <Heading>{i18n('login.title')}</Heading>
            {socialProviders && socialProviders.length > 0 &&
                <SocialButtons providers={socialProviders} auth={auth} acceptTos={acceptTos} />
            }
            {socialProviders && socialProviders.length > 0 &&
                <Separator text={i18n('or')} />
            }
            <LoginForm
                showLabels={showLabels}
                showRememberMe={showRememberMe}
                showForgotPassword={allowForgotPassword}
                canShowPassword={canShowPassword}
                defaultIdentifier={defaultIdentifier}
                allowCustomIdentifier={allowCustomIdentifier}
                handler={(data: LoginFormData) => ReCaptcha.handle(data, { recaptcha_enabled, recaptcha_site_key }, callback, "login")}
            />
            {allowSignup &&
                <Alternative>
                    <span>{i18n('login.signupLinkPrefix')}</span>
                    &nbsp;
                    <Link target="signup" controller={controller}>{i18n('login.signupLink')}</Link>
                </Alternative>
            }
        </div>
    );
}

export default LoginView
