import { ComponentProps } from 'react';

import { type SessionInfo } from '@reachfive/identity-core';

import { InitialScreen } from '../../../constants.ts';
import { createMultiViewWidget } from '../../components/widget/widget';
import { UserError } from '../../helpers/errors';
import { ProviderId } from '../../providers/providers';
import { FaSelectionView, VerificationCodeView } from '../stepUp/mfaStepUpWidget';
import {
    AccountRecoverySuccessView,
    AccountRecoveryView,
} from './views/accountRecoveryViewComponent.tsx';
import {
    ForgotPasswordCodeView,
    ForgotPasswordPhoneNumberView,
    ForgotPasswordSuccessView,
    ForgotPasswordView,
} from './views/forgotPasswordViewComponent';
import LoginView from './views/loginViewComponent';
import LoginWithPasswordView from './views/loginWithPasswordViewComponent';
import LoginWithWebAuthnView from './views/loginWithWebAuthnViewComponent';
import QuickLoginView from './views/quickLoginViewComponent';
import ReauthView from './views/reauthViewComponent';
import SignupView from './views/signupViewComponent';
import SignupWithPasswordView from './views/signupWithPasswordViewComponent';
import SignupWithWebAuthnView from './views/signupWithWebAuthnViewComponent';

import type { PropsWithSession } from '../../contexts/session';
import type { FaSelectionViewState, VerificationCodeViewState } from '../stepUp/mfaStepUpWidget';

export interface AuthWidgetProps
    extends
        ComponentProps<typeof LoginView>,
        ComponentProps<typeof LoginWithWebAuthnView>,
        ComponentProps<typeof LoginWithPasswordView>,
        ComponentProps<typeof SignupView>,
        ComponentProps<typeof SignupWithPasswordView>,
        ComponentProps<typeof SignupWithWebAuthnView>,
        ComponentProps<typeof ForgotPasswordView>,
        ComponentProps<typeof QuickLoginView>,
        ComponentProps<typeof ReauthView>,
        Omit<ComponentProps<typeof FaSelectionView>, keyof FaSelectionViewState>,
        Omit<ComponentProps<typeof VerificationCodeView>, keyof VerificationCodeViewState> {
    /**
     * Boolean that specifies whether quick login is enabled.
     *
     * @default true
     */
    allowQuickLogin?: boolean;
    /**
     * The widget’s initial screen if a value is provided, otherwise:
     * - if `quickLogin` is set to `true`, it defaults to `quick-login`.
     * - otherwise if the user is authenticated, it defaults to `reauth`.
     * - otherwise if `allowLogin` is set to `true` and `allowWebAuthnLogin` is not set to `true`, it defaults to `login`.
     * - otherwise if `allowLogin` is set to `true`, it defaults to `login-with-web-authn`.
     * - otherwise if `allowSignup` is set to `true`, it defaults to `signup`.
     * - otherwise, defaults to `forgot-password`.
     */
    initialScreen?: InitialScreen;
}

export function selectLogin(initialScreen?: InitialScreen, allowWebAuthnLogin?: boolean): string {
    if (initialScreen === 'login' || initialScreen === 'login-with-web-authn') return initialScreen;
    return !allowWebAuthnLogin ? 'login' : 'login-with-web-authn';
}

export default createMultiViewWidget<AuthWidgetProps, PropsWithSession<AuthWidgetProps>>({
    initialView({
        initialScreen,
        allowLogin = true,
        allowQuickLogin = true,
        allowSignup = true,
        allowWebAuthnLogin,
        socialProviders,
        session = {} as SessionInfo,
    }): string {
        const quickLogin =
            allowQuickLogin &&
            !session.isAuthenticated &&
            session.lastLoginType &&
            socialProviders?.includes(session.lastLoginType as ProviderId);

        return (
            initialScreen ??
            (quickLogin ? 'quick-login' : undefined) ??
            (session.isAuthenticated ? 'reauth' : undefined) ??
            (allowLogin && !allowWebAuthnLogin ? 'login' : undefined) ??
            (allowLogin ? 'login-with-web-authn' : undefined) ??
            (allowSignup ? 'signup' : undefined) ??
            'forgot-password'
        );
    },
    views: {
        login: LoginView,
        'login-with-web-authn': LoginWithWebAuthnView,
        'login-with-password': LoginWithPasswordView,
        signup: SignupView,
        'signup-with-password': SignupWithPasswordView,
        'signup-with-web-authn': SignupWithWebAuthnView,
        'forgot-password': ForgotPasswordView,
        'forgot-password-phone-number': ForgotPasswordPhoneNumberView,
        'account-recovery': AccountRecoveryView,
        'forgot-password-code': ForgotPasswordCodeView,
        'forgot-password-success': ForgotPasswordSuccessView,
        'account-recovery-success': AccountRecoverySuccessView,
        'quick-login': QuickLoginView,
        'fa-selection': FaSelectionView,
        'verification-code': VerificationCodeView,
        reauth: ReauthView,
    },
    prepare: (options, { config, session }) => {
        if (!config.passwordPolicy) {
            throw new UserError('This feature is not available on your account.');
        }
        if (!config.webAuthn && options.allowWebAuthnLogin) {
            throw new UserError('The WebAuthn feature is not available on your account.');
        }

        return {
            socialProviders: config.socialProviders,
            ...options,
            session,
        } as PropsWithSession<AuthWidgetProps>;
    },
});
