/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import consentField from '../../../../src/components/form/fields/consentField';
import { createForm } from '../../../../src/components/form/formComponent';
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

type Model = { 'consents.myconsent.1': string };

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup();

        const label = 'My Consent';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [
                consentField({
                    key: `consents.myconsent.1`,
                    path: `consents.myconsent`, // Will target the same profile consent value for different versions of the consent
                    label,
                    type: 'opt-in',
                    version: {
                        versionId: 1,
                        language: defaultConfig.language,
                    },
                    description: 'Lorem ipsum sit amet',
                    consentCannotBeGranted: false,
                }),
            ],
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

        const checkbox = screen.getByLabelText('My Consent');
        expect(checkbox).not.toBeChecked();

        const description = screen.queryByTestId('consents.myconsent.1.description');
        expect(description).toBeInTheDocument();
        expect(description).toHaveTextContent('Lorem ipsum sit amet');

        await user.click(checkbox);

        expect(checkbox).toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    consents: expect.objectContaining({
                        myconsent: expect.objectContaining({
                            consentType: 'opt-in',
                            consentVersion: { language: 'fr', versionId: 1 },
                            granted: true,
                        }),
                    }),
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    consents: expect.objectContaining({
                        myconsent: expect.objectContaining({
                            consentType: 'opt-in',
                            consentVersion: expect.objectContaining({
                                language: defaultConfig.language,
                                versionId: 1,
                            }),
                            granted: true,
                        }),
                    }),
                })
            )
        );
    });

    test('initially checked', async () => {
        const user = userEvent.setup();

        const label = 'My Consent';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [
                consentField({
                    label,
                    key: `consents.myconsent.1`,
                    path: `consents.myconsent`, // Will target the same profile consent value for different versions of the consent
                    type: 'opt-in',
                    version: {
                        versionId: 1,
                        language: defaultConfig.language,
                    },
                    description: 'Lorem ipsum sit amet',
                    consentCannotBeGranted: false,
                    defaultValue: true,
                }),
            ],
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

        const checkbox = screen.getByLabelText('My Consent');
        expect(checkbox).toBeChecked();

        await user.click(checkbox);

        expect(checkbox).not.toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    consents: expect.objectContaining({
                        myconsent: expect.objectContaining({
                            consentType: 'opt-in',
                            consentVersion: { language: 'fr', versionId: 1 },
                            granted: false,
                        }),
                    }),
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    consents: expect.objectContaining({
                        myconsent: expect.objectContaining({
                            consentType: 'opt-in',
                            consentVersion: { language: 'fr', versionId: 1 },
                            granted: false,
                        }),
                    }),
                })
            )
        );
    });
});
