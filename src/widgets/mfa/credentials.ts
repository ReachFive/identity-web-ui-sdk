import { Mail, Smartphone, type LucideIcon } from 'lucide-react';

import { MFA } from '@reachfive/identity-core';

/** An email or phone number credential. Passkeys are managed in their own view. */
export type MfaCredential = MFA.EmailCredential | MFA.PhoneCredential;

/**
 * Keeps only the types this SDK can show and remove. The API may return a type that Core does not
 * declare yet (TOTP, …): it is skipped.
 */
export const isMfaCredential = (credential: MFA.Credential): credential is MfaCredential =>
    MFA.isEmailCredential(credential) || MFA.isPhoneCredential(credential);

export const credentialKey = (credential: MfaCredential) =>
    `${credential.type}-${credential.friendlyName}`;

interface CredentialDetails {
    identifier: string;
    /** i18n key of the factor type shown under the identifier. */
    labelKey: string;
    /** i18n key of the trash button label. */
    removeLabelKey: string;
    Icon: LucideIcon;
}

export const credentialDetails = (credential: MfaCredential): CredentialDetails => {
    switch (credential.type) {
        case 'email':
            return {
                identifier: credential.email,
                labelKey: 'mfaList.email',
                removeLabelKey: 'mfa.remove.email',
                Icon: Mail,
            };
        case 'sms':
            return {
                identifier: credential.phoneNumber,
                labelKey: 'mfaList.phoneNumber',
                removeLabelKey: 'mfa.remove.phoneNumber',
                Icon: Smartphone,
            };
    }
};
