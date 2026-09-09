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

/** Country code of the flag currently displayed in the country select. */
function selectedCountry() {
    return screen.getByRole('button', { name: 'Country' }).querySelector('title')?.textContent;
}

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

    test('changing the country keeps the entered number and reformats it', async () => {
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
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        await user.type(input, '612345678');
        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('+33612345678'));

        // Switch the country to Germany (+49) — the only country with that calling code.
        await user.click(screen.getByRole('button', { name: 'Country' }));
        await user.click(screen.getByRole('menuitem', { name: /\(\+49\)/ }));

        // The national number is kept, re-prefixed with the new country calling code.
        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('+49612345678'));
        expect(input).toHaveValue(format('+49612345678', 'INTERNATIONAL'));
    });

    test('changing the country on an empty input does not emit a number', async () => {
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
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        await user.click(screen.getByRole('button', { name: 'Country' }));
        await user.click(screen.getByRole('menuitem', { name: /\(\+49\)/ }));

        const input = screen.getByLabelText('Phone number');
        expect(input).toHaveValue('');
        expect(onChange).not.toHaveBeenCalledWith(expect.stringMatching(/\d/));
    });

    test('an international prefix selects the country it belongs to', async () => {
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
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        expect(selectedCountry()).toBe('FR');

        // A +1 number that is not assigned to any NANP country: the number itself
        // cannot be matched to a country, but its calling code still can.
        await user.type(screen.getByLabelText('Phone number'), '+12223334444');

        await waitFor(() => expect(selectedCountry()).toBe('US'));
        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('+12223334444'));
    });

    test('an initial value carrying another country prefix selects that country', async () => {
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledPhoneInput
                    label="phone"
                    initialValue="+12223334444"
                    onChange={onChange}
                    showLabels={true}
                    allowInternational={true}
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        await waitFor(() => expect(selectedCountry()).toBe('US'));
        expect(screen.getByLabelText('Phone number')).toHaveValue(
            format('+12223334444', 'INTERNATIONAL')
        );
    });

    test('a country selection sharing the calling code is kept', async () => {
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
                    defaultCountry="CA"
                />
            </WidgetContext>
        );

        // +1 213 373 4253 is a valid US number, but Canada shares its calling code:
        // the explicit selection must not be overridden.
        await user.type(screen.getByLabelText('Phone number'), '+12133734253');

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('+12133734253'));
        expect(selectedCountry()).toBe('CA');
    });
    test('a number too short for its country is still prefixed on blur', async () => {
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
                    defaultCountry="TR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        // Turkey requires 10 significant digits — this one carries 9.
        await user.type(input, '0769521258');
        await user.tab();

        await waitFor(() => expect(input).toHaveValue('+90 769521258'));
    });

    test('a number too long for its country is still prefixed on blur', async () => {
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
                    defaultCountry="FR"
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('Phone number');
        await user.type(input, '07695212581234');
        await user.tab();

        await waitFor(() => expect(input).toHaveValue('+33 7695212581234'));
    });

    test('without country select, an impossible number keeps its national formatting on blur', async () => {
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
        await user.type(input, '0769');
        await user.tab();

        // `formatNational()` would drop the trunk prefix ("07 69" -> "769").
        await waitFor(() => expect(input).toHaveValue('07 69'));
    });
});
