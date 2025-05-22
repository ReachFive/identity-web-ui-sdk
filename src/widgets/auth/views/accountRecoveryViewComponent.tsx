import { RequestAccountRecoveryParams } from '@reachfive/identity-core/es/main/profileClient';
import React, { useCallback, useLayoutEffect } from 'react';

import { isAppError } from '../../../helpers/errors';

import { Alternative, Heading, Info, Intro, Link } from '../../../components/miscComponent';
import { email } from '../../../core/validation';

import { simpleField } from '../../../components/form/fields/simpleField';
import { createForm } from '../../../components/form/formComponent';
import ReCaptcha, { importGoogleRecaptchaScript } from '../../../components/reCaptcha';

import { useI18n } from '../../../contexts/i18n';
import { useReachfive } from '../../../contexts/reachfive';
import { useRouting } from '../../../contexts/routing';

import type { OnError, OnSuccess } from '../../../types'

const AccountRecoveryForm = createForm<RequestAccountRecoveryParams>({
    prefix: 'r5-account-recovery-',
    fields: [
        simpleField({
            key: 'email',
            label: 'email',
            type: 'email',
            validator: email,
        }),
    ],
    submitLabel: 'accountRecovery.submitLabel',
});

const skipError = (error: unknown) =>
    isAppError(error) ? error.error === 'resource_not_found' : false;

export interface AccountRecoveryViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean;
    /**
     * Whether or not to display a safe error message on password reset, given an invalid email address.
     * This mode ensures not to leak email addresses registered to the platform.
     *
     * @default false
     */
    displaySafeErrorMessage?: boolean;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used to redirect users to a specific URL after a credentials reset.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterAccountRecovery?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export const AccountRecoveryView = ({
    allowLogin = true,
    displaySafeErrorMessage = false,
    showLabels = false,
    recaptcha_enabled = false,
    recaptcha_site_key,
    redirectUrl,
    returnToAfterAccountRecovery,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: AccountRecoveryViewProps) => {
    const coreClient = useReachfive();
    const { goTo } = useRouting();
    const i18n = useI18n();

    const callback = useCallback(
        (data: RequestAccountRecoveryParams) =>
            ReCaptcha.handle(
                { ...data, redirectUrl, returnToAfterAccountRecovery },
                { recaptcha_enabled, recaptcha_site_key },
                coreClient.requestAccountRecovery,
                'account_recovery'
            ),
        [
            coreClient,
            recaptcha_enabled,
            recaptcha_site_key,
            redirectUrl,
            returnToAfterAccountRecovery,
        ]
    );

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    return (
        <div>
            <Heading>{i18n('accountRecovery.title')}</Heading>
            <Intro>{i18n('accountRecovery.prompt')}</Intro>
            <AccountRecoveryForm
                showLabels={showLabels}
                handler={callback}
                onSuccess={() => {
                    onSuccess();
                    goTo('account-recovery-success');
                }}
                onError={onError}
                skipError={displaySafeErrorMessage && skipError}
            />
            {allowLogin && (
                <Alternative>
                    <Link target={'login'}>{i18n('accountRecovery.backToLoginLink')}</Link>
                </Alternative>
            )}
        </div>
    );
};

export interface AccountRecoverySuccessViewProps {
    allowLogin?: boolean;
}

export const AccountRecoverySuccessView = ({ allowLogin }: AccountRecoverySuccessViewProps) => {
    const i18n = useI18n();
    return (
        <div>
            <Heading>{i18n('accountRecovery.title')}</Heading>
            <Info>{i18n('accountRecovery.successMessage')}</Info>
            {allowLogin && (
                <Alternative>
                    <Link target={'login'}>{i18n('back')}</Link>
                </Alternative>
            )}
        </div>
    );
};
