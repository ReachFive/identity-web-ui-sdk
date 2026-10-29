import type { Client, PasswordStrength } from '@reachfive/identity-core';

// the password strength endpoint is rate limited: wait for the user to stop typing
export const PASSWORD_STRENGTH_DEBOUNCE_DELAY = 1000;

let pending: { timerId: ReturnType<typeof setTimeout>; skip: () => void } | undefined;

/**
 * Calls `client.getPasswordStrength` once the user has stopped typing.
 * Resolves with `undefined` when a newer password replaces this one before the delay ends.
 */
export function debouncedPasswordStrength(
    client: Client,
    password: string
): Promise<PasswordStrength | undefined> {
    if (pending) {
        clearTimeout(pending.timerId);
        pending.skip();
    }
    return new Promise((resolve, reject) => {
        pending = {
            skip: () => resolve(undefined),
            timerId: setTimeout(() => {
                pending = undefined;
                client.getPasswordStrength(password).then(resolve, reject);
            }, PASSWORD_STRENGTH_DEBOUNCE_DELAY),
        };
    });
}
