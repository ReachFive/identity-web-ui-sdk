import React from 'react';
import styled from 'styled-components';
import { MFA } from '@reachfive/identity-core';
import type { StartMfaEmailRegistrationResponse, StartMfaPhoneNumberRegistrationResponse } from '@reachfive/identity-core/es/main/mfaClient';

import type { Config } from '../../types';

import { createMultiViewWidget } from '../../components/widget/widget';

import { simpleField } from '../../components/form/fields/simpleField';
import { Info, Intro, Separator } from '../../components/miscComponent';
import { createForm } from '../../components/form/formComponent';
import phoneNumberField from '../../components/form/fields/phoneNumberField';

import { UserError } from '../../helpers/errors';

import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { useConfig } from '../../contexts/config';


const EmailRegisteringCredentialForm = createForm({
    prefix: 'r5-mfa-credentials-email-',
    submitLabel: 'mfa.register.email'
});

const EmailCredentialRemovalForm = createForm({
    prefix: 'r5-mfa-credentials-email-removal-',
    submitLabel: 'mfa.remove.email'
})

const PhoneNumberCredentialRemovalForm = createForm({
    prefix: 'r5-mfa-credentials-phone-number-removal-',
    submitLabel: 'mfa.remove.phoneNumber'
})

type VerificationCodeFormData = { verificationCode: string }

const VerificationCodeForm = createForm<VerificationCodeFormData>({
    prefix: 'r5-mfa-credentials-verification-code-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ],
})

type PhoneNumberRegisteringCredentialFormData = { phoneNumber: string }

const PhoneNumberRegisteringCredentialForm = (config: Config) => createForm<PhoneNumberRegisteringCredentialFormData>({
    prefix: 'r5-mfa-credentials-phone-number-',
    fields: [
        phoneNumberField({required: true}, config)
    ],
    submitLabel: 'mfa.register.phoneNumber'
})

const DivCredentialBlock = styled.div`
    margin-left: ${props => props.theme._blockInnerHeight}px;
    margin-bottom: 5em;
`;

interface MainViewProps {
    accessToken: string
    credentials: MFA.CredentialsResponse['credentials']
    showIntro?: boolean
    showRemoveMfaCredentials: boolean
}

const MainView = ({ accessToken, credentials, showIntro = true, showRemoveMfaCredentials = true }: MainViewProps) => {
    const coreClient = useReachfive()
    const config = useConfig()
    const i18n = useI18n()
    const { goTo } = useRouting()

    const onEmailRegistering = () => {
        return coreClient.startMfaEmailRegistration({
                accessToken
            }
        )
    }

    const onPhoneNumberRegistering = (data: PhoneNumberRegisteringCredentialFormData) => {
        return coreClient.startMfaPhoneNumberRegistration({
            accessToken,
            ...data
        })
    }

    const onEmailRemoval = () => {
        return coreClient.removeMfaEmail({
            accessToken
        })
    }

    const onPhoneNumberRemoval = ({ phoneNumber }: MFA.PhoneCredential) => {
        return coreClient.removeMfaPhoneNumber({
            accessToken,
            phoneNumber,
        })
    }

    const PhoneNumberInputForm = PhoneNumberRegisteringCredentialForm(config);
    const phoneNumberCredentialRegistered = credentials.find<MFA.PhoneCredential>(
        (credential): credential is MFA.PhoneCredential => MFA.isPhoneCredential(credential)
    )
    const isEmailCredentialRegistered = credentials.some(credential => MFA.isEmailCredential(credential))

    return (
        <div>
            <DivCredentialBlock>
                {config.mfaEmailEnabled &&
                    <div>
                        {showIntro && <Intro>{i18n('mfa.email.explain')}</Intro>}
                        <EmailRegisteringCredentialForm
                            handler={onEmailRegistering}
                            onSuccess={(data: Awaited<ReturnType<typeof onEmailRegistering>>) => goTo('verification-code', {...data, registrationType: 'email'})}
                        />
                    </div>
                }

                {config.mfaEmailEnabled && config.mfaSmsEnabled && <Separator />}

                {config.mfaSmsEnabled &&
                    <div>
                        {showIntro && <Intro>{i18n('mfa.phoneNumber.explain')}</Intro>}
                        <PhoneNumberInputForm
                            handler={onPhoneNumberRegistering}
                            onSuccess={(data: Awaited<ReturnType<typeof onPhoneNumberRegistering>>) => goTo('verification-code', {...data, registrationType: 'sms'})}
                        />
                    </div>
                }
            </DivCredentialBlock>
            <DivCredentialBlock>
                {showRemoveMfaCredentials &&
                    config.mfaEmailEnabled &&
                    isEmailCredentialRegistered &&
                    <div>
                        {showIntro && <Intro>{i18n('mfa.email.remove.explain')}</Intro>}
                        <EmailCredentialRemovalForm
                            handler={onEmailRemoval}
                            onSuccess={() => goTo('credential-removed', {credentialType: 'email'})}
                        />
                    </div>
                }
                {showRemoveMfaCredentials 
                    && config.mfaEmailEnabled 
                    && config.mfaSmsEnabled 
                    && phoneNumberCredentialRegistered 
                    && isEmailCredentialRegistered 
                    && <Separator/>
                }
                {showRemoveMfaCredentials &&
                    config.mfaSmsEnabled &&
                    phoneNumberCredentialRegistered &&
                    <div>
                        {showIntro && <Intro>{i18n('mfa.phoneNumber.remove.explain')}</Intro>}
                        <PhoneNumberCredentialRemovalForm
                            handler={() => onPhoneNumberRemoval({ ...phoneNumberCredentialRegistered })}
                            onSuccess={() => goTo('credential-removed', {credentialType: 'sms'})}
                        />
                    </div>
                }
            </DivCredentialBlock>
        </div>
    )
}

