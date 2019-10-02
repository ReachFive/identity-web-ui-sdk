import { rawRequest } from './helpers/httpClient';
import { UiClient } from './client';
import { createUrlParser } from './core/urlParser';
import { createEventManager } from './core/identityEventManager';
import { toQueryString } from './helpers/queryString';

export function createClient(creationConfig) {
    const eventManager = createEventManager();
    const urlParser = createUrlParser(eventManager);
    const query = { clientId: creationConfig.clientId, lang: creationConfig.language };

    const client = rawRequest(`https://${creationConfig.domain}/identity/v1/config?${toQueryString(query)}`)
        .then(remoteConfig => new UiClient({ ...creationConfig, ...remoteConfig }, urlParser));

    return {
        showAuth: options => client.then(client => client.showAuth(options))
    };
}
