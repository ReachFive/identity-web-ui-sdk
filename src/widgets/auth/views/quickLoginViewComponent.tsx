import React from 'react';
import type { AuthOptions } from '@reachfive/identity-core'

import { Heading, Intro, Link, Alternative } from '../../../components/miscComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';

import { useI18n } from '../../../contexts/i18n';

import { PropsWithSession  } from '../../../contexts/session'

export interface QuickLoginViewProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions
}

export const QuickLoginView = ({ auth, session }: PropsWithSession<QuickLoginViewProps>) => {
    const i18n = useI18n()

    // this component should never be display without session infos defined
    if (!session) return null;

    return (
        <div>
        <Heading>{session.name || session.email}</Heading>
        <Intro>{i18n('lastTimeYouLoggedInWith')}</Intro>
        <SocialButtons providers={session.lastLoginType ? [session.lastLoginType] : []} auth={auth} />
        <Alternative>
          <Link target={'login'}>{i18n('notYourAccount')}</Link>
        </Alternative>
    </div>
    )
}

export default QuickLoginView
