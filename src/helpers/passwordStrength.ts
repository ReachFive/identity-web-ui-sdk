import type { Client, PasswordStrength } from '@reachfive/identity-core';

// the password strength endpoint is rate limited: wait for the user to stop typing
export const PASSWORD_STRENGTH_DEBOUNCE_DELAY = 1000;

type Waiter = {
    resolve: (strength: PasswordStrength) => void;
    reject: (error: unknown) => void;
};

type PasswordStrengthChecker = (password: string) => Promise<PasswordStrength>;

function createPasswordStrengthChecker(client: Client): PasswordStrengthChecker {
    let last: { password: string; strength: Promise<PasswordStrength> } | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let waiters: Waiter[] = [];

    return password => {
        if (last?.password === password) return last.strength;

        clearTimeout(timerId);
        return new Promise<PasswordStrength>((resolve, reject) => {
            waiters = [...waiters, { resolve, reject }];
            timerId = setTimeout(() => {
                // a caller superseded by a newer password gets that password's result, rather
                // than a promise that never settles
                const settling = waiters;
                waiters = [];
                const strength = client.getPasswordStrength(password);
                last = { password, strength };
                strength.then(
                    result => settling.forEach(waiter => waiter.resolve(result)),
                    (error: unknown) => {
                        if (last?.strength === strength) last = undefined;
                        settling.forEach(waiter => waiter.reject(error));
                    }
                );
            }, PASSWORD_STRENGTH_DEBOUNCE_DELAY);
        });
    };
}

// one checker per client, shared by the strength indicator and the form validation
const checkers = new WeakMap<Client, PasswordStrengthChecker>();

/**
 * Debounced `client.getPasswordStrength`: one API call per pause in typing, and none at all for
 * the password checked last.
 */
export function getPasswordStrength(client: Client, password: string): Promise<PasswordStrength> {
    const checker = checkers.get(client) ?? createPasswordStrengthChecker(client);
    checkers.set(client, checker);
    return checker(password);
}
