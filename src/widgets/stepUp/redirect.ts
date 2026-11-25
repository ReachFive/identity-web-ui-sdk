import type { AuthOptions, AuthResult } from '@reachfive/identity-core';

import { snakeCaseProperties } from '@/helpers/transformObjectProperties';

/** Sends the user back to the application, unless an orchestrated flow continues on its own. */
export function completeStepUp(auth: AuthOptions | undefined, authResult: AuthResult): void {
    const isOrchestratedFlow = new URLSearchParams(window.location.search).has('r5_request_token');
    if (isOrchestratedFlow) return;
    // relative to the current page when the redirect URI is missing or relative
    const url = new URL(auth?.redirectUri ?? '', window.location.href);
    Object.entries(snakeCaseProperties({ ...authResult }))
        .filter(([, value]) => value !== null && value !== undefined)
        .forEach(([key, value]) => url.searchParams.set(key, String(value)));
    window.location.replace(url.toString());
}
