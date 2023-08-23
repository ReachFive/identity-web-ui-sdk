import React from 'react';

import { email } from '../../core/validation';

import { createMultiViewWidget } from '../../components/widget/widget';
import { Info, Intro } from '../../components/miscComponent';
import { createForm } from '../../components/form/formComponent';
import { simpleField } from '../../components/form/fields/simpleField';
import ReCaptcha, {importGoogleRecaptchaScript} from '../../components/reCaptcha'

const EmailEditorForm = createForm({
    prefix: 'r5-email-editor-',
    supportMultipleSubmits: true,
    fields: [
        simpleField({
            key: 'email',
            label: 'email',
            type: 'email',
            validator: email
        })
    ]
});

class MainView extends React.Component {
    componentDidMount () {
        importGoogleRecaptchaScript(this.props.recaptcha_site_key)
    }

    callback = data => {
        const { apiClient, accessToken, redirectUrl } = this.props;

        return apiClient.updateEmail({ ...data, accessToken, redirectUrl });
    }

    handleSuccess = () => this.props.goTo('success');

    render() {
        return <div>
            <Intro>{this.props.i18n('emailEditor.intro')}</Intro>
            <EmailEditorForm
                showLabels={this.props.showLabels}
                handler={(data) => ReCaptcha.handle(data, this.props, this.callback, "update_email")}
                onSuccess={this.handleSuccess} />
        </div>;
    }
}

const SuccessView = ({ i18n }) => <Info>{i18n('emailEditor.successMessage')}</Info>;

export default createMultiViewWidget({
    initialView: 'main',
    views: {
        main: MainView,
        success: SuccessView
    }
});
