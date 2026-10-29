import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import {
    debouncedPasswordStrength,
    PASSWORD_STRENGTH_DEBOUNCE_DELAY,
} from '@/helpers/passwordStrength';

describe('debouncedPasswordStrength', () => {
    const getPasswordStrength = jest.fn<Client['getPasswordStrength']>();
    // @ts-expect-error partial Client
    const client: Client = { getPasswordStrength };

    beforeEach(() => {
        jest.useFakeTimers();
        getPasswordStrength.mockReset();
        getPasswordStrength.mockImplementation(password =>
            Promise.resolve({ score: Math.min(password.length, 4) as PasswordStrengthScore })
        );
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('waits for the debounce delay before calling the API', async () => {
        const strength = debouncedPasswordStrength(client, 'abc');

        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY - 1);
        expect(getPasswordStrength).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        expect(getPasswordStrength).toHaveBeenCalledTimes(1);
        await expect(strength).resolves.toEqual({ score: 3 });
    });

    test('calls the API once, with the last password, while the user is typing', async () => {
        const first = debouncedPasswordStrength(client, 'a');
        await jest.advanceTimersByTimeAsync(500);
        const last = debouncedPasswordStrength(client, 'abcd');
        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY);

        expect(getPasswordStrength).toHaveBeenCalledTimes(1);
        expect(getPasswordStrength).toHaveBeenCalledWith('abcd');
        await expect(first).resolves.toBeUndefined();
        await expect(last).resolves.toEqual({ score: 4 });
    });

    test('rejects when the API fails', async () => {
        getPasswordStrength.mockRejectedValueOnce(new Error('Too many requests'));

        const strength = debouncedPasswordStrength(client, 'abc');
        const assertion = expect(strength).rejects.toThrow('Too many requests');
        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY);
        await assertion;
    });
});
