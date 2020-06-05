import React from 'react';

import { email } from '../../../core/validation';
import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';

import SocialButtons from '../../../components/form/socialButtonsComponent';
import { WebAuthnViewPrimaryButtons } from './../../../components/form/webAuthButtonsComponent';
import { createForm } from '../../../components/form/formComponent';
import { simpleField } from '../../../components/form/fields/simpleField';


export const LoginWithWebAuthnForm = createForm({
    prefix: 'r5-login-',
    fields({ showEmail = true, defaultEmail }) {
        return [
            showEmail && simpleField({
                key: 'email',
                label: 'email',
                type: 'email',
                autoComplete: 'email',
                defaultValue: defaultEmail,
                validator: email
            })
        ];
    },
    webAuthn: true
});

export default class LoginWithWebAuthnView extends React.Component {
    handleLogin = data => {
        return this.props.apiClient.loginWithPassword({
            ...data,
            auth: {
                ...data.auth,
                ...this.props.auth,
            },
        });
    }

    render() {
        const { socialProviders, session = {}, i18n } = this.props;

        const defaultEmail = session.lastLoginType === 'password' ? session.email : null;

        const webAuthnButtons = disabled => <WebAuthnViewPrimaryButtons
            disabled={disabled}
            i18n={i18n}
            onPasswordIconClick={() => this.props.goTo('login')} />

        return (
            <div>
                <Heading>{i18n('login.title')}</Heading>
                {socialProviders && socialProviders.length > 0 &&
                    <SocialButtons providers={socialProviders} auth={this.props.auth} acceptTos={this.props.acceptTos} />
                }
                {socialProviders && socialProviders.length > 0 &&
                    <Separator text={i18n('or')} />
                }
                <LoginWithWebAuthnForm
                    showLabels={this.props.showLabels}
                    defaultEmail={defaultEmail}
                    handler={this.handleLogin}
                    webAuthnButtons={webAuthnButtons} />
                {this.props.allowSignup &&
                    <Alternative>
                        <span>{i18n('login.signupLinkPrefix')}</span>
                        &nbsp;
                        <Link target="signup">{i18n('login.signupLink')}</Link>
                    </Alternative>
                }
            </div>
        );
    }
}
