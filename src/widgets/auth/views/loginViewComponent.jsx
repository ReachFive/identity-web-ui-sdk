import React from 'react';

import styled from 'styled-components';
import pick from 'lodash-es/pick';

import { email } from '../../../core/validation';
import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';
import { withTheme } from '../../../components/widget/widgetContext';

import SocialButtons from '../../../components/form/socialButtonsComponent';
import { createForm } from '../../../components/form/formComponent';
import { simpleField } from '../../../components/form/fields/simpleField';
import { simplePasswordField } from '../../../components/form/fields/simplePasswordField';
import checkboxField from '../../../components/form/fields/checkboxField';

const ForgotPasswordWrapper = withTheme(styled.div`
    margin-bottom: ${props => props.theme.get('spacing')}px;
    text-align: right;
    ${props => props.floating && `
        position: absolute;
        right: 0;
    `};
`);

export const LoginForm = createForm({
    prefix: 'r5-login-',
    fields({ showEmail = true, showRememberMe, canShowPassword, showForgotPassword, defaultEmail, i18n }) {
        return [
            showEmail && simpleField({
                key: 'email',
                label: 'email',
                type: 'email',
                autoComplete: 'email',
                defaultValue: defaultEmail,
                validator: email
            }),
            simplePasswordField({
                key: 'password',
                label: 'password',
                autoComplete: 'current-password',
                canShowPassword
            }),
            showForgotPassword && {
                staticContent: (
                    <ForgotPasswordWrapper key="forgot-password" floating={showRememberMe}>
                        <Link target="forgot-password">{i18n('login.forgotPasswordLink')}</Link>
                    </ForgotPasswordWrapper>
                )
            },
            showRememberMe && checkboxField({
                key: 'persistent',
                label: 'rememberMe',
                defaultValue: true
            })
        ];
    },
    submitLabel: 'login.submitLabel'
});

export default class LoginView extends React.Component {
    handleLogin = data => this.props.apiClient.loginWithPassword({
        ...data,
        ...pick(this.props, 'auth')
    });

    render() {
        const {
            socialProviders,
            allowSignup,
            allowForgotPassword,
            showRememberMe,
            auth,
            acceptTos,
            session = {},
            i18n,
            canShowPassword
        } = this.props;

        const defaultEmail = session.lastLoginType === 'password' ? session.email : null;

        return (
            <div>
                <Heading>{i18n('login.title')}</Heading>
                {socialProviders && socialProviders.length > 0 &&
                    <SocialButtons providers={socialProviders} auth={auth} acceptTos={acceptTos} />
                }
                {socialProviders && socialProviders.length > 0 &&
                    <Separator text={i18n('or')} />
                }
                <LoginForm
                    showRememberMe={showRememberMe}
                    showForgotPassword={allowForgotPassword}
                    canShowPassword={canShowPassword}
                    defaultEmail={defaultEmail}
                    handler={this.handleLogin} />
                {allowSignup &&
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
