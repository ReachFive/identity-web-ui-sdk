import React from 'react';

import { UserError } from '../../helpers/errors';

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
        accessToken: this.props.accessToken,
        data,
        redirectUrl: this.props && this.props.redirectUrl
    });

    render() {
        return <ProfileEditorForm
            handler={this.handleSubmit}
            initialModel={this.props.profile}
            fields={this.props.resolvedFields}
            showLabels={this.props.showLabels}
            onSuccess={this.props.onSuccess}
            onError={this.props.onError}
        />;
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
            throw new UserError('Theses fields are not allowed: password, password_confirmation.');
        }

        const resolvedFields = buildFormFields(fields, config);

        return apiClient
            .getUser({
                accessToken,
                fields: computeFieldList(resolvedFields)
            })
            .then(profile => ({
                ...opts,
                profile,
                resolvedFields: resolvedFields.filter(field => {
                    return (field.path !== 'email' || !profile.email)
                        && (field.path !== 'phone_number' || !config.sms || !profile.phoneNumber)
                })
            }));
    }
});
