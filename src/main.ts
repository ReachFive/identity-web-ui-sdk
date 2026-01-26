import type { Config, Client as CoreClient } from '@reachfive/identity-core';
import { createClient as createCoreClient } from '@reachfive/identity-core';

import { UiClient } from './client';

export type { Config } from '@reachfive/identity-core';

export { ReachfiveProvider, useReachfive, type ReachfiveProviderProps } from './contexts/reachfive';
export { default as AccountRecovery } from './widgets/accountRecovery/accountRecoveryWidget.tsx';
export { default as Auth } from './widgets/auth/authWidget';
export { default as EmailEditor } from './widgets/emailEditor/emailEditorWidget';
export { default as MfaCredentials } from './widgets/mfa/MfaCredentialsWidget';
export { default as MfaList } from './widgets/mfa/mfaListWidget';
export { default as TrustedDevices } from './widgets/mfa/trustedDevicesWidget.tsx';
export { default as PasswordEditor } from './widgets/passwordEditor/passwordEditorWidget';
export { default as Passwordless } from './widgets/passwordless/passwordlessWidget';
export { default as PasswordReset } from './widgets/passwordReset/passwordResetWidget';
export { default as PhoneNumberEditor } from './widgets/phoneNumberEditor/phoneNumberEditorWidget';
export { default as ProfileEditor } from './widgets/profileEditor/profileEditorWidget';
export { default as SocialAccounts } from './widgets/socialAccounts/socialAccountsWidget';
export { default as SocialLogin } from './widgets/socialLogin/socialLoginWidget';
export { default as MfaStepUp } from './widgets/stepUp/mfaStepUpWidget';
export { default as WebAuthnDevices } from './widgets/webAuthn/webAuthnDevicesWidget';

export type Client = {
    core: CoreClient;
    showAuth: InstanceType<typeof UiClient>['showAuth'];
    showAccountRecovery: InstanceType<typeof UiClient>['showAccountRecovery'];
    showEmailEditor: InstanceType<typeof UiClient>['showEmailEditor'];
    showPasswordEditor: InstanceType<typeof UiClient>['showPasswordEditor'];
    showPhoneNumberEditor: InstanceType<typeof UiClient>['showPhoneNumberEditor'];
    showPasswordReset: InstanceType<typeof UiClient>['showPasswordReset'];
    showPasswordless: InstanceType<typeof UiClient>['showPasswordless'];
    showProfileEditor: InstanceType<typeof UiClient>['showProfileEditor'];
    showSocialAccounts: InstanceType<typeof UiClient>['showSocialAccounts'];
    showSocialLogin: InstanceType<typeof UiClient>['showSocialLogin'];
    showWebAuthnDevices: InstanceType<typeof UiClient>['showWebAuthnDevices'];
    showMfa: InstanceType<typeof UiClient>['showMfa'];
    showMfaCredentials: InstanceType<typeof UiClient>['showMfaCredentials'];
    showStepUp: InstanceType<typeof UiClient>['showStepUp'];
    showTrustedDevices: InstanceType<typeof UiClient>['showTrustedDevices'];
};

export function createClient(config: Config): Client {
    const coreClient = createCoreClient(config);

    const client = new UiClient(config, coreClient);

    return {
        core: coreClient,
        showAuth: (options: Parameters<Awaited<typeof client>['showAuth']>[0]) =>
            client.showAuth(options),
        showAccountRecovery: (
            options: Parameters<Awaited<typeof client>['showAccountRecovery']>[0]
        ) => client.showAccountRecovery(options),
        showEmailEditor: (options: Parameters<Awaited<typeof client>['showEmailEditor']>[0]) =>
            client.showEmailEditor(options),
        showPasswordEditor: (
            options: Parameters<Awaited<typeof client>['showPasswordEditor']>[0]
        ) => client.showPasswordEditor(options),
        showPhoneNumberEditor: (
            options: Parameters<Awaited<typeof client>['showPhoneNumberEditor']>[0]
        ) => client.showPhoneNumberEditor(options),
        showPasswordReset: (options: Parameters<Awaited<typeof client>['showPasswordReset']>[0]) =>
            client.showPasswordReset(options),
        showPasswordless: (options: Parameters<Awaited<typeof client>['showPasswordless']>[0]) =>
            client.showPasswordless(options),
        showProfileEditor: (options: Parameters<Awaited<typeof client>['showProfileEditor']>[0]) =>
            client.showProfileEditor(options),
        showSocialAccounts: (
            options: Parameters<Awaited<typeof client>['showSocialAccounts']>[0]
        ) => client.showSocialAccounts(options),
        showSocialLogin: (options: Parameters<Awaited<typeof client>['showSocialLogin']>[0]) =>
            client.showSocialLogin(options),
        showWebAuthnDevices: (
            options: Parameters<Awaited<typeof client>['showWebAuthnDevices']>[0]
        ) => client.showWebAuthnDevices(options),
        showMfa: (options: Parameters<Awaited<typeof client>['showMfa']>[0]) =>
            client.showMfa(options),
        showMfaCredentials: (
            options: Parameters<Awaited<typeof client>['showMfaCredentials']>[0]
        ) => client.showMfaCredentials(options),
        showStepUp: (options: Parameters<Awaited<typeof client>['showStepUp']>[0]) =>
            client.showStepUp(options),
        showTrustedDevices: (
            options: Parameters<Awaited<typeof client>['showTrustedDevices']>[0]
        ) => client.showTrustedDevices(options),
    };
}
