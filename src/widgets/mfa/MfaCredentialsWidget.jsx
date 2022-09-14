import React from 'react';

import { createMultiViewWidget } from '../../components/widget/widget';

import {simpleField} from '../../components/form/fields/simpleField';
import {Info, Intro} from '../../components/miscComponent';
import {createForm} from '../../components/form/formComponent';
import {deepDefaults} from '../../helpers/deepDefaults';


const EmailRegisteringCredentialForm = createForm({
    prefix: 'r5-mfa-credentials-email-',
    submitLabel: 'mfa.register.email'
});

const EmailVerificationCodeForm = createForm({
    prefix: 'r5-mfa-credentials-verification-code-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ],
})

class MainView extends React.Component {
    onEmailRegistering = _ => {
        return this.props.apiClient.startMfaEmailRegistration({
                accessToken: this.props.accessToken
            }
        )
    }
    render() {
        const { i18n, showIntro, config } = this.props
        return (
            <div>
                {config.mfaEmailEnabled && showIntro && <Intro>{i18n('mfa.email.explain')}</Intro>}
                {config.mfaEmailEnabled && <EmailRegisteringCredentialForm handler={this.onEmailRegistering} onSuccess={data => this.props.goTo('verification-code', data)}/>}
            </div>
        )
    }
}

class VerificationCodeView extends React.Component {
    callback = data => {
        return this.props.apiClient.verifyMfaEmailRegistration({
            ...data,
            accessToken: this.props.accessToken
        })
    }
    render() {
        const { i18n, showIntro, status, goTo } = this.props
        return <div>
            {showIntro && status === 'email_sent' && <Intro>{i18n('mfa.verify.email')}</Intro>}
            {status === 'email_sent' && <EmailVerificationCodeForm handler={this.callback} onSuccess={data => goTo('credential-registered', data)}/>}
            {showIntro && status === 'enabled' && <Intro>{i18n('mfa.email.alreadyRegistered')}</Intro>}
        </div>
    }
}

const CredentialRegisteredView = ({ i18n }) => <Info>{i18n('mfa.email.registered')}</Info>

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
