import { logError } from '@/helpers/logger';

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
 * included) speaks for itself; anything else, an API error object included, stays generic.
 */
export function widgetErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unexpected error';
}

/**
 * Logs a widget that cannot be displayed, whether it failed before rendering (`_showWidget`) or
 * while loading its data (the query widget's error boundary). Anything but an `Error` or a string,
 * an API error object included, is reported through `onError` only.
 */
export function logWidgetError(error: unknown): void {
    if (error instanceof UserError) {
        logError(`ReachFive widget display fails: ${widgetErrorMessage(error)}`);
    } else if (error instanceof Error || typeof error === 'string') {
        logError(error);
    }
}
