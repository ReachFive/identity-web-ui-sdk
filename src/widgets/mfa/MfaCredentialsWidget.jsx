import React from 'react';

import { createMultiViewWidget } from '../../components/widget/widget';

import {simpleField} from '../../components/form/fields/simpleField';
import {Info, Intro, Separator} from '../../components/miscComponent';
import {createForm} from '../../components/form/formComponent';
import {deepDefaults} from '../../helpers/deepDefaults';
import phoneNumberField from "../../components/form/fields/phoneNumberField";


const EmailRegisteringCredentialForm = createForm({
    prefix: 'r5-mfa-credentials-email-',
    submitLabel: 'mfa.register.email'
});

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

    render() {
        const { i18n, showIntro, config } = this.props
        const PhoneNumberInputForm = PhoneNumberRegisteringCredentialForm(config);
        return (
            <div>
                <div>
                    {showIntro && <Intro>{i18n('mfa.email.explain')}</Intro>}
                    <EmailRegisteringCredentialForm handler={this.onEmailRegistering} onSuccess={data => this.props.goTo('verification-code', {...data, registrationType: 'email'})}/>
                </div>
                <Separator/>
                <div>
                    <Intro>{showIntro && <Intro>{i18n('mfa.phoneNumber.explain')}</Intro>}</Intro>
                    <PhoneNumberInputForm
                        handler={this.onPhoneNumberRegistering} onSuccess={data => this.props.goTo('verification-code', {...data, registrationType: 'sms'})}/>
                </div>
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
        const CredentialRegistered = CredentialRegisteredView({i18n, registrationType})
        return <div>
            {showIntro && status === 'email_sent' && <Intro>{i18n('mfa.verify.email')}</Intro>}
            {status === 'email_sent' && <VerificationCodeForm handler={this.onEmailCodeVerification} onSuccess={data => goTo('credential-registered', {...data, registrationType})}/>}

            {showIntro && status === 'sms_sent' && <Intro>{i18n('mfa.verify.sms')}</Intro>}
            {status === 'sms_sent' && <VerificationCodeForm handler={this.onSmsCodeVerification} onSuccess={data => goTo('credential-registered', {...data, registrationType})}/>}

            {showIntro && registrationType === 'email' && status === 'enabled' && <Intro>{i18n('mfa.email.alreadyRegistered')}</Intro>}
            {showIntro && registrationType === 'sms' && status === 'enabled' && <CredentialRegistered />}
        </div>
    }
}

const CredentialRegisteredView = ({ i18n, registrationType}) => <div>
        {registrationType === 'email' && <Info>{i18n('mfa.email.registered')}</Info>}
        {registrationType === 'sms' && <Info>{i18n('mfa.phoneNumber.registered')}</Info>}
    </div>

export default createMultiViewWidget({
    initialView: 'main',
    views: {
        'main': MainView,
        'credential-registered': CredentialRegisteredView,
        'verification-code': VerificationCodeView
    },
    prepare: (options) => {
        return deepDefaults({
            showIntro: true,
            ...options
        }
    )}
})
