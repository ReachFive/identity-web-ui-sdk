import { UserError } from '@/helpers/errors';

const refusal = (errorDescription: string, errorMessageKey: string) =>
    UserError.fromAppError({
        errorId: '',
        error: 'Recaptcha error',
        errorDescription,
        errorMessageKey,
    });

/** Nothing could produce a token: the script, the runtime or the widget is missing. */
export const captchaUnavailable = () => refusal('Recaptcha error', 'recaptcha.error');

/** The widget is there and the user has not ticked it. */
export const checkboxNotTicked = () =>
    refusal('Please tick the reCAPTCHA box.', 'recaptcha.checkbox.required');
