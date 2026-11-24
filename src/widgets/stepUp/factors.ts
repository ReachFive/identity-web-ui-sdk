/** A factor that verifies the user with a code sent to them. */
export type CodeFactor = 'email' | 'sms';

const CODE_FACTORS: readonly CodeFactor[] = ['email', 'sms'];

export interface StepUpFactors {
    /** In display order. */
    codeFactors: CodeFactor[];
}

/** The factors of a step-up token's `amr` the screens offer. */
export function stepUpFactors(amr: string[]): StepUpFactors {
    return { codeFactors: CODE_FACTORS.filter(factor => amr.includes(factor)) };
}
