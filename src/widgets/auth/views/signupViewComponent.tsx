import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import PasswordSignupForm from '../../../components/form/passwordSignupFormComponent';
import { WebAuthnSignupViewButtons } from '../../../components/form/webAuthAndPasswordButtonsComponent';
import { type PhoneNumberOptions } from '../../../components/form/fields/phoneNumberField';
import { useI18n } from '../../../contexts/i18n';

import type { SignupWithPasswordViewProps } from './signupWithPasswordViewComponent'
import type { SignupWithWebAuthnViewProps } from './signupWithWebAuthnViewComponent'
import { selectLogin } from '../authWidget.tsx';
import { InitialScreen } from '../../../../constants.ts';

export interface SignupViewProps extends SignupWithPasswordViewProps, SignupWithWebAuthnViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean
    initialScreen?: InitialScreen,
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean
    /**
     * Boolean that specifies whether biometric signup is enabled.
     *
     * @default false
     */
    allowWebAuthnSignup?: boolean
    /**
     * Boolean that specifies whether password authentication is enabled.
     */
    enablePasswordAuthentication?: boolean
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[]
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions
}

export const SignupView = ({
    allowLogin = true,
    initialScreen,
    allowWebAuthnLogin = false,
    allowWebAuthnSignup = false,
    enablePasswordAuthentication=true,
    socialProviders,
    ...props
}: SignupViewProps) => {
    const i18n = useI18n()
    const navigate = useNavigate()

    return (
        <div>
            <Heading>{i18n('signup.title')}</Heading>

            {socialProviders && socialProviders.length > 0 &&
                <SocialButtons providers={socialProviders} auth={props.auth} />}
            {socialProviders && socialProviders.length > 0 && <Separator text={i18n('or')} />}

            {allowWebAuthnSignup
                ? <WebAuthnSignupViewButtons
                    enablePasswordAuthentication={enablePasswordAuthentication}
                    onPasswordClick={() => navigate('/signup-with-password')}
                    onBiometricClick={() => navigate('/signup-with-web-authn')}
                  />
                : <PasswordSignupForm {...props} />
            }

            {allowLogin && <Alternative>
                <span>{i18n('signup.loginLinkPrefix')}</span>
                &nbsp;
                <Link target={selectLogin(initialScreen, allowWebAuthnLogin)}>
                    {i18n('signup.loginLink')}
                </Link>
            </Alternative>}
        </div>
    )
}

export default SignupView
