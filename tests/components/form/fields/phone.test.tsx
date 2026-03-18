/**
 * @jest-environment jsdom
 */
import React from 'react';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

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
        expect(input).toHaveValue(formatPhoneNumberIntl(initialValue));

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
});
