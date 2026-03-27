/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { InputField } from '../../../../src/components/form/fields/input';
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
    simple: 'simple',
};

function ControlledInputField({
    initialValue = '',
    onChange,
    ...props
}: React.ComponentProps<typeof InputField> & { initialValue?: string }) {
    const [value, setValue] = React.useState(initialValue);
    return (
        <InputField
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
    test('default settings', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledInputField
                    label="simple"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('simple');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('');

        const newValue = 'azerty';
        await user.clear(input);
        await user.type(input, newValue);

        expect(onChange).toHaveBeenCalled();
        expect(input).toHaveValue(newValue);
    });

    test('custom type, placeholder and default value', async () => {
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledInputField
                    label="simple"
                    type="email"
                    placeholder="simple placeholder"
                    initialValue="my value"
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.queryByLabelText('simple');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'email');
        expect(input).toHaveAttribute('placeholder', 'simple placeholder');
        expect(input).toHaveValue('my value');
    });

    test('extends validators — onChange called with typed value', async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <ControlledInputField
                    label="simple"
                    initialValue=""
                    onChange={onChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const input = screen.getByLabelText('simple');
        expect(input).toBeInTheDocument();

        const invalidValue = 'ILoveApples';
        await user.clear(input);
        await user.type(input, invalidValue);

        expect(onChange).toHaveBeenCalled();
        expect(input).toHaveValue(invalidValue);
    });
});
