import React from 'react';

import pick from 'lodash-es/pick';
import omit from 'lodash-es/omit';

import { parseQueryString } from '../../helpers/queryString'

import { Heading, Info, Link } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { PasswordEditorForm } from '../passwordEditor/passwordEditorWidget'

class MainView extends React.Component {
    static defaultProps = {
        onSuccess: () => { },
        onError: () => { }
    };

    handleSubmit = data => {
        return this.props.apiClient.updatePassword({
            ...omit(data, ['passwordConfirmation']),
            ...this.props.authentication
        });
    };

    onSuccess = () => {
        this.props.onSuccess();
        this.props.goTo('success');
    };

    render() {
        const { i18n } = this.props;

        return <div>
            <Heading>{i18n('passwordReset.title')}</Heading>
            <Info>{i18n('passwordReset.intro')}</Info>
            <PasswordEditorForm
                handler={this.handleSubmit}
                canShowPassword={this.props.canShowPassword}
                showLabels={this.props.showLabels}
                onSuccess={this.onSuccess}
                onError={this.props.onError} />
        </div>;
    }
}

const SuccessView = ({ i18n, loginLink }) => (
    <div>
        <Heading>{i18n('passwordReset.successTitle')}</Heading>
        <Info>{i18n('passwordReset.successMessage')}</Info>
        {loginLink && (
            <Info>
                <Link href={loginLink}>{i18n('passwordReset.loginLink')}</Link>
            </Info>
        )}
    </div>
);

const resolveCode = () => {
    const qs = (window.location.search && window.location.search.length)
        ? window.location.search.substr(1)
        : '';

    return { authentication: pick(parseQueryString(qs), ['verificationCode', 'email', 'purpose']) };
};

export default createMultiViewWidget({
    initialView: 'main',
    views: {
        main: MainView,
        success: SuccessView
    },
    prepare: options => ({
        ...options,
        ...resolveCode()
    })
});
