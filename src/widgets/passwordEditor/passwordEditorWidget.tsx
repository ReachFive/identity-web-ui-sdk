import React from 'react';

import { Validator } from '../../core/validation';

import passwordField from '../../components/form/fields/passwordField';
import simplePasswordField from '../../components/form/fields/simplePasswordField';
import { createForm, FormContext } from '../../components/form/formComponent';
import { createWidget } from '../../components/widget/widget';

import { useReachfive } from '../../contexts/reachfive';

import type { OnError, OnSuccess } from '../../types';

export type PasswordEditorFormData = {
    password: string;
    passwordConfirmation: string;
    oldPassword: string;
};

interface PasswordEditorFormProps {
    /**
     * Ask for the old password before entering a new one.
     * @default false
     */
    promptOldPassword?: boolean;
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
}

export const PasswordEditorForm = createForm<PasswordEditorFormData, PasswordEditorFormProps>({
    prefix: 'r5-password-editor-',
    fields({ promptOldPassword = false, canShowPassword = false, config }) {
        return [
            ...(promptOldPassword
                ? [
                      simplePasswordField({
                          key: 'old_password',
                          label: 'oldPassword',
                      }),
                  ]
                : []),
            passwordField(
                {
                    label: 'newPassword',
                    autoComplete: 'new-password',
                    canShowPassword,
                },
                config
            ),
            simplePasswordField({
                key: 'password_confirmation',
                label: 'passwordConfirmation',
                autoComplete: 'new-password',
                validator: new Validator<string, FormContext<PasswordEditorFormData>>({
                    rule: (value, ctx) => {
                        return value === ctx.fields.password;
                    },
                    hint: 'passwordMatch',
                }),
            }),
        ];
    },
    resetAfterSuccess: true,
    resetAfterError: true,
});

export interface PasswordEditorProps extends PasswordEditorFormProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken?: string;
    /**
     * @toto missing description
     */
    authentication?: Authentication;
    /**
     * @toto missing description
     */
    userId?: string;
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

const PasswordEditor = ({
    authentication,
    canShowPassword = false,
    promptOldPassword = false,
    showLabels = false,
    onSuccess = () => {},
    onError = () => {},
}: PasswordEditorProps) => {
    const coreClient = useReachfive();

    const handleSubmit = ({ password, oldPassword }: PasswordEditorFormData) => {
        return coreClient.updatePassword({
            password,
            ...(promptOldPassword ? { oldPassword } : {}),
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
            onSuccess={() => onSuccess({ name: 'password_changed' })}
            onError={onError}
        />
    );
};

type Authentication = { accessToken: string } | { userId: string };

const resolveAuthentication = (
    accessToken?: string,
    userId?: string
): { authentication?: Authentication } => {
    if (accessToken) {
        return { authentication: { accessToken } };
    } else if (userId) {
        return { authentication: { userId } };
    } else {
        return {};
    }
};

export type PasswordEditorWidgetProps = Omit<PasswordEditorProps, 'authentication'>;

export default createWidget<PasswordEditorWidgetProps, PasswordEditorProps>({
    component: PasswordEditor,
    prepare: options => ({
        ...options,
        ...resolveAuthentication(options.accessToken, options.userId),
    }),
});
