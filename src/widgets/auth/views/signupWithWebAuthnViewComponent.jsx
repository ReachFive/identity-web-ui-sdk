import React from 'react';

import { createForm } from '../../../components/form/formComponent';
import { buildFormFields } from '../../../components/form/formFieldFactory';
import { simpleField } from '../../../components/form/fields/simpleField';
import { Heading, Link, MarkdownContent } from '../../../components/miscComponent';
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
            friendlyName: '',
            redirectUrl: this.props && this.props.redirectUrl
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
            .concat('device_friendly_name')

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
            <Heading>Signup with FIDO2</Heading>
            <SignupForm
                fields={allFields}
                showLabels={this.props.showLabels}
                beforeSubmit={beforeSignup}
                handler={this.handleSignup} />
            <Link target={'signup'}>Back</Link>
        </div>;
    }
}
