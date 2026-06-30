import React from 'react';

import { CaptchaProvider, WithCaptchaProps, type WithCaptchaToken } from '@/components/captcha';
import { Form } from '@/components/form/form';
import { Info } from '@/components/miscComponent';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useRouting } from '@/contexts/routing';
import { OnError, OnSuccess } from '@/types';

export interface VerificationCodeViewProps {
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

    return (
        <div>
            <CaptchaProvider
                recaptcha_enabled={recaptcha_enabled}
                recaptcha_site_key={recaptcha_site_key}
                captchaFoxEnabled={captchaFoxEnabled}
                captchaFoxSiteKey={captchaFoxSiteKey}
                captchaFoxMode={captchaFoxMode}
                action={`verify_passwordless_${state.authType}`}
            >
                <Info>
                    {state.authType === 'sms'
                        ? i18n('passwordless.sms.verification.intro')
                        : i18n('passwordless.email.verification.intro')}
                </Info>
                <Form
                    fields={[
                        {
                            key: 'verification_code',
                            label: 'verificationCode',
                            type: 'string',
                        },
                    ]}
                    handler={handleSubmit}
                    onError={onError}
                />
            </CaptchaProvider>
        </div>
    );
};
