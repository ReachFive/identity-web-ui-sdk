export class UserError extends Error {
    constructor(...params) {
        super(...params)
        this.isUserError = true;
    }
}
