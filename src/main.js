import { createClient as createCoreClient } from '@reachfive/identity-core';

import { UiClient } from './client';
import { createUrlParser } from './core/urlParser';
import { createEventManager } from './core/identityEventManager';

export function createClient(creationConfig) {
    const urlParser = createUrlParser(createEventManager());
    const coreClient = createCoreClient(creationConfig);

    const client = coreClient.remoteSettings.then(remoteSettings => {
        return new UiClient({ ...creationConfig, ...remoteSettings }, urlParser, coreClient)
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
        showSocialLogin: options => client.then(client => client.showSocialLogin(options))
    };
}
