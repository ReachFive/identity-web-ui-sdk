/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { CheckboxField } from '../../../../src/components/form/field2/checkbox';
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
    checkbox: 'Check?',
};

describe('DOM testing', () => {
    test('default settings (unchecked)', async () => {
        const user = userEvent.setup();
        const onCheckedChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <CheckboxField label="checkbox" checked={false} onCheckedChange={onCheckedChange} />
            </WidgetContext>
        );

        const checkbox = screen.getByLabelText('Check?');
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);

        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    test('initially checked', async () => {
        const user = userEvent.setup();
        const onCheckedChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <CheckboxField label="checkbox" checked={true} onCheckedChange={onCheckedChange} />
            </WidgetContext>
        );

        const checkbox = screen.getByLabelText('Check?');
        expect(checkbox).toBeChecked();

        await user.click(checkbox);

        expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    test('description visible (consent-style)', () => {
        const onCheckedChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <CheckboxField
                    label="My Consent"
                    checked={false}
                    onCheckedChange={onCheckedChange}
                    description={<span>Lorem ipsum sit amet</span>}
                />
            </WidgetContext>
        );

        const checkbox = screen.getByLabelText('My Consent');
        expect(checkbox).not.toBeChecked();

        const description = screen.queryByText('Lorem ipsum sit amet');
        expect(description).toBeInTheDocument();
    });
});
