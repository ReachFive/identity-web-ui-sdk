import { parseJwtTokenPayload } from '../helpers/jwt'
import { logError } from '../helpers/logger'

export function enrichAuthResult(response) {
    if (response.idToken) {
        try {
            const idTokenPayload = parseJwtTokenPayload(response.idToken);

            return {
                ...response,
                idTokenPayload
            };
        } catch (e) {
            logError('id token parsing error: ' + e);
        }
    }

    return response;
}

export function isAuthResult(value) {
    return value && (value.accessToken || value.idToken);
}

export function isErrorResponse(value) {
    return value && value.error;
}
