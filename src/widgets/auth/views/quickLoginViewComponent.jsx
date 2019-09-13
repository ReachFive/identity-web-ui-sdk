import React from 'react';

import { Heading, Intro, Link, Alternative } from '../../../components/miscComponent';
import SocialButtons from '../../../components/form/socialButtonsComponent';

export default class QuickLoginView extends React.Component {
    render() {
        const { auth, i18n, session = {} } = this.props;
        const { name, email, lastLoginType } = session;

        return <div>
            <Heading>{name || email}</Heading>
            <Intro>{i18n('lastTimeYouLoggedInWith')}</Intro>
            <SocialButtons providers={[lastLoginType]} auth={auth} />
            <Alternative>
                <Link target="login">{i18n('notYourAccount')}</Link>
            </Alternative>
        </div>;
    }
}
