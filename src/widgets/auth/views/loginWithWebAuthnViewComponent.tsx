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

    // Un seul AbortController pour la requête conditionnelle (autofill), créé DANS l'effect
    // (donc neuf à chaque exécution) et exposé via un ref pour pouvoir l'annuler depuis les handlers.
    const conditionalAbort = React.useRef<AbortController | null>(null);
    // Référence vers la promesse de la requête conditionnelle, pour pouvoir ATTENDRE qu'elle
    // soit réellement réglée (donc que Chrome ait libéré le "slot" WebAuthn) avant d'en lancer une autre.
    const conditionalRequest = React.useRef<Promise<unknown> | null>(null);

    React.useEffect(() => {
        const controller = new AbortController();
        conditionalAbort.current = controller;

        conditionalRequest.current = coreClient
            .loginWithWebAuthn({
                conditionalMediation: 'preferred',
                auth: {
                    ...auth,
                },
                signal: controller.signal,
            })
            .catch(err => {
                // L'annulation (clic empreinte, navigation, démontage) n'est pas une vraie erreur.
                if (err?.name !== 'AbortError') onError(err);
            });

        // Annule l'autofill au démontage (ex: navigation vers signup) pour ne pas laisser
        // une requête WebAuthn pendante — c'est ce que Chrome refuse ("A request is already pending.").
        return () => controller.abort();
        // onError est volontairement exclu : c'est une callback recréée à chaque render qui,
        // dans les deps, relancerait l'effect en boucle et casserait l'autofill.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coreClient, auth]);

    const handleWebAuthnLogin = React.useCallback(
        async (data: LoginWithWebAuthnFormData) => {
            // Annule la requête conditionnelle (autofill)...
            conditionalAbort.current?.abort();
            // ... puis ATTEND qu'elle soit effectivement terminée. Sur un backend local, le POST
            // d'options de la requête modale répond plus vite que l'IPC d'annulation de Chrome :
            // sans cette attente, le get() modal part pendant que l'autofill est encore "pending"
            // côté process navigateur → "A request is already pending.". On synchronise donc le
            // lancement de la requête modale sur le règlement réel de la requête conditionnelle.
            await conditionalRequest.current?.catch(() => {});

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
