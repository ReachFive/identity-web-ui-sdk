import React from 'react';

import { email } from '../../core/validation';

import { createMultiViewWidget } from '../../components/widget/widget';
import { Info, Intro } from '../../components/miscComponent';
import { createForm } from '../../components/form/formComponent';
import { simpleField } from '../../components/form/fields/simpleField';

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
    handleSubmit = data => {
        const { apiClient, accessToken, redirectUrl } = this.props;

        return apiClient.updateEmail({
            ...data,
            accessToken,
            redirectUrl: redirectUrl
        });
    }

    handleSuccess = () => this.props.goTo('success');

    render() {
        const { i18n } = this.props;

        return <div>
            <Intro>{i18n('emailEditor.intro')}</Intro>
            <EmailEditorForm handler={this.handleSubmit} onSuccess={this.handleSuccess} />
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
