import { AuthOptions } from '@reachfive/identity-core';
import { SignupParams } from '@reachfive/identity-core/es/main/oAuthClient';
import React, { useCallback, useLayoutEffect, useState } from 'react';

import { type PhoneNumberOptions } from './fields/phoneNumberField';
import { createForm } from './formComponent';
import { UserAgreementStyle } from './formControlsComponent';
import { buildFormFields, type Field } from './formFieldFactory';

import { CaptchaProvider, WithCaptchaProps, type WithCaptchaToken } from '../../components/captcha';
import { snakeCaseProperties } from '../../helpers/transformObjectProperties';
import { isValued } from '../../helpers/utils';
import { MarkdownContent } from '../miscComponent';
import { extractCaptchaTokenFromData, importGoogleRecaptchaScript } from '../reCaptcha';

import { useConfig } from '../../contexts/config';
import { useReachfive } from '../../contexts/reachfive';

import { isEqual } from '../../helpers/utils';

import type { OnError, OnSuccess } from '../../types';

const SignupForm = createForm<SignupParams['data']>({
    prefix: 'r5-signup-',
    submitLabel: 'signup.submitLabel',
});

export interface PasswordSignupFormProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * A function that is called before the signup request is made.
     */
    beforeSignup?: <T>(param: T) => T;
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
    /**
     * Object that lets you set display options for the phone number field.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * The URL sent in the email to which the user is redirected. This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used as the post-email confirmation URL.
     */
    returnToAfterEmailConfirmation?: string;
    /**
     * Boolean for whether the signup form fields' labels are displayed on the login view.
     * @default false
     * If set to `true`, the labels are shown which includes an asterisk (*) next to required fields.
     */
    showLabels?: boolean;
    /**
     * List of the signup fields to display in the form.
     *
     * A field is either a string representing the field’s key (predefined, custom field, or consent) or an object with attributes overriding the default field configuration.
     *
     * @default ['given_name', 'family_name', 'email', 'password', 'password_confirmation']
     */
    signupFields?: (string | Field)[];
    /**
     * The user agreement text to display in the form.
     */
    userAgreement?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export const PasswordSignupForm = ({
    auth,
    beforeSignup = x => x,
    canShowPassword,
    phoneNumberOptions,
    recaptcha_enabled = false,
    recaptcha_site_key,
    captchaFoxEnabled = false,
    captchaFoxSiteKey,
    captchaFoxMode = 'hidden',
    redirectUrl,
    returnToAfterEmailConfirmation,
    showLabels,
    signupFields = ['given_name', 'family_name', 'email', 'password', 'password_confirmation'],
    userAgreement,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) satisfies OnSuccess,
}: WithCaptchaProps<PasswordSignupFormProps>) => {
    const coreClient = useReachfive();
    const config = useConfig();
    const [blacklist, setBlacklist] = useState<string[]>([]);

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    const callback = useCallback(
        (data: WithCaptchaToken<SignupParams['data']>) => {
            const captchaToken = extractCaptchaTokenFromData(data);
            return coreClient.signup({
                captchaToken,
                data: snakeCaseProperties(data) as SignupParams['data'],
                auth,
                redirectUrl,
                returnToAfterEmailConfirmation,
            });
        },
        [auth, coreClient, redirectUrl, returnToAfterEmailConfirmation]
    );

    const refreshBlacklist = useCallback(
        ({ email = '', givenName = '', familyName = '' }: SignupParams['data']) => {
            const list = [email.split('@'), email, givenName.split(' '), familyName.split(' ')]
                .flat(1)
                .map(str => str.trim().toLowerCase())
                .filter(function (word) {
                    return isValued(word);
                });

            const distinct = Array.from(new Set(list));

            if (!isEqual(distinct, blacklist)) {
                setBlacklist(distinct);
            }
        },
        [blacklist]
    );

    const fields = buildFormFields(signupFields, {
        ...config,
        canShowPassword,
        errorArchivedConsents: true,
    });

    const allFields = userAgreement
        ? [
              ...fields,
              {
                  staticContent: (
                      <MarkdownContent
                          key="user-agreement"
                          data-testid="user-agreement"
                          root={UserAgreementStyle}
                          source={userAgreement}
                      />
                  ),
              },
          ]
        : fields;

    return (
        <CaptchaProvider
            recaptcha_enabled={recaptcha_enabled}
            recaptcha_site_key={recaptcha_site_key}
            captchaFoxEnabled={captchaFoxEnabled}
            captchaFoxSiteKey={captchaFoxSiteKey}
            captchaFoxMode={captchaFoxMode}
            action="signup"
        >
            <SignupForm
                fields={allFields}
                showLabels={showLabels}
                beforeSubmit={beforeSignup}
                onFieldChange={refreshBlacklist}
                sharedProps={{
                    blacklist,
                    ...phoneNumberOptions,
                }}
                handler={callback}
                onSuccess={authResult => {
                    const isIdentifierVerificationRequired =
                        authResult != undefined &&
                        authResult.accessToken == undefined &&
                        authResult?.code == undefined;
                    onSuccess({
                        name: 'signup',
                        authResult,
                        isIdentifierVerificationRequired,
                    });
                }}
                onError={onError}
            />
        </CaptchaProvider>
    );
};

export default PasswordSignupForm;
