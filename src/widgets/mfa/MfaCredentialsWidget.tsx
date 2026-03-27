import React, { useCallback, useState } from 'react';

import { MFA, Profile } from '@reachfive/identity-core';
import type {
    StartMfaEmailRegistrationResponse,
    StartMfaPhoneNumberRegistrationResponse,
} from '@reachfive/identity-core/es/main/mfaClient';

import { Form, FormProps } from '@/components/form/form.tsx';
import { Field } from '@/lib/form.tsx';

import { DestructiveButton } from '../../components/form/buttonComponent';
import { Intro, Separator } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { useConfig } from '../../contexts/config';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { isAppError, UserError } from '../../helpers/errors';
import { type PhoneNumberOptions } from '../../lib/form';
import {
    useCredentials,
    withCredentials,
    type CredentialsProviderProps,
} from './contexts/credentials';

import type { OnError, OnSuccess, Prettify } from '../../types';

type EmailRegisteringCredentialFormData = { trustDevice: boolean };

type VerificationCodeFormData = { verificationCode: string; trustDevice: boolean };

type DisplayTrustDeviceFormOptions = {
    displayTrustDevice: boolean;
};

const VerificationCodeForm = ({
    displayTrustDevice,
    ...props
}: DisplayTrustDeviceFormOptions & FormProps<VerificationCodeFormData>) => {
    return (
        <Form
            fields={[
                {
                    key: 'verification_code',
                    label: 'verificationCode',
                    type: 'string',
                },
                ...((displayTrustDevice
                    ? [
                          {
                              type: 'checkbox',
                              key: 'trust_device',
                              label: 'mfa.stepUp.trustDevice',
                              defaultChecked: false,
                          },
                      ]
                    : []) satisfies Field[]),
            ]}
            {...props}
        />
    );
};

type PhoneNumberRegisteringCredentialFormData = { phoneNumber: string; trustDevice: boolean };

const PhoneNumberRegisteringCredentialForm = ({
    displayTrustDevice,
    phoneNumberOptions,
    ...props
}: DisplayTrustDeviceFormOptions &
    FormProps<
        PhoneNumberRegisteringCredentialFormData,
        StartMfaPhoneNumberRegistrationResponse
    >) => {
    return (
        <Form
            fields={[
                { key: 'phoneNumber', type: 'phone', ...phoneNumberOptions },
                ...((displayTrustDevice
                    ? [
                          {
                              key: 'trust_device',
                              type: 'checkbox',
                              label: 'mfa.stepUp.trustDevice',
                              required: true,
                              defaultChecked: false,
                          },
                      ]
                    : []) satisfies Field[]),
            ]}
            submitLabel={'mfa.register.phoneNumber'}
            {...props}
        />
    );
};

interface MainViewProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Boolean to enable (`true`) or disable (`false`) whether the option to remove MFA credentials are displayed.
     *
     * @default false
     */
    requireMfaRegistration?: boolean;
    /**
     * Show the introduction text.
     *
     * @default true
     */
    showIntro?: boolean;
    /**
     * Boolean to enable (true) or disable (false) whether the option to remove MFA credentials are displayed.
     *
     * @default true
     */
    showRemoveMfaCredentials?: boolean;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;

    profileIdentifiers?: Pick<Profile, 'emailVerified' | 'phoneNumber' | 'phoneNumberVerified'>;
    /**
     * Allow to trust device during enrollment
     */
    allowTrustDevice?: boolean;
    /**
     * Action used in template
     */
    action?: string;
}

