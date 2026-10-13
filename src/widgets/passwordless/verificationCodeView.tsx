import React from 'react';

import { AuthOptions } from '@reachfive/identity-core';

import { CaptchaProvider, WithCaptchaProps, type WithCaptchaToken } from '@/components/captcha';
import { Form } from '@/components/form/form';
import { Info } from '@/components/miscComponent';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useRouting } from '@/contexts/routing';
import { OnError, OnSuccess } from '@/types';

export interface VerificationCodeViewProps {
    /**
     * List of authentication options, used again when a new code is sent.
     */
    auth?: AuthOptions;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export type VerificationCodeViewState =
    | {
          authType: 'sms';
          phoneNumber: string;
      }
    | {
          authType: 'magic_link';
          email: string;
      };

export type VerificationCodeFormData = { verificationCode: string };

export const VerificationCodeView = ({
    auth,
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
    const state = params as VerificationCodeViewState;
    const captcha = {
        recaptcha_enabled,
        recaptcha_site_key,
        captchaFoxEnabled,
        captchaFoxSiteKey,
        captchaFoxMode,
    };

    const handleSubmit = async (data: WithCaptchaToken<VerificationCodeFormData>) => {
        const result = await coreClient.verifyPasswordless({
            ...state,
            ...data,
        });
        onSuccess({
            name: 'login',
            authResult: result ?? {},
            authType: state.authType,
            identifierType: state.authType === 'sms' ? 'phone_number' : 'email',
        });
    };

    // the same request as the one which sent the first code, `passwordlessView` included
    const handleResend = async ({ captchaToken }: { captchaToken?: string }) => {
        const identifier =
            state.authType === 'sms'
                ? { authType: 'sms' as const, phoneNumber: state.phoneNumber }
                : { authType: 'magic_link' as const, email: state.email };
        await coreClient
            .startPasswordless({ ...identifier, captchaToken }, auth)
            .catch((error: unknown) => {
                onError(error);
                throw error;
            });
        onSuccess({ name: 'otp_sent', authType: state.authType });
    };

    return (
        <div>
            <CaptchaProvider {...captcha} action={`verify_passwordless_${state.authType}`}>
                <Info>
                    {state.authType === 'sms'
                        ? i18n('passwordless.sms.verification.intro')
                        : i18n('passwordless.email.verification.intro')}
                </Info>
                <Form
                    fields={[
                        {
                            key: 'verification_code',
                            onResend: handleResend,
                            resendCaptcha: {
                                ...captcha,
                                action:
                                    state.authType === 'sms'
                                        ? 'passwordless_phone'
                                        : 'passwordless_email',
                            },
                        },
                    ]}
                    handler={handleSubmit}
                    onError={onError}
                />
            </CaptchaProvider>
        </div>
    );
};
