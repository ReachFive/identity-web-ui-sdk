import React from 'react';

import { UserError } from '../../helpers/errors';
import { snakeCaseProperties, camelCaseProperties } from '../../helpers/transformObjectProperties';

import { createWidget } from '../../components/widget/widget';
import { createForm } from '../../components/form/formComponent';
import { buildFormFields, computeFieldList } from '../../components/form/formFieldFactory';

const ProfileEditorForm = createForm({
    prefix: 'r5-profile-editor-',
    supportMultipleSubmits: true,
    submitLabel: 'save'
});

class ProfileEditor extends React.Component {
    static defaultProps = {
        onSuccess: () => { },
        onError: () => { }
    };

    handleSubmit = data => this.props.apiClient.updateProfile({
        data: snakeCaseProperties(data),
        accessToken: this.props.accessToken,
        redirectUrl: this.props && this.props.redirectUrl
    });

    render() {
        return <ProfileEditorForm
            handler={this.handleSubmit}
            initialModel={this.props.profile}
            fields={this.props.resolvedFields}
            showLabels={this.props.showLabels}
            onSuccess={this.props.onSuccess}
            onError={this.props.onError} />;
    }
}

export default createWidget({
    component: ProfileEditor,
    prepare: (options, { apiClient, config }) => {
        const opts = {
            showLabels: true,
            fields: [],
            ...options
        };
        const { accessToken, fields = [] } = opts;

        const haveNotAllowedFields = fields.some(field => {
            const fieldName = field.key || field;

            return fieldName === 'password' || fieldName === 'password_confirmation'
        });

        if (haveNotAllowedFields) {
            throw new UserError('These fields are not allowed: password, password_confirmation.');
        }

        // This step removes the version from the consents
        const resolvedFields = buildFormFields(fields, { ...config, errorArchivedConsents: false });

        return apiClient
            .getUser({
                accessToken,
                fields: computeFieldList(resolvedFields)
            })
            .then(profile => {
                const camelProfile = camelCaseProperties(profile);
                return ({
                ...opts,
                profile: camelProfile,
                resolvedFields: resolvedFields.filter(field => {
                    return (field.path !== 'email' || !profile.email)
                        && (field.path !== 'phone_number' || !config.sms || !profile.phoneNumber)
                        && (field.path.startsWith('consents') && checkConsentVersion(field.path, fields, camelProfile.consents))
                })
            })});
    }
});

// Filter out the resolved consent fileds with different version than the one the profile owns
const checkConsentVersion = (path, fields, profileConsents) => {
    const fieldConsent = fields.find(f => f.startsWith(path));
    const fieldConsentSplit = fieldConsent.split('.v');
    const fieldConsentKey = fieldConsentSplit[0].split('.')[1];
    const fieldConsentVersion = fieldConsentSplit[1];
    const profileConsentVersion = profileConsents[fieldConsentKey].consentVersion.versionId;
    return fieldConsentVersion === undefined || parseInt(fieldConsentVersion) === profileConsentVersion;
}
