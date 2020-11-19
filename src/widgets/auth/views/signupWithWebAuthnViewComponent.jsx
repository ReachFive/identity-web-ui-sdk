import React from 'react';

import { UserAggreementStyle } from '../../../components/form/formControlsComponent'
import { createForm } from '../../../components/form/formComponent';
import { buildFormFields } from '../../../components/form/formFieldFactory';
import { Alternative, Heading, Link, MarkdownContent } from '../../../components/miscComponent';
import { snakeCaseProperties } from '../../../helpers/transformObjectProperties';

const defaultSignupFields = [
    'given_name',
    'family_name',
    'email'
];

const SignupForm = createForm({
    prefix: 'r5-webauthn-signup-',
    submitLabel: 'signup.submitLabel'
});

export default class SignupWithWebAuthnView extends React.Component {
    handleSignup = data => this.props.apiClient.signupWithWebAuthn(
        {
            profile: snakeCaseProperties(data),
            friendlyName: data.friendlyName,
            redirectUrl: this.props && this.props.redirectUrl,
            returnToAfterEmailConfirmation: this.props && this.props.returnToAfterEmailConfirmation
        },
        this.props.auth
    );

    render() {
        const {
            beforeSignup = x => x,
            signupFields = defaultSignupFields,
            userAgreement
        } = this.props;

        const webAuthnSignupFields = signupFields
            .filter(field => field !== 'password' && field !== 'password_confirmation')
            .concat('friendly_name')

        const fields = buildFormFields(webAuthnSignupFields, this.props.config);

        const allFields = userAgreement
        ? [
            ...fields,
            {
                staticContent: <MarkdownContent key="user-aggreement" root={UserAggreementStyle} source={userAgreement} />
            }
        ]
        : fields;


        return <div>
            <Heading>{this.props.i18n('signup.withBiometrics')}</Heading>
            <SignupForm
                fields={allFields}
                showLabels={this.props.showLabels}
                beforeSubmit={beforeSignup}
                handler={this.handleSignup} />
            <Alternative>
                <Link target={'signup'}>{this.props.i18n('back')}</Link>
            </Alternative>
        </div>;
    }
}
