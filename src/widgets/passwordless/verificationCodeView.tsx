import React from 'react';

import { AuthResult, SingleFactorPasswordlessParams } from '@reachfive/identity-core';

import { CaptchaProvider, WithCaptchaProps, type WithCaptchaToken } from '@/components/captcha';
import { simpleField } from '@/components/form/fields/simpleField';
import { createForm } from '@/components/form/formComponent';
import { Info } from '@/components/miscComponent';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useRouting } from '@/contexts/routing';
import { OnError, OnSuccess } from '@/types';

export interface VerificationCodeViewProps {
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: SingleFactorPasswordlessParams['authType'];
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export type VerificationCodeViewState = {
    phoneNumber: string;
};

export type VerificationCodeFormData = { verificationCode: string };

const VerificationCodeInputForm = createForm<VerificationCodeFormData>({
    prefix: 'r5-passwordless-sms-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text',
        }),
    ],
});

export const VerificationCodeView = ({
    authType = 'magic_link',
    recaptcha_enabled = false,
    recaptcha_site_key,
    captchaFoxEnabled = false,
    captchaFoxMode = 'hidden',
    captchaFoxSiteKey,
    onSuccess = (() => {}) as OnSuccess,
    onError = (() => {}) as OnError,
}: WithCaptchaProps<VerificationCodeViewProps>) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { params } = useRouting();
    const { phoneNumber } = params as VerificationCodeViewState;

    const handleSubmit = async (data: WithCaptchaToken<VerificationCodeFormData>) => {
        try {
            const result = await coreClient.verifyPasswordless({
                authType,
                phoneNumber,
                ...data,
            });
            if (AuthResult.isAuthResult(result)) {
                onSuccess({
                    name: 'login',
                    authResult: result,
                    authType,
                    identifierType: 'phone_number',
                });
            } else {
                onError();
            }
        } catch (error) {
            onError(error);
        }
    };

    return (
        <div>
            <CaptchaProvider
                recaptcha_enabled={recaptcha_enabled}
                recaptcha_site_key={recaptcha_site_key}
                captchaFoxEnabled={captchaFoxEnabled}
                captchaFoxSiteKey={captchaFoxSiteKey}
                captchaFoxMode={captchaFoxMode}
                action="verify_passwordless_sms"
            >
                <Info>{i18n('passwordless.sms.verification.intro')}</Info>
                <VerificationCodeInputForm handler={handleSubmit} onError={onError} />
            </CaptchaProvider>
        </div>
    );
};
