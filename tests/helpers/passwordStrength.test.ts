import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import { getPasswordStrength, PASSWORD_STRENGTH_DEBOUNCE_DELAY } from '@/helpers/passwordStrength';

describe('getPasswordStrength', () => {
    const apiGetPasswordStrength = jest.fn<Client['getPasswordStrength']>();
    let client: Client;

    beforeEach(() => {
        jest.useFakeTimers();
        apiGetPasswordStrength.mockReset();
        apiGetPasswordStrength.mockImplementation(password =>
            Promise.resolve({ score: Math.min(password.length, 4) as PasswordStrengthScore })
        );
        // a new client per test, so no result is shared between tests
        // @ts-expect-error partial Client
        client = { getPasswordStrength: apiGetPasswordStrength };
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('waits for the debounce delay before calling the API', async () => {
        const strength = getPasswordStrength(client, 'abc');

        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY - 1);
        expect(apiGetPasswordStrength).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        expect(apiGetPasswordStrength).toHaveBeenCalledTimes(1);
        await expect(strength).resolves.toEqual({ score: 3 });
    });

    test('calls the API once, with the last password, while the user is typing', async () => {
        const first = getPasswordStrength(client, 'a');
        await jest.advanceTimersByTimeAsync(500);
        const second = getPasswordStrength(client, 'ab');
        await jest.advanceTimersByTimeAsync(500);
        const last = getPasswordStrength(client, 'abcd');
        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY);

        expect(apiGetPasswordStrength).toHaveBeenCalledTimes(1);
        expect(apiGetPasswordStrength).toHaveBeenCalledWith('abcd');
        // superseded callers get the latest result instead of hanging forever
        await expect(first).resolves.toEqual({ score: 4 });
        await expect(second).resolves.toEqual({ score: 4 });
        await expect(last).resolves.toEqual({ score: 4 });
    });

    test('reuses the last result for the same password, without waiting', async () => {
        const strength = getPasswordStrength(client, 'abc');
        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY);
        await strength;

        // e.g. the form validation asking for the password the indicator already checked
        await expect(getPasswordStrength(client, 'abc')).resolves.toEqual({ score: 3 });
        expect(apiGetPasswordStrength).toHaveBeenCalledTimes(1);
    });

    test('shares the debounce between callers of the same client only', async () => {
        const otherApiGetPasswordStrength = jest
            .fn<Client['getPasswordStrength']>()
            .mockResolvedValue({ score: 1 });
        // @ts-expect-error partial Client
        const otherClient: Client = { getPasswordStrength: otherApiGetPasswordStrength };

        const strength = getPasswordStrength(client, 'abc');
        const otherStrength = getPasswordStrength(otherClient, 'abc');
        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY);

        await expect(strength).resolves.toEqual({ score: 3 });
        await expect(otherStrength).resolves.toEqual({ score: 1 });
    });

    test('rejects every waiting caller and forgets the failure when the API fails', async () => {
        apiGetPasswordStrength.mockRejectedValueOnce(new Error('Too many requests'));

        const first = getPasswordStrength(client, 'ab');
        const last = getPasswordStrength(client, 'abc');
        const assertions = Promise.all([
            expect(first).rejects.toThrow('Too many requests'),
            expect(last).rejects.toThrow('Too many requests'),
        ]);
        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY);
        await assertions;

        // the next call for the same password asks the API again
        const retry = getPasswordStrength(client, 'abc');
        await jest.advanceTimersByTimeAsync(PASSWORD_STRENGTH_DEBOUNCE_DELAY);
        await expect(retry).resolves.toEqual({ score: 3 });
        expect(apiGetPasswordStrength).toHaveBeenCalledTimes(2);
    });
});
