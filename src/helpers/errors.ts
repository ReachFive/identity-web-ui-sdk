export interface AppError {
    errorId: string;
    errorDescription: string;
    error: string;
    errorUserMsg?: string;
    errorDetails?: FieldError[];
    errorMessageKey?: string;
}

type FieldErrorCode = 'missing' | 'invalid';

interface FieldError {
    field?: string;
    message: string;
    code: FieldErrorCode;
}

export function isAppError(err: unknown): err is AppError {
    return (
        typeof err === 'object' &&
        err !== null &&
        'error' in err &&
        ('errorDescription' in err || 'errorMessageKey' in err || 'errorDetails' in err)
    );
}

/**
 * The `errorMessageKey` the API refuses a verification code with. It answers the same for a wrong
 * code, a code which reached its maximum number of trials and an expired one, on purpose: which of
 * them it is must not be told apart.
 */
export const VERIFICATION_CODE_REFUSED = 'error.invalidVerificationCode';

export class UserError extends Error {
    isUserError = true;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UserError.prototype);
    }

    static fromAppError(appError: AppError) {
        return new UserError(appError.errorUserMsg ?? appError.errorDescription ?? appError.error);
    }
}

/**
 * The message shown in place of a widget that cannot be displayed. An `Error` (a `UserError`
 * included) speaks for itself, and an API error reads like a `UserError` made from it.
 */
export function widgetErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (isAppError(error)) return UserError.fromAppError(error).message;
    return 'Unexpected error';
}
