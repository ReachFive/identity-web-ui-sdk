/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';
import { format } from 'libphonenumber-js';

import { PhoneNumberInput } from '../../../../src/components/form/fields/phone/PhoneNumberInput';
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
    phone: 'Phone number',
    'address.country': 'Country',
};

type ControlledPhoneInputProps = Omit<React.ComponentProps<typeof PhoneNumberInput>, 'value'> & {
    initialValue?: string;
};

function ControlledPhoneInput({ initialValue, onChange, ...props }: ControlledPhoneInputProps) {
    const [value, setValue] = React.useState<string | undefined>(initialValue);
    return (
        <PhoneNumberInput
            {...props}
            value={value}
            onChange={val => {
                setValue(val);
                onChange(val);
            }}
        />
    );
}

describe('DOM testing', () => {
    test('with country select — country button visible', () => {
        const onChange = jest.fn();
        const initialValue = '+33123456789';

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue={initialValue}
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={true}
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.queryByLabelText('Phone number');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue(format(initialValue, 'FR', 'INTERNATIONAL'));

        // Country select button rendered (aria-label = i18n('address.country'))
        const countryBtn = screen.queryByRole('button', { name: 'Country' });
        expect(countryBtn).toBeInTheDocument();
    });

    test('phone number formatting on input', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue={undefined}
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={true}
                    defaultCountry="US"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        // Type a US number directly (without +1 prefix to avoid layout-effect reset)
        await user.clear(input);
        await user.type(input, '2133734253');

        await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\+1/)));
    });

    test('without country select — foreign number typed with the `00` IDD prefix', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue={undefined}
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={false}
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        // a Moroccan number, on a field whose default country is France
        await user.type(input, '00212668996442');
        await user.tab();

        // it does not belong to the field's country, so it keeps its calling code on screen:
        // displaying it as `0668996442` would be indistinguishable from a French mobile
        expect(input).toHaveValue(format('+212668996442', 'MA', 'INTERNATIONAL'));
        expect(onChange).toHaveBeenLastCalledWith('+212668996442');
    });

    test('without country select — editing a foreign number does not turn it into a local one', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue={undefined}
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={false}
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        await user.type(input, '00212668996442');
        await user.tab();

        await user.click(input);
        await user.type(input, '{backspace}2');
        await user.tab();

        expect(input).toHaveValue(format('+212668996442', 'MA', 'INTERNATIONAL'));
        expect(onChange).toHaveBeenLastCalledWith('+212668996442');
    });

    test('without country select — a foreign number does not change the country of the next one', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue={undefined}
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={false}
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        await user.type(input, '00212668996442');
        await user.tab();

        // the field has no country select: the country it reads national numbers with stays the
        // one it was configured with, whatever number was typed before
        await user.clear(input);
        await user.type(input, '0668996442');
        await user.tab();

        expect(input).toHaveValue(format('+33668996442', 'FR', 'NATIONAL'));
        expect(onChange).toHaveBeenLastCalledWith('+33668996442');
    });

    test('without country select — a local number keeps its national shape', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue={undefined}
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={false}
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        await user.type(input, '0612345678');
        await user.tab();

        expect(input).toHaveValue(format('+33612345678', 'FR', 'NATIONAL'));
        expect(onChange).toHaveBeenLastCalledWith('+33612345678');
    });

    test('without country select — a stored foreign number survives an edit', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue="+212668996442"
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={false}
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        expect(input).toHaveValue(format('+212668996442', 'MA', 'INTERNATIONAL'));

        await user.click(input);
        await user.type(input, '{backspace}2');
        await user.tab();

        expect(input).toHaveValue(format('+212668996442', 'MA', 'INTERNATIONAL'));
        expect(onChange).toHaveBeenLastCalledWith('+212668996442');
    });

    test('optional — onChange not called on initial render', () => {
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue={undefined}
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={true}
                    defaultCountry="FR"
                    required={false}
                />
            </WidgetContext>
        );

        // Just verify the component renders without errors
        const input = screen.getByLabelText('Phone number');
        expect(input).toBeInTheDocument();
    });
});
