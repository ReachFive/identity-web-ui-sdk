import React from 'react';

import styled from 'styled-components';

import { Alternative, Heading, Link } from '../../../components/miscComponent';
import { withTheme } from '../../../components/widget/widgetContext';

import { createForm } from '../../../components/form/formComponent';
import { simplePasswordField } from '../../../components/form/fields/simplePasswordField';
import checkboxField from '../../../components/form/fields/checkboxField';
import identifierField from "../../../components/form/fields/identifierField";
import {specializeIdentifierData} from "../../../helpers/utils";
import ReCaptcha, {importGoogleRecaptchaScript} from '../../../components/reCaptcha';

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
    fields({ username, showRememberMe, canShowPassword, showForgotPassword, i18n, config }) {
        return [
            (config.sms) ?
                identifierField({
                    key: 'identifier',
                    defaultValue: username,
                    withPhoneNumber: true,
                    readOnly: true,
                }, config)
                :
                identifierField({
                    key: 'identifier',
                    defaultValue: username,
                    withPhoneNumber: false,
                    readOnly: true
                }, config),
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
    componentDidMount () {
        importGoogleRecaptchaScript(this.props.recaptcha_site_key)
    }

    callback = data => {
        const specializedData = specializeIdentifierData(data);
        return this.props.apiClient.loginWithPassword({
            ...specializedData,
            captchaToken: data.captchaToken,
            auth: {
                ...specializedData.auth,
                ...this.props.auth,
            },
        })
            .then(res => res?.stepUpToken ? this.props.goTo('fa-selection', {token: res.stepUpToken, amr: res.amr}) : res)
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
                    handler={(data) => ReCaptcha.handle(data, this.props, this.callback, "login")}
                    config={this.props.config}
                />
                <Alternative>
                    <Link target="login-with-web-authn">{i18n('login.password.userAnotherIdentifier')}</Link>
                </Alternative>
            </div>
        );
    }
}
