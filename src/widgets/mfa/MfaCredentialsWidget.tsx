import { MFA, Profile } from '@reachfive/identity-core';
import type {
    StartMfaEmailRegistrationResponse,
    StartMfaPhoneNumberRegistrationResponse,
} from '@reachfive/identity-core/es/main/mfaClient';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import type { OnError, OnSuccess, Prettify } from '../../types';

import { createMultiViewWidget } from '../../components/widget/widget';

import phoneNumberField, {
    type PhoneNumberOptions,
} from '../../components/form/fields/phoneNumberField';
import { simpleField } from '../../components/form/fields/simpleField';
import { createForm } from '../../components/form/formComponent';
import { Info, Intro, Separator } from '../../components/miscComponent';

import { UserError } from '../../helpers/errors';

import checkboxField from '../../components/form/fields/checkboxField.tsx';
import { useConfig } from '../../contexts/config';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';

type EmailRegisteringCredentialFormData = { trustDevice: boolean };

const EmailRegisteringCredentialForm = createForm<
    EmailRegisteringCredentialFormData,
    DisplayTrustDeviceFormOptions
>({
    prefix: 'r5-mfa-credentials-email-',
    fields({ displayTrustDevice }) {
        return displayTrustDevice
            ? [
                  checkboxField({
                      key: 'trust_device',
                      label: 'mfa.stepUp.trustDevice',
                      defaultValue: false,
                  }),
              ]
            : [];
    },
    submitLabel: 'mfa.register.email',
});

const EmailCredentialRemovalForm = createForm({
    prefix: 'r5-mfa-credentials-email-removal-',
    submitLabel: 'mfa.remove.email',
});

const PhoneNumberCredentialRemovalForm = createForm({
    prefix: 'r5-mfa-credentials-phone-number-removal-',
    submitLabel: 'mfa.remove.phoneNumber',
});

type VerificationCodeFormData = { verificationCode: string; trustDevice: boolean };

type DisplayTrustDeviceFormOptions = {
    displayTrustDevice: boolean;
};

const VerificationCodeForm = createForm<VerificationCodeFormData, DisplayTrustDeviceFormOptions>({
    prefix: 'r5-mfa-credentials-verification-code-',
    fields({ displayTrustDevice }) {
        return [
            simpleField({
                key: 'verification_code',
                label: 'verificationCode',
                type: 'text',
            }),
            ...(displayTrustDevice
                ? [
                      checkboxField({
                          key: 'trust_device',
                          label: 'mfa.stepUp.trustDevice',
                          defaultValue: false,
                      }),
                  ]
                : []),
        ];
    },
});

type PhoneNumberRegisteringCredentialFormData = { phoneNumber: string; trustDevice: boolean };

const PhoneNumberRegisteringCredentialForm = createForm<
    PhoneNumberRegisteringCredentialFormData,
    { phoneNumberOptions?: PhoneNumberOptions } & DisplayTrustDeviceFormOptions
>({
    prefix: 'r5-mfa-credentials-phone-number-',
    fields: ({ config, phoneNumberOptions, displayTrustDevice }) => {
        return [
            phoneNumberField(
                {
                    required: true,
                    ...phoneNumberOptions,
                },
                config
            ),
            ...(displayTrustDevice
                ? [
                      checkboxField({
                          key: 'trust_device',
                          label: 'mfa.stepUp.trustDevice',
                          required: true,
                          defaultValue: false,
                      }),
                  ]
                : []),
        ];
    },
    submitLabel: 'mfa.register.phoneNumber',
});

const DivCredentialBlock = styled.div`
    margin-left: ${props => props.theme._blockInnerHeight}px;
    margin-bottom: 5em;
`;

interface MainViewProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * The user's MFA credentials
     */
    credentials: MFA.CredentialsResponse['credentials'];
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
     * Callback function called when the request has failed.
     */
    onError?: OnError;

    profileIdentifiers?: Pick<Profile, 'emailVerified' | 'phoneNumber' | 'phoneNumberVerified'>;
    /**
     * Allow to trust device during enrollment
     */
    allowTrustDevice?: boolean;
}

