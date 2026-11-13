import { isMfaCredential, type MfaCredential } from '@/widgets/mfa/credentials';
import { isPasskeyCredential, type ListedCredential } from '@/widgets/mfa/passkeyCredential';

import type { Config } from '@/types';

export type AddableFactor = 'passkey' | 'email' | 'sms';

/** The profile fields the factor rules read. */
export type MfaProfile = {
    email?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
};

export interface FactorChoices {
    /** The MFA credentials already set up. */
    enabled: MfaCredential[];
    passkeyCount: number;
    /** The factors the user can still add, in display order. */
    addable: AddableFactor[];
}

export type CredentialGroups = Pick<FactorChoices, 'enabled' | 'passkeyCount'>;

/** The listed credentials as the screens show them: one row per MFA credential, passkeys counted. */
export function groupCredentials(credentials: ListedCredential[]): CredentialGroups {
    return {
        enabled: credentials.filter(isMfaCredential),
        passkeyCount: credentials.filter(isPasskeyCredential).length,
    };
}

export function factorChoices(
    config: Pick<Config, 'webAuthn' | 'mfaEmailEnabled' | 'mfaSmsEnabled' | 'mfaWebauthnEnabled'>,
    credentials: ListedCredential[],
    profile: MfaProfile
): FactorChoices {
    const { enabled, passkeyCount } = groupCredentials(credentials);
    const has = (type: MfaCredential['type']) => enabled.some(c => c.type === type);

    const addable: AddableFactor[] = [];
    // a passkey also needs the WebAuthn feature of the account, as showWebAuthnDevices does
    if (config.webAuthn && config.mfaWebauthnEnabled && passkeyCount === 0) addable.push('passkey');
    if (config.mfaEmailEnabled && !has('email') && profile.email) addable.push('email');
    if (config.mfaSmsEnabled && !has('sms')) addable.push('sms');

    return { enabled, passkeyCount, addable };
}

/**
 * Whether starting the enrollment sends no code: the backend enables the factor right away when
 * the identifier is already verified on the profile.
 */
export function sendsNoCode(
    factor: 'email' | 'sms',
    profile: MfaProfile,
    phoneNumber?: string
): boolean {
    if (factor === 'email') return profile.emailVerified === true;
    return (
        phoneNumber !== undefined &&
        phoneNumber === profile.phoneNumber &&
        profile.phoneNumberVerified === true
    );
}

/** Hides a phone number but its last two digits: `••78`. */
export function maskPhoneNumber(phoneNumber: string): string {
    return `••${phoneNumber.replace(/\D/g, '').slice(-2)}`;
}
