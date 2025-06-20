import React from 'react';

import { type PhoneNumberOptions } from '../../../components/form/fields/phoneNumberField';
import PasswordSignupForm from '../../../components/form/passwordSignupFormComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import { WebAuthnSignupViewButtons } from '../../../components/form/webAuthAndPasswordButtonsComponent';
import { Alternative, Heading, Link, Separator } from '../../../components/miscComponent';
import { useI18n } from '../../../contexts/i18n';
import { useRouting } from '../../../contexts/routing';

import { InitialScreen } from '../../../../constants.ts';
import { selectLogin } from '../authWidget.tsx';
import type { SignupWithPasswordViewProps } from './signupWithPasswordViewComponent';
import type { SignupWithWebAuthnViewProps } from './signupWithWebAuthnViewComponent';

import type { OnError, OnSuccess } from '../../../types';

export interface SignupViewProps extends SignupWithPasswordViewProps, SignupWithWebAuthnViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean;
    initialScreen?: InitialScreen;
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean;
    /**
     * Boolean that specifies whether biometric signup is enabled.
     *
     * @default false
     */
    allowWebAuthnSignup?: boolean;
    /**
     * Boolean that specifies whether password authentication is enabled.
     */
    enablePasswordAuthentication?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
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

export const SignupView = ({
    allowLogin = true,
    initialScreen,
    allowWebAuthnLogin = false,
    allowWebAuthnSignup = false,
    enablePasswordAuthentication = true,
    socialProviders,
    ...props
}: SignupViewProps) => {
    const i18n = useI18n();
    const { goTo } = useRouting();

    return (
        <div>
            <Heading>{i18n('signup.title')}</Heading>

            {socialProviders && socialProviders.length > 0 && (
                <SocialButtons
                    providers={socialProviders}
                    auth={props.auth}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            )}
            {socialProviders && socialProviders.length > 0 && <Separator text={i18n('or')} />}

            {allowWebAuthnSignup ? (
                <WebAuthnSignupViewButtons
                    enablePasswordAuthentication={enablePasswordAuthentication}
                    onPasswordClick={() => goTo('signup-with-password')}
                    onBiometricClick={() => goTo('signup-with-web-authn')}
                />
            ) : (
                <PasswordSignupForm {...props} />
            )}

            {allowLogin && (
                <Alternative>
                    <span>{i18n('signup.loginLinkPrefix')}</span>
                    &nbsp;
                    <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>
                        {i18n('signup.loginLink')}
                    </Link>
                </Alternative>
            )}
        </div>
    );
};

export default SignupView;
