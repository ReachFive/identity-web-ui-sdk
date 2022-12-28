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
                const profileConsents = camelProfile.consents;
                const filteredProfileConsents = (profileConsents !== undefined && Object.keys(profileConsents).length) ? filterProfileConsents(fields, profileConsents) : undefined;
                const filteredOutConsentsProfile = { ...profile, consents: filteredProfileConsents };
                return ({
                    ...opts,
                    profile: filteredOutConsentsProfile,
                    resolvedFields: resolvedFields.filter(field => {
                        return (field.path !== 'email' || !filteredOutConsentsProfile.email)
                            && (field.path !== 'phone_number' || !config.sms || !filteredOutConsentsProfile.phoneNumber);
                    })
                })
            });
    }
});

// Filter out the profile consents with different version than the one the given consent field own
const filterProfileConsents = (fields, profileConsents) => {
    return Object.keys(profileConsents)
        .filter(profileConsentKey => {
            const consentField = fields.find(field => field.startsWith(`consents.${profileConsentKey}`));
            const consentFieldSplit = consentField.split('.v');
            const consentFieldVersion = consentFieldSplit[1];
            const profileConsentVersion = profileConsents[profileConsentKey].consentVersion.versionId;
            return !consentFieldVersion || parseInt(consentFieldVersion) === profileConsentVersion;
        })
        .reduce((filteredProfileConsents, consentKey) => {
            filteredProfileConsents[consentKey] = profileConsents[consentKey];
            return filteredProfileConsents;
        }, {});
}
