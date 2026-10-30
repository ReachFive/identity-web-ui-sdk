import { Mail, Smartphone, type LucideIcon } from 'lucide-react';

import {
    isPasskeyCredential,
    type ListedCredential,
    type PasskeyCredential,
} from '@/widgets/mfa/passkeyCredential';

/**
 * An MFA credential (email, phone number, …): a second factor only, listed one row each and
 * removable. Passkeys are left out: an authentication method first, they are managed in their own
 * view.
 */
export type MfaCredential = Exclude<ListedCredential, PasskeyCredential>;

export const isMfaCredential = (credential: ListedCredential): credential is MfaCredential =>
    !isPasskeyCredential(credential);

/** Identifies a row of the list; unique across MFA credentials. */
export const credentialKey = (credential: MfaCredential) =>
    `${credential.type}-${credential.friendlyName}`;

interface CredentialDetails {
    identifier: string;
    /** i18n key of the factor type shown under the identifier. */
    labelKey: string;
    /** i18n key naming the trash button. */
    removeLabelKey: string;
    Icon: LucideIcon;
}

/** What a row shows for each type of MFA credential. */
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
