import type {
    Config,
    ConsentVersions,
    Client as CoreClient,
    RemoteSettings,
} from '@reachfive/identity-core';
import { createClient as createCoreClient } from '@reachfive/identity-core';

import { UiClient } from './client';
import { toQueryString } from './helpers/queryString';
import { camelCaseProperties } from './helpers/transformObjectProperties';

export type { Config } from '@reachfive/identity-core';

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

export function createClient(creationConfig: Config): Client {
    const coreClient = createCoreClient(creationConfig);

    const client = coreClient.remoteSettings.then(remoteSettings => {
        const remoteConfig = camelCaseProperties(remoteSettings) as RemoteSettings;
        const language = creationConfig.language ?? remoteSettings.language;

        return fetch(
            `https://${creationConfig.domain}/identity/v1/config/consents?${toQueryString({ lang: language })}`
        )
            .then(response => response.json())
            .then((consentsVersions: Record<string, ConsentVersions>) => {
                return fetch(`${remoteConfig.resourceBaseUrl}/${language}.json`)
                    .then(response => response.json())
                    .then(defaultI18n => {
                        const config = {
                            ...creationConfig,
                            ...remoteConfig,
                            consentsVersions: Object.fromEntries(
                                Object.entries(consentsVersions).map(([key, value]) => [
                                    key, // consents keys should be snake_case
                                    camelCaseProperties(value) as ConsentVersions,
                                ])
                            ),
                        };
                        return new UiClient(config, coreClient, defaultI18n);
                    });
            });
    });

    return {
        core: coreClient,
        showAuth: (options: Parameters<Awaited<typeof client>['showAuth']>[0]) =>
            client.then(client => client.showAuth(options)),
        showAccountRecovery: (
            options: Parameters<Awaited<typeof client>['showAccountRecovery']>[0]
        ) => client.then(client => client.showAccountRecovery(options)),
        showEmailEditor: (options: Parameters<Awaited<typeof client>['showEmailEditor']>[0]) =>
            client.then(client => client.showEmailEditor(options)),
        showPasswordEditor: (
            options: Parameters<Awaited<typeof client>['showPasswordEditor']>[0]
        ) => client.then(client => client.showPasswordEditor(options)),
        showPhoneNumberEditor: (
            options: Parameters<Awaited<typeof client>['showPhoneNumberEditor']>[0]
        ) => client.then(client => client.showPhoneNumberEditor(options)),
        showPasswordReset: (options: Parameters<Awaited<typeof client>['showPasswordReset']>[0]) =>
            client.then(client => client.showPasswordReset(options)),
        showPasswordless: (options: Parameters<Awaited<typeof client>['showPasswordless']>[0]) =>
            client.then(client => client.showPasswordless(options)),
        showProfileEditor: (options: Parameters<Awaited<typeof client>['showProfileEditor']>[0]) =>
            client.then(client => client.showProfileEditor(options)),
        showSocialAccounts: (
            options: Parameters<Awaited<typeof client>['showSocialAccounts']>[0]
        ) => client.then(client => client.showSocialAccounts(options)),
        showSocialLogin: (options: Parameters<Awaited<typeof client>['showSocialLogin']>[0]) =>
            client.then(client => client.showSocialLogin(options)),
        showWebAuthnDevices: (
            options: Parameters<Awaited<typeof client>['showWebAuthnDevices']>[0]
        ) => client.then(client => client.showWebAuthnDevices(options)),
        showMfa: (options: Parameters<Awaited<typeof client>['showMfa']>[0]) =>
            client.then(client => client.showMfa(options)),
        showMfaCredentials: (
            options: Parameters<Awaited<typeof client>['showMfaCredentials']>[0]
        ) => client.then(client => client.showMfaCredentials(options)),
        showStepUp: (options: Parameters<Awaited<typeof client>['showStepUp']>[0]) =>
            client.then(client => client.showStepUp(options)),
        showTrustedDevices: (
            options: Parameters<Awaited<typeof client>['showTrustedDevices']>[0]
        ) => client.then(client => client.showTrustedDevices(options)),
    };
}
