import type { Config, Client as CoreClient } from '@reachfive/identity-core';
import React, { ComponentType, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import type { Prettify } from './types';

import { UserError } from './helpers/errors';
import { logError } from './helpers/logger';

import { ErrorText } from './components/miscComponent';
import type { I18nProps, ThemeProps } from './components/widget/widget';

import { ReachfiveProvider } from './contexts/reachfive.tsx';
import { withSsoCheck } from './contexts/session.tsx';

import AccountRecoveryWidget, {
    type AccountRecoveryWidgetProps,
} from './widgets/accountRecovery/accountRecoveryWidget.tsx';
import AuthWidget, { type AuthWidgetProps } from './widgets/auth/authWidget';
import EmailEditorWidget, {
    type EmailEditorWidgetProps,
} from './widgets/emailEditor/emailEditorWidget';
import MfaCredentialsWidget, {
    type MfaCredentialsWidgetProps,
} from './widgets/mfa/MfaCredentialsWidget';
import MfaListWidget, { type MfaListWidgetProps } from './widgets/mfa/mfaListWidget';
import TrustedDevicesWidget, {
    type TrustedDeviceWidgetProps,
} from './widgets/mfa/trustedDevicesWidget.tsx';
import PasswordEditorWidget, {
    type PasswordEditorWidgetProps,
} from './widgets/passwordEditor/passwordEditorWidget';
import PasswordResetWidget, {
    type PasswordResetWidgetProps,
} from './widgets/passwordReset/passwordResetWidget';
import PasswordlessWidget, {
    type PasswordlessWidgetProps,
} from './widgets/passwordless/passwordlessWidget';
import PhoneNumberEditorWidget, {
    type PhoneNumberEditorWidgetProps,
} from './widgets/phoneNumberEditor/phoneNumberEditorWidget';
import ProfileEditorWidget, {
    type ProfileEditorWidgetProps,
} from './widgets/profileEditor/profileEditorWidget';
import SocialAccountsWidget, {
    type SocialAccountsWidgetProps,
} from './widgets/socialAccounts/socialAccountsWidget';
import SocialLoginWidget, {
    type SocialLoginWidgetProps,
} from './widgets/socialLogin/socialLoginWidget';
import MfaStepUpWidget, { type MfaStepUpWidgetProps } from './widgets/stepUp/mfaStepUpWidget';
import WebAuthnWidget, { type WebAuthnWidgetProps } from './widgets/webAuthn/webAuthnDevicesWidget';

export interface WidgetInstance {
    destroy(): void;
}

export interface WidgetProps {
    /** The DOM element or the `id` of a DOM element in which the widget should be embedded. */
    container: string | HTMLElement;
    /**
     * The [ISO country](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code useful to format phone numbers.
     * Defaults to the predefined country code in your account settings or `FR`.
     */
    countryCode?: string;
    /** A fallback react tree to show when a Suspense child (like React.lazy) suspends */
    fallback?: ReactNode;
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onReady?: (instance: WidgetInstance) => void;
}

// type PropsWithWidgetProps<P> = P & WidgetProps
type WidgetOptions<P> = Prettify<P & WidgetProps & I18nProps & ThemeProps>;

// type Widget<P> = (props: P, ctx: Context) => Promise<React.JSX.Element>

// type WidgetOptions<W> = PropsWithWidgetProps<W extends Widget<infer P> ? P : never[0]>

export class UiClient {
    config: Config;
    core: CoreClient;

    constructor(config: Config, coreClient: CoreClient) {
        this.config = config;
        this.core = coreClient;
    }

    showAuth(options: WidgetOptions<AuthWidgetProps>) {
        this._showWidget(withSsoCheck(AuthWidget), options);
    }

    showAccountRecovery(options: WidgetOptions<AccountRecoveryWidgetProps>) {
        this._showWidget(AccountRecoveryWidget, options);
    }

    showSocialLogin(options: WidgetOptions<SocialLoginWidgetProps>) {
        this._showWidget(withSsoCheck(SocialLoginWidget), options);
    }

    showPasswordless(options: WidgetOptions<PasswordlessWidgetProps>) {
        this._showWidget(withSsoCheck(PasswordlessWidget), options);
    }

    showEmailEditor(options: WidgetOptions<EmailEditorWidgetProps>) {
        this._showWidget(EmailEditorWidget, options);
    }

    showPasswordEditor(options: WidgetOptions<PasswordEditorWidgetProps>) {
        this._showWidget(PasswordEditorWidget, options);
    }

    showPhoneNumberEditor(options: WidgetOptions<PhoneNumberEditorWidgetProps>) {
        this._showWidget(PhoneNumberEditorWidget, options);
    }

    showProfileEditor(options: WidgetOptions<ProfileEditorWidgetProps>) {
        this._showWidget(ProfileEditorWidget, options);
    }

    showPasswordReset(options: WidgetOptions<PasswordResetWidgetProps>) {
        this._showWidget(PasswordResetWidget, options);
    }

    showSocialAccounts(options: WidgetOptions<SocialAccountsWidgetProps>) {
        this._showWidget(SocialAccountsWidget, options);
    }

    showWebAuthnDevices(options: WidgetOptions<WebAuthnWidgetProps>) {
        this._showWidget(WebAuthnWidget, options);
    }

    showMfa(options: WidgetOptions<MfaCredentialsWidgetProps>) {
        this._showWidget(MfaCredentialsWidget, options);
    }

    showStepUp(options: WidgetOptions<MfaStepUpWidgetProps>) {
        this._showWidget(MfaStepUpWidget, options);
    }

    showMfaCredentials(options: WidgetOptions<MfaListWidgetProps>) {
        this._showWidget(MfaListWidget, options);
    }

    showTrustedDevices(options: WidgetOptions<TrustedDeviceWidgetProps>) {
        this._showWidget(TrustedDevicesWidget, options);
    }

    async _showWidget<P extends WidgetProps>(
        Widget: ComponentType<Omit<P, keyof WidgetProps>>,
        options: P = {} as P,
        props = {}
    ) {
        const {
            container: _c1,
            fallback,
            countryCode: _c2,
            onReady: _c3,
            ...widgetProps
        } = options;

        const container =
            typeof options.container === 'string'
                ? document.getElementById(options.container)
                : options.container;

        if (!container) {
            throw new Error(`Container '#${options.container}' not found.`);
        }

        const root = createRoot(container);

        try {
            root.render(
                <ReachfiveProvider client={this.core} config={this.config} fallback={fallback}>
                    <Widget {...widgetProps} {...props} />
                </ReachfiveProvider>
            );

            if (options.onReady && typeof options.onReady === 'function') {
                options.onReady({
                    destroy() {
                        root.unmount();
                    },
                });
            }
        } catch (error) {
            const message = this.adaptError(error);
            root.render(<ErrorText>{message}</ErrorText>);
            this.handleError(error);
        }
    }

    adaptError(error: unknown): string {
        return error instanceof UserError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Unexpected error';
    }

    handleError(error: unknown): void {
        if (error instanceof UserError) {
            const message = this.adaptError(error);
            logError(`ReachFive widget display fails: ${message}`);
        } else if (error instanceof Error || typeof error === 'string') {
            logError(error);
        }
    }
}
