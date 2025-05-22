import type { AuthOptions, Client as CoreClient } from '@reachfive/identity-core';
import React from 'react';

import { useReachfive } from '../../../contexts/reachfive'

import { createForm } from '../../../components/form/formComponent';
import { UserAggreementStyle } from '../../../components/form/formControlsComponent';
import { buildFormFields, type Field } from '../../../components/form/formFieldFactory';
import { Alternative, Heading, Link, MarkdownContent } from '../../../components/miscComponent';
import { useConfig } from '../../../contexts/config';
import { useI18n } from '../../../contexts/i18n';
import { snakeCaseProperties } from '../../../helpers/transformObjectProperties';

import type { OnError, OnSuccess } from '../../../types'

type SignupFormData = Parameters<CoreClient['signupWithWebAuthn']>[0]['profile'] & {
    friendlyName?: string;
};

const SignupForm = createForm({
    prefix: 'r5-webauthn-signup-',
    submitLabel: 'signup.submitLabel',
});

export interface SignupWithWebAuthnViewProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**  */
    beforeSignup?: <T>(param: T) => T;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used as the post-email confirmation URL.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterEmailConfirmation?: string;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * List of the signup fields to display in the form.
     *
     * You can pass a field as an object to override default values :
     *
     * @example
     * {
     *   "key": "family_name",
     *   "defaultValue": "Moreau",
     *   "required": true
     * }
     */
    signupFields?: (string | Field)[];
    /**  */
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

export const SignupWithWebAuthnView = ({
    auth,
    beforeSignup = (x) => x,
    redirectUrl,
    returnToAfterEmailConfirmation,
    signupFields = ['given_name', 'family_name', 'email'],
    showLabels = false,
    userAgreement,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: SignupWithWebAuthnViewProps) => {
    const coreClient = useReachfive();
    const config = useConfig();
    const i18n = useI18n();

    const handleSignup = (data: SignupFormData) =>
        coreClient.signupWithWebAuthn(
            {
                profile: snakeCaseProperties(data),
                friendlyName: data.friendlyName,
                redirectUrl,
                returnToAfterEmailConfirmation,
            },
            auth
        )

    const webAuthnSignupFields = signupFields.filter(
        field => field !== 'password' && field !== 'password_confirmation'
    );

    const fields = buildFormFields(webAuthnSignupFields, config);

    const allFields = userAgreement
        ? [
              ...fields,
              {
                  staticContent: (
                      <MarkdownContent
                          key="user-aggreement"
                          root={UserAggreementStyle}
                          source={userAgreement}
                      />
                  ),
              },
          ]
        : fields;

    return (
        <div>
            <Heading>{i18n('signup.withBiometrics')}</Heading>
            <SignupForm
                fields={allFields}
                showLabels={showLabels}
                beforeSubmit={beforeSignup}
                handler={handleSignup}
                onSuccess={(authResult) =>
                    onSuccess({ name: 'sign_up', authResult })
                }
                onError={onError}
            />
            <Alternative>
                <Link target={'signup'}>{i18n('back')}</Link>
            </Alternative>
        </div>
    );
};

export default SignupWithWebAuthnView;