const MainView = ({
    accessToken,
    credentials,
    onError = (() => {}) as OnError,
    phoneNumberOptions,
    requireMfaRegistration = false,
    showIntro = true,
    showRemoveMfaCredentials = true,
    allowTrustDevice = false,
    profileIdentifiers = {},
}: MainViewProps) => {
    const coreClient = useReachfive();
    const config = useConfig();
    const i18n = useI18n();
    const { goTo } = useRouting();
    const [displayTrustDevicePhoneNumber, setDisplayTrustDevicePhoneNumber] =
        useState<boolean>(false);

    const onEmailRegistering = (data: EmailRegisteringCredentialFormData) => {
        return coreClient.startMfaEmailRegistration({
            accessToken,
            ...data,
        });
    };

    const onPhoneNumberRegistering = (data: PhoneNumberRegisteringCredentialFormData) => {
        return coreClient.startMfaPhoneNumberRegistration({
            accessToken,
            ...data,
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

    return (
        <div>
            <DivCredentialBlock>
                {config.mfaEmailEnabled && !isEmailCredentialRegistered && (
                    <div>
                        {showIntro && (
                            <Intro>
                                {requireMfaRegistration
                                    ? i18n('mfa.email.explain.required')
                                    : i18n('mfa.email.explain')}
                            </Intro>
                        )}
                        <EmailRegisteringCredentialForm
                            displayTrustDevice={
                                profileIdentifiers.emailVerified != undefined &&
                                profileIdentifiers.emailVerified &&
                                allowTrustDevice &&
                                config.rbaEnabled
                            }
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
                    <div>
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
            </DivCredentialBlock>
            <DivCredentialBlock>
                {showRemoveMfaCredentials &&
                    config.mfaEmailEnabled &&
                    isEmailCredentialRegistered && (
                        <div>
                            {showIntro && <Intro>{i18n('mfa.email.remove.explain')}</Intro>}
                            <EmailCredentialRemovalForm
                                handler={onEmailRemoval}
                                onSuccess={() =>
                                    goTo<CredentialRemovedViewState>('credential-removed', {
                                        credentialType: 'email',
                                    })
                                }
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
                            <PhoneNumberCredentialRemovalForm
                                handler={() =>
                                    onPhoneNumberRemoval({ ...phoneNumberCredentialRegistered })
                                }
                                onSuccess={() =>
                                    goTo<CredentialRemovedViewState>('credential-removed', {
                                        credentialType: 'sms',
                                    })
                                }
                                onError={onError}
                            />
                        </div>
                    )}
            </DivCredentialBlock>
        </div>
    );
};

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
        return coreClient.verifyMfaEmailRegistration({
            ...data,
            accessToken,
        });
    };

    const onSmsCodeVerification = (data: VerificationCodeFormData) => {
        return coreClient.verifyMfaPhoneNumberRegistration({
            ...data,
            accessToken,
        });
    };

    const onCredentialRegistered = () => {
        onSuccess({ name: 'credential_registered', type: registrationType });
        goTo<CredentialRegisteredViewState>('credential-registered', { registrationType });
    };

    if (showIntro && status === 'enabled') {
        goTo<CredentialRegisteredViewState>('credential-registered', { registrationType });
        return null;
    }

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

interface CredentialRegisteredViewProps {}

type CredentialRegisteredViewState = {
    registrationType: MFA.CredentialsResponse['credentials'][number]['type'];
};

const CredentialRegisteredView = () => {
    const i18n = useI18n();
    const { params } = useRouting();
    const { registrationType } = params as CredentialRegisteredViewState;
    return (
        <div>
            {registrationType === 'email' && <Info>{i18n('mfa.email.registered')}</Info>}
            {registrationType === 'sms' && <Info>{i18n('mfa.phoneNumber.registered')}</Info>}
        </div>
    );
};

type CredentialRemovedViewProps = {};

type CredentialRemovedViewState = {
    credentialType: MFA.Credential['type'];
};

const CredentialRemovedView = () => {
    const i18n = useI18n();
    const { params } = useRouting();
    const { credentialType } = params as CredentialRemovedViewState;
    return (
        <div>
            {credentialType === 'email' && <Info>{i18n('mfa.email.removed')}</Info>}
            {credentialType === 'sms' && <Info>{i18n('mfa.phoneNumber.removed')}</Info>}
        </div>
    );
};

type MfaCredentialsProps = Prettify<
    MainViewProps &
        CredentialRegisteredViewProps &
        VerificationCodeViewProps &
        CredentialRemovedViewProps
>;

export type MfaCredentialsWidgetProps = Prettify<
    Omit<MfaCredentialsProps, 'credentials' | 'profileIdentifiers'>
>;

export default createMultiViewWidget<MfaCredentialsWidgetProps, MfaCredentialsProps>({
    initialView: 'main',
    views: {
        main: MainView,
        'credential-registered': CredentialRegisteredView,
        'verification-code': VerificationCodeView,
        'credential-removed': CredentialRemovedView,
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
            .catch(error => {
                options.onError?.(error);
                throw UserError.fromAppError(error);
            });
    },
});
