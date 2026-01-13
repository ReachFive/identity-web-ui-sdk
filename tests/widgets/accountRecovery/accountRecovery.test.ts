/**
 * @jest-environment jest-fixed-jsdom
 * @jest-environment-options {"url": "http://localhost/?email=alice@reach5.co&verificationCode=123456&email=alice@reach5.co&clientId=local"}
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import { type I18nMessages } from '@/contexts/i18n';
import { OnError, OnSuccess } from '@/types';
import AccountRecoveryWidget from '@/widgets/accountRecovery/accountRecoveryWidget';

import { componentGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

const getPasswordStrengthImplementation = (password: string) => {
    let score = 0;
    if (/[a-z]+/.exec(password)) score++;
    if (/[0-9]+/.exec(password)) score++;
    if (/[^a-z0-9]+/.exec(password)) score++;
    if (password.length > 8) score++;
    return Promise.resolve({ score: score as PasswordStrengthScore });
};

describe('DOM testing', () => {
    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation(getPasswordStrengthImplementation);
    const resetPasskeys = jest.fn<Client['resetPasskeys']>();
    const updatePassword = jest.fn<Client['updatePassword']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        getPasswordStrength.mockClear();
        resetPasskeys.mockClear();
        updatePassword.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getPasswordStrength,
        resetPasskeys,
        updatePassword,
    };

    const generateComponent = componentGenerator(AccountRecoveryWidget, apiClient, defaultI18n);

    describe('accountRecovery', () => {
        test('default', async () => {
            const user = userEvent.setup();

            resetPasskeys.mockResolvedValue();

            await generateComponent({ onError, onSuccess });

            const passkeyResetBtn = screen.getByRole('button', {
                name: 'accountRecovery.passkeyReset.button',
            });
            expect(passkeyResetBtn).toBeInTheDocument();

            await user.click(passkeyResetBtn);

            expect(resetPasskeys).toBeCalledWith(
                expect.objectContaining({
                    email: 'alice@reach5.co' /** @see @jest-environment-options on top of file */,
                    verificationCode: '123456' /** @see @jest-environment-options on top of file */,
                    clientId: 'local' /** @see @jest-environment-options on top of file */,
                })
            );

            expect(
                screen.getByText('accountRecovery.passkeyReset.successMessage')
            ).toBeInTheDocument();

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    name: 'webauthn_reset',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('allowCreatePassword = false', async () => {
            await generateComponent({
                allowCreatePassword: false,
            });

            const createNewPasswordBtn = screen.queryByRole('link', {
                name: 'accountRecovery.password.title',
            });

            expect(createNewPasswordBtn).not.toBeInTheDocument();
        });

        test('Create a new password', async () => {
            const user = userEvent.setup();

            updatePassword.mockResolvedValue();

            await generateComponent({ onError, onSuccess });

            const createNewPasswordBtn = screen.getByRole('link', {
                name: 'accountRecovery.password.title',
            });
            expect(createNewPasswordBtn).toBeInTheDocument();

            await user.click(createNewPasswordBtn);

            const newPasswordInput = screen.getByLabelText('newPassword');
            await user.clear(newPasswordInput);
            await user.type(newPasswordInput, 'Wond3rFu11_Pa55w0rD*$');

            const passwordConfirmationInput = screen.getByLabelText('passwordConfirmation');
            await user.clear(passwordConfirmationInput);
            await user.type(passwordConfirmationInput, 'Wond3rFu11_Pa55w0rD*$');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(updatePassword).toBeCalledWith(
                expect.objectContaining({
                    password: 'Wond3rFu11_Pa55w0rD*$',
                    email: 'alice@reach5.co' /** @see @jest-environment-options on top of file */,
                    verificationCode: '123456' /** @see @jest-environment-options on top of file */,
                    clientId: 'local' /** @see @jest-environment-options on top of file */,
                })
            );

            expect(screen.getByText('passwordReset.successMessage')).toBeInTheDocument();

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    name: 'password_changed',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('resetPasskeys api failure', async () => {
            const user = userEvent.setup();

            resetPasskeys.mockRejectedValue('Unexpected error');

            await generateComponent({ onError, onSuccess });

            const passkeyResetBtn = screen.getByRole('button', {
                name: 'accountRecovery.passkeyReset.button',
            });

            await user.click(passkeyResetBtn);

            expect(resetPasskeys).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });

        test('updatePassword api failure', async () => {
            const user = userEvent.setup();

            updatePassword.mockRejectedValue('Unexpected error');

            await generateComponent({ onError, onSuccess });

            const createNewPasswordBtn = screen.getByRole('link', {
                name: 'accountRecovery.password.title',
            });

            await user.click(createNewPasswordBtn);

            const newPasswordInput = screen.getByLabelText('newPassword');
            await user.clear(newPasswordInput);
            await user.type(newPasswordInput, 'Wond3rFu11_Pa55w0rD*$');

            const passwordConfirmationInput = screen.getByLabelText('passwordConfirmation');
            await user.clear(passwordConfirmationInput);
            await user.type(passwordConfirmationInput, 'Wond3rFu11_Pa55w0rD*$');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(updatePassword).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
