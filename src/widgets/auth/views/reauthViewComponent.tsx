import { AuthOptions } from '@reachfive/identity-core';
import React from 'react';

import { intersection } from '../../../helpers/utils';

import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import { Heading, Intro, Separator } from '../../../components/miscComponent';
import { LoginForm, type LoginFormData } from './loginViewComponent';

import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';

import { PropsWithSession } from '../../../contexts/session';

import type { OnError, OnSuccess } from '../../../types';

export interface ReauthViewProps {
    /**
     * Boolean that specifies if the forgot password option is enabled.
     *
     * If the `allowLogin` and `allowSignup` properties are set to `false`, the forgot password feature is enabled even if `allowForgotPassword` is set to `false`.
     *
     * @default true
     */
    allowForgotPassword?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
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
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export const ReauthView = ({
    allowForgotPassword = true,
    auth,
    session,
    showLabels = false,
    socialProviders,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: PropsWithSession<ReauthViewProps>) => {
    const coreClient = useReachfive();
    const i18n = useI18n();

    // this component should never be display without session infos defined
    if (!session) return null;

    const handlePasswordLogin = ({ password }: LoginFormData) =>
        coreClient.loginWithPassword({
            email: session.email ?? '' /** @todo email must be define */,
            password,
            auth: auth,
        });

    const userSocialProviders = intersection(socialProviders ?? [], session.socialProviders ?? []);

    return (
        <div>
            <Heading>{session.name}</Heading>
            <Intro>{i18n('confirmYourIdentity')}</Intro>
            {userSocialProviders && userSocialProviders.length > 0 && (
                <SocialButtons providers={userSocialProviders} auth={auth} />
            )}
            {userSocialProviders && userSocialProviders.length > 0 && session.hasPassword && (
                <Separator text={i18n('or')} />
            )}
            {session.hasPassword && (
                <LoginForm
                    showLabels={showLabels}
                    showRememberMe={false}
                    showForgotPassword={allowForgotPassword}
                    showEmail={false}
                    handler={handlePasswordLogin}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            )}
        </div>
    );
};

export default ReauthView;
