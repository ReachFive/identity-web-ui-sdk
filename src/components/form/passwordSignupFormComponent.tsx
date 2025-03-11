import React, { useCallback, useLayoutEffect, useState } from 'react';
import { AuthOptions } from '@reachfive/identity-core';
import { SignupParams } from '@reachfive/identity-core/es/main/oAuthClient';

import { createForm, FieldValues } from './formComponent';
import { buildFormFields, type Field } from './formFieldFactory';
import { UserAggreementStyle } from './formControlsComponent'
import { type PhoneNumberOptions } from './fields/phoneNumberField';

import { MarkdownContent } from '../miscComponent';
import { snakeCaseProperties } from '../../helpers/transformObjectProperties';
import { isRichFormValue, isValued } from '../../helpers/utils';
import ReCaptcha, { extractCaptchaTokenFromData, importGoogleRecaptchaScript, type WithCaptchaToken } from '../reCaptcha';

import { useReachfive } from '../../contexts/reachfive';

import { isEqual } from '../../helpers/utils';

import type { OnError, OnSuccess } from '../../types';

const SignupForm = createForm<SignupParams['data']>({
    prefix: 'r5-signup-',
    submitLabel: 'signup.submitLabel'
});

export interface PasswordSignupFormProps {
    auth?: AuthOptions
    beforeSignup?: <T>(param: T) => T
    canShowPassword?: boolean
    phoneNumberOptions?: PhoneNumberOptions
    recaptcha_enabled?: boolean
    recaptcha_site_key?: string
    redirectUrl?: string
    returnToAfterEmailConfirmation?: string
    showLabels?: boolean
    signupFields?: (string | Field)[]
    userAgreement?: string
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError
}

export const PasswordSignupForm = ({
    auth,
    beforeSignup = x => x,
    canShowPassword,
    phoneNumberOptions,
    recaptcha_enabled = false,
    recaptcha_site_key,
    redirectUrl,
    returnToAfterEmailConfirmation,
    showLabels,
    signupFields = [
        'given_name',
        'family_name',
        'email',
        'password',
        'password_confirmation'
    ],
    userAgreement,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: PasswordSignupFormProps) => {
    const { client: coreClient, config } = useReachfive()
    const [blacklist, setBlacklist] = useState<string[]>([])

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key)
    }, [recaptcha_site_key])

    const callback = useCallback(
        (data: WithCaptchaToken<SignupParams['data']>) => {
            const captchaToken = extractCaptchaTokenFromData(data)
            return coreClient.signup({
                captchaToken,
                data: snakeCaseProperties(data) as SignupParams['data'],
                auth,
                redirectUrl,
                returnToAfterEmailConfirmation,
            })
        },
        [auth, coreClient, redirectUrl, returnToAfterEmailConfirmation]
    )

    const refreshBlacklist = useCallback(
        (data: FieldValues<SignupParams['data']>) => {
            const email = (isRichFormValue(data.email?.value) ? data.email?.value.raw : data.email?.value) ?? '';
            const givenName = (isRichFormValue(data.givenName?.value) ? data.givenName?.value.raw : data.givenName?.value) ?? '';
            const lastName = (isRichFormValue(data.familyName?.value) ? data.familyName?.value.raw : data.familyName?.value) ?? '';

            const list = [
                email.split('@'),
                email,
                givenName.split(' '),
                lastName.split(' ')
            ]
                .flat(1)
                .map(str => str.trim().toLowerCase())
                .filter(function (word) { return isValued(word) });

            const distinct = Array.from(new Set(list))

            if (!isEqual(distinct, blacklist)) {
                setBlacklist(distinct);
            }
        },
        [blacklist]
    )

    const fields = buildFormFields(signupFields, { ...config, canShowPassword, errorArchivedConsents: true });

    const allFields = userAgreement
        ? [
            ...fields,
            { staticContent: <MarkdownContent key="user-aggreement" data-testid="user-aggreement" root={UserAggreementStyle} source={userAgreement} /> }
        ]
        : fields;

    return <SignupForm
        fields={allFields}
        showLabels={showLabels}
        beforeSubmit={beforeSignup}
        onFieldChange={refreshBlacklist}
        sharedProps={{
            blacklist,
            ...phoneNumberOptions,
        }}
        handler={(data: SignupParams['data']) => ReCaptcha.handle(data, { recaptcha_enabled, recaptcha_site_key }, callback, "signup")}
        onSuccess={onSuccess}
        onError={onError}
    />
}

export default PasswordSignupForm