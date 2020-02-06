import React from 'react';
import styled from 'styled-components';

import { snakeCaseProperties } from '../../../helpers/transformObjectProperties';

import { Heading, Link, Alternative, Separator, MarkdownContent } from '../../../components/miscComponent';
import SocialButtons from '../../../components/form/socialButtonsComponent';
import { createForm } from '../../../components/form/formComponent';
import { buildFormFields } from '../../../components/form/formFieldFactory';
import { withTheme } from '../../../components/widget/widgetContext';

const defaultSignupFields = [
    'given_name',
    'family_name',
    'email',
    'password',
    'password_confirmation'
];

const SignupForm = createForm({
    prefix: 'r5-signup-',
    submitLabel: 'signup.submitLabel'
});

const UserAggreementStyle = withTheme(styled.div`
    font-size: ${props => props.theme.get('fontSize') * 0.8}px;
    color: ${props => props.theme.get('mutedTextColor')};
    text-align: center;
    margin-bottom: ${props => props.theme.get('spacing')}px;

    p {
        margin: 0;
    }

    a {
        color: ${props => props.theme.get('mutedTextColor')};
        text-decoration: underline;
    }

    a:hover {
        color: ${props => props.theme.get('mutedTextColor')};
    }
`);

export default class SignupView extends React.Component {
    handleSignup = data => this.props.apiClient.signup({
        data: snakeCaseProperties(data),
        auth: this.props.auth,
        redirectUrl: this.props && this.props.redirectUrl,
        returnToAfterEmailConfirmation: this.props && this.props.returnToAfterEmailConfirmation,
    });

    render() {
        const {
            signupFields = defaultSignupFields,
            userAgreement,
            socialProviders,
            canShowPassword,
            beforeSignup = x => x,
            i18n,
            config,
        } = this.props;

        const fields = buildFormFields(signupFields, { ...config, canShowPassword });

        const allFields = userAgreement
            ? [
                ...fields,
                { staticContent: <MarkdownContent key="user-aggreement" root={UserAggreementStyle} source={userAgreement} /> }
            ]
            : fields;

        return <div>
            <Heading>{i18n('signup.title')}</Heading>
            {socialProviders && socialProviders.length > 0 &&
                <SocialButtons providers={socialProviders} auth={this.props.auth} />}
            {socialProviders && socialProviders.length > 0 && <Separator text={i18n('or')} />}
            <SignupForm
                fields={allFields}
                showLabels={this.props.showLabels}
                beforeSubmit={beforeSignup}
                handler={this.handleSignup} />
            {this.props.allowLogin && <Alternative>
                <span>{i18n('signup.loginLinkPrefix')}</span>
                &nbsp;
                <Link target="login">{i18n('signup.loginLink')}</Link>
            </Alternative>}
        </div>;
    }
}
