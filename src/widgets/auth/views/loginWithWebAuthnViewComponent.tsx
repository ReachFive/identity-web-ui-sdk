import React, { useCallback } from 'react';
import type { AuthOptions, LoginWithWebAuthnParams } from '@reachfive/identity-core'

import { LoginWithPasswordViewState } from './loginWithPasswordViewComponent';
import { Alternative, Heading, Link, Separator } from '../../../components/miscComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import {
    WebAuthnLoginViewButtons,
    type WebAuthnLoginViewButtonsProps
} from '../../../components/form/webAuthAndPasswordButtonsComponent';
import { createForm } from '../../../components/form/formComponent';
import identifierField from '../../../components/form/fields/identifierField';

import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';
import { useSession } from '../../../contexts/session';

import { isCustomIdentifier, specializeIdentifierData } from '../../../helpers/utils';
import styled from 'styled-components'

type LoginWithWebAuthnFormData = { identifier: string } | { email: string }

interface LoginWithWebAuthnFormProps {
    defaultIdentifier?: string
    showIdentifier?: boolean
    showAccountRecovery?: boolean
}

const ResetCredentialWrapper = styled.div<{ floating?: boolean }>`
    margin-bottom: ${props => props.theme.spacing}px;
    text-align: right;
    ${props => props.floating && `
        right: 0;
    `};
`;

export const LoginWithWebAuthnForm = createForm<LoginWithWebAuthnFormData, LoginWithWebAuthnFormProps>({
    prefix: 'r5-login-',
    fields({ showIdentifier = true, defaultIdentifier, config, showAccountRecovery = false, i18n }) {
        return [
            identifierField({
                    defaultValue: defaultIdentifier,
                    withPhoneNumber: showIdentifier && config.sms,
                    required: true,
                    autoComplete: 'username webauthn'
                },
                config),
            showAccountRecovery && {
                staticContent: (
                    <ResetCredentialWrapper key="account-recovery" floating={true}>
                    <Link target="account-recovery">{i18n('accountRecovery.title')}</Link>
                    </ResetCredentialWrapper>
                )
            }
        ];
    },
    allowWebAuthnLogin: true
});

export interface LoginWithWebAuthnViewProps {
    /**
     * @deprecated
     */
    acceptTos?: boolean
    /**
     * Boolean that specifies whether signup is enabled.
     *
     * @default true
     */
    allowSignup?: boolean
    /**
     * List of authentication options
     */
    auth?: AuthOptions
    /**
     * Boolean that specifies whether password authentication is enabled.
     */
    enablePasswordAuthentication?: boolean
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[]

    allowAccountRecovery?: boolean
}

export const LoginWithWebAuthnView = ({ acceptTos, allowSignup = true, auth, enablePasswordAuthentication = true, showLabels = false, socialProviders, allowAccountRecovery }: LoginWithWebAuthnViewProps) => {
    const coreClient = useReachfive()
    const { goTo } = useRouting()
    const i18n = useI18n()
    const session = useSession()


    const controller = new AbortController();
    const signal = controller.signal;
    React.useEffect(() => {
        coreClient.loginWithWebAuthn({
            conditionalMediation: 'preferred',
            auth: {
                ...auth
            },
            signal: signal
        }).catch(() => undefined)
    }, [coreClient, auth, signal])


    const handleWebAuthnLogin = React.useCallback(
        (data: LoginWithWebAuthnFormData) => {
            const { auth: dataAuth, ...identifier } = specializeIdentifierData<LoginWithWebAuthnParams>(data);

            if (isCustomIdentifier(identifier)) {
                console.error('Custom identifier is not a valid WebAuthn identifier.')
                return Promise.reject(new Error('Custom identifier is not a valid WebAuthn identifier.'));
            }

            return coreClient.loginWithWebAuthn({
                ...identifier,
                auth: {
                    ...dataAuth,
                    ...auth,
                }
            });
        },
        [coreClient, auth]
    )

    const redirectToPasswordLoginView = useCallback(
        (data: LoginWithWebAuthnFormData) => {
            const username = 'identifier' in data ? data.identifier : 'email' in data ? data.email : ''
            goTo<LoginWithPasswordViewState>('login-with-password', { username })
        },
        [goTo]
    )

    const defaultIdentifier = session?.lastLoginType === 'password' ? session.email : undefined;

    const webAuthnButtons = (disabled: boolean, enablePasswordAuthentication: boolean, handleClick: WebAuthnLoginViewButtonsProps['onPasswordClick']) =>
        <WebAuthnLoginViewButtons
            disabled={disabled}
            enablePasswordAuthentication={enablePasswordAuthentication}
            onPasswordClick={handleClick}
        />

    return (
        <div>
            <Heading>{i18n('login.title')}</Heading>
            {socialProviders && socialProviders.length > 0 &&
                <SocialButtons providers={socialProviders} auth={auth} acceptTos={acceptTos} />
            }
            {socialProviders && socialProviders.length > 0 &&
                <Separator text={i18n('or')} />
            }
            <LoginWithWebAuthnForm
                showLabels={showLabels}
                defaultIdentifier={defaultIdentifier}
                handler={handleWebAuthnLogin}
                redirect={redirectToPasswordLoginView}
                webAuthnButtons={webAuthnButtons}
                showAccountRecovery={allowAccountRecovery}
                enablePasswordAuthentication={enablePasswordAuthentication}
            />
            {allowSignup &&
                <Alternative>
                    <span>{i18n('login.signupLinkPrefix')}</span>
                    &nbsp;
                    <Link controller={controller} target="signup">{i18n('login.signupLink')}</Link>
                </Alternative>
            }
        </div>
    );
}

export default LoginWithWebAuthnView
