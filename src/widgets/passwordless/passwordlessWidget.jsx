import React from 'react';

import { email } from '../../core/validation';

import { createMultiViewWidget } from '../../components/widget/widget';
import { Info, Intro, Separator } from '../../components/miscComponent';

import { createForm } from '../../components/form/formComponent';
import { simpleField } from '../../components/form/fields/simpleField';
import phoneNumberField from '../../components/form/fields/phoneNumberField';
import SocialButtons from '../../components/form/socialButtonsComponent';

const EmailInputForm = createForm({
    prefix: 'r5-passwordless-',
    fields: [
        simpleField({
            key: 'email',
            label: 'email',
            type: 'email',
            validator: email
        })
    ]
});

const phoneNumberInputForm = config => createForm({
    prefix: 'r5-passwordless-sms-',
    fields: [phoneNumberField({ required: true }, config)]
});

const VerificationCodeInputForm = createForm({
    prefix: 'r5-passwordless-sms-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ]
});

class MainView extends React.Component {
    handleSubmit = data => this.props.apiClient.startPasswordless(data, this.props.auth).then(_ => data);

    handleSuccess = data => {
        return data.email
            ? this.props.goTo('emailSent')
            : this.props.goTo('verificationCode', data);
    };

    render() {
        const { i18n, showSocialLogins, socialProviders, showIntro, authType } = this.props;
        const isEmail = authType === 'magic_link' || authType === '' || !authType;
        const PhoneNumberInputForm = phoneNumberInputForm(this.props.config);

        return <div>
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <SocialButtons providers={socialProviders} auth={this.props.auth} />
            )}
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <Separator text={i18n('or')} />
            )}
            {isEmail && showIntro && <Intro>{i18n('passwordless.intro')}</Intro>}
            {isEmail && <EmailInputForm handler={this.handleSubmit} onSuccess={this.handleSuccess} />}
            {!isEmail && showIntro && <Intro>{i18n('passwordless.sms.intro')}</Intro>}
            {!isEmail && <PhoneNumberInputForm handler={this.handleSubmit} onSuccess={this.handleSuccess} />}
        </div>;
    }
}

class VerificationCodeView extends React.Component {
    handleSubmit = data => {
        const { apiClient, auth, phoneNumber } = this.props;

        return apiClient.verifyPasswordless({ phoneNumber, ...data }, auth);
    };

    render() {
        return <div>
            <Info>{this.props.i18n('passwordless.sms.verification.intro')}</Info>
            <VerificationCodeInputForm handler={this.handleSubmit} />
        </div>;
    }
}
const EmailSentView = ({ i18n }) => <Info>{i18n('passwordless.emailSent')}</Info>;

export default createMultiViewWidget({
    initialView: 'main',
    views: {
        main: MainView,
        emailSent: EmailSentView,
        verificationCode: VerificationCodeView
    },
    prepare: (options, { config }) => ({
        socialProviders: config.socialProviders,
        auth: {},
        showSocialLogins: false,
        showIntro: true,
        authType: 'magic_link',
        ...options
    })
})
