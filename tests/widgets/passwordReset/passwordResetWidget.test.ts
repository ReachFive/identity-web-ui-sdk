/**
 * @jest-environment jest-fixed-jsdom
 * @jest-environment-options {"url": "http://localhost/?email=alice@reach5.co&verificationCode=123456"}
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { PasswordStrengthScore, type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '@/contexts/i18n';
import { OnError, OnSuccess } from '@/types';
import PasswordResetWidget from '@/widgets/passwordReset/passwordResetWidget';

import { componentGenerator, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation((password: string) => {
            let score = 0;
            if (/[a-z]+/.exec(password)) score++;
            if (/[0-9]+/.exec(password)) score++;
            if (/[^a-z0-9]+/.exec(password)) score++;
            if (password.length > 8) score++;
            return Promise.resolve({ score: score as PasswordStrengthScore });
        });

    beforeEach(() => {
        getPasswordStrength.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getPasswordStrength,
    };

    const generateSnapshot = snapshotGenerator(PasswordResetWidget, apiClient, defaultI18n);

    describe('password-reset', () => {
        test('default', generateSnapshot({}));
    });
});

describe('DOM testing', () => {
    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation((password: string) => {
            let score = 0;
            if (/[a-z]+/.exec(password)) score++;
            if (/[0-9]+/.exec(password)) score++;
            if (/[^a-z0-9]+/.exec(password)) score++;
            if (password.length > 8) score++;
            return Promise.resolve({ score: score as PasswordStrengthScore });
        });
    const updatePassword = jest.fn<Client['updatePassword']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        getPasswordStrength.mockClear();
        updatePassword.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getPasswordStrength,
        updatePassword,
    };

    const generateComponent = componentGenerator(PasswordResetWidget, apiClient, defaultI18n);

    describe('password-reset', () => {
        test('basic', async () => {
            expect.assertions(6);
            const user = userEvent.setup();

            updatePassword.mockResolvedValue();

            await generateComponent({ onError, onSuccess });

            const password = screen.getByTestId('password');
            expect(password).toBeInTheDocument();

            const passwordConfirmation = screen.getByTestId('password_confirmation');
            expect(passwordConfirmation).toBeInTheDocument();

            const submitBtn = screen.getByTestId('submit');
            expect(submitBtn).toHaveTextContent('send');

            await user.type(password, 'Wond3rFu11_Pa55w0rD*$');
            await user.type(passwordConfirmation, 'Wond3rFu11_Pa55w0rD*$');
            await user.click(submitBtn);

            expect(updatePassword).toBeCalledWith({
                password: 'Wond3rFu11_Pa55w0rD*$',
                email: 'alice@reach5.co' /** @see @jest-environment-options on top of file */,
                verificationCode: '123456' /** @see @jest-environment-options on top of file */,
            });

            expect(onSuccess).toBeCalledWith(expect.objectContaining({ name: 'password_changed' }));
            expect(onError).not.toBeCalled();
        });

        test('api failure', async () => {
            const user = userEvent.setup();

            updatePassword.mockRejectedValue('Unexpected error');

            await generateComponent({ onError, onSuccess });

            const password = screen.getByTestId('password');
            const passwordConfirmation = screen.getByTestId('password_confirmation');
            const submitBtn = screen.getByTestId('submit');

            await user.type(password, 'Wond3rFu11_Pa55w0rD*$');
            await user.type(passwordConfirmation, 'Wond3rFu11_Pa55w0rD*$');
            await user.click(submitBtn);

            expect(updatePassword).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
