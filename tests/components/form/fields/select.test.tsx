/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { SelectField } from '../../../../src/components/form/fields/select';
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
    selectbox: 'Pet',
    cat: 'cat',
    dog: 'dog',
};

const options = [
    { label: 'cat', value: 'cat' },
    { label: 'dog', value: 'dog' },
];

describe('DOM testing', () => {
    test('default settings — no option selected', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <SelectField
                    label="Pet"
                    values={options}
                    value=""
                    onValueChange={onValueChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const trigger = screen.getByRole('combobox', { name: 'Pet' });
        expect(trigger).toBeInTheDocument();

        // Open the select
        await user.click(trigger);

        // Select 'dog'
        const dogOption = screen.getByRole('option', { name: 'dog' });
        await user.click(dogOption);

        await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('dog'));
    });

    test('initially selected value', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <SelectField
                    label="Pet"
                    values={options}
                    value="dog"
                    onValueChange={onValueChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const trigger = screen.getByRole('combobox', { name: 'Pet' });
        expect(trigger).toBeInTheDocument();

        // Open the select
        await user.click(trigger);

        // Select 'cat'
        const catOption = screen.getByRole('option', { name: 'cat' });
        await user.click(catOption);

        await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('cat'));
    });

    test('onValueChange called with selected value', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <SelectField
                    label="Pet"
                    values={options}
                    onValueChange={onValueChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const trigger = screen.getByRole('combobox', { name: 'Pet' });
        await user.click(trigger);

        await user.click(screen.getByRole('option', { name: 'cat' }));

        await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('cat'));
    });
});
