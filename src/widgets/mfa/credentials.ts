import { Mail, Smartphone, type LucideIcon } from 'lucide-react';

import {
    isPasskeyCredential,
    type MfaCredential,
    type PasskeyCredential,
} from '@/widgets/mfa/passkeyCredential';

/** An email or phone number credential: the factors listed one row each, and removable. */
export type EmailOrPhoneCredential = Exclude<MfaCredential, PasskeyCredential>;

export const isEmailOrPhoneCredential = (
    credential: MfaCredential
): credential is EmailOrPhoneCredential => !isPasskeyCredential(credential);

/** Identifies a row of the list; unique across email and phone number credentials. */
export const credentialKey = (credential: EmailOrPhoneCredential) =>
    `${credential.type}-${credential.friendlyName}`;

interface CredentialDetails {
    identifier: string;
    /** i18n key of the factor type shown under the identifier. */
    labelKey: string;
    /** i18n key naming the trash button. */
    removeLabelKey: string;
    Icon: LucideIcon;
}

/** What a row shows for each type of email or phone number credential. */
export const credentialDetails = (credential: EmailOrPhoneCredential): CredentialDetails => {
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