const MainView = withCredentials(
    ({
        accessToken,
        onError = (() => {}) as OnError,
        onSuccess = (() => {}) as OnSuccess,
        phoneNumberOptions,
        requireMfaRegistration = false,
        showIntro = true,
        showRemoveMfaCredentials = true,
        allowTrustDevice = false,
        profileIdentifiers = {},
        action,
    }: MainViewProps) => {
        const coreClient = useReachfive();
        const config = useConfig();
        const i18n = useI18n();
        const { goTo } = useRouting();
        const { credentials, refresh } = useCredentials();
        const [displayTrustDevicePhoneNumber, setDisplayTrustDevicePhoneNumber] =
            useState<boolean>(false);

        const onEmailRegistering = (data: EmailRegisteringCredentialFormData) => {
            return coreClient
                .startMfaEmailRegistration({
                    accessToken,
                    action,
                    ...data,
                })
                .then(resp => {
                    onSuccess({ name: 'mfa_email_start_registration' });
                    if (data.trustDevice && resp.status == 'enabled') {
                        onSuccess({ name: 'mfa_trusted_device_added' });
                    }
                    return resp;
                })
                .catch(error => {
                    onError(error);
                    throw error;
                });
        };

        const onPhoneNumberRegistering = (data: PhoneNumberRegisteringCredentialFormData) => {
            return coreClient
                .startMfaPhoneNumberRegistration({
                    accessToken,
                    action,
                    ...data,
                })
                .then(resp => {
                    onSuccess({ name: 'mfa_phone_number_start_registration' });
                    if (data.trustDevice && resp.status == 'enabled') {
                        onSuccess({ name: 'mfa_trusted_device_added' });
                    }
                    return resp;
                })
                .catch(error => {
                    onError(error);
                    throw error;
                });
        };

        const onEmailRemoval = () => {
            return coreClient.removeMfaEmail({
                accessToken,
            });
        };

        const onPhoneNumberRemoval = ({ phoneNumber }: MFA.PhoneCredential) => {
            return coreClient.removeMfaPhoneNumber({
                accessToken,
                phoneNumber,
            });
        };

        const onPhoneNumberChange = useCallback(
            (data: PhoneNumberRegisteringCredentialFormData) => {
                const { phoneNumber } = data;
                setDisplayTrustDevicePhoneNumber(
                    profileIdentifiers.phoneNumber != undefined &&
                        profileIdentifiers.phoneNumber === phoneNumber &&
                        config.rbaEnabled &&
                        allowTrustDevice &&
                        profileIdentifiers.phoneNumberVerified != undefined &&
                        profileIdentifiers.phoneNumberVerified
                );
            },
            [displayTrustDevicePhoneNumber]
        );

        const phoneNumberCredentialRegistered = credentials.find<MFA.PhoneCredential>(
            (credential): credential is MFA.PhoneCredential => MFA.isPhoneCredential(credential)
        );
        const isEmailCredentialRegistered = credentials.some(credential =>
            MFA.isEmailCredential(credential)
        );
        const isPhoneCredentialRegistered = credentials.some(credential =>
            MFA.isPhoneCredential(credential)
        );

        const displayTrustDevice =
            profileIdentifiers.emailVerified != undefined &&
            profileIdentifiers.emailVerified &&
            allowTrustDevice &&
            config.rbaEnabled;

        return (
            <div className="flex flex-col gap-4">
                {config.mfaEmailEnabled && !isEmailCredentialRegistered && (
                    <div id="email-registering-credential">
                        {showIntro && (
                            <Intro>
                                {requireMfaRegistration
                                    ? i18n('mfa.email.explain.required')
                                    : i18n('mfa.email.explain')}
                            </Intro>
                        )}
                        <Form
                            fields={[
                                ...((displayTrustDevice
                                    ? [
                                          {
                                              key: 'trust_device',
                                              type: 'checkbox',
                                              label: 'mfa.stepUp.trustDevice',
                                              defaultChecked: false,
                                          },
                                      ]
                                    : []) satisfies Field[]),
                            ]}
                            submitLabel={'mfa.register.email'}
                            handler={onEmailRegistering}
                            onSuccess={(data: StartMfaEmailRegistrationResponse) =>
                                goTo<VerificationCodeViewState>('verification-code', {
                                    ...data,
                                    registrationType: 'email',
                                    allowTrustDevice,
                                })
                            }
                            onError={onError}
                        />
                    </div>
                )}

                {config.mfaEmailEnabled &&
                    !isEmailCredentialRegistered &&
                    config.mfaSmsEnabled &&
                    !isPhoneCredentialRegistered && <Separator text={i18n('or')} />}

                {config.mfaSmsEnabled && !isPhoneCredentialRegistered && (
                    <div id="phone-number-registering-credential">
                        {showIntro && <Intro>{i18n('mfa.phoneNumber.explain')}</Intro>}
                        <PhoneNumberRegisteringCredentialForm
                            handler={onPhoneNumberRegistering}
                            displayTrustDevice={displayTrustDevicePhoneNumber}
                            onFieldChange={onPhoneNumberChange}
                            onSuccess={(data: StartMfaPhoneNumberRegistrationResponse) =>
                                goTo<VerificationCodeViewState>('verification-code', {
                                    ...data,
                                    registrationType: 'sms',
                                    allowTrustDevice,
                                })
                            }
                            onError={onError}
                            phoneNumberOptions={phoneNumberOptions}
                        />
                    </div>
                )}

                {showRemoveMfaCredentials &&
                    config.mfaEmailEnabled &&
                    isEmailCredentialRegistered && (
                        <div>
                            {showIntro && <Intro>{i18n('mfa.email.remove.explain')}</Intro>}
                            <Form
                                submitLabel={'mfa.remove.email'}
                                SubmitComponent={({ disabled, label }) => (
                                    <DestructiveButton disabled={disabled}>
                                        {label}
                                    </DestructiveButton>
                                )}
                                handler={onEmailRemoval}
                                onSuccess={async () => {
                                    onSuccess({ name: 'mfa_email_deleted' });
                                    await refresh();
                                }}
                                onError={onError}
                            />
                        </div>
                    )}
                {showRemoveMfaCredentials &&
                    config.mfaEmailEnabled &&
                    config.mfaSmsEnabled &&
                    phoneNumberCredentialRegistered &&
                    isEmailCredentialRegistered && <Separator text={i18n('or')} />}
                {showRemoveMfaCredentials &&
                    config.mfaSmsEnabled &&
                    phoneNumberCredentialRegistered && (
                        <div>
                            {showIntro && <Intro>{i18n('mfa.phoneNumber.remove.explain')}</Intro>}
                            <Form
                                submitLabel="mfa.remove.phoneNumber"
                                SubmitComponent={({ label, ...props }) => (
                                    <DestructiveButton {...props}>{label}</DestructiveButton>
                                )}
                                handler={() =>
                                    onPhoneNumberRemoval({ ...phoneNumberCredentialRegistered })
                                }
                                onSuccess={async () => {
                                    onSuccess({ name: 'mfa_phone_number_deleted' });
                                    await refresh();
                                }}
                                onError={onError}
                            />
                        </div>
                    )}
            </div>
        );
    }
);

