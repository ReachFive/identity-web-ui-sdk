import React from 'react';

import styled from 'styled-components';

import { Alternative, Heading, Link } from '../../../components/miscComponent';
import { withTheme } from '../../../components/widget/widgetContext';

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

export const LoginWithPasswordForm = createForm({
    prefix: 'r5-login-',
    fields({ username, showRememberMe, canShowPassword, showForgotPassword, i18n }) {
        return [
            simpleField({
                key: 'email',
                label: 'email',
                type: 'email',
                autoComplete: 'email',
                defaultValue: username,
                readOnly: true
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
                key: 'auth.persistent',
                label: 'rememberMe',
                defaultValue: false
            })
        ];
    },
    submitLabel: 'login.submitLabel'
});

export default class LoginView extends React.Component {
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
        const { i18n } = this.props

        return (
            <div>
                <Heading>{i18n('login.title')}</Heading>
                <LoginWithPasswordForm
                    username={this.props.username}
                    showLabels={this.props.showLabels}
                    showRememberMe={this.props.showRememberMe}
                    showForgotPassword={this.props.allowForgotPassword}
                    canShowPassword={this.props.canShowPassword}
                    handler={this.handleLogin} />
                <Alternative>
                    <Link target="login-with-web-authn">{i18n('login.password.userAnotherIdentifier')}</Link>
                </Alternative>
            </div>
        );
    }
}
