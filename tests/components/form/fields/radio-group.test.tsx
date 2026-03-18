/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { RadioGroupField } from '../../../../src/components/form/fields/radio-group';
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
    radiobox: 'Pet',
    cat: 'cat',
    dog: 'dog',
};

const options = [
    { label: 'cat', value: 'cat' },
    { label: 'dog', value: 'dog' },
];

describe('DOM testing', () => {
    test('default settings — all options unselected', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <RadioGroupField
                    label="radiobox"
                    values={options}
                    value=""
                    onValueChange={onValueChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        options.forEach(option => {
            const input = screen.queryByLabelText(option.label);
            expect(input).toBeInTheDocument();
            expect(input).not.toBeChecked();
        });

        const dogInput = screen.getByLabelText('dog');
        await user.click(dogInput);

        expect(onValueChange).toHaveBeenCalledWith('dog');
    });

    test('initially selected', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <RadioGroupField
                    label="radiobox"
                    values={options}
                    value="dog"
                    onValueChange={onValueChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const catInput = screen.getByLabelText('cat');
        await user.click(catInput);

        expect(onValueChange).toHaveBeenCalledWith('cat');
    });

    test('with i18n-resolved option label', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();

        // RadioGroupField resolves labels through i18n — use keys that are in defaultI18n
        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <RadioGroupField
                    label="radiobox"
                    values={options}
                    value=""
                    onValueChange={onValueChange}
                    showLabels={true}
                />
            </WidgetContext>
        );

        const catRadio = screen.getByRole('radio', { name: 'cat' });
        expect(catRadio).toBeInTheDocument();
        expect(catRadio).not.toBeChecked();

        const dogRadio = screen.getByRole('radio', { name: 'dog' });
        expect(dogRadio).toBeInTheDocument();
        expect(dogRadio).not.toBeChecked();

        await user.click(dogRadio);

        expect(onValueChange).toHaveBeenCalledWith('dog');
    });
});
