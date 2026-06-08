import React, { useCallback } from 'react';

import type { AuthOptions, LoginWithWebAuthnParams } from '@reachfive/identity-core';

import identifierField from '../../../components/form/fields/identifierField';
import { createForm } from '../../../components/form/formComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import { WebAuthnLoginViewButtons } from '../../../components/form/webAuthAndPasswordButtonsComponent';
import { Alternative, Heading, Link, Separator } from '../../../components/miscComponent';
import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';
import { useSession } from '../../../contexts/session';
import {
    enrichLoginEvent,
    isCustomIdentifier,
    specializeIdentifierData,
} from '../../../helpers/utils';
import { LoginWithPasswordViewState } from './loginWithPasswordViewComponent';

import type { OnError, OnSuccess } from '../../../types';

type LoginWithWebAuthnFormData = { identifier: string } | { email: string };

type LoginWithWebAuthnFormProps = {
    defaultIdentifier?: string;
    showIdentifier?: boolean;
};

export const LoginWithWebAuthnForm = createForm<
    LoginWithWebAuthnFormData,
    LoginWithWebAuthnFormProps
>({
    prefix: 'r5-login-',
    fields({ showIdentifier = true, defaultIdentifier, config }) {
        return [
            identifierField(
                {
                    defaultValue: defaultIdentifier,
                    withPhoneNumber: showIdentifier && config.loginTypeAllowed.phoneNumber,
                    required: true,
                    autoComplete: 'username webauthn',
                    isWebAuthnLogin: true,
                },
                config
            ),
        ];
    },
});

export interface LoginWithWebAuthnViewProps {
    /**
     * @deprecated
     */
    acceptTos?: boolean;
    /**
     * Boolean that specifies whether signup is enabled.
     *
     * @default true
     */
    allowSignup?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Boolean that specifies whether password authentication is enabled.
     */
    enablePasswordAuthentication?: boolean;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];

    allowAccountRecovery?: boolean;

    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export const LoginWithWebAuthnView = ({
    acceptTos,
    allowSignup = true,
    auth,
    enablePasswordAuthentication = true,
    showLabels = false,
    socialProviders,
    allowAccountRecovery,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: LoginWithWebAuthnViewProps) => {
    const coreClient = useReachfive();
    const { goTo } = useRouting();
    const i18n = useI18n();
    const session = useSession();

    // Single AbortController for the conditional (autofill) request. Created inside the effect so
    // each run gets a fresh one, and kept in a ref so the submit handler can cancel it.
    const conditionalAbort = React.useRef<AbortController | null>(null);

    React.useEffect(() => {
        const controller = new AbortController();
        conditionalAbort.current = controller;

        coreClient
            .loginWithWebAuthn({
                conditionalMediation: 'preferred',
                auth: {
                    ...auth,
                },
                signal: controller.signal,
            })
            .catch(err => {
                // Aborting the autofill request (submit, navigation, unmount) is expected.
                if (err?.name !== 'AbortError') onError(err);
            });

        // Cancel the autofill request when the view unmounts (e.g. navigating to signup) so it
        // does not stay pending in the background.
        return () => controller.abort();
        // onError is intentionally left out of the deps: it is re-created on every render, so
        // including it would re-run the effect on each render and tear down the autofill request.
    }, [coreClient, auth]);

    const handleWebAuthnLogin = React.useCallback(
        (data: LoginWithWebAuthnFormData) => {
            // Cancel the pending conditional (autofill) request before starting the modal one.
            // Chrome only allows one navigator.credentials.get() at a time and otherwise rejects
            // the modal request with "A request is already pending.".
            conditionalAbort.current?.abort();

            const specializedIdentifierData =
                specializeIdentifierData<LoginWithWebAuthnParams>(data);
            const { auth: dataAuth, ...identifier } = specializedIdentifierData;

            if (isCustomIdentifier(identifier)) {
                console.error('Custom identifier is not a valid WebAuthn identifier.');
                return Promise.reject(
                    new Error('Custom identifier is not a valid WebAuthn identifier.')
                );
            }

            return coreClient
                .loginWithWebAuthn({
                    ...identifier,
                    auth: {
                        ...dataAuth,
                        ...auth,
                    },
                })
                .then(res => {
                    return enrichLoginEvent(res, 'webauthn', specializedIdentifierData);
                });
        },
        [coreClient, auth]
    );

    const redirectToPasswordLoginView = useCallback(
        (data: LoginWithWebAuthnFormData) => {
            const username =
                'identifier' in data ? data.identifier : 'email' in data ? data.email : '';
            goTo<LoginWithPasswordViewState>('login-with-password', { username });
        },
        [goTo]
    );

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
            <LoginWithWebAuthnForm
                showLabels={showLabels}
                defaultIdentifier={defaultIdentifier}
                handler={handleWebAuthnLogin}
                onSuccess={res => onSuccess({ name: 'login', ...res })}
                onError={onError}
                SubmitComponent={({ disabled, onClick }) => (
                    <WebAuthnLoginViewButtons
                        disabled={disabled}
                        enablePasswordAuthentication={enablePasswordAuthentication}
                        onPasswordClick={() => onClick(redirectToPasswordLoginView)}
                    />
                )}
            />
            {allowAccountRecovery && (
                <Alternative>
                    <Link target="account-recovery">{i18n('accountRecovery.title')}</Link>
                </Alternative>
            )}
            {allowSignup && (
                <Alternative>
                    <span>{i18n('login.signupLinkPrefix')}</span>
                    &nbsp;
                    <Link target="signup">{i18n('login.signupLink')}</Link>
                </Alternative>
            )}
        </div>
    );
};

export default LoginWithWebAuthnView;
