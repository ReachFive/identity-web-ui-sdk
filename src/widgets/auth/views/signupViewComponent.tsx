import React from 'react';

import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';
import { SocialButtons } from '../../../components/form/socialButtonsComponent';
import PasswordSignupForm from '../../../components/form/passwordSignupFormComponent';
import { WebAuthnSignupViewButtons } from '../../../components/form/webAuthAndPasswordButtonsComponent';
import { useI18n } from '../../../contexts/i18n';
import { useRouting } from '../../../contexts/routing';

import type { SignupWithPasswordViewProps } from './signupWithPasswordViewComponent'
import type { SignupWithWebAuthnViewProps } from './signupWithWebAuthnViewComponent'

export interface SignupViewProps extends SignupWithPasswordViewProps, SignupWithWebAuthnViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean
    /**
     * Boolean that specifies whether biometric signup is enabled.
     *
     * @default false
     */
    allowWebAuthnSignup?: boolean
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[]
}

export const SignupView = ({
    allowLogin = true,
    allowWebAuthnSignup = false,
    socialProviders,
    ...props
}: SignupViewProps) => {
    const i18n = useI18n()
    const { goTo } = useRouting()

    return (
        <div>
            <Heading>{i18n('signup.title')}</Heading>

            {socialProviders && socialProviders.length > 0 &&
                <SocialButtons providers={socialProviders} auth={props.auth} />}
            {socialProviders && socialProviders.length > 0 && <Separator text={i18n('or')} />}

            {allowWebAuthnSignup
                ? <WebAuthnSignupViewButtons
                    onPasswordClick={() => goTo('signup-with-password')}
                    onBiometricClick={() => goTo('signup-with-web-authn')} />
                : <PasswordSignupForm {...props} />
            }

            {allowLogin && <Alternative>
                <span>{i18n('signup.loginLinkPrefix')}</span>
                &nbsp;
                <Link target={'login'}>
                    {i18n('signup.loginLink')}
                </Link>
            </Alternative>}
        </div>
    )
}

export default SignupView
