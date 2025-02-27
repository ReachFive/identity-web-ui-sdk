import { UserError } from '../../helpers/errors';
import { createMultiViewWidget } from '../../components/widget/widget';

import LoginView, { type LoginViewProps } from './views/loginViewComponent'
import LoginWithWebAuthnView, { type LoginWithWebAuthnViewProps } from './views/loginWithWebAuthnViewComponent'
import LoginWithPasswordView, { type LoginWithPasswordViewProps } from './views/loginWithPasswordViewComponent'
import SignupView, { type SignupViewProps } from './views/signupViewComponent'
import SignupWithPasswordView, { type SignupWithPasswordViewProps } from './views/signupWithPasswordViewComponent'
import SignupWithWebAuthnView, { type SignupWithWebAuthnViewProps} from './views/signupWithWebAuthnViewComponent'
import { ForgotPasswordView, ForgotPasswordCodeView, ForgotPasswordSuccessView, type ForgotPasswordViewProps, ForgotPasswordPhoneNumberView } from './views/forgotPasswordViewComponent'
import QuickLoginView, { type QuickLoginViewProps } from './views/quickLoginViewComponent'
import ReauthView, { type ReauthViewProps } from './views/reauthViewComponent'
import { FaSelectionView, VerificationCodeView, } from '../stepUp/mfaStepUpWidget'
import type { FaSelectionViewProps, FaSelectionViewState, VerificationCodeViewProps, VerificationCodeViewState } from '../stepUp/mfaStepUpWidget'

import { withSsoCheck, type PropsWithSession } from '../../contexts/session'

import { ProviderId } from '../../providers/providers';
import { AccountRecoverySuccessView, AccountRecoveryView } from './views/accountRecoveryViewComponent.tsx'
import { InitialScreen } from '../../../constants.ts';

export interface AuthWidgetProps extends
    LoginViewProps,
    LoginWithWebAuthnViewProps,
    LoginWithPasswordViewProps,
    SignupViewProps,
    SignupWithPasswordViewProps,
    SignupWithWebAuthnViewProps,
    ForgotPasswordViewProps,
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
         * The widget’s initial screen if a value is provided, otherwise:
         * - if `quickLogin` is set to `true`, it defaults to `quick-login`.
         * - otherwise if the user is authenticated, it defaults to `reauth`.
         * - otherwise if `allowLogin` is set to `true` and `allowWebAuthnLogin` is not set to `true`, it defaults to `login`.
         * - otherwise if `allowLogin` is set to `true`, it defaults to `login-with-web-authn`.
         * - otherwise if `allowSignup` is set to `true`, it defaults to `signup`.
         * - otherwise, defaults to `forgot-password`.
         */
        initialScreen?: InitialScreen
    }

export function selectLogin(initialScreen?: InitialScreen, allowWebAuthnLogin?: boolean): string {
    if (initialScreen === 'login' || initialScreen === 'login-with-web-authn') return initialScreen
    return !allowWebAuthnLogin ? 'login' : 'login-with-web-authn'
}

export default withSsoCheck(
    createMultiViewWidget<AuthWidgetProps, PropsWithSession<AuthWidgetProps>>({
        initialView({
            initialScreen,
            allowLogin = true,
            allowQuickLogin = true,
            allowSignup = true,
            allowWebAuthnLogin,
            socialProviders,
            session
        }): string {
            const quickLogin = allowQuickLogin &&
                !session?.isAuthenticated &&
                session?.lastLoginType &&
                socialProviders?.includes(session?.lastLoginType as ProviderId);

            return initialScreen
                ?? (quickLogin ? 'quick-login' : undefined)
                ?? (session?.isAuthenticated ? 'reauth' : undefined)
                ?? (allowLogin && !allowWebAuthnLogin ? 'login' : undefined)
                ?? (allowLogin ? 'login-with-web-authn' : undefined)
                ?? (allowSignup ? 'signup' : undefined)
                ?? 'forgot-password';
        },
        views: {
            'login': LoginView,
            'login-with-web-authn': LoginWithWebAuthnView,
            'login-with-password': LoginWithPasswordView,
            'signup': SignupView,
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
                session,
                ...options,
            };
        }
    })
);
