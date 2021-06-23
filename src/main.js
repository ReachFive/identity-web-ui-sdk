import { createClient as createCoreClient } from '@reachfive/identity-core';

import { UiClient } from './client';
import { createUrlParser } from './core/urlParser';
import { createEventManager } from './core/identityEventManager';
import { camelCaseProperties } from './helpers/transformObjectProperties';
import { toQueryString } from './helpers/queryString';

export function createClient(creationConfig) {
    const urlParser = createUrlParser(createEventManager());
    const coreClient = createCoreClient(creationConfig);

    const client = coreClient.remoteSettings.then(remoteSettings => {
        const remoteConfig = camelCaseProperties(remoteSettings);
        const language = creationConfig.language || remoteConfig.language;

        return fetch(`https://${creationConfig.domain}/identity/v1/config/consents?${toQueryString({ lang: language })}`)
            .then(response => response.json())
            .then(consentsVersions => {
                return fetch(`${remoteSettings.resourceBaseUrl}/${language}.json`)
                    .then(response => response.json())
                    .then(defaultI18n => new UiClient({ ...creationConfig, ...remoteConfig, consentsVersions }, urlParser, coreClient, defaultI18n))
                    .catch(console.error);
            })
            .catch(console.error);
    });

    return {
        showAuth: options => client.then(client => client.showAuth(options)),
        showEmailEditor: options => client.then(client => client.showEmailEditor(options)),
        showPasswordEditor: options => client.then(client => client.showPasswordEditor(options)),
        showPhoneNumberEditor: options => client.then(client => client.showPhoneNumberEditor(options)),
        showPasswordReset: options => client.then(client => client.showPasswordReset(options)),
        showPasswordless: options => client.then(client => client.showPasswordless(options)),
        showProfileEditor: options => client.then(client => client.showProfileEditor(options)),
        showSocialAccounts: options => client.then(client => client.showSocialAccounts(options)),
        showSocialLogin: options => client.then(client => client.showSocialLogin(options)),
        showWebAuthnDevices: options => client.then(client => client.showWebAuthnDevices(options))
    };
}
