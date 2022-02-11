import React from 'react';

import { withHandlers } from '@hypnosphi/recompose';

import { email } from '../../../core/validation';
import { Heading, Intro, Info, Link, Alternative } from '../../../components/miscComponent';

import { createForm } from '../../../components/form/formComponent';
import { simpleField } from '../../../components/form/fields/simpleField';
import ReCaptcha, {importGoogleRecaptchaScript} from '../../../components/reCaptcha';

const ForgotPasswordForm = createForm({
    prefix: 'r5-forgot-password-',
    fields: [
        simpleField({
            key: 'email',
            label: 'email',
            type: 'email',
            validator: email
        })
    ],
    submitLabel: 'forgotPassword.submitLabel'
});

const skipError = err => err.error === 'resource_not_found';

const enhance = withHandlers({
    callback: ({
                   apiClient,
                   redirectUrl,
                   returnToAfterPasswordReset,
                   recaptcha_enabled,
                   recaptcha_site_key
               }) => data => ReCaptcha.handle({...data, redirectUrl, returnToAfterPasswordReset}, {
        apiClient,
        redirectUrl,
        returnToAfterPasswordReset,
        recaptcha_enabled,
        recaptcha_site_key
    }, apiClient.requestPasswordReset),
    handleSubmit: ({
                       apiClient,
                       redirectUrl,
                       returnToAfterPasswordReset
                   }) => data => apiClient.requestPasswordReset({...data, redirectUrl, returnToAfterPasswordReset})
});

export const ForgotPasswordView = enhance(({ i18n, goTo, allowLogin, callback, displaySafeErrorMessage, showLabels, allowWebAuthnLogin, recaptcha_site_key }) => (
    <div>
        {importGoogleRecaptchaScript(recaptcha_site_key)}
        <Heading>{i18n('forgotPassword.title')}</Heading>
        <Intro>{i18n('forgotPassword.prompt')}</Intro>
        <ForgotPasswordForm
            showLabels={showLabels}
            handler={callback}
            onSuccess={() => goTo('forgot-password-success')}
            skipError={displaySafeErrorMessage && skipError} />
        {allowLogin && <Alternative>
            <Link target={allowWebAuthnLogin ? 'login-with-web-authn' : 'login'}>{i18n('forgotPassword.backToLoginLink')}</Link>
        </Alternative>}
    </div>
));

export const ForgotPasswordSuccessView = ({ i18n, allowLogin, allowWebAuthnLogin }) => (
    <div>
        <Heading>{i18n('forgotPassword.title')}</Heading>
        <Info>{i18n('forgotPassword.successMessage')}</Info>
        {allowLogin && <Alternative>
            <Link target={allowWebAuthnLogin ? 'login-with-web-authn' : 'login'}>{i18n('back')}</Link>
        </Alternative>}
    </div>
);
