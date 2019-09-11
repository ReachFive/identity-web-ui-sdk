import { camelCaseProperties } from './transformObjectProperties';
import { decodeBase64UrlSafe } from './base64';

export function parseJwtTokenPayload(token) {
    const bodyPart = token.split('.')[1];

    return camelCaseProperties(JSON.parse(decodeBase64UrlSafe(bodyPart)));
}
