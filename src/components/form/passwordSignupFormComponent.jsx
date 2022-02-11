import React from 'react';

import { isEqual } from 'lodash-es';
import uniq from 'lodash-es/uniq';

import { createForm } from './formComponent';
import { buildFormFields } from './formFieldFactory';
import { UserAggreementStyle } from './formControlsComponent'

import { MarkdownContent } from '../miscComponent';
import { snakeCaseProperties } from '../../helpers/transformObjectProperties';
import { isValued } from '../../helpers/utils';
import ReCaptcha, {extractCaptchaTokenFromData, importGoogleRecaptchaScript} from '../reCaptcha';

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

export default class PasswordSignupForm extends React.Component {
    state = {
        blacklist: []
    }

    componentDidMount () {
        importGoogleRecaptchaScript(this.props.recaptcha_site_key)
    }

    callback = data => {
        const captchaToken = extractCaptchaTokenFromData(data)
        return this.props.apiClient.signup({
            captchaToken,
            data: snakeCaseProperties(data),
            auth: this.props.auth,
            redirectUrl: this.props && this.props.redirectUrl,
            returnToAfterEmailConfirmation: this.props && this.props.returnToAfterEmailConfirmation,
        })
    }

    refreshBlacklist = data => {
        const email = data['email'] && data['email'].value || '';
        const givenName = data['given_name'] && data['given_name'].value || '';
        const lastName = data['family_name'] && data['family_name'].value || '';

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
            beforeSignup = x => x,
            signupFields = defaultSignupFields,
            userAgreement,
            canShowPassword,
            config
        } = this.props;

        const fields = buildFormFields(signupFields, { ...config, canShowPassword, errorArchivedConsents: true });

        const allFields = userAgreement
            ? [
                ...fields,
                { staticContent: <MarkdownContent key="user-aggreement" root={UserAggreementStyle} source={userAgreement} /> }
            ]
            : fields;

        const sharedProps = {
            blacklist: this.state.blacklist
        }

        return <SignupForm
            fields={allFields}
            showLabels={this.props.showLabels}
            beforeSubmit={beforeSignup}
            onFieldChange={this.refreshBlacklist}
            sharedProps={sharedProps}
            handler={(data) => ReCaptcha.handle(data, this.props, this.callback, "signup")} />
    }
}
