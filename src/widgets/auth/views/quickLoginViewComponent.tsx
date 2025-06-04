import type { AuthOptions } from '@reachfive/identity-core';
import React from 'react';

import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import { Alternative, Heading, Intro, Link } from '../../../components/miscComponent';

import { useI18n } from '../../../contexts/i18n';

import { InitialScreen } from '../../../../constants.ts';
import { PropsWithSession } from '../../../contexts/session';
import { selectLogin } from '../authWidget.tsx';

import type { OnError, OnSuccess } from '../../../types';

export interface QuickLoginViewProps {
    initialScreen?: InitialScreen;
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
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export const QuickLoginView = ({
    initialScreen,
    allowWebAuthnLogin = false,
    auth,
    session,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: PropsWithSession<QuickLoginViewProps>) => {
    const i18n = useI18n();

    // this component should never be display without session infos defined
    if (!session) return null;

    return (
        <div>
            <Heading>{session.name ?? session.email}</Heading>
            <Intro>{i18n('lastTimeYouLoggedInWith')}</Intro>
            <SocialButtons
                providers={session.lastLoginType ? [session.lastLoginType] : []}
                auth={auth}
                onSuccess={onSuccess}
                onError={onError}
            />
            <Alternative>
                <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>
                    {i18n('notYourAccount')}
                </Link>
            </Alternative>
        </div>
    );
};

export default QuickLoginView;
