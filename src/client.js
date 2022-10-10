import ReactDOM from 'react-dom'

import authWidget from './widgets/auth/authWidget';
import emailEditorWidget from './widgets/emailEditor/emailEditorWidget';
import passwordEditorWidget from './widgets/passwordEditor/passwordEditorWidget';
import phoneNumberEditorWidget from './widgets/phoneNumberEditor/phoneNumberEditorWidget';
import passwordResetWidget from './widgets/passwordReset/passwordResetWidget';
import passwordlessWidget from './widgets/passwordless/passwordlessWidget';
import profileEditorWidget from './widgets/profileEditor/profileEditorWidget';
import socialAccountsWidget from './widgets/socialAccounts/socialAccountsWidget';
import socialLoginWidget from './widgets/socialLogin/socialLoginWidget';
import webAuthnWidget from './widgets/webAuthn/webAuthnDevicesWidget';
import mfaCredentialsWidget from "./widgets/mfa/MfaCredentialsWidget";
import mfaListWidget from './widgets/mfa/mfaListWidget'
import { logError } from './helpers/logger';
import mfaStepUpWidget from "./widgets/stepUp/mfaStepUpWidget";

export class UiClient {
    constructor(config, urlParser, coreClient, defaultI18n) {
        this.config = config;
        this.urlParser = urlParser;
        this.client = coreClient;
        this.defaultI18n = defaultI18n;
    }

    /**
     * @param options `option.redirectUrl` the page which the confirmation email redirects to.
     *
     *                `option.returnToAfterEmailConfirmation` the confirmation email will redirect to one page.
     *                This parameter is where this page will redirect.
     *                This parameter is supported by the `/email-confirmation` hosted page.
     */
    showAuth(options) {
        this._ssoCheck(authWidget, options);
    }

    showSocialLogin(options) {
        this._ssoCheck(socialLoginWidget, options);
    }

    showPasswordless(options) {
        this._ssoCheck(passwordlessWidget, options);
    }

    showEmailEditor(options) {
        this._showWidget(emailEditorWidget, options);
    }

    showPasswordEditor(options) {
        this._showWidget(passwordEditorWidget, options);
    }

    showPhoneNumberEditor(options) {
        this._showWidget(phoneNumberEditorWidget, options);
    }

    showProfileEditor(options) {
        this._showWidget(profileEditorWidget, options);
    }

    showPasswordReset(options) {
        this._showWidget(passwordResetWidget, options);
    }

    showSocialAccounts(options) {
        this._showWidget(socialAccountsWidget, options);
    }

    showWebAuthnDevices(options) {
        this._showWidget(webAuthnWidget, options);
    }

    showMfa(options) {
        this._showWidget(mfaCredentialsWidget, options);
    }

    showStepUp(options) {
        this._showWidget(mfaStepUpWidget, options)
    }

    showMfaCredentials(options) {
        this._showWidget(mfaListWidget, options);
    }

    async _showWidget(widget, options = {}, props = {}) {
        const container = typeof options.container === 'string'
            ? document.getElementById(options.container)
            : options.container;

        if (!container) {
            throw new Error(`Container '#${options.container}' not found.`);
        }

        try {
            const config = {
                ...this.config,
                countryCode: options.countryCode || this.config.countryCode || 'FR'
            };

            const result = await widget(options, {
                ...props,
                config,
                apiClient: this.client,
                defaultI18n: this.defaultI18n
            });

            ReactDOM.render(result, container);

            if (options.onReady && typeof options.onReady === 'function') {
                options.onReady({
                    destroy() { ReactDOM.unmountComponentAtNode(container) }
                });
            }
        } catch (e) {
            const message = e.isUserError ? e.message : 'Unexpected error';

            container.innerHTML = `<div style="color: red; text-align: center;">${message}</div>`;

            if (e.isUserError) {
                logError(`ReachFive widget display fails: ${e.message}`);
            } else {
                logError(e);
            }
        }
    }

    _ssoCheck(widget, options) {
        const { auth = {} } = options;
        const showAuthWidget = session => this._showWidget(widget, options, { session });

        if (this.config.sso || auth.idTokenHint || auth.loginHint) {
            setTimeout(() =>
                Promise.resolve(this.urlParser.parseUrlFragment(window.location.href)).then(authResult => {
                    // Avoid authentication triggering when an authentication response is present
                    if (authResult) return;

                    this.client
                        .getSessionInfo()
                        .then(session => {
                            const reAuthenticate = auth && auth.prompt && auth.prompt === 'login'

                            if (session.isAuthenticated && !reAuthenticate) {
                                this.client.loginFromSession(auth);
                            } else {
                                showAuthWidget(session);
                            }
                        })
                        .catch(err => {
                            logError(err);
                            showAuthWidget();
                        });
                }),
                0);
        } else {
            showAuthWidget();
        }
    }
}
