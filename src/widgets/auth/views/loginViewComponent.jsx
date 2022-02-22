import React from 'react';

import styled from 'styled-components';

import { email } from '../../../core/validation';
import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';
import { withTheme } from '../../../components/widget/widgetContext';

import SocialButtons from '../../../components/form/socialButtonsComponent';
import { createForm } from '../../../components/form/formComponent';
import { simpleField } from '../../../components/form/fields/simpleField';
import { simplePasswordField } from '../../../components/form/fields/simplePasswordField';
import checkboxField from '../../../components/form/fields/checkboxField';
import identifierField from "../../../components/form/fields/identifierField";
import {specializeIdentifierData} from "../../../helpers/utils";
import ReCaptcha, {importGoogleRecaptchaScript} from '../../../components/reCaptcha'

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
    fields({ showIdentifier = true, showRememberMe, canShowPassword, showForgotPassword, defaultIdentifier, i18n, config }) {
        return [
            showIdentifier && (config.sms) ?
                identifierField({
                    defaultValue: defaultIdentifier,
                }, config)
                :
                simpleField({
                    key: 'email',
                    label: 'email',
                    type: 'email',
                    autoComplete: 'email',
                    defaultValue: defaultIdentifier,
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
    }

    render() {
        const { socialProviders, session = {}, i18n } = this.props;

        const defaultIdentifier = session.lastLoginType === 'password' ? session.email : null;

        return (
            <div>
                <Heading>{i18n('login.title')}</Heading>
                {socialProviders && socialProviders.length > 0 &&
                    <SocialButtons providers={socialProviders} auth={this.props.auth} acceptTos={this.props.acceptTos} />
                }
                {socialProviders && socialProviders.length > 0 &&
                    <Separator text={i18n('or')} />
                }
                <LoginForm
                    showLabels={this.props.showLabels}
                    showRememberMe={this.props.showRememberMe}
                    showForgotPassword={this.props.allowForgotPassword}
                    canShowPassword={this.props.canShowPassword}
                    defaultIdentifier={defaultIdentifier}
                    handler={(data) => ReCaptcha.handle(data, this.props, this.callback, "login")}
                    config={this.props.config}
                />
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
