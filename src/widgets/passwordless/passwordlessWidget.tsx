import { AuthOptions, AuthResult, SingleFactorPasswordlessParams } from '@reachfive/identity-core';
import React, { useLayoutEffect } from 'react';

import type { Config, OnError, OnSuccess, Prettify } from '../../types';

import { email } from '../../core/validation';

import { Info, Intro, Separator } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';

import phoneNumberField, {
    type PhoneNumberOptions,
} from '../../components/form/fields/phoneNumberField';
import { simpleField } from '../../components/form/fields/simpleField';
import { createForm } from '../../components/form/formComponent';
import { SocialButtons } from '../../components/form/socialButtonsComponent';
import { importGoogleRecaptchaScript } from '../../components/reCaptcha';

import { getCaptchaHandler, type WithCaptchaToken } from '../../components/captcha';

import R5CaptchaFox, { CaptchaFoxMode } from '../../components/captchaFox';
import { useConfig } from '../../contexts/config';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';

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

type PhoneNumberFormFata = { phoneNumber: string; captchaToken?: string };

const phoneNumberInputForm = (config: Config) =>
    createForm<PhoneNumberFormFata, { phoneNumberOptions?: PhoneNumberOptions }>({
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
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * Boolean that specifies whether CaptchaFox is enabled or not.
     */
    captchaFoxEnabled?: boolean;
    /**
     * The SITE key that comes from your [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys) setup.
     * This must be paired with the appropriate secret key that you received when setting up CaptchaFox.
     */
    captchaFoxSiteKey?: string;
    /**
     * Define how CaptchaFox is displayed (hidden|inline|popup)/ Default to hidden.
     */
    captchaFoxMode?: CaptchaFoxMode;
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
}: MainViewProps) => {
    const coreClient = useReachfive();
    const config = useConfig();
    const i18n = useI18n();
    const { goTo } = useRouting();

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    const callback = (data: WithCaptchaToken<EmailFormData | PhoneNumberFormFata>) =>
        coreClient
            .startPasswordless(
                {
                    authType,
                    ...data,
                },
                auth
            )
            .then(() => data);

    const handleSuccess = (data: EmailFormData | PhoneNumberFormFata) => {
        if ('email' in data) {
            onSuccess();
            goTo('emailSent');
        } else {
            goTo<VerificationCodeViewState>('verificationCode', data);
        }
    };

    const isEmail = authType === 'magic_link';
    const PhoneNumberInputForm = phoneNumberInputForm(config);

    const captchaFox = new R5CaptchaFox(captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey);
    const handleCaptcha = getCaptchaHandler(
        {
            recaptchaEnabled: recaptcha_enabled,
            recaptchaSiteKey: recaptcha_site_key,
            captchaFoxEnabled: captchaFoxEnabled,
            captchaFoxInstance: captchaFox,
        },
        callback
    );

    return (
        <div>
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <SocialButtons providers={socialProviders} auth={auth} />
            )}
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <Separator text={i18n('or')} />
            )}
            {isEmail && showIntro && <Intro>{i18n('passwordless.intro')}</Intro>}
            {isEmail && (
                <EmailInputForm
                    handler={data => handleCaptcha(data, 'passwordless_email')}
                    captchaFox={captchaFox}
                    onSuccess={handleSuccess}
                    onError={onError}
                />
            )}
            {!isEmail && showIntro && <Intro>{i18n('passwordless.sms.intro')}</Intro>}
            {!isEmail && (
                <PhoneNumberInputForm
                    handler={data => handleCaptcha(data, 'passwordless_phone')}
                    captchaFox={captchaFox}
                    onSuccess={handleSuccess}
                    onError={onError}
                    phoneNumberOptions={phoneNumberOptions}
                />
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
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * Boolean that specifies whether CaptchaFox is enabled or not.
     */
    captchaFoxEnabled?: boolean;
    /**
     * The SITE key that comes from your [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys) setup.
     * This must be paired with the appropriate secret key that you received when setting up CaptchaFox.
     */
    captchaFoxSiteKey?: string;
    /**
     * Define how CaptchaFox is displayed (hidden|inline|popup)/ Default to hidden.
     */
    captchaFoxMode?: CaptchaFoxMode;
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
}: VerificationCodeViewProps) => {
    const coreClient = useReachfive();
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
                    onSuccess();
                } else {
                    onError();
                }
            });
    };

    const captchaFox = new R5CaptchaFox(captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey);
    const handleCaptcha = getCaptchaHandler(
        {
            recaptchaEnabled: recaptcha_enabled,
            recaptchaSiteKey: recaptcha_site_key,
            captchaFoxEnabled: captchaFoxEnabled,
            captchaFoxInstance: captchaFox,
        },
        handleSubmit
    );

    return (
        <div>
            <Info>{i18n('passwordless.sms.verification.intro')}</Info>
            <VerificationCodeInputForm
                handler={data => handleCaptcha(data, 'verify_passwordless_sms')}
                captchaFox={captchaFox}
                onError={onError}
            />
        </div>
    );
};

const EmailSentView = () => {
    const i18n = useI18n();
    return <Info>{i18n('passwordless.emailSent')}</Info>;
};

export type PasswordlessWidgetProps = Prettify<MainViewProps & VerificationCodeViewProps>;

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
