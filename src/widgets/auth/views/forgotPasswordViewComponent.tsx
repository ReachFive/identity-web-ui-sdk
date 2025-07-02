import React, { useCallback, useLayoutEffect } from 'react';

import { isAppError } from '../../../helpers/errors';

import { Alternative, Heading, Info, Intro, Link } from '../../../components/miscComponent';
import { email } from '../../../core/validation';

import phoneNumberField, {
    type PhoneNumberOptions,
} from '../../../components/form/fields/phoneNumberField';
import { simpleField } from '../../../components/form/fields/simpleField';
import { createForm, FormContext } from '../../../components/form/formComponent';
import ReCaptcha, { importGoogleRecaptchaScript } from '../../../components/reCaptcha';

import { InitialScreen } from '../../../../constants.ts';
import { DefaultButton } from '../../../components/form/buttonComponent.tsx';
import passwordField from '../../../components/form/fields/passwordField.tsx';
import simplePasswordField from '../../../components/form/fields/simplePasswordField';
import { useConfig } from '../../../contexts/config.tsx';
import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';
import { Validator } from '../../../core/validation.ts';
import { selectLogin } from '../authWidget.tsx';

import type { OnError, OnSuccess } from '../../../types';

type EmailIdentifier = { email: string };
type PhoneNumberIdentifier = { phoneNumber: string };

type ForgotPasswordEmailFormData = EmailIdentifier;
type ForgotPasswordPhoneNumberFormData = PhoneNumberIdentifier;

const ForgotPasswordEmailForm = createForm<ForgotPasswordEmailFormData>({
    prefix: 'r5-forgot-password-',
    fields() {
        return [
            simpleField({
                key: 'email',
                label: 'email',
                required: true,
                type: 'email',
                validator: email,
            }),
        ];
    },
    submitLabel: 'forgotPassword.submitLabel',
});

const ForgotPasswordPhoneNumberForm = createForm<
    ForgotPasswordPhoneNumberFormData,
    { phoneNumberOptions?: PhoneNumberOptions }
>({
    prefix: 'r5-forgot-password-',
    fields({ config, phoneNumberOptions }) {
        return [
            phoneNumberField(
                {
                    key: 'phoneNumber',
                    label: 'phoneNumber',
                    required: true,
                    withCountryCallingCode: false,
                    ...phoneNumberOptions,
                },
                config
            ),
        ];
    },
    submitLabel: 'forgotPassword.submitLabel.code',
});

export type VerificationCodeFormData = {
    password: string;
    passwordConfirmation: string;
    verificationCode: string;
};

interface VerificationCodeFormProps {
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
}

const VerificationCodeForm = createForm<VerificationCodeFormData, VerificationCodeFormProps>({
    prefix: 'r5-verification-code-',
    fields({ canShowPassword = false, config }) {
        return [
            simpleField({
                key: 'verification_code',
                label: 'verificationCode',
                type: 'text',
            }),
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
                validator: new Validator<string, FormContext<VerificationCodeFormData>>({
                    rule: (value, ctx) => value === ctx.fields.password,
                    hint: 'passwordMatch',
                }),
            }),
        ];
    },
});

const skipError = (error: unknown) =>
    isAppError(error) ? error.error === 'resource_not_found' : false;

