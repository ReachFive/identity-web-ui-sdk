export class UserError extends Error {
    constructor(...params) {
        super(...params)
        this.isUserError = true;
    }

    static fromAppError(appError) {
        return new UserError(appError.errorUserMsg || appError.errorDescription || appError.error)
    }
}
