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

const UNEXPECTED_ERROR = 'Unexpected error';

/** An empty text counts as missing. */
const text = (value?: string): string | undefined => (value === '' ? undefined : value);

/**
 * The message of an API error, in forms and in place of a widget. The first non-empty one of:
 * the translation of the message key (else of the error code), so an integrator's text wins;
 * the API user message; the description; the error code; a generic message.
 * Without `i18n`, no key is translated.
 */
export const appErrorMessage = (error: AppError, i18n?: TFunction): string => {
    const fallback =
        text(error.errorUserMsg) ??
        text(error.errorDescription) ??
        text(error.error) ??
        UNEXPECTED_ERROR;
    const key = text(error.errorMessageKey) ?? text(error.error);
    return key && i18n ? i18n(key, { defaultValue: fallback }) : fallback;
};

export class UserError extends Error {
    isUserError = true;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UserError.prototype);
    }

    /** A `UserError` with the message given by `appErrorMessage`. */
    static fromAppError(appError: AppError, i18n?: TFunction) {
        return new UserError(appErrorMessage(appError, i18n));
    }
}

/**
 * The message shown in place of a widget that cannot be displayed. An `Error` shows its own
 * message; an API error goes through `appErrorMessage`.
 */
export function widgetErrorMessage(error: unknown, i18n?: TFunction): string {
    if (error instanceof Error) return error.message;
    if (isAppError(error)) return UserError.fromAppError(error, i18n).message;
    return UNEXPECTED_ERROR;
}
