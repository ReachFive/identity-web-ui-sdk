import React from 'react';

import omit from 'lodash-es/omit';
import compact from 'lodash-es/compact';
import compose from 'recompose/compose';

import { Validator } from '../../core/validation';

import { createWidget } from '../../components/widget/widget';
import { createForm } from '../../components/form/formComponent';
import { passwordField } from '../../components/form/fields/passwordField'
import { simplePasswordField } from '../../components/form/fields/simplePasswordField';
import { withConfig, withI18n } from '../../components/widget/widgetContext'

export const PasswordEditorForm = compose(withI18n, withConfig)(createForm({
    prefix: 'r5-password-editor-',
    fields({ promptOldPassword, canShowPassword, config }) {
        return compact([
            promptOldPassword && simplePasswordField({
                key: 'old_password',
                label: 'oldPassword'
            }),
            passwordField({
                label: 'newPassword',
                autoComplete: 'new-password',
                canShowPassword
            }, config),
            simplePasswordField({
                key: 'password_confirmation',
                label: 'passwordConfirmation',
                autoComplete: 'new-password',
                validator: new Validator({
                    rule: (value, ctx) => value === ctx.fields.password.value,
                    hint: 'passwordMatch'
                })
            })
        ]);
    },
    resetAfterSuccess: true,
    resetAfterError: true
}));

class PasswordEditor extends React.Component {
    static defaultProps = {
        onSuccess: () => { },
        onError: () => { }
    };

    handleSubmit = data => {
        return this.props.apiClient.updatePassword({
            ...omit(data, ['passwordConfirmation']),
            ...this.props.authentication
        });
    };

    render() {
        const {
            promptOldPassword,
            showLabels,
            onSuccess,
            onError,
            canShowPassword,
        } = this.props;

        return <PasswordEditorForm
            handler={this.handleSubmit}
            supportMultipleSubmits={promptOldPassword}
            promptOldPassword={promptOldPassword}
            canShowPassword={canShowPassword}
            showLabels={showLabels}
            onSuccess={onSuccess}
            onError={onError} />
    }
}

const resolveAuthentication = (accessToken, userId) => {
    if (accessToken) {
        return { authentication: { accessToken } };
    } else if (userId) {
        return { authentication: { userId } };
    } else {
        return {};
    }
};

export default createWidget({
    component: PasswordEditor,
    prepare: options => ({
        promptOldPassword: false,
        ...options,
        ...resolveAuthentication(options.accessToken, options.userId)
    })
});
