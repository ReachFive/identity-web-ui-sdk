import { AuthOptions } from '@reachfive/identity-core';
import { SignupParams } from '@reachfive/identity-core/es/main/oAuthClient';
import React, { useCallback, useLayoutEffect, useState } from 'react';

import { type PhoneNumberOptions } from './fields/phoneNumberField';
import { createForm } from './formComponent';
import { UserAgreementStyle } from './formControlsComponent';
import { buildFormFields, type Field } from './formFieldFactory';

import { snakeCaseProperties } from '../../helpers/transformObjectProperties';
import { isValued } from '../../helpers/utils';
import { MarkdownContent } from '../miscComponent';
import ReCaptcha, {
    extractCaptchaTokenFromData,
    importGoogleRecaptchaScript,
    type WithCaptchaToken,
} from '../reCaptcha';

import { useConfig } from '../../contexts/config';
import { useReachfive } from '../../contexts/reachfive';

import { isEqual } from '../../helpers/utils';

import type { OnError, OnSuccess } from '../../types';

const SignupForm = createForm<SignupParams['data']>({
    prefix: 'r5-signup-',
    submitLabel: 'signup.submitLabel',
});

export interface PasswordSignupFormProps {
    auth?: AuthOptions;
    beforeSignup?: <T>(param: T) => T;
    canShowPassword?: boolean;
    phoneNumberOptions?: PhoneNumberOptions;
    recaptcha_enabled?: boolean;
    recaptcha_site_key?: string;
    redirectUrl?: string;
    returnToAfterEmailConfirmation?: string;
    showLabels?: boolean;
    signupFields?: (string | Field)[];
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
    redirectUrl,
    returnToAfterEmailConfirmation,
    showLabels,
    signupFields = ['given_name', 'family_name', 'email', 'password', 'password_confirmation'],
    userAgreement,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) satisfies OnSuccess,
}: PasswordSignupFormProps) => {
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
        <SignupForm
            fields={allFields}
            showLabels={showLabels}
            beforeSubmit={beforeSignup}
            onFieldChange={refreshBlacklist}
            sharedProps={{
                blacklist,
                ...phoneNumberOptions,
            }}
            handler={(data: SignupParams['data']) =>
                ReCaptcha.handle(
                    data,
                    { recaptcha_enabled, recaptcha_site_key },
                    callback,
                    'signup'
                )
            }
            onSuccess={authResult => {
                onSuccess({ name: 'signup', authResult });
            }}
            onError={onError}
        />
    );
};

export default PasswordSignupForm;
