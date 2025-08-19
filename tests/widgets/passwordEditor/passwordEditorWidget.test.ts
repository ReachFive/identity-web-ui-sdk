/**
 * @jest-environment jest-fixed-jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import { type I18nMessages } from '@/core/i18n';
import { OnError, OnSuccess } from '@/types';
import PasswordEditorWidget from '@/widgets/passwordEditor/passwordEditorWidget';

import { componentGenerator, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

const getPasswordStrengthImplementation = (password: string) => {
    let score = 0;
    if (/[a-z]+/.exec(password)) score++;
    if (/[0-9]+/.exec(password)) score++;
    if (/[^a-z0-9]+/.exec(password)) score++;
    if (password.length > 8) score++;
    return Promise.resolve({ score: score as PasswordStrengthScore });
};

describe('Snapshot', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {
        getPasswordStrength: jest
            .fn<Client['getPasswordStrength']>()
            .mockImplementation(getPasswordStrengthImplementation),
        updatePassword: jest.fn<Client['updatePassword']>().mockResolvedValue(),
    };

    const generateSnapshot = snapshotGenerator(PasswordEditorWidget, apiClient, defaultI18n);

    describe('password editor', () => {
        test('basic', generateSnapshot({}));
    });
});

describe('DOM testing', () => {
    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation(getPasswordStrengthImplementation);
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

    const generateComponent = componentGenerator(PasswordEditorWidget, apiClient, defaultI18n);

    describe('passwordEditor', () => {
        test('default', async () => {
            const user = userEvent.setup();

            updatePassword.mockResolvedValue();

            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            expect(screen.queryByLabelText('oldPassword')).not.toBeInTheDocument();

            const newPasswordInput = screen.getByLabelText('newPassword');
            expect(newPasswordInput).toBeInTheDocument();

            const passwordConfirmationInput = screen.getByLabelText('passwordConfirmation');
            expect(passwordConfirmationInput).toBeInTheDocument();

            await userEvent.clear(newPasswordInput);
            await userEvent.type(newPasswordInput, 'bob@reach5.co');

            await userEvent.clear(passwordConfirmationInput);
            await userEvent.type(passwordConfirmationInput, 'bob@reach5.co');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(updatePassword).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    password: 'bob@reach5.co',
                })
            );

            expect(onSuccess).toBeCalledWith(expect.objectContaining({ name: 'password_changed' }));
            expect(onError).not.toBeCalled();
        });

        test('with promptOldPassword = true', async () => {
            const user = userEvent.setup();

            updatePassword.mockResolvedValue();

            await generateComponent({
                accessToken: 'azerty',
                promptOldPassword: true,
                onError,
                onSuccess,
            });

            const oldPasswordInput = screen.getByLabelText('oldPassword');
            expect(oldPasswordInput).toBeInTheDocument();

            const newPasswordInput = screen.getByLabelText('newPassword');
            expect(newPasswordInput).toBeInTheDocument();

            const passwordConfirmationInput = screen.getByLabelText('passwordConfirmation');
            expect(passwordConfirmationInput).toBeInTheDocument();

            await userEvent.clear(oldPasswordInput);
            await userEvent.type(oldPasswordInput, 'My0ld_Pa55w0rD');

            await userEvent.clear(newPasswordInput);
            await userEvent.type(newPasswordInput, 'Wond3rFu11_Pa55w0rD*$');

            await userEvent.clear(passwordConfirmationInput);
            await userEvent.type(passwordConfirmationInput, 'Wr0ng_Pa55w0rD*$'); // don't match newPasswordInput

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            // password confirm don't match
            const formError = screen.queryByTestId('form-error');
            expect(formError).toBeInTheDocument();
            expect(formError).toHaveTextContent('validation.passwordMatch');

            await userEvent.clear(passwordConfirmationInput);
            await userEvent.type(passwordConfirmationInput, 'Wond3rFu11_Pa55w0rD*$'); // match newPasswordInput

            await user.click(submitBtn);

            expect(updatePassword).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    oldPassword: 'My0ld_Pa55w0rD',
                    password: 'Wond3rFu11_Pa55w0rD*$',
                })
            );

            expect(onSuccess).toBeCalledWith(expect.objectContaining({ name: 'password_changed' }));
            expect(onError).not.toBeCalled();
        });

        test('api update password failed', async () => {
            const user = userEvent.setup();

            updatePassword.mockRejectedValue('Unexpected error');

            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            const newPasswordInput = screen.getByLabelText('newPassword');
            expect(newPasswordInput).toBeInTheDocument();

            const passwordConfirmationInput = screen.getByLabelText('passwordConfirmation');
            expect(passwordConfirmationInput).toBeInTheDocument();

            await userEvent.clear(newPasswordInput);
            await userEvent.type(newPasswordInput, 'Wond3rFu11_Pa55w0rD*$');

            await userEvent.clear(passwordConfirmationInput);
            await userEvent.type(passwordConfirmationInput, 'Wond3rFu11_Pa55w0rD*$');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
