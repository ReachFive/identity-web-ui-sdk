/**
 * @jest-environment jsdom
 */
import React from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { PasswordStrengthScore, type Client } from '@reachfive/identity-core';

import {
    PasswordField,
    PasswordPolicyRules,
} from '../../../../src/components/form/fields/password';
import { type I18nMessages } from '../../../../src/contexts/i18n';
import { WidgetContext } from '../WidgetContext';

import type { Config } from '../../../../src/types';

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
    loginTypeAllowed: {
        email: true,
        phoneNumber: true,
        customIdentifier: true,
    },
    isImplicitFlowForbidden: false,
};

const defaultI18n: I18nMessages = {
    password: 'Password',
};

type ControlledPasswordFieldProps = React.ComponentPropsWithoutRef<typeof PasswordField> & {
    initialValue?: string;
};

function ControlledPasswordField({
    initialValue = '',
    onChange,
    children,
    ...props
}: ControlledPasswordFieldProps) {
    const [value, setValue] = React.useState(initialValue);
    return (
        <PasswordField
            {...props}
            value={value}
            onChange={e => {
                setValue(e.target.value);
                onChange?.(e);
            }}
        >
            {children}
        </PasswordField>
    );
}

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
    const apiClient: Client = { getPasswordStrength };

    beforeEach(() => {
        getPasswordStrength.mockClear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('simple password — no show/hide toggle without canShowPassword', async () => {
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPasswordField
                    label="Password"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Password');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'password');
        expect(input).toHaveValue('');

        expect(screen.queryByTestId('show-password-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument();
    });

    test('simple password — custom placeholder', async () => {
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPasswordField
                    label="Password"
                    placeholder="password placeholder"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.queryByLabelText('Password');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('placeholder', 'password placeholder');
    });

    test('simple password — canShowPassword toggle', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPasswordField
                    label="Password"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    canShowPassword={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Password');
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

    test('with PasswordPolicyRules — no rules shown when empty', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
        const onChange = jest.fn();

        render(
            <WidgetContext client={apiClient} config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPasswordField
                    label="Password"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                >
                    <PasswordPolicyRules />
                </ControlledPasswordField>
            </WidgetContext>
        );

        const input = screen.getByLabelText('Password');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('');

        expect(screen.queryByRole('meter')).not.toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();

        const invalidPassword = 'azerty';
        await user.clear(input);
        await user.type(input, invalidPassword);

        await waitFor(() => expect(onChange).toHaveBeenCalled());

        expect(screen.getByRole('meter')).toBeInTheDocument();
        expect(screen.getByRole('list')).toBeInTheDocument();
    });

    test('with PasswordPolicyRules — rules still shown after typing valid password', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
        const onChange = jest.fn();

        render(
            <WidgetContext client={apiClient} config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPasswordField
                    label="Password"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                >
                    <PasswordPolicyRules />
                </ControlledPasswordField>
            </WidgetContext>
        );

        const input = screen.getByLabelText('Password');

        const validPassword = 'Wond3rFu11_Pa55w0rD';
        await user.clear(input);
        await user.type(input, validPassword);

        await waitFor(() => expect(onChange).toHaveBeenCalled());
        expect(input).toHaveValue(validPassword);

        expect(screen.getByRole('meter')).toBeInTheDocument();
        expect(screen.getByRole('list')).toBeInTheDocument();
    });

    test('with PasswordPolicyRules — onChange called with typed value (custom validator)', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });
        const onChange = jest.fn();

        render(
            <WidgetContext client={apiClient} config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPasswordField
                    label="Password"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                >
                    <PasswordPolicyRules />
                </ControlledPasswordField>
            </WidgetContext>
        );

        const input = screen.getByLabelText('Password');

        expect(screen.queryByRole('meter')).not.toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();

        const invalidPassword = 'ILoveApples';
        await user.clear(input);
        await user.type(input, invalidPassword);

        await jest.runOnlyPendingTimersAsync();

        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({ value: invalidPassword }),
                })
            )
        );
    });
});
