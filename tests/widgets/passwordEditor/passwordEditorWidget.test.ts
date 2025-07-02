/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import passwordEditorWidget from '../../../src/widgets/passwordEditor/passwordEditorWidget';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
};

const defaultI18n: I18nMessages = {};

const getPasswordStrengthImplementation = (password: string) => {
    let score = 0;
    if (password.match(/[a-z]+/)) score++;
    if (password.match(/[0-9]+/)) score++;
    if (password.match(/[^a-z0-9]+/)) score++;
    if (password.length > 8) score++;
    return Promise.resolve({ score: score as PasswordStrengthScore });
};

describe('Snapshot', () => {
    const generateSnapshot =
        (
            options: Partial<Parameters<typeof passwordEditorWidget>[0]> = {},
            config: Partial<Config> = {}
        ) =>
        async () => {
            // @ts-expect-error partial Client
            const apiClient: Client = {
                getPasswordStrength: jest
                    .fn<Client['getPasswordStrength']>()
                    .mockImplementation(getPasswordStrengthImplementation),
                updatePassword: jest.fn<Client['updatePassword']>().mockResolvedValue(),
            };

            const widget = await passwordEditorWidget(
                { ...options, accessToken: 'azerty' },
                { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
            );

            await waitFor(async () => {
                const { container } = await render(widget);
                expect(container).toMatchSnapshot();
            });
        };

    describe('password editor', () => {
        test('basic', generateSnapshot({}));
    });
});

describe('DOM testing', () => {
    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation(getPasswordStrengthImplementation);
    const updatePassword = jest.fn<Client['updatePassword']>();

    const onError = jest.fn();
    const onSuccess = jest.fn();

    beforeEach(() => {
        getPasswordStrength.mockClear();
        updatePassword.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    const generateComponent = async (
        options: Partial<Parameters<typeof passwordEditorWidget>[0]> = {},
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getPasswordStrength,
            updatePassword,
        };

        const result = await passwordEditorWidget(
            { onError, onSuccess, ...options, accessToken: 'azerty' },
            { config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        return waitFor(async () => {
            return render(result);
        });
    };

    describe('passwordEditor', () => {
        test('default', async () => {
            const user = userEvent.setup();

            updatePassword.mockResolvedValue();

            await generateComponent({});

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

            expect(onSuccess).toBeCalled();
            expect(onError).not.toBeCalled();
        });

        test('with promptOldPassword = true', async () => {
            const user = userEvent.setup();

            updatePassword.mockResolvedValue();

            await generateComponent({ promptOldPassword: true });

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

            expect(onSuccess).toBeCalled();
            expect(onError).not.toBeCalled();
        });

        test('api update password failed', async () => {
            const user = userEvent.setup();

            updatePassword.mockRejectedValue('Unexpected error');

            await generateComponent({});

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
