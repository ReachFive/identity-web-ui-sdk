import React from 'react';

import intersection from 'lodash-es/intersection';

import { Heading, Intro, Separator } from '../../../components/miscComponent';
import SocialButtons from '../../../components/form/socialButtonsComponent';
import { LoginForm } from './loginViewComponent';

export default class ReauthView extends React.Component {
    handlePasswordLogin = ({ password }) => {
        this.props.apiClient.loginWithPassword({
            email: this.props.session.email,
            password,
            auth: this.props.auth
        });
    }

    render() {
        const {
            socialProviders,
            allowForgotPassword,
            auth,
            session = {},
            i18n
        } = this.props;

        const userSocialProviders = intersection(socialProviders, session.socialProviders);

        return <div>
            <Heading>{session.name}</Heading>
            <Intro>{i18n('confirmYourIdentity')}</Intro>
            {userSocialProviders && userSocialProviders.length > 0 && (
                <SocialButtons providers={userSocialProviders} auth={auth} />
            )}
            {userSocialProviders && userSocialProviders.length > 0 && session.hasPassword && (
                <Separator text={i18n('or')} />
            )}
            {session.hasPassword && (
                <LoginForm showRememberMe={false}
                    showForgotPassword={allowForgotPassword}
                    showEmail={false}
                    handler={this.handlePasswordLogin} />
            )}
        </div>;
    }
}
