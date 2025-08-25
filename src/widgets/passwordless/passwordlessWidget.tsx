import React, { ComponentProps, useLayoutEffect } from 'react';

import { AuthOptions, AuthResult, SingleFactorPasswordlessParams } from '@reachfive/identity-core';

import { CaptchaProvider, WithCaptchaProps, type WithCaptchaToken } from '../../components/captcha';
import phoneNumberField, {
    type PhoneNumberOptions,
} from '../../components/form/fields/phoneNumberField';
import { simpleField } from '../../components/form/fields/simpleField';
import { createForm } from '../../components/form/formComponent';
import { SocialButtons } from '../../components/form/socialButtonsComponent';
import { Info, Intro, Separator } from '../../components/miscComponent';
import { importGoogleRecaptchaScript } from '../../components/reCaptcha';
import { createMultiViewWidget } from '../../components/widget/widget';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { email } from '../../core/validation';

import type { Config, OnError, OnSuccess, Prettify } from '../../types';

type EmailFormData = { email: string; captchaToken?: string };

const EmailInputForm = createForm<EmailFormData>({
    prefix: 'r5-passwordless-',
    fields: [
        simpleField({
            key: 'email',
            label: 'email',
            type: 'email',
            validator: email,
        }),
    ],
});

type PhoneNumberFormData = { phoneNumber: string; captchaToken?: string };

const phoneNumberInputForm = (config: Config) =>
    createForm<PhoneNumberFormData, { phoneNumberOptions?: PhoneNumberOptions }>({
        prefix: 'r5-passwordless-sms-',
        fields: ({ phoneNumberOptions }) => [
            phoneNumberField(
                {
                    required: true,
                    ...phoneNumberOptions,
                },
                config
            ),
        ],
    });

type VerificationCodeFormData = { verificationCode: string };

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

interface MainViewProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: SingleFactorPasswordlessParams['authType'];
    /**
     * Show the introduction text.
     * @default true
     */
    showIntro?: boolean;
    /**
     * Show the social login buttons.
     * @default false
     */
    showSocialLogins?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip:  If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

const MainView = ({
    auth,
    authType = 'magic_link',
    recaptcha_enabled = false,
    recaptcha_site_key,
    captchaFoxEnabled = false,
    captchaFoxMode = 'hidden',
    captchaFoxSiteKey,
    showIntro = true,
    showSocialLogins = false,
    socialProviders,
    phoneNumberOptions,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: WithCaptchaProps<MainViewProps>) => {
    const { client: coreClient, config } = useReachfive();
    const i18n = useI18n();
    const { goTo } = useRouting();

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    const callback = (data: WithCaptchaToken<EmailFormData | PhoneNumberFormData>) =>
        coreClient
            .startPasswordless(
                {
                    authType,
                    ...data,
                },
                auth
            )
            .then(() => data);

    const handleSuccess = (data: EmailFormData | PhoneNumberFormData) => {
        onSuccess({ name: 'otp_sent', authType });
        if ('email' in data) {
            goTo('emailSent');
        } else {
            goTo<VerificationCodeViewState>('verificationCode', data);
        }
    };

    const isEmail = authType === 'magic_link';
    const PhoneNumberInputForm = phoneNumberInputForm(config);

    return (
        <div>
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <SocialButtons
                    providers={socialProviders}
                    auth={auth}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            )}
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <Separator text={i18n('or')} />
            )}
            {isEmail && showIntro && <Intro>{i18n('passwordless.intro')}</Intro>}
            {isEmail && (
                <CaptchaProvider
                    recaptcha_enabled={recaptcha_enabled}
                    recaptcha_site_key={recaptcha_site_key}
                    captchaFoxEnabled={captchaFoxEnabled}
                    captchaFoxSiteKey={captchaFoxSiteKey}
                    captchaFoxMode={captchaFoxMode}
                    action="passwordless_email"
                >
                    <EmailInputForm
                        handler={callback}
                        onSuccess={handleSuccess}
                        onError={onError}
                    />
                </CaptchaProvider>
            )}
            {!isEmail && showIntro && <Intro>{i18n('passwordless.sms.intro')}</Intro>}
            {!isEmail && (
                <CaptchaProvider
                    recaptcha_enabled={recaptcha_enabled}
                    recaptcha_site_key={recaptcha_site_key}
                    captchaFoxEnabled={captchaFoxEnabled}
                    captchaFoxSiteKey={captchaFoxSiteKey}
                    captchaFoxMode={captchaFoxMode}
                    action="passwordless_phone"
                >
                    <PhoneNumberInputForm
                        handler={callback}
                        onSuccess={handleSuccess}
                        onError={onError}
                        phoneNumberOptions={phoneNumberOptions}
                    />
                </CaptchaProvider>
            )}
        </div>
    );
};

interface VerificationCodeViewProps {
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

type VerificationCodeViewState = {
    phoneNumber: string;
};

const VerificationCodeView = ({
    authType = 'magic_link',
    recaptcha_enabled = false,
    recaptcha_site_key,
    captchaFoxEnabled = false,
    captchaFoxMode = 'hidden',
    captchaFoxSiteKey,
    onSuccess = (() => {}) as OnSuccess,
    onError = (() => {}) as OnError,
}: WithCaptchaProps<VerificationCodeViewProps>) => {
    const { client: coreClient } = useReachfive();
    const i18n = useI18n();
    const { params } = useRouting();
    const { phoneNumber } = params as VerificationCodeViewState;

    const handleSubmit = (data: WithCaptchaToken<VerificationCodeFormData>) => {
        return coreClient
            .verifyPasswordless({
                authType,
                phoneNumber,
                ...data,
            })
            .then(result => {
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
            })
            .catch(onError);
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

const EmailSentView = () => {
    const i18n = useI18n();
    return <Info>{i18n('passwordless.emailSent')}</Info>;
};

export type PasswordlessWidgetProps = Prettify<
    ComponentProps<typeof MainView> & ComponentProps<typeof VerificationCodeView>
>;

export default createMultiViewWidget<PasswordlessWidgetProps>({
    initialView: 'main',
    views: {
        main: MainView,
        emailSent: EmailSentView,
        verificationCode: VerificationCodeView,
    },
    prepare: (options, { config }) => ({
        socialProviders: config.socialProviders,
        ...options,
    }),
});
