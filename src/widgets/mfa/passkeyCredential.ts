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

/** An MFA credential, including the passkey variant Core 1.42.0 does not declare yet. */
export type MfaCredential = MFA.Credential | PasskeyCredential;

export const isPasskeyCredential = (credential: MfaCredential): credential is PasskeyCredential =>
    credential.type === 'webauthn';

/** An email or phone number credential: the factors listed one row each, and removable. */
export type EmailOrPhoneCredential = Exclude<MfaCredential, PasskeyCredential>;

export const isEmailOrPhoneCredential = (
    credential: MfaCredential
): credential is EmailOrPhoneCredential => !isPasskeyCredential(credential);
