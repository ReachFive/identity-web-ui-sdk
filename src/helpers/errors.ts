export interface AppError {
    errorId: string
    errorDescription: string
    error: string
    errorUserMsg?: string
    errorDetails?: string
    errorMessageKey?: string
}

export function isAppError(err: unknown): err is AppError {
    return typeof err === 'object' && err !== null && 'errorMessageKey' in err
}

export class UserError extends Error {
    isUserError = true

    constructor(message: string) {
        super(message)
        Object.setPrototypeOf(this, UserError.prototype);
    }

    static fromAppError(appError: AppError) {
        return new UserError(appError.errorUserMsg ?? appError.errorDescription ?? appError.error)
    }
}
