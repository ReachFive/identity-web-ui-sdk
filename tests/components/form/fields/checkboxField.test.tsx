/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';
import React from 'react';

import type { Config } from '../../../../src/types';

import checkboxField from '../../../../src/components/form/fields/checkboxField';
import { createForm } from '../../../../src/components/form/formComponent';
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { WidgetContext } from '../WidgetContext';

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
};

const defaultI18n: I18nMessages = {
    checkbox: 'Check?',
};

const i18nResolver = resolveI18n(defaultI18n);

type Model = { check: string };

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup();

        const key = 'checkbox';
        const label = 'checkbox';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [checkboxField({ key, label })],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        onFieldChange={onFieldChange}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );
        });

        const checkbox = screen.getByLabelText(i18nResolver(label));
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);

        expect(checkbox).toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    checkbox: true,
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    checkbox: true,
                })
            )
        );
    });

    test('initially checked', async () => {
        const user = userEvent.setup();

        const key = 'checkbox';
        const label = 'checkbox';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [checkboxField({ key, label, defaultValue: true })],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        onFieldChange={onFieldChange}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );
        });

        const checkbox = screen.getByLabelText(i18nResolver(label));
        expect(checkbox).toBeChecked();

        await user.click(checkbox);

        expect(checkbox).not.toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    checkbox: false,
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    checkbox: false,
                })
            )
        );
    });
});
