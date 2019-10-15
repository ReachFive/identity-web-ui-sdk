import React from 'react';

import { withHandlers } from 'recompose';

import { email } from '../../../core/validation';
import { Heading, Intro, Info, Link, Alternative } from '../../../components/miscComponent';

import { createForm } from '../../../components/form/formComponent';
import { simpleField } from '../../../components/form/fields/simpleField';

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
    handleSubmit: ({ apiClient, redirectUrl }) => data => apiClient.requestPasswordReset({ ...data, redirectUrl })
});

export const ForgotPasswordView = enhance(({ i18n, goTo, allowLogin, handleSubmit, displaySafeErrorMessage, showLabels }) => (
    <div>
        <Heading>{i18n('forgotPassword.title')}</Heading>
        <Intro>{i18n('forgotPassword.prompt')}</Intro>
        <ForgotPasswordForm
            showLabels={showLabels}
            handler={handleSubmit}
            onSuccess={() => goTo('forgot-password-success')}
            skipError={displaySafeErrorMessage && skipError} />
        {allowLogin && <Alternative>
            <Link target="login">{i18n('forgotPassword.backToLoginLink')}</Link>
        </Alternative>}
    </div>
));

export const ForgotPasswordSuccessView = ({ i18n, allowLogin }) => (
    <div>
        <Heading>{i18n('forgotPassword.title')}</Heading>
        <Info>{i18n('forgotPassword.successMessage')}</Info>
        {allowLogin && <Alternative>
            <Link target="login">{i18n('back')}</Link>
        </Alternative>}
    </div>
);