interface VerificationCodeViewProps {
    accessToken: string
    registrationType: MFA.CredentialsResponse['credentials'][number]['type']
    showIntro?: boolean
    status: StartMfaEmailRegistrationResponse['status'] | StartMfaPhoneNumberRegistrationResponse['status']
}

const VerificationCodeView = ({ accessToken, registrationType, showIntro = true, status }: VerificationCodeViewProps) => {
    const coreClient = useReachfive()
    const i18n = useI18n()
    const { goTo } = useRouting()

    const onEmailCodeVerification = (data: VerificationCodeFormData) => {
        return coreClient.verifyMfaEmailRegistration({
            ...data,
            accessToken
        })
    }

    const onSmsCodeVerification = (data: VerificationCodeFormData) => {
        return coreClient.verifyMfaPhoneNumberRegistration({
            ...data,
            accessToken
        })
    }

    if (showIntro && status === 'enabled') {
        goTo<CredentialRegisteredViewState>('credential-registered', { registrationType })
        return null
    }

    return (
        <div>
            {showIntro && status === 'email_sent' && <Intro>{i18n('mfa.verify.email')}</Intro>}
            {status === 'email_sent' &&
                <VerificationCodeForm
                    handler={onEmailCodeVerification}
                    onSuccess={() => goTo('credential-registered', { registrationType })}
                />
            }

            {showIntro && status === 'sms_sent' && <Intro>{i18n('mfa.verify.sms')}</Intro>}
            {status === 'sms_sent' &&
                <VerificationCodeForm
                    handler={onSmsCodeVerification}
                    onSuccess={() => goTo('credential-registered', { registrationType })}
                />
            }
        </div>
    )
}

interface CredentialRegisteredViewProps {}

type CredentialRegisteredViewState = {
    registrationType: MFA.CredentialsResponse['credentials'][number]['type']
}

const CredentialRegisteredView = () => {
    const i18n = useI18n()
    const { params } = useRouting()
    const { registrationType } = params as CredentialRegisteredViewState
    return (
        <div>
            {registrationType === 'email' && <Info>{i18n('mfa.email.registered')}</Info>}
            {registrationType === 'sms' && <Info>{i18n('mfa.phoneNumber.registered')}</Info>}
        </div>
    )
}

interface CredentialRemovedViewProps {
    credentialType: MFA.CredentialsResponse['credentials'][number]['type']
}

const CredentialRemovedView = ({ credentialType }: CredentialRemovedViewProps) => {
    const i18n = useI18n()
    return (
        <div>
            {credentialType === 'email' && <Info>{i18n('mfa.email.removed')}</Info>}
            {credentialType === 'sms' && <Info>{i18n('mfa.phoneNumber.removed')}</Info>}
        </div>
    )
}

export interface MfaCredentialsWidgetProps extends
    MainViewProps,
    CredentialRegisteredViewProps,
    VerificationCodeViewProps,
    CredentialRemovedViewProps {}

export default createMultiViewWidget<Omit<MfaCredentialsWidgetProps, 'credentials'>, MfaCredentialsWidgetProps>({
    initialView: 'main',
    views: {
        'main': MainView,
        'credential-registered': CredentialRegisteredView,
        'verification-code': VerificationCodeView,
        'credential-removed': CredentialRemovedView
    },
    prepare: (options, { apiClient }) => {
        return apiClient.listMfaCredentials(options.accessToken)
            .catch(error => {
                throw UserError.fromAppError(error)
            })
            .then(({ credentials }) => ({
                ...options,
                credentials,
            }))
    }
})
