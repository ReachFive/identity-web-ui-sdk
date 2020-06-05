import React from 'react';

import { Heading, Intro, Link, Alternative } from '../../../components/miscComponent';
import SocialButtons from '../../../components/form/socialButtonsComponent';

export default class QuickLoginView extends React.Component {
    render() {
        const { i18n, session = {}, webAuthn } = this.props;

        return <div>
            <Heading>{session.name || session.email}</Heading>
            <Intro>{i18n('lastTimeYouLoggedInWith')}</Intro>
            <SocialButtons providers={[session.lastLoginType]} auth={this.props.auth} />
            <Alternative>
                <Link target={webAuthn ? 'login-with-web-authn' : 'login'}>{i18n('notYourAccount')}</Link>
            </Alternative>
        </div>;
    }
}
