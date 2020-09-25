import React from 'react';


import { createForm } from './formComponent';
import { buildFormFields } from './formFieldFactory';

import { snakeCaseProperties } from '../../helpers/transformObjectProperties';
import { MarkdownContent } from '../../components/miscComponent';

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

export default function MultiSignupForm(props) {
    const {
        beforeSignup = x => x,
        signupFields = defaultSignupFields,
        userAgreement,
        canShowPassword,
        i18n,
        config
    } = props;

    const fields = buildFormFields(signupFields, { ...config, canShowPassword });

    const allFields = userAgreement
    ? [
        ...fields,
        { staticContent: <MarkdownContent key="user-aggreement" root={UserAggreementStyle} source={userAgreement} /> }
    ]
    : fields;

    const handleSignup = data => props.apiClient.signup({
        data: snakeCaseProperties(data),
        auth: props.auth,
        redirectUrl: props && props.redirectUrl,
        returnToAfterEmailConfirmation: props && props.returnToAfterEmailConfirmation,
    });

    return <SignupForm
        fields={allFields}
        showLabels={props.showLabels}
        beforeSubmit={beforeSignup}
        handler={handleSignup} />
}
