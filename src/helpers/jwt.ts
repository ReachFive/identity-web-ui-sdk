import type { AuthResult } from '@reachfive/identity-core';

import { decodeBase64UrlSafe } from '@/helpers/base64';
import { camelCaseProperties } from '@/helpers/transformObjectProperties';

export type IdTokenPayload = AuthResult['idTokenPayload'];

export function parseJwtTokenPayload(token: string): IdTokenPayload {
    const bodyPart = token.split('.')[1];
    return camelCaseProperties(JSON.parse(decodeBase64UrlSafe(bodyPart))) as IdTokenPayload;
}
