/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { queryByText, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { PasswordStrengthScore, type Client } from '@reachfive/identity-core';

import passwordField from '@/components/form/fields/passwordField';
import { createForm } from '@/components/form/formComponent';
import { I18nMessages } from '@/contexts/i18n';
import { Validator } from '@/core/validation';

import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    password: 'Password',
};

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
    });

    test('default settings', async () => {
        const user = userEvent.setup();

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

        const input = screen.getByLabelText('Password');
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

        expect(screen.getByTestId('password-strength')).toBeInTheDocument();
        expect(screen.getByTestId('password-policy-rules')).toBeInTheDocument();

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

        expect(screen.getByTestId('password-strength')).toBeInTheDocument();
        expect(screen.getByTestId('password-policy-rules')).toBeInTheDocument();

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
        const user = userEvent.setup();

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

        const input = screen.getByLabelText('Password');
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
            new Validator<string, unknown>({
                rule: value => value === matchText,
                hint: 'password.match',
            });

        const user = userEvent.setup();

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

        const input = screen.getByLabelText('Password');
        expect(input).toBeInTheDocument();

        expect(screen.queryByTestId('password-strength')).not.toBeInTheDocument();
        expect(screen.queryByTestId('password-policy-rules')).not.toBeInTheDocument();

        const invalidPassword = 'ILoveApples';
        await user.clear(input);
        await user.type(input, invalidPassword);

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    password: invalidPassword,
                })
            )
        );
    });
});