export interface ForgotPasswordViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean;
    /**
     * Boolean that specifies whether password reset with phone number is enabled.
     *
     * @default false
     */
    allowPhoneNumberResetPassword?: boolean;
    /**
     * Whether or not to display a safe error message on password reset, given an invalid email address.
     * This mode ensures not to leak email addresses registered to the platform.
     *
     * @default false
     */
    displaySafeErrorMessage?: boolean;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;

    initialScreen?: InitialScreen;
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used to redirect users to a specific URL after a password reset.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterPasswordReset?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export const ForgotPasswordView = ({
    allowLogin = true,
    allowPhoneNumberResetPassword = false,
    displaySafeErrorMessage = false,
    showLabels = false,
    allowWebAuthnLogin = false,
    initialScreen,
    recaptcha_enabled = false,
    recaptcha_site_key,
    redirectUrl,
    returnToAfterPasswordReset,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: ForgotPasswordViewProps) => {
    const coreClient = useReachfive();
    const config = useConfig();
    const { goTo } = useRouting();
    const i18n = useI18n();

    const callback = useCallback(
        (data: ForgotPasswordEmailFormData) => {
            return ReCaptcha.handle(
                { ...data, redirectUrl, returnToAfterPasswordReset },
                { recaptcha_enabled, recaptcha_site_key },
                coreClient.requestPasswordReset,
                'forgot_password'
            );
        },
        [coreClient, recaptcha_enabled, recaptcha_site_key, redirectUrl, returnToAfterPasswordReset]
    );

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    return (
        <div>
            <Heading>{i18n('forgotPassword.title')}</Heading>
            <Intro>{i18n('forgotPassword.prompt')}</Intro>
            <ForgotPasswordEmailForm
                showLabels={showLabels}
                handler={callback}
                onSuccess={() => {
                    onSuccess();
                    goTo('forgot-password-success');
                }}
                onError={onError}
                skipError={displaySafeErrorMessage && skipError}
            />
            {allowPhoneNumberResetPassword && config.sms && (
                <Alternative>
                    <DefaultButton onClick={() => goTo('forgot-password-phone-number')}>
                        {i18n('forgotPassword.usePhoneNumberButton')}
                    </DefaultButton>
                </Alternative>
            )}
            {allowLogin && (
                <Alternative>
                    <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>
                        {i18n('forgotPassword.backToLoginLink')}
                    </Link>
                </Alternative>
            )}
        </div>
    );
};

export const ForgotPasswordPhoneNumberView = ({
    allowLogin = true,
    displaySafeErrorMessage = false,
    showLabels = false,
    allowWebAuthnLogin = false,
    initialScreen,
    phoneNumberOptions,
    recaptcha_enabled = false,
    recaptcha_site_key,
    redirectUrl,
    returnToAfterPasswordReset,
    onError = (() => {}) as OnError,
}: ForgotPasswordViewProps) => {
    const coreClient = useReachfive();
    const { goTo } = useRouting();
    const i18n = useI18n();

    const callback = useCallback(
        (data: ForgotPasswordPhoneNumberFormData) => {
            return ReCaptcha.handle(
                { ...data, redirectUrl, returnToAfterPasswordReset },
                { recaptcha_enabled, recaptcha_site_key },
                coreClient.requestPasswordReset,
                'forgot_password'
            ).then(() => data);
        },
        [coreClient, recaptcha_enabled, recaptcha_site_key, redirectUrl, returnToAfterPasswordReset]
    );

    const onSuccess = ({ phoneNumber }: PhoneNumberIdentifier) => {
        goTo<PhoneNumberIdentifier>('forgot-password-code', { phoneNumber });
    };

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    return (
        <div>
            <Heading>{i18n('forgotPassword.title')}</Heading>
            <Intro>{i18n('forgotPassword.prompt.phoneNumber')}</Intro>
            <ForgotPasswordPhoneNumberForm
                showLabels={showLabels}
                handler={callback}
                onSuccess={onSuccess}
                onError={onError}
                skipError={displaySafeErrorMessage && skipError}
                phoneNumberOptions={phoneNumberOptions}
            />
            <Alternative>
                <DefaultButton onClick={() => goTo('forgot-password')}>
                    {i18n('forgotPassword.useEmailButton')}
                </DefaultButton>
            </Alternative>
            {allowLogin && (
                <Alternative>
                    <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>
                        {i18n('forgotPassword.backToLoginLink')}
                    </Link>
                </Alternative>
            )}
        </div>
    );
};

export const ForgotPasswordCodeView = ({
    allowLogin = true,
    displaySafeErrorMessage = false,
    initialScreen,
    allowWebAuthnLogin = false,
    showLabels = false,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: ForgotPasswordViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { goTo, params } = useRouting();
    const { phoneNumber } = params as PhoneNumberIdentifier;

    const callback = useCallback(
        ({ passwordConfirmation: _, ...data }: VerificationCodeFormData) => {
            return coreClient.updatePassword({
                phoneNumber,
                ...data,
            });
        },
        [coreClient, params]
    );

    return (
        <div>
            <Heading>{i18n('forgotPassword.title')}</Heading>
            <Info>{i18n('forgotPassword.verificationCode')}</Info>
            <VerificationCodeForm
                showLabels={showLabels}
                handler={callback}
                onSuccess={() => {
                    onSuccess();
                    goTo('login');
                }}
                onError={onError}
                skipError={displaySafeErrorMessage && skipError}
            />
            {allowLogin && (
                <Alternative>
                    <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>
                        {i18n('back')}
                    </Link>
                </Alternative>
            )}
        </div>
    );
};

export const ForgotPasswordSuccessView = ({
    allowLogin = true,
    initialScreen,
    allowWebAuthnLogin = false,
}: ForgotPasswordViewProps) => {
    const i18n = useI18n();
    return (
        <div>
            <Heading>{i18n('forgotPassword.title')}</Heading>
            <Info>{i18n('forgotPassword.successMessage')}</Info>
            {allowLogin && (
                <Alternative>
                    <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>
                        {i18n('back')}
                    </Link>
                </Alternative>
            )}
        </div>
    );
};
