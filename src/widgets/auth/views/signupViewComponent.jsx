import React from 'react';

import { snakeCaseProperties } from '../../../helpers/transformObjectProperties';
import { isValued } from '../../../helpers/utils';
import { isEqual } from 'lodash-es';
import uniq from 'lodash-es/uniq';

import { Heading, Link, Alternative, Separator, MarkdownContent } from '../../../components/miscComponent';
import SocialButtons from '../../../components/form/socialButtonsComponent';
import { createForm } from '../../../components/form/formComponent';
import { UserAggreementStyle } from '../../../components/form/formControlsComponent';
import { buildFormFields } from '../../../components/form/formFieldFactory';

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

export default class SignupView extends React.Component {
    state = {
        blacklist: []
    }

    handleSignup = data => this.props.apiClient.signup({
        data: snakeCaseProperties(data),
        auth: this.props.auth,
        redirectUrl: this.props && this.props.redirectUrl,
        returnToAfterEmailConfirmation: this.props && this.props.returnToAfterEmailConfirmation,
    });

    refreshBlacklist = data => {
        const email = data['email'] && data['email'].value || "";
        const givenName = data['given_name'] && data['given_name'].value || "";
        const lastName = data['family_name'] && data['family_name'].value || "";

        const blacklist = [
            email.split('@'),
            email,
            givenName.split(' '),
            lastName.split(' ')
        ]
            .flat(1)
            .map(str => str.trim().toLowerCase())
            .filter(function (word) { return isValued(word) });

        const distinct = uniq(blacklist);

        if (!isEqual(distinct, this.state.blacklist)) {
            this.setState({blacklist: distinct});
        }
    }

    render() {
        const {
            signupFields = defaultSignupFields,
            userAgreement,
            socialProviders,
            canShowPassword,
            beforeSignup = x => x,
            i18n,
            config,
            allowWebAuthnLogin
        } = this.props;

        const fields = buildFormFields(signupFields, { ...config, canShowPassword });

        const allFields = userAgreement
            ? [
                ...fields,
                { staticContent: <MarkdownContent key="user-aggreement" root={UserAggreementStyle} source={userAgreement} /> }
            ]
            : fields;

        const sharedProps = {
            blacklist: this.state.blacklist
        }

        return <div>
            <Heading>{i18n('signup.title')}</Heading>
            {socialProviders && socialProviders.length > 0 &&
                <SocialButtons providers={socialProviders} auth={this.props.auth} />}
            {socialProviders && socialProviders.length > 0 && <Separator text={i18n('or')} />}
            <SignupForm
                fields={allFields}
                showLabels={this.props.showLabels}
                beforeSubmit={beforeSignup}
                onFieldChange={this.refreshBlacklist}
                sharedProps={sharedProps}
                handler={this.handleSignup} />
            {this.props.allowLogin && <Alternative>
                <span>{i18n('signup.loginLinkPrefix')}</span>
                &nbsp;
                <Link target={allowWebAuthnLogin ? 'login-with-web-authn' : 'login'}>{i18n('signup.loginLink')}</Link>
            </Alternative>}
        </div>;
    }
}
