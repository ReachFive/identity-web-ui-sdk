import type { MFA } from '@reachfive/identity-core';

/**
 * Local copy of Core's `MFA.PasskeyCredential`, which is not published yet (Core 1.42.0).
 *
 * TODO(CA-6894 ticket 08): once Core ^1.43.0 is required, delete this file and use
 * `MFA.Credential`, `MFA.PasskeyCredential` and `MFA.isPasskeyCredential` from Core instead.
 */
export type PasskeyCredential = {
    type: 'webauthn';
    id: string;
    friendlyName: string;
    createdAt: string;
};

/**
 * A credential returned by the MFA credentials list: an MFA credential or a passkey, the passkey
 * variant being one Core 1.42.0 does not declare yet.
 */
export type ListedCredential = MFA.Credential | PasskeyCredential;

export const isPasskeyCredential = (
    credential: ListedCredential
): credential is PasskeyCredential => credential.type === 'webauthn';