interface VerificationCodeViewProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Show the introduction text.
     */
    showIntro?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Display the checkbox to trust device
     */
    allowTrustDevice?: boolean;
}

type VerificationCodeViewState = (
    | ({ registrationType: 'email' } & StartMfaEmailRegistrationResponse)
    | ({ registrationType: 'sms' } & StartMfaPhoneNumberRegistrationResponse)
) & { allowTrustDevice: boolean };

const VerificationCodeView = ({
    accessToken,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
    showIntro = true,
    allowTrustDevice = false,
}: VerificationCodeViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const config = useConfig();
    const { goTo, params } = useRouting();
    const { registrationType, status } = params as VerificationCodeViewState;

    const onEmailCodeVerification = (data: VerificationCodeFormData) => {
        return coreClient
            .verifyMfaEmailRegistration({
                ...data,
                accessToken,
            })
            .then(resp => {
                if (data.trustDevice) {
                    onSuccess({ name: 'mfa_trusted_device_added' });
                }
                return resp;
            })
            .catch(error => {
                onError(error);
                throw error;
            });
    };

    const onSmsCodeVerification = (data: VerificationCodeFormData) => {
        return coreClient
            .verifyMfaPhoneNumberRegistration({
                ...data,
                accessToken,
            })
            .then(resp => {
                if (data.trustDevice) {
                    onSuccess({ name: 'mfa_trusted_device_added' });
                }
                return resp;
            })
            .catch(error => {
                onError(error);
                throw error;
            });
    };

    const onCredentialRegistered = () => {
        switch (registrationType) {
            case 'email':
                onSuccess({ name: 'mfa_email_verify_registration' });
                break;
            case 'sms':
                onSuccess({ name: 'mfa_phone_number_verify_registration' });
                break;
        }
        goTo('main');
    };

    React.useEffect(() => {
        if (status === 'enabled') {
            onCredentialRegistered();
        }
    }, [showIntro, status]);

    return (
        <div>
            {showIntro && status === 'email_sent' && <Intro>{i18n('mfa.verify.email')}</Intro>}
            {status === 'email_sent' && (
                <VerificationCodeForm
                    displayTrustDevice={allowTrustDevice && config.rbaEnabled}
                    handler={onEmailCodeVerification}
                    onSuccess={onCredentialRegistered}
                    onError={onError}
                />
            )}

            {showIntro && status === 'sms_sent' && <Intro>{i18n('mfa.verify.sms')}</Intro>}
            {status === 'sms_sent' && (
                <VerificationCodeForm
                    displayTrustDevice={allowTrustDevice && config.rbaEnabled}
                    handler={onSmsCodeVerification}
                    onSuccess={onCredentialRegistered}
                    onError={onError}
                />
            )}
        </div>
    );
};

type MfaCredentialsProps = Prettify<
    MainViewProps & VerificationCodeViewProps & CredentialsProviderProps
>;

export type MfaCredentialsWidgetProps = Prettify<
    Omit<MfaCredentialsProps, 'credentials' | 'profileIdentifiers'>
>;

export default createMultiViewWidget<MfaCredentialsWidgetProps, MfaCredentialsProps>({
    initialView: 'main',
    views: {
        main: MainView,
        'verification-code': VerificationCodeView,
    },
    prepare: (options, { apiClient }) => {
        return Promise.all([
            apiClient.listMfaCredentials(options.accessToken),
            apiClient.getUser({
                accessToken: options.accessToken,
                fields: 'email_verified,phone_number,phone_number_verified',
            }),
        ])
            .then(([{ credentials }, profile]) => {
                const profileIdentifiers = profile as Pick<
                    Profile,
                    'emailVerified' | 'phoneNumber' | 'phoneNumberVerified'
                >;
                return {
                    ...options,
                    credentials,
                    profileIdentifiers,
                };
            })
            .catch((error: unknown) => {
                options.onError?.(error);
                if (isAppError(error)) {
                    throw UserError.fromAppError(error);
                } else {
                    throw error;
                }
            });
    },
});
