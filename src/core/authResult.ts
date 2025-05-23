import { AuthResult, ErrorResponse } from '@reachfive/identity-core';

import { parseJwtTokenPayload } from '../helpers/jwt';
import { logError } from '../helpers/logger';

export function enrichAuthResult(response: AuthResult) {
    if (response.idToken) {
        try {
            const idTokenPayload = parseJwtTokenPayload(response.idToken);

            return {
                ...response,
                idTokenPayload,
            };
        } catch (e) {
            logError('id token parsing error: ' + e);
        }
    }

    return response;
}

export function isAuthResult(value: unknown): value is AuthResult {
    return (
        value !== null &&
        typeof value === 'object' &&
        ('accessToken' in value || 'idToken' in value)
    );
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
    return value !== null && typeof value === 'object' && 'error' in value;
}
