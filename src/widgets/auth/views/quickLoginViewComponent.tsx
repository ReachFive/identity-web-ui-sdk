import React from 'react';
import type { AuthOptions } from '@reachfive/identity-core'

import { Heading, Intro, Link, Alternative } from '../../../components/miscComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';

import { useI18n } from '../../../contexts/i18n';

import { PropsWithSession  } from '../../../contexts/session'
import { selectLogin } from '../authWidget.tsx';
import { InitialScreen } from '../../../../constants.ts';

export interface QuickLoginViewProps {
    initialScreen?: InitialScreen
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
}

export const  QuickLoginView = ({ initialScreen, allowWebAuthnLogin = false, auth, session }: PropsWithSession<QuickLoginViewProps>) => {
    const i18n = useI18n()

    // this component should never be display without session infos defined
    if (!session) return null;

    return (
        <div>
        <Heading>{session.name || session.email}</Heading>
        <Intro>{i18n('lastTimeYouLoggedInWith')}</Intro>
        <SocialButtons providers={session.lastLoginType ? [session.lastLoginType] : []} auth={auth} />
        <Alternative>
            <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>{i18n('notYourAccount')}</Link>
        </Alternative>
    </div>
    )
}

export default QuickLoginView
