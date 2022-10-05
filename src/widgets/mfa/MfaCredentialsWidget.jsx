import React from 'react';

import { createMultiViewWidget } from '../../components/widget/widget';

import {simpleField} from '../../components/form/fields/simpleField';
import {Info, Intro, Separator} from '../../components/miscComponent';
import {createForm} from '../../components/form/formComponent';
import {deepDefaults} from '../../helpers/deepDefaults';
import phoneNumberField from '../../components/form/fields/phoneNumberField';
import {withTheme} from '../../components/widget/widgetContext';
import styled from 'styled-components';


const EmailRegisteringCredentialForm = createForm({
    prefix: 'r5-mfa-credentials-email-',
    submitLabel: 'mfa.register.email'
});

const EmailCredentialRemovalForm = createForm({
    prefix: 'r5-mfa-credentials-email-removal-',
    submitLabel: 'mfa.remove.email'
})

const PhoneNumberCredentialRemovalForm = config => createForm({
    prefix: 'r5-mfa-credentials-phone-number-removal-',
    fields: [
        phoneNumberField({required: true}, config)
    ],
    submitLabel: 'mfa.remove.phoneNumber'
})

const VerificationCodeForm = createForm({
    prefix: 'r5-mfa-credentials-verification-code-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ],
})

const PhoneNumberRegisteringCredentialForm = config => createForm({
    prefix: 'r5-mfa-credentials-phone-number-',
    fields: [
        phoneNumberField({required: true}, config)
    ],
    submitLabel: 'mfa.register.phoneNumber'
})

const DivCredentialBlock = withTheme(styled.div`
    margin-left: ${props => props.theme.get('_blockInnerHeight')}px;
    margin-bottom: 5em;
`);

class MainView extends React.Component {
    onEmailRegistering = _ => {
        return this.props.apiClient.startMfaEmailRegistration({
                accessToken: this.props.accessToken
            }
        )
    }

    onPhoneNumberRegistering = data => {
        return this.props.apiClient.startMfaPhoneNumberRegistration({
            accessToken: this.props.accessToken,
            ...data
        })
    }

    onEmailRemoval = _ => {
        return this.props.apiClient.removeMfaEmail({
            accessToken: this.props.accessToken
        })
    }

    onPhoneNumberRemoval = data => {
        return this.props.apiClient.removeMfaPhoneNumber({
            accessToken: this.props.accessToken,
            phoneNumber: data.phoneNumber
        })
    }

    render() {
        const { i18n, showIntro, config, showRemoveMfaCredentials } = this.props
        const PhoneNumberInputForm = PhoneNumberRegisteringCredentialForm(config);
        const PhoneNumberRemovalInputForm = PhoneNumberCredentialRemovalForm(config)
        return (
            <div>
                <DivCredentialBlock>
                    {config.mfaEmailEnabled &&
                        <div>
                            {showIntro && <Intro>{i18n('mfa.email.explain')}</Intro>}
                            <EmailRegisteringCredentialForm handler={this.onEmailRegistering} onSuccess={data => this.props.goTo('verification-code', {...data, registrationType: 'email'})}/>
                        </div>
                    }

                    {config.mfaEmailEnabled && config.mfaSmsEnabled && <Separator/>}
                    {config.mfaSmsEnabled &&
                        <div>
                            {showIntro && <Intro>{i18n('mfa.phoneNumber.explain')}</Intro>}
                            <PhoneNumberInputForm
                                handler={this.onPhoneNumberRegistering} onSuccess={data => this.props.goTo('verification-code', {...data, registrationType: 'sms'})}/>
                        </div>
                    }
                </DivCredentialBlock>
                <DivCredentialBlock>
                    {showRemoveMfaCredentials &&
                        config.mfaEmailEnabled &&
                        <div>
                            {showIntro && <Intro>{i18n('mfa.email.remove.explain')}</Intro>}
                            <EmailCredentialRemovalForm handler={this.onEmailRemoval}
                                                        onSuccess={_ => this.props.goTo('credential-removed', {credentialType: 'email'})}/>
                        </div>
                    }
                    {showRemoveMfaCredentials && config.mfaEmailEnabled && config.mfaSmsEnabled && <Separator/>}
                    {showRemoveMfaCredentials &&
                        config.mfaSmsEnabled &&
                        <div>
                            {showIntro && <Intro>{i18n('mfa.phoneNumber.remove.explain')}</Intro>}
                            <PhoneNumberRemovalInputForm handler={this.onPhoneNumberRemoval}
                                                         onSuccess={_ => this.props.goTo('credential-removed', {credentialType: 'sms'})}/>
                        </div>
                    }
                </DivCredentialBlock>
            </div>
        )
    }
}

class VerificationCodeView extends React.Component {
    onEmailCodeVerification = data => {
        return this.props.apiClient.verifyMfaEmailRegistration({
            ...data,
            accessToken: this.props.accessToken
        })
    }

    onSmsCodeVerification = data => {
        return this.props.apiClient.verifyMfaPhoneNumberRegistration({
            ...data,
            accessToken: this.props.accessToken
        })
    }

    render() {
        const { i18n, showIntro, status, goTo, registrationType } = this.props
        return <div>
            {showIntro && status === 'email_sent' && <Intro>{i18n('mfa.verify.email')}</Intro>}
            {status === 'email_sent' && <VerificationCodeForm handler={this.onEmailCodeVerification} onSuccess={data => goTo('credential-registered', {...data, registrationType})}/>}

            {showIntro && status === 'sms_sent' && <Intro>{i18n('mfa.verify.sms')}</Intro>}
            {status === 'sms_sent' && <VerificationCodeForm handler={this.onSmsCodeVerification} onSuccess={data => goTo('credential-registered', {...data, registrationType})}/>}

            {showIntro && status === 'enabled' && goTo('credential-registered', {i18n, registrationType})}
        </div>
    }
}

const CredentialRegisteredView = ({ i18n, registrationType}) => <div>
        {registrationType === 'email' && <Info>{i18n('mfa.email.registered')}</Info>}
        {registrationType === 'sms' && <Info>{i18n('mfa.phoneNumber.registered')}</Info>}
    </div>

const CredentialRemovedView = ({ i18n, credentialType}) => <div>
    {credentialType === 'email' && <Info>{i18n('mfa.email.removed')}</Info>}
    {credentialType === 'sms' && <Info>{i18n('mfa.phoneNumber.removed')}</Info>}
</div>

export default createMultiViewWidget({
    initialView: 'main',
    views: {
        'main': MainView,
        'credential-registered': CredentialRegisteredView,
        'verification-code': VerificationCodeView,
        'credential-removed': CredentialRemovedView
    },
    prepare: (options) => {
        return deepDefaults({
            showIntro: true,
            showRemoveMfaCredentials: true,
            ...options
        }
    )}
})
