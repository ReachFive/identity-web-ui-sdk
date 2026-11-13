import type { TFunction } from 'i18next';

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

/**
 * The message of an API error: the user message the API localised, else the translation of its
 * message key, else its description, else its code. Without translations, the key is skipped.
 */
const appErrorMessage = (error: AppError, i18n?: TFunction): string => {
    const fallback = error.errorDescription ?? error.error;
    if (error.errorUserMsg) return error.errorUserMsg;
    if (error.errorMessageKey && i18n) {
        return i18n(error.errorMessageKey, { defaultValue: fallback });
    }
    return fallback;
};

export class UserError extends Error {
    isUserError = true;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UserError.prototype);
    }

    /** A `UserError` with the message of an API error, read by `appErrorMessage`. */
    static fromAppError(appError: AppError, i18n?: TFunction) {
        return new UserError(appErrorMessage(appError, i18n));
    }
}

/**
 * The message shown in place of a widget that cannot be displayed. An `Error` (a `UserError`
 * included) speaks for itself; an API error reads like a `UserError` made from it.
 */
export function widgetErrorMessage(error: unknown, i18n?: TFunction): string {
    if (error instanceof Error) return error.message;
    if (isAppError(error)) return UserError.fromAppError(error, i18n).message;
    return 'Unexpected error';
}
