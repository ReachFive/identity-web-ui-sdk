import React, { useLayoutEffect } from 'react';
import { type AuthOptions } from '@reachfive/identity-core'
import { LoginWithPasswordParams } from '@reachfive/identity-core/es/main/oAuthClient'

import styled from 'styled-components';

import { Alternative, Heading, Link } from '../../../components/miscComponent';

import { createForm } from '../../../components/form/formComponent';
import simplePasswordField from '../../../components/form/fields/simplePasswordField';
import checkboxField from '../../../components/form/fields/checkboxField';
import identifierField from '../../../components/form/fields/identifierField';
import ReCaptcha, {importGoogleRecaptchaScript} from '../../../components/reCaptcha';

import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';

import { specializeIdentifierData } from '../../../helpers/utils';
import { FaSelectionViewState } from '../../stepUp/mfaStepUpWidget';

const ResetCredentialWrapper = styled.div<{ floating?: boolean }>`
    margin-bottom: ${props => props.theme.spacing}px;
    text-align: right;
    ${props => props.floating && `
        position: absolute;
        right: 0;
    `};
`;

type LoginWithPasswordFormData = {
    identifier: string
    password: string
}

interface LoginWithPasswordFormProps {
    canShowPassword?: boolean
    showRememberMe?: boolean
    showForgotPassword: boolean
    showAccountRecovery?: boolean
    username?: string
}

export const LoginWithPasswordForm = createForm<LoginWithPasswordFormData, LoginWithPasswordFormProps>({
    prefix: 'r5-login-',
    fields({ username, showRememberMe, canShowPassword, showForgotPassword, showAccountRecovery, i18n, config }) {
        return [
            identifierField({
                key: 'identifier',
                defaultValue: username,
                withPhoneNumber: config.sms,
                readOnly: true,
            }, config),
            simplePasswordField({
                key: 'password',
                label: 'password',
                autoComplete: 'current-password',
                canShowPassword
            }),
            ...(showForgotPassword && !showAccountRecovery
                ? [{
                    staticContent: (
                        <ResetCredentialWrapper key="forgot-password" floating={showRememberMe}>
                            <Link target="forgot-password">{i18n('login.forgotPasswordLink')}</Link>
                        </ResetCredentialWrapper>
                    )
                }]
                : []
            ),
            ...(showAccountRecovery
                ? [{
                    staticContent: (
                        <ResetCredentialWrapper key="account-recovery" floating={showRememberMe}>
                            <Link target="account-recovery">{i18n('accountRecovery.title')}</Link>
                        </ResetCredentialWrapper>
                    )
                }]
                : []
            ),
            ...(showRememberMe
                ? [
                    checkboxField({
                        key: 'auth.persistent',
                        label: 'rememberMe',
                        defaultValue: false
                    })
                ]
                : []
            )
        ];
    },
    submitLabel: 'login.submitLabel'
});

export interface LoginWithPasswordViewProps {
    allowForgotPassword?: boolean
    allowAccountRecovery?: boolean
    auth?: AuthOptions
    canShowPassword?: boolean
    recaptcha_enabled?: boolean
    recaptcha_site_key?: string
    showLabels?: boolean
    showRememberMe?: boolean
    allowTrustDevice?: boolean
}

export type LoginWithPasswordViewState = {
    username?: string
}

export const LoginWithPasswordView = ({
    allowForgotPassword = true,
    allowAccountRecovery = false,
    auth,
    canShowPassword,
    recaptcha_enabled = false,
    recaptcha_site_key,
    showLabels,
    showRememberMe,
    allowTrustDevice
}: LoginWithPasswordViewProps) => {
    const i18n = useI18n()
    const coreClient = useReachfive()
    const { goTo, params } = useRouting()
    const { username } = params as LoginWithPasswordViewState

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key)
    }, [recaptcha_site_key])

    const callback = (data: LoginWithPasswordFormData & { captchaToken?: string }) => {
        const { auth: dataAuth, ...specializedData} = specializeIdentifierData<LoginWithPasswordParams>(data);
        return coreClient.loginWithPassword({
            ...specializedData,
            captchaToken: data.captchaToken,
            auth: {
                ...dataAuth,
                ...auth,
            },
        })
            .then(res => res?.stepUpToken ? goTo<FaSelectionViewState>('fa-selection', {token: res.stepUpToken, amr: res.amr ?? [], allowTrustDevice}) : res)
    }

    return (
        <div>
            <Heading>{i18n('login.title')}</Heading>
            <LoginWithPasswordForm
                username={username}
                showLabels={showLabels}
                showRememberMe={showRememberMe}
                showForgotPassword={allowForgotPassword}
                showAccountRecovery={allowAccountRecovery}
                canShowPassword={canShowPassword}
                handler={(data: LoginWithPasswordFormData) => ReCaptcha.handle(data, { recaptcha_enabled, recaptcha_site_key }, callback, "login")}
            />
            <Alternative>
                <Link target="login-with-web-authn">{i18n('login.password.userAnotherIdentifier')}</Link>
            </Alternative>
        </div>
    );
}

export default LoginWithPasswordView
