/**
 * What the surrounding widget is about to do.
 *
 * Providers that score a user's intent are told which operation is under way, but each names them
 * differently — ReachFive's classic reCAPTCHA action set and the endpoints an Enterprise assessment
 * pins its expected action to do not use the same vocabulary. So widgets state the operation, and
 * each provider translates it into the names its own configuration is written against.
 */
export type CaptchaOperation =
    | 'signup'
    | 'login'
    | 'update_email'
    | 'passwordless_email'
    | 'passwordless_phone'
    | 'verify_passwordless_sms'
    | 'verify_passwordless_magic_link'
    | 'account_recovery'
    | 'forgot_password';
