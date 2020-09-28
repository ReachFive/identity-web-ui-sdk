import React from 'react';

import { email } from '../../../core/validation';
import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';

import SocialButtons from '../../../components/form/socialButtonsComponent';
import { WebAuthnLoginViewButtons } from './../../../components/form/webAuthAndPasswordButtonsComponent';
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
    allowWebAuthnLogin: true
});

export default class LoginWithWebAuthnView extends React.Component {
    handleWebAuthnLogin = data => {
        return this.props.apiClient.loginWithWebAuthn({
            ...data,
            auth: {
                ...data.auth,
                ...this.props.auth,
            }
        });
    }

    redirectToPasswordLoginView = data => {
        this.props.goTo('login-with-password', { username: data.email })
    }

    render() {
        const { socialProviders, session = {}, i18n } = this.props;

        const defaultEmail = session.lastLoginType === 'password' ? session.email : null;

        const webAuthnButtons = (disabled, handleClick) => <WebAuthnLoginViewButtons
            disabled={disabled}
            i18n={i18n}
            onPasswordClick={handleClick} />

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
                    handler={this.handleWebAuthnLogin}
                    redirect={this.redirectToPasswordLoginView}
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
