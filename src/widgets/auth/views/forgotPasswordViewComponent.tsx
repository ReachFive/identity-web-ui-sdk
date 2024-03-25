import React, { useCallback, useLayoutEffect } from 'react';
import { RequestPasswordResetParams } from '@reachfive/identity-core/es/main/profileClient';

import { AppError, isAppError } from '../../../helpers/errors'

import { email } from '../../../core/validation';
import { Heading, Intro, Info, Link, Alternative } from '../../../components/miscComponent';

import { createForm } from '../../../components/form/formComponent';
import { simpleField } from '../../../components/form/fields/simpleField';
import ReCaptcha, {importGoogleRecaptchaScript} from '../../../components/reCaptcha';

import { useI18n } from '../../../contexts/i18n'
import { useRouting } from '../../../contexts/routing';
import { useReachfive } from '../../../contexts/reachfive';

const ForgotPasswordForm = createForm<RequestPasswordResetParams>({
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

const skipError = (err: AppError | Error | string) =>
    isAppError(err) && err.error === 'resource_not_found';

export interface ForgotPasswordViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean
    /**
     * Whether or not to display a safe error message on password reset, given an invalid email address.
     * This mode ensures not to leak email addresses registered to the platform.
     *
     * @default false
     */
    displaySafeErrorMessage?: boolean
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string,
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used to redirect users to a specific URL after a password reset.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterPasswordReset?: string,
}

export const ForgotPasswordView = ({
    allowLogin = true,
    displaySafeErrorMessage = false,
    showLabels = false,
    recaptcha_enabled = false,
    recaptcha_site_key,
    redirectUrl,
    returnToAfterPasswordReset,
}: ForgotPasswordViewProps) => {
    const coreClient = useReachfive()
    const { goTo } = useRouting()
    const i18n = useI18n()

    const callback = useCallback((data: RequestPasswordResetParams) =>
        ReCaptcha.handle(
            {...data, redirectUrl, returnToAfterPasswordReset},
            { recaptcha_enabled, recaptcha_site_key },
            coreClient.requestPasswordReset,
            "forgot_password"
        ),
        [coreClient, recaptcha_enabled, recaptcha_site_key, redirectUrl, returnToAfterPasswordReset]
    )

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key)
    }, [recaptcha_site_key])

    return (
        <div>
            <Heading>{i18n('forgotPassword.title')}</Heading>
            <Intro>{i18n('forgotPassword.prompt')}</Intro>
            <ForgotPasswordForm
                showLabels={showLabels}
                handler={callback}
                onSuccess={() => goTo('forgot-password-success')}
                skipError={displaySafeErrorMessage && skipError} />
            {allowLogin && <Alternative>
                <Link target={'login'}>{i18n('forgotPassword.backToLoginLink')}</Link>
            </Alternative>}
        </div>
    )
}

export interface ForgotPasswordSuccessViewProps {
    allowLogin?: boolean
}

export const ForgotPasswordSuccessView = ({ allowLogin }: ForgotPasswordSuccessViewProps) => {
    const i18n = useI18n()
    return (
        <div>
            <Heading>{i18n('forgotPassword.title')}</Heading>
            <Info>{i18n('forgotPassword.successMessage')}</Info>
            {allowLogin && <Alternative>
                <Link target={'login'}>{i18n('back')}</Link>
            </Alternative>}
        </div>
    )
}
