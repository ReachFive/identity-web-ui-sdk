/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OtpField } from '../../../../src/components/form/fields/otp';
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
    customProviders: {},
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

const defaultI18n: I18nMessages = {};

function ControlledOtpField({
    initialValue = '',
    onChange,
    ...props
}: React.ComponentProps<typeof OtpField> & { initialValue?: string }) {
    const [value, setValue] = React.useState(initialValue);
    return (
        <OtpField
            {...props}
            value={value}
            onChange={newValue => {
                setValue(newValue);
                onChange?.(newValue);
            }}
        />
    );
}

function renderField(props: Partial<React.ComponentProps<typeof ControlledOtpField>> = {}) {
    return render(
        <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
            <ControlledOtpField label="verificationCode" length={6} showLabels={true} {...props} />
        </WidgetContext>
    );
}

const slots = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('[data-slot="widget-otp-slot"]'));

describe('OtpField', () => {
    test('renders one slot per expected digit', () => {
        const { container } = renderField({ length: 8 });

        expect(slots(container)).toHaveLength(8);
        const input = screen.getByLabelText('verificationCode');
        expect(input).toHaveAttribute('maxlength', '8');
    });

    test('is announced as a one-time code', () => {
        renderField();

        const input = screen.getByLabelText('verificationCode');
        expect(input).toHaveAttribute('autocomplete', 'one-time-code');
        expect(input).toHaveAttribute('inputmode', 'numeric');
    });

    test('dispatches typed digits and fills the slots', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const { container } = renderField({ onChange });

        await user.type(screen.getByLabelText('verificationCode'), '123');

        expect(onChange).toHaveBeenLastCalledWith('123');
        expect(slots(container).map(slot => slot.textContent)).toEqual(['1', '2', '3', '', '', '']);
    });

    test('ignores non-digit characters', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        renderField({ onChange });

        const input = screen.getByLabelText('verificationCode');
        await user.type(input, '1a2b');

        expect(input).toHaveValue('12');
    });

    test('accepts a pasted code', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        renderField({ onChange });

        await user.click(screen.getByLabelText('verificationCode'));
        await user.paste('654321');

        expect(onChange).toHaveBeenLastCalledWith('654321');
    });

    test('calls onComplete once every slot is filled', async () => {
        const user = userEvent.setup();
        const onComplete = jest.fn();
        renderField({ length: 4, onComplete });

        const input = screen.getByLabelText('verificationCode');
        await user.type(input, '123');
        expect(onComplete).not.toHaveBeenCalled();

        await user.type(input, '4');
        expect(onComplete).toHaveBeenCalledWith('1234');
    });

    test('hides the label when labels are not shown', () => {
        renderField({ showLabels: false });

        expect(screen.getByText('verificationCode')).toHaveClass('sr-only');
    });

    test('flags the input and every slot on error', () => {
        const { container } = renderField({
            errors: [{ message: 'Incorrect code' }],
        });

        const input = screen.getByLabelText('verificationCode');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleErrorMessage('Incorrect code');
        slots(container).forEach(slot => expect(slot).toHaveAttribute('data-status', 'error'));
    });

    test('can be disabled', () => {
        const { container } = renderField({ disabled: true });

        expect(screen.getByLabelText('verificationCode')).toBeDisabled();
        slots(container).forEach(slot => expect(slot).toHaveAttribute('data-status', 'disabled'));
    });

    test('submits the enclosing form once every slot is filled when autoSubmit is set', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <form onSubmit={onSubmit}>
                    <ControlledOtpField
                        label="verificationCode"
                        length={4}
                        showLabels={true}
                        autoSubmit
                    />
                </form>
            </WidgetContext>
        );

        const input = screen.getByLabelText('verificationCode');
        await user.type(input, '123');
        expect(onSubmit).not.toHaveBeenCalled();

        await user.type(input, '4');
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('does not submit the enclosing form without autoSubmit', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <form onSubmit={onSubmit}>
                    <ControlledOtpField label="verificationCode" length={4} showLabels={true} />
                </form>
            </WidgetContext>
        );

        await user.type(screen.getByLabelText('verificationCode'), '1234');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test('exposes the public styling hooks', () => {
        const { container } = renderField();

        expect(container.querySelector('[data-slot="widget-otp"]')).toBeInTheDocument();
    });
});
