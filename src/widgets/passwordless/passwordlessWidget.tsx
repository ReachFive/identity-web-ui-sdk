import React, { useLayoutEffect } from 'react';
import { AuthOptions, SingleFactorPasswordlessParams } from '@reachfive/identity-core';

import type { Config, Prettify } from '../../types';

import { email } from '../../core/validation';

import { createMultiViewWidget } from '../../components/widget/widget';
import { Info, Intro, Separator } from '../../components/miscComponent';

import { createForm } from '../../components/form/formComponent';
import { simpleField } from '../../components/form/fields/simpleField';
import phoneNumberField from '../../components/form/fields/phoneNumberField';
import { SocialButtons } from '../../components/form/socialButtonsComponent';
import ReCaptcha, { importGoogleRecaptchaScript, type WithCaptchaToken } from '../../components/reCaptcha';

import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { useI18n } from '../../contexts/i18n';
import { useConfig } from '../../contexts/config';

import CountrySelector from '../../components/form/fields/CountrySelector';


type EmailFormData = { email: string, captchaToken?: string }

const EmailInputForm = createForm<EmailFormData>({
    prefix: 'r5-passwordless-',
    fields: [
        simpleField({
            key: 'email',
            label: 'email',
            type: 'email',
            validator: email
        })
    ]
});

type PhoneNumberFormFata = { phoneNumber: string, captchaToken?: string }

const phoneNumberInputForm = (config: Config) => createForm<PhoneNumberFormFata>({
    prefix: 'r5-passwordless-sms-',
    fields: [
        { component: CountrySelector, key: 'countryCode', label: 'Country Code' },
        phoneNumberField({ required: true }, config)
    ]
});

type VerificationCodeFormData = { verificationCode: string }

const VerificationCodeInputForm = createForm<VerificationCodeFormData>({
    prefix: 'r5-passwordless-sms-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ]
});

interface MainViewProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: SingleFactorPasswordlessParams['authType']
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
     * Show the introduction text.
     * @default true
     */
    showIntro?: boolean
    /**
     * Show the social login buttons.
     * @default false
     */
    showSocialLogins?: boolean
    /**
     * Lists the available social providers. This is an array of strings.
     * 
     * Tip:  If you pass an empty array, social providers will not be displayed. 
     */
    socialProviders?: string[]
}

const MainView = ({
    auth,
    authType = 'magic_link',
    recaptcha_enabled = false,
    recaptcha_site_key,
    showIntro = true,
    showSocialLogins = false,
    socialProviders,
}: MainViewProps) => {
    const coreClient = useReachfive()
    const config = useConfig()
    const i18n = useI18n()
    const { goTo } = useRouting()

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key)
    }, [recaptcha_site_key])

    const callback = (data: WithCaptchaToken<EmailFormData | PhoneNumberFormFata>) =>
        coreClient.startPasswordless({
            authType,
            ...data,
        }, auth)
            .then(() => data);

    const handleSuccess = (data: EmailFormData | PhoneNumberFormFata) =>
        'email' in data
            ? goTo('emailSent')
            : goTo<VerificationCodeViewState>('verificationCode', data)

    const isEmail = authType === 'magic_link';
    const PhoneNumberInputForm = phoneNumberInputForm(config);

    return (
        <div>
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <SocialButtons providers={socialProviders} auth={auth} />
            )}
            {showSocialLogins && socialProviders && socialProviders.length > 0 && (
                <Separator text={i18n('or')} />
            )}
            {isEmail && showIntro && <Intro>{i18n('passwordless.intro')}</Intro>}
            {isEmail && <EmailInputForm
                handler={(data: EmailFormData) => ReCaptcha.handle(data, { recaptcha_enabled, recaptcha_site_key }, callback, "passwordless_email")}
                onSuccess={handleSuccess}
            />}
            {!isEmail && showIntro && <Intro>{i18n('passwordless.sms.intro')}</Intro>}
            {!isEmail && <PhoneNumberInputForm
                handler={(data: PhoneNumberFormFata) => ReCaptcha.handle(data, { recaptcha_enabled, recaptcha_site_key }, callback, "passwordless_phone")}
                onSuccess={handleSuccess}
            />}
        </div>
    )
}

interface VerificationCodeViewProps {
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: SingleFactorPasswordlessParams['authType']
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string
}

type VerificationCodeViewState = {
    phoneNumber: string
}

const VerificationCodeView = ({
    authType = 'magic_link',
    recaptcha_enabled = false,
    recaptcha_site_key,
}: VerificationCodeViewProps) => {
    const coreClient = useReachfive()
    const i18n = useI18n()
    const { params } = useRouting()
    const { phoneNumber } = params as VerificationCodeViewState

    const handleSubmit = (data: WithCaptchaToken<VerificationCodeFormData>) => {
        return coreClient.verifyPasswordless({
            authType,
            phoneNumber,
            ...data
        });
    };

    return (
        <div>
            <Info>{i18n('passwordless.sms.verification.intro')}</Info>
            <VerificationCodeInputForm
                handler={(data: VerificationCodeFormData) => ReCaptcha.handle(data, { recaptcha_enabled, recaptcha_site_key }, handleSubmit, "verify_passwordless_sms")}
            />
        </div>
    )
}

const EmailSentView = () => {
    const i18n = useI18n()
    return <Info>{i18n('passwordless.emailSent')}</Info>
}

export type PasswordlessWidgetProps = Prettify<MainViewProps & VerificationCodeViewProps>

export default createMultiViewWidget<PasswordlessWidgetProps>({
    initialView: 'main',
    views: {
        main: MainView,
        emailSent: EmailSentView,
        verificationCode: VerificationCodeView
    },
    prepare: (options, { config }) => ({
        socialProviders: config.socialProviders,
        ...options
    })
})
