import type { AuthResult } from '@reachfive/identity-core'

export type IdTokenPayload = AuthResult['idTokenPayload']

import { camelCaseProperties } from './transformObjectProperties';
import { decodeBase64UrlSafe } from './base64';

export function parseJwtTokenPayload(token: string): IdTokenPayload {
    const bodyPart = token.split('.')[1]
    return camelCaseProperties(JSON.parse(decodeBase64UrlSafe(bodyPart))) as IdTokenPayload
  }
