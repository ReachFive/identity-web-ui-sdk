import React from 'react';

import styled from 'styled-components';

import { Heading, Link } from '../../../components/miscComponent';
import { withTheme } from '../../../components/widget/widgetContext';

import { createForm } from '../../../components/form/formComponent';
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
    fields({ showRememberMe, canShowPassword, showForgotPassword, i18n }) {
        return [
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
        return (
            <div>
                <Heading>{this.props.i18n('login.title')}</Heading>
                <LoginWithPasswordForm
                    showLabels={this.props.showLabels}
                    showRememberMe={this.props.showRememberMe}
                    showForgotPassword={this.props.allowForgotPassword}
                    canShowPassword={this.props.canShowPassword}
                    handler={this.handleLogin} />
            </div>
        );
    }
}
