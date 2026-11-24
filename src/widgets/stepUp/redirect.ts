import type { AuthOptions, AuthResult } from '@reachfive/identity-core';

import { toQueryString } from '@/helpers/queryString';

/** Sends the user back to the application, unless an orchestrated flow continues on its own. */
export function completeStepUp(auth: AuthOptions | undefined, authResult: AuthResult): void {
    const isOrchestratedFlow = new URLSearchParams(window.location.search).has('r5_request_token');
    if (isOrchestratedFlow) return;
    window.location.replace(
        // @ts-expect-error AuthResult is too complex and is not representative of the real response of this request
        (auth?.redirectUri ?? '') + '?' + toQueryString(authResult)
    );
}
