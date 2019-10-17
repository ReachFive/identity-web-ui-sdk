import React from 'react';

import { createMultiViewWidget } from '../../components/widget/widget';
import { Info, Intro } from '../../components/miscComponent';
import { createForm } from '../../components/form/formComponent';
import { simpleField } from '../../components/form/fields/simpleField';
import phoneNumberField from '../../components/form/fields/phoneNumberField'

const phoneNumberInputForm = config => createForm({
    prefix: 'r5-phonenumber-editor-',
    fields: [phoneNumberField({ required: true }, config)]
});

const VerificationCodeInputForm = createForm({
    prefix: 'r5-phonenumber-editor-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ]
});

class MainView extends React.Component {
    handleSubmit = data => {
        const { apiClient, accessToken } = this.props;

        return apiClient.updatePhoneNumber({
            ...data,
            accessToken
        }).then(_ => data);
    };

    handleSuccess = data => this.props.goTo('verificationCode', data);

    render() {
        const PhoneNumberInputForm = phoneNumberInputForm(this.props.config);

        return <div>
            <Intro>{this.props.i18n('phoneNumberEditor.intro')}</Intro>
            <PhoneNumberInputForm
                showLabels={this.props.showLabels}
                 handler={this.handleSubmit}
                 onSuccess={this.handleSuccess} />
        </div>;
    }
}

class VerificationCodeView extends React.Component {
    static defaultProps = {
        onSuccess: () => { },
        onError: () => { }
    };

    handleSubmit = data => {
        const { apiClient, accessToken, phoneNumber } = this.props;

        return apiClient.verifyPhoneNumber({ ...data, phoneNumber, accessToken });
    };

    render() {
        const { onSuccess, onError } = this.props;

        return <div>
            <Info>{this.props.i18n('phoneNumberEditor.verification.intro')}</Info>
            <VerificationCodeInputForm
                handler={this.handleSubmit}
                onSuccess={onSuccess}
                onError={onError} />
        </div>
    }
}

export default createMultiViewWidget({
    initialView: 'main',
    views: {
        main: MainView,
        verificationCode: VerificationCodeView,
    }
});
