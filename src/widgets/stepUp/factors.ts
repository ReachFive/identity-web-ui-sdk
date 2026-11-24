import type { Config } from '@/types';

/** A factor that verifies the user with a code sent to them. */
export type CodeFactor = 'email' | 'sms';

const CODE_FACTORS: readonly CodeFactor[] = ['email', 'sms'];

export interface StepUpFactors {
    /** Whether the passkey is offered. */
    passkey: boolean;
    /** In display order. */
    codeFactors: CodeFactor[];
}

/** Whether this browser can use a passkey. */
export function browserSupportsWebAuthn(): boolean {
    return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
}

/** The factors of a step-up token's `amr` the screens offer. */
export function stepUpFactors(amr: string[], config: Pick<Config, 'webAuthn'>): StepUpFactors {
    return {
        passkey: amr.includes('webauthn') && config.webAuthn && browserSupportsWebAuthn(),
        codeFactors: CODE_FACTORS.filter(factor => amr.includes(factor)),
    };
}
