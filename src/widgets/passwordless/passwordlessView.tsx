import React, { useLayoutEffect } from 'react';

import { AuthOptions, SingleFactorPasswordlessParams } from '@reachfive/identity-core';

import { CaptchaProvider, WithCaptchaProps, type WithCaptchaToken } from '@/components/captcha';
import { Form } from '@/components/form/form';
import { Intro, Separator } from '@/components/miscComponent';
import { importGoogleRecaptchaScript } from '@/components/reCaptcha';
import { SocialButtons } from '@/components/slo/social-buttons';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useRouting } from '@/contexts/routing';
import { specializeIdentifier } from '@/helpers/utils';
import { PhoneNumberOptions } from '@/lib/form';

import { VerificationCodeViewState } from './verificationCodeView';

import type { OnError, OnSuccess } from '@/types';

type EmailFormData = { email: string };

type PhoneNumberFormData = { phoneNumber: string };

/**
 * The identity form yields whichever field the tenant configuration allows: a generic `identifier`
 * when both an email and a phone number are allowed login types, or the single narrowed field
 * (`email` / `phoneNumber`) when only one of them is — see `predefinedFields.identifier`.
 */
type IdentityFormData = { identifier: string } | { email: string } | { phoneNumber: string };

export interface PasswordlessViewProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?:
        | SingleFactorPasswordlessParams['authType']
        | SingleFactorPasswordlessParams['authType'][];
    /**
     * Enable the verification code view.
     * If not defined, the verification code view will only be enabled if the authType is `sms`.
     */
    enableVerificationCode?: boolean;
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

export const PasswordlessView = ({
    auth,
    authType = 'magic_link',
    enableVerificationCode,
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
}: WithCaptchaProps<PasswordlessViewProps>) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { goTo } = useRouting();

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    const sendMagicLink = async (data: WithCaptchaToken<EmailFormData>) => {
        await coreClient.startPasswordless({ authType: 'magic_link', ...data }, auth);
        onSuccess({ name: 'otp_sent', authType: 'magic_link' });
        if (enableVerificationCode) {
            goTo<VerificationCodeViewState>('verificationCode', {
                authType: 'magic_link',
                ...data,
            });
        } else {
            goTo('emailSent');
        }
    };

    const sendSms = async (data: WithCaptchaToken<PhoneNumberFormData>) => {
        await coreClient.startPasswordless({ authType: 'sms', ...data }, auth);
        onSuccess({ name: 'otp_sent', authType: 'sms' });
        if (typeof enableVerificationCode === 'undefined' || enableVerificationCode) {
            goTo<VerificationCodeViewState>('verificationCode', { authType: 'sms', ...data });
        } else {
            goTo('smsSent');
        }
    };

    const handleIdentity = async (data: WithCaptchaToken<IdentityFormData>) => {
        // a narrowed field already carries the resolved shape, so it goes straight to its flow
        if ('email' in data) {
            const { email, ...rest } = data;
            return sendMagicLink({ email, ...rest });
        }
        if ('phoneNumber' in data) {
            const { phoneNumber, ...rest } = data;
            return sendSms({ phoneNumber, ...rest });
        }

        // the email / phone number / custom identifier decision is shared with the login widgets so
        // that every widget reads an identifier the same way, and yields a value normalized for the
        // API rather than the raw input
        const { identifier, ...rest } = data;
        const specialized = specializeIdentifier(identifier);
        if ('email' in specialized) {
            return sendMagicLink({ email: specialized.email, ...rest });
        }
        if ('phoneNumber' in specialized) {
            return sendSms({ phoneNumber: specialized.phoneNumber, ...rest });
        }
        // a custom identifier has no passwordless flow to start. The field validation refuses that
        // shape (`allowCustomIdentifier: false` below), so this only guards against a value reaching
        // the handler another way
        throw new Error(i18n('validation.identifier'));
    };

    const authTypes = [
        ...new Set(
            Array.isArray(authType) ? (authType.length > 0 ? authType : ['magic_link']) : [authType]
        ),
    ];
    const showEmail = authTypes.length === 1 && authTypes.includes('magic_link');
    const showPhoneNumber = authTypes.length === 1 && authTypes.includes('sms');
    const showIdentity = authTypes.length > 1;

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
            <CaptchaProvider
                recaptcha_enabled={recaptcha_enabled}
                recaptcha_site_key={recaptcha_site_key}
                captchaFoxEnabled={captchaFoxEnabled}
                captchaFoxSiteKey={captchaFoxSiteKey}
                captchaFoxMode={captchaFoxMode}
                action={showEmail ? 'passwordless_email' : 'passwordless_phone'}
            >
                {showEmail && showIntro && <Intro>{i18n('passwordless.intro')}</Intro>}
                {showEmail && <Form fields={['email']} handler={sendMagicLink} onError={onError} />}
                {showPhoneNumber && showIntro && <Intro>{i18n('passwordless.sms.intro')}</Intro>}
                {showPhoneNumber && (
                    <Form
                        fields={[
                            {
                                key: 'phoneNumber',
                                type: 'phone',
                                label: 'phoneNumber',
                                allowInternational: phoneNumberOptions?.allowInternational ?? false,
                                defaultCountry: phoneNumberOptions?.defaultCountry,
                                phoneNumberOptions,
                            },
                        ]}
                        handler={sendSms}
                        onError={onError}
                        phoneNumberOptions={phoneNumberOptions}
                    />
                )}
                {showIdentity && showIntro && <Intro>{i18n('passwordless.identity.intro')}</Intro>}
                {showIdentity && (
                    <Form
                        fields={[
                            {
                                key: 'identifier',
                                type: 'identifier',
                                // passwordless starts either a magic link or an sms flow: a custom
                                // identifier addresses neither, so the field refuses it instead of
                                // submitting a value `handleIdentity` could only reject
                                allowCustomIdentifier: false,
                            },
                        ]}
                        handler={handleIdentity}
                        onError={onError}
                    />
                )}
            </CaptchaProvider>
        </div>
    );
};
