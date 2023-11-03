import React from 'react';

import compact from 'lodash-es/compact';

import { Validator } from '../../core/validation';

import { createWidget } from '../../components/widget/widget';
import { createForm } from '../../components/form/formComponent';
import passwordField from '../../components/form/fields/passwordField'
import simplePasswordField from '../../components/form/fields/simplePasswordField';

import { useReachfive } from '../../contexts/reachfive';

export type PasswordEditorFormData = {
    old_password: string,
    password: string,
    password_confirmation: string
}

interface PasswordEditorFormProps {
    /**
     * Ask for the old password before entering a new one.
     * @default false
     */
    promptOldPassword?: boolean
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean
}

export const PasswordEditorForm = createForm<PasswordEditorFormData, PasswordEditorFormProps>({
    prefix: 'r5-password-editor-',
    fields({ promptOldPassword = false, canShowPassword = false, config }) {
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
                    rule: (value: string, ctx: { fields: { password: { value: string } } }) => value === ctx.fields.password.value,
                    hint: 'passwordMatch'
                })
            })
        ]);
    },
    resetAfterSuccess: true,
    resetAfterError: true
});

export interface PasswordEditorProps extends PasswordEditorFormProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken?: string
    /**
     * @toto missing description
     */
    authentication?: Authentication
    /**
     * @toto missing description
     */
    userId?: string
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean
    /**
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void
}

const PasswordEditor = ({
    authentication,
    canShowPassword = false,
    promptOldPassword = false,
    showLabels = false,
    onSuccess = () => { },
    onError = () => { }
}: PasswordEditorProps) => {
    const coreClient = useReachfive()

    const handleSubmit = (data: PasswordEditorFormData) => {
        const { password_confirmation: _, password, old_password: oldPassword } = data
        return coreClient.updatePassword({
            password,
            oldPassword,
            ...authentication,
        });
    };

    return (
        <PasswordEditorForm
            handler={handleSubmit}
            supportMultipleSubmits={promptOldPassword}
            promptOldPassword={promptOldPassword}
            canShowPassword={canShowPassword}
            showLabels={showLabels}
            onSuccess={onSuccess}
            onError={onError}
        />
    )
}

type Authentication = { accessToken: string } | { userId: string }

const resolveAuthentication = (accessToken?: string, userId?: string): { authentication?: Authentication } => {
    if (accessToken) {
        return { authentication: { accessToken } };
    } else if (userId) {
        return { authentication: { userId } };
    } else {
        return {};
    }
};

export type PasswordEditorWidgetProps = Omit<PasswordEditorProps, 'autauthenticationhen'>

export default createWidget<PasswordEditorWidgetProps, PasswordEditorProps>({
    component: PasswordEditor,
    prepare: (options) => ({
        ...options,
        ...resolveAuthentication(options.accessToken, options.userId)
    })
});
