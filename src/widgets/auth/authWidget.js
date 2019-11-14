import { deepDefaults } from '../../helpers/deepDefaults';
import { UserError } from '../../helpers/errors';
import { createMultiViewWidget } from '../../components/widget/widget';
import LoginView from './views/loginViewComponent'
import SignupView from './views/signupViewComponent'
import { ForgotPasswordView, ForgotPasswordSuccessView } from './views/forgotPasswordViewComponent'
import QuickLoginView from './views/quickLoginViewComponent'
import ReauthView from './views/reauthViewComponent'

export default createMultiViewWidget({
    initialView({ initialScreen, allowLogin, allowQuickLogin, allowSignup, socialProviders, session = {} }) {
        const quickLogin = allowQuickLogin &&
            !session.isAuthenticated &&
            session.lastLoginType &&
            socialProviders.indexOf(session.lastLoginType) >= 0;
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
        'forgot-password': ForgotPasswordView,
        'forgot-password-success': ForgotPasswordSuccessView,
        'quick-login': QuickLoginView,
        'reauth': ReauthView
    },
    prepare: (options, { config }) => {
        if (!config.passwordPolicy) {
            throw new UserError('This feature is not available on your account.');
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
