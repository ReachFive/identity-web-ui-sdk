import { type SessionInfo } from '@reachfive/identity-core'

import { UserError } from '../../helpers/errors';
import { createMultiViewWidget } from '../../components/widget/widget';

import LoginView, { type LoginViewProps } from './views/loginViewComponent'
import SignupView, { type SignupViewProps } from './views/signupViewComponent'
import SignupWithPasswordView, { type SignupWithPasswordViewProps } from './views/signupWithPasswordViewComponent'
import SignupWithWebAuthnView, { type SignupWithWebAuthnViewProps} from './views/signupWithWebAuthnViewComponent'
import { ForgotPasswordView, ForgotPasswordSuccessView, type ForgotPasswordViewProps, type ForgotPasswordSuccessViewProps } from './views/forgotPasswordViewComponent'
import QuickLoginView, { type QuickLoginViewProps } from './views/quickLoginViewComponent'
import ReauthView, { type ReauthViewProps } from './views/reauthViewComponent'
import { FaSelectionView, VerificationCodeView, } from '../stepUp/mfaStepUpWidget'
import type { FaSelectionViewProps, FaSelectionViewState, VerificationCodeViewProps, VerificationCodeViewState } from '../stepUp/mfaStepUpWidget'

import type { PropsWithSession } from '../../contexts/session'

import { ProviderId } from '../../providers/providers';

export interface AuthWidgetProps extends
    LoginViewProps,
    SignupViewProps,
    SignupWithPasswordViewProps,
    SignupWithWebAuthnViewProps,
    ForgotPasswordViewProps,
    ForgotPasswordSuccessViewProps,
    QuickLoginViewProps,
    ReauthViewProps,
    Omit<FaSelectionViewProps, keyof FaSelectionViewState>,
    Omit<VerificationCodeViewProps, keyof VerificationCodeViewState> {
        /**
         * Boolean that specifies whether quick login is enabled.
         *
         * @default true
         */
        allowQuickLogin?: boolean
        /**
         * The widget’s initial screen.
         *
         * - if `allowLogin` is set to `true`, it defaults to `login`.
         * - if `allowLogin` is set to `false` and `allowSignup` is set to `true`, it defaults to `signup`.
         * - otherwise, defaults to `forgot-password`.
         */
        initialScreen?: 'login' | 'signup' | 'forgot-password'
    }

export default createMultiViewWidget<AuthWidgetProps, PropsWithSession<AuthWidgetProps>>({
    initialView({
        initialScreen,
        allowLogin = true,
        allowQuickLogin = true,
        allowSignup = true,
        socialProviders,
        session = {} as SessionInfo
    }): string {
        const quickLogin = allowQuickLogin &&
            !session.isAuthenticated &&
            session.lastLoginType &&
            socialProviders ? socialProviders.indexOf(session.lastLoginType as ProviderId) >= 0 : false;

        return initialScreen
            || (quickLogin && 'quick-login')
            || (session.isAuthenticated && 'reauth')
            || (allowLogin && 'login')
            || (allowSignup && 'signup')
            || 'forgot-password';
    },
    views: {
        'login': LoginView,
        'signup': SignupView,
        'signup-with-password': SignupWithPasswordView,
        'signup-with-web-authn': SignupWithWebAuthnView,
        'forgot-password': ForgotPasswordView,
        'forgot-password-success': ForgotPasswordSuccessView,
        'quick-login': QuickLoginView,
        'fa-selection': FaSelectionView,
        'verification-code': VerificationCodeView,
        'reauth': ReauthView
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
    }
});
