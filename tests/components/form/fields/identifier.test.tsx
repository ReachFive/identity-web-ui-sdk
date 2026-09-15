/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';
import { format } from 'libphonenumber-js';

import { IdentifierField } from '../../../../src/components/form/fields/identifier';
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

const defaultI18n: I18nMessages = {
    identifier: 'Identifiant',
};

function ControlledIdentifierField({
    initialValue = '',
    onChange,
    ...props
}: React.ComponentProps<typeof IdentifierField> & { initialValue?: string }) {
    const [value, setValue] = React.useState(initialValue);
    return (
        <IdentifierField
            {...props}
            value={value}
            onChange={e => {
                setValue(e.target.value);
                onChange?.(e);
            }}
        />
    );
}

describe('DOM testing', () => {
    test('default settings — basic text input', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('');

        const emailValue = 'alice@reach5.co';
        await user.clear(input!);
        await user.type(input!, emailValue);
        expect(input).toHaveValue(emailValue);
        expect(onChange).toHaveBeenCalled();
    });

    test('with defaultValue set', () => {
        const onChange = jest.fn();
        const defaultValue = 'alice@reach5.co';

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue={defaultValue}
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue(defaultValue);
    });

    test('onChange called when typing', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.type(input, 'Alice971');

        expect(onChange).toHaveBeenCalled();
        expect(input).toHaveValue('Alice971');
    });

    test('withPhoneNumber = true — email value passed through unchanged', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        await user.tab();

        expect(input).toHaveValue(emailValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: emailValue }) })
        );
    });

    test('withPhoneNumber = true — email whose local part holds a possible phone number', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        const emailValue = 'ccu123456789@yopmail.com';
        await user.clear(input);
        await user.type(input, emailValue);

        // the 9th digit makes `123456789` a possible French number: the formatter must not
        // claim the value and drop everything it cannot read
        expect(input).toHaveValue(emailValue);

        await user.tab();

        expect(input).toHaveValue(emailValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: emailValue }) })
        );
    });

    test('withPhoneNumber = true — email whose local part is a whole possible phone number', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        // unlike `ccu123456789@…`, this one is phone-shaped until the `@`: the field must not bake
        // the phone formatting into it, since nothing typed afterwards can take it back out
        const emailValue = '0612345678@yopmail.com';
        await user.clear(input);
        await user.type(input, emailValue);

        expect(input).toHaveValue(emailValue);

        await user.tab();

        expect(input).toHaveValue(emailValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: emailValue }) })
        );
    });

    test('withPhoneNumber = true — a possible phone number is only reformatted on blur', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.clear(input);
        await user.type(input, '0612345678');

        // the field cannot know yet whether this is a phone number or the start of something else,
        // so it leaves the value alone while the user is still typing
        expect(input).toHaveValue('0612345678');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: '+33612345678' }) })
        );

        await user.tab();

        expect(input).toHaveValue(format('+33612345678', 'FR', 'NATIONAL'));
    });

    test('withPhoneNumber = true — custom identifier holding a possible phone number', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        const otherValue = 'ccu123456789';
        await user.clear(input);
        await user.type(input, otherValue);
        await user.tab();

        expect(input).toHaveValue(otherValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: otherValue }) })
        );
    });

    test('withPhoneNumber = true — phone number formatted on blur', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const phoneValue = '+33123456789';

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.clear(input);
        await user.type(input, phoneValue);
        await user.tab();

        const formatted = format(phoneValue, 'FR', 'NATIONAL');
        const expected = format(phoneValue, 'FR', 'E.164');
        expect(input).toHaveValue(formatted);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: expected }) })
        );
    });

    test('withPhoneNumber = true — phone number typed with the `00` IDD prefix', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.clear(input);
        // `0033…` is the same number as `+33…`, written with the IDD prefix instead of the `+`
        await user.type(input, '0033123456789');
        await user.tab();

        const formatted = format('+33123456789', 'FR', 'NATIONAL');
        const expected = format('+33123456789', 'FR', 'E.164');
        expect(input).toHaveValue(formatted);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: expected }) })
        );
    });

    test('withPhoneNumber = true — foreign phone number typed with the `00` IDD prefix', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.clear(input);
        await user.type(input, '00447911123456');
        await user.tab();

        const formatted = format('+447911123456', 'GB', 'INTERNATIONAL');
        const expected = format('+447911123456', 'GB', 'E.164');
        expect(input).toHaveValue(formatted);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: expected }) })
        );
    });

    test('withPhoneNumber = true — national phone number keeps its national shape', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.clear(input);
        await user.type(input, '0123456789');
        await user.tab();

        const formatted = format('+33123456789', 'FR', 'NATIONAL');
        const expected = format('+33123456789', 'FR', 'E.164');
        expect(input).toHaveValue(formatted);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: expected }) })
        );
    });

    test('withPhoneNumber = true, allowInternational = true — local number shown international', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                    allowInternational={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.clear(input);
        await user.type(input, '0123456789');
        await user.tab();

        expect(input).toHaveValue(format('+33123456789', 'FR', 'INTERNATIONAL'));
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: '+33123456789' }) })
        );
    });

    test('withPhoneNumber = true — custom identifier passed through unchanged', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        await user.tab();

        expect(input).toHaveValue(otherValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: otherValue }) })
        );
    });

    test('withPhoneNumber = false — phone value treated as plain text, no formatting on blur', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const phoneValue = '+33123456789';

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={false}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        await user.clear(input);
        await user.type(input, phoneValue);
        await user.tab();

        expect(input).toHaveValue(phoneValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: phoneValue }) })
        );
    });

    test('withPhoneNumber = false — email and custom identifier passed through unchanged', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={false}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: emailValue }) })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: otherValue }) })
        );
    });

    test('with defaultValue set — phone pre-formatted, then editable', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const defaultValue = 'alice@reach5.co';

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledIdentifierField
                    label="Identifiant"
                    initialValue={defaultValue}
                    onChange={onChange}
                    showLabels={true}
                    withPhoneNumber={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Identifiant');
        expect(input).toHaveValue(defaultValue);

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        await user.tab();

        const formatted = format(phoneValue, 'FR', 'NATIONAL');
        const expected = format(phoneValue, 'FR', 'E.164');
        expect(input).toHaveValue(formatted);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: expected }) })
        );

        await user.clear(input);
        await user.type(input, defaultValue);
        expect(input).toHaveValue(defaultValue);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ value: defaultValue }) })
        );
    });
});
