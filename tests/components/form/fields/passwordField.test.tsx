/**
 * @jest-environment jest-fixed-jsdom
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { PasswordStrengthScore, type Client } from '@reachfive/identity-core';
import '@testing-library/jest-dom/jest-globals';
import { queryByText, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';
import React from 'react';

import passwordField from '../../../../src/components/form/fields/passwordField';
import { createForm } from '../../../../src/components/form/formComponent';
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { Validator } from '../../../../src/core/validation';
import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    password: 'Password',
};

const i18nResolver = resolveI18n(defaultI18n);

type Model = { password: string };

describe('DOM testing', () => {
    const getPasswordStrength = jest.fn<Client['getPasswordStrength']>();

    getPasswordStrength.mockImplementation((password: string) => {
        let score = 0;
        if (/[a-z]+/.exec(password)) score++;
        if (/[0-9]+/.exec(password)) score++;
        if (/[^a-z0-9]+/.exec(password)) score++;
        if (password.length > 8) score++;
        return Promise.resolve({ score: score as PasswordStrengthScore });
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getPasswordStrength,
    };

    beforeEach(() => {
        getPasswordStrength.mockClear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('default settings', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });

        const key = 'password';
        const label = 'password';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [passwordField({ key, label }, defaultConfig)],
        });

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            apiClient,
            defaultConfig,
            defaultI18n
        );

        const input = screen.getByLabelText(i18nResolver(label));
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveValue('');

        expect(screen.queryByTestId('password-strength')).not.toBeInTheDocument();
        expect(screen.queryByTestId('password-policy-rules')).not.toBeInTheDocument();

        const showPasswordBtn = screen.queryByTestId('show-password-btn');
        expect(showPasswordBtn).not.toBeInTheDocument();
        const hidePasswordBtn = screen.queryByTestId('hide-password-btn');
        expect(hidePasswordBtn).not.toBeInTheDocument();

        const invalidPassword = 'azerty';
        await user.clear(input);
        await user.type(input, invalidPassword);

        expect(screen.queryByTestId('password-strength')).toBeInTheDocument();
        expect(screen.queryByTestId('password-policy-rules')).toBeInTheDocument();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    password: invalidPassword,
                })
            )
        );

        expect(screen.queryAllByTestId('error').length).toBeGreaterThan(0);
        screen.queryAllByTestId('error').some(error => {
            queryByText(error, 'validation.password.minStrength');
        });

        const validPassword = 'Wond3rFu11_Pa55w0rD*$';
        await user.clear(input);
        await user.type(input, validPassword);

        expect(screen.queryByTestId('password-strength')).toBeInTheDocument();
        expect(screen.queryByTestId('password-policy-rules')).toBeInTheDocument();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    password: validPassword,
                })
            )
        );

        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });

    test('with canShowPassword enabled', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });

        const key = 'password';
        const label = 'password';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [passwordField({ key, label, canShowPassword: true }, defaultConfig)],
        });

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            apiClient,
            defaultConfig,
            defaultI18n
        );

        const input = screen.getByLabelText(i18nResolver(label));
        expect(input).toBeInTheDocument();

        expect(input).toHaveAttribute('type', 'password');

        const showPasswordBtn = screen.getByTestId('show-password-btn');
        expect(showPasswordBtn).toBeInTheDocument();

        await user.click(showPasswordBtn);

        expect(input).toHaveAttribute('type', 'text');

        const hidePasswordBtn = screen.getByTestId('hide-password-btn');
        expect(hidePasswordBtn).toBeInTheDocument();

        await user.click(hidePasswordBtn);

        expect(input).toHaveAttribute('type', 'password');
    });

    test('extends validators', async () => {
        const passwordMatchValidator = (matchText: string) =>
            new Validator<string>({
                rule: value => value === matchText,
                hint: 'password.match',
            });

        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });

        const key = 'password';
        const label = 'password';
        const matchPassword = '1L0v38anana5';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [
                passwordField(
                    {
                        key,
                        label,
                        validator: passwordMatchValidator(matchPassword),
                    },
                    defaultConfig
                ),
            ],
        });

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            apiClient,
            defaultConfig,
            defaultI18n
        );

        const input = screen.getByLabelText(i18nResolver(label));
        expect(input).toBeInTheDocument();

        expect(screen.queryByTestId('password-strength')).not.toBeInTheDocument();
        expect(screen.queryByTestId('password-policy-rules')).not.toBeInTheDocument();

        const invalidPassword = 'ILoveApples';
        await user.clear(input);
        await user.type(input, invalidPassword);

        // Fast-forward until all timers have been executed
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    password: invalidPassword,
                })
            )
        );
    });
});
