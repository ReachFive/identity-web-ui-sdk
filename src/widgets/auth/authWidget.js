import { deepDefaults } from '../../helpers/deepDefaults';
import { UserError } from '../../helpers/errors';
import { createMultiViewWidget } from '../../components/widget/widget';

import LoginView from './views/loginViewComponent'
import LoginWithWebAuthnView from './views/loginWithWebAuthnViewComponent'
import LoginWithPasswordView from './views/loginWithPasswordViewComponent'
import SignupView from './views/signupViewComponent'
import SignupWithPasswordView from './views/signupWithPasswordViewComponent'
import SignupWithWebAuthnView from './views/signupWithWebAuthnViewComponent'
import { ForgotPasswordView, ForgotPasswordSuccessView } from './views/forgotPasswordViewComponent'
import QuickLoginView from './views/quickLoginViewComponent'
import ReauthView from './views/reauthViewComponent'
import { FaSelectionView, VerificationCodeView } from '../stepUp/mfaStepUpWidget'

export default createMultiViewWidget({
    initialView({ initialScreen, allowLogin, allowQuickLogin, allowSignup, allowWebAuthnLogin, socialProviders, session = {} }) {
        const quickLogin = allowQuickLogin &&
            !session.isAuthenticated &&
            session.lastLoginType &&
            socialProviders.indexOf(session.lastLoginType) >= 0;

        return initialScreen
            || (quickLogin && 'quick-login')
            || (session.isAuthenticated && 'reauth')
            || (allowLogin && !allowWebAuthnLogin && 'login')
            || (allowLogin && 'login-with-web-authn')
            || (allowSignup && 'signup')
            || 'forgot-password';
    },
    views: {
        'login': LoginView,
        'login-with-web-authn': LoginWithWebAuthnView,
        'login-with-password': LoginWithPasswordView,
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
    prepare: (options, { config }) => {
        if (!config.passwordPolicy) {
            throw new UserError('This feature is not available on your account.');
        }

        if (!config.webAuthn && options.allowWebAuthnLogin) {
            throw new UserError('The WebAuthn feature is not available on your account.');
        }

        return deepDefaults(
            {},
            options,
            {
                showLabels: false,
                allowLogin: true,
                allowSignup: true,
                allowQuickLogin: true,
                allowForgotPassword: true,
                socialProviders: config.socialProviders,
                theme: {
                    socialButtons: {}
                }
            }
        );
    }
});
