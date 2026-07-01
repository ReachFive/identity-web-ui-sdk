/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { Client } from '@reachfive/identity-core';

import { Form } from '@/components/form/form';
import { I18nMessages } from '@/contexts/i18n';
import { Config } from '@/types';

import { WidgetContext } from './WidgetContext';

describe('DOM testing', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {};

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
        customFields: [
            {
                name: 'username',
                nameTranslations: [{ langCode: 'fr', label: "Nom d'utilisateur" }],
                path: 'username',
                dataType: 'string',
            },
            {
                name: 'country',
                path: 'country',
                dataType: 'select',
                selectableValues: [
                    { value: 'FRA', label: 'France', translations: [] },
                    { value: 'USA', label: 'United States', translations: [] },
                ],
            },
        ],
        addressFields: [
            {
                name: 'Building',
                path: 'cf_address_string',
                dataType: 'string',
            },
            {
                name: 'Floor',
                path: 'cf_address_integer',
                dataType: 'integer',
            },
            {
                name: 'Latitude',
                path: 'cf_address_decimal',
                dataType: 'decimal',
            },
            {
                name: 'Has intercom',
                path: 'cf_address_checkbox',
                dataType: 'checkbox',
            },
            {
                name: 'Delivery instructions',
                path: 'cf_address_select',
                dataType: 'select',
                selectableValues: [
                    { value: 'leave_at_door', label: 'Leave at door', translations: [] },
                    { value: 'signature_required', label: 'Signature required', translations: [] },
                ],
            },
        ],
        resourceBaseUrl: 'http://localhost',
        mfaSmsEnabled: false,
        mfaEmailEnabled: false,
        rbaEnabled: false,
        consents: [
            {
                key: 'optin_testing',
                consentType: 'opt-in',
                status: 'active',
                title: 'Opt-in Testing v1',
                description: 'This is just a test',
            },
            {
                key: 'optout_testing',
                consentType: 'opt-out',
                status: 'active',
                title: 'Opt-out Testing v1',
                description: 'This is an opt-out test',
            },
            {
                key: 'double_optin_testing',
                consentType: 'double-opt-in',
                status: 'active',
                title: 'Double Opt-in Testing v1',
                description: 'This is a double opt-in test',
            },
        ],
        consentsVersions: {
            optin_testing: {
                key: 'optin_testing',
                versions: [
                    {
                        versionId: 1,
                        title: 'Opt-in Testing v1',
                        language: 'fr',
                        description: 'This is just a test',
                    },
                ],
                consentType: 'opt-in',
                status: 'active',
            },
            optout_testing: {
                key: 'optout_testing',
                versions: [
                    {
                        versionId: 1,
                        title: 'Opt-out Testing v1',
                        language: 'fr',
                        description: 'This is an opt-out test',
                    },
                ],
                consentType: 'opt-out',
                status: 'active',
            },
            double_optin_testing: {
                key: 'double_optin_testing',
                versions: [
                    {
                        versionId: 1,
                        title: 'Double Opt-in Testing v1',
                        language: 'fr',
                        description: 'This is a double opt-in test',
                    },
                ],
                consentType: 'double-opt-in',
                status: 'active',
            },
        },
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
        send: 'Submit',
    };

    describe('Field Rendering', () => {
        test('renders all field types by string key and calls handler with composite data', async () => {
            const user = userEvent.setup();
            const onFieldChange = jest.fn<() => void>();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[
                            'email',
                            'password',
                            'consents.optin_testing',
                            { staticContent: <hr title="separator" /> },
                            'custom_fields.username',
                        ]}
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );

            expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
            expect(screen.getByLabelText('password')).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: 'Opt-in Testing v1' })).toBeInTheDocument();
            expect(screen.getByRole('separator', { name: 'separator' })).toBeInTheDocument();
            expect(screen.getByLabelText("Nom d'utilisateur")).toBeInTheDocument();

            await user.type(screen.getByRole('textbox', { name: 'email' }), 'alice@reach5.co');
            await user.type(screen.getByLabelText('password'), 'Wond3rFu11_Pa55w0rD*$');
            await user.click(screen.getByRole('checkbox', { name: 'Opt-in Testing v1' }));
            await user.type(screen.getByLabelText("Nom d'utilisateur"), 'alice');

            const expectedData = {
                email: 'alice@reach5.co',
                password: 'Wond3rFu11_Pa55w0rD*$',
                consents: { optin_testing: expect.objectContaining({ granted: true }) },
                custom_fields: { username: 'alice' },
            };

            expect(onFieldChange).toBeCalledWith(expect.objectContaining(expectedData));

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).toBeCalledWith(expectedData);
        });

        test('custom field input name uses snake_case path from config', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            const configWithSnakeCaseField: Config = {
                ...defaultConfig,
                customFields: [
                    ...defaultConfig.customFields,
                    {
                        name: 'Display Name',
                        path: 'display_name',
                        dataType: 'string',
                    },
                ],
            };

            render(
                <WidgetContext
                    client={apiClient}
                    config={configWithSnakeCaseField}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['custom_fields.display_name']} handler={onSubmit} />
                </WidgetContext>
            );

            const input = screen.getByRole('textbox', { name: 'Display Name' });
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('name', 'custom_fields.display_name');

            await user.type(input, 'Alice');
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).toBeCalledWith({ custom_fields: { display_name: 'Alice' } });
        });

        test.each([
            ['snake_case name without prefix', 'display_name'],
            ['camelCase name without prefix', 'displayName'],
            ['snake_case name with custom_fields prefix', 'custom_fields.display_name'],
            ['camelCase name with customFields prefix', 'customFields.displayName'],
        ])('custom field resolved by %s', async (_, fieldRef) => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            const config: Config = {
                ...defaultConfig,
                customFields: [
                    {
                        name: 'Display Name',
                        path: 'display_name',
                        dataType: 'string',
                    },
                ],
            };

            render(
                <WidgetContext client={apiClient} config={config} defaultMessages={defaultI18n}>
                    <Form fields={[fieldRef]} handler={onSubmit} />
                </WidgetContext>
            );

            const input = screen.getByRole('textbox', { name: 'Display Name' });
            expect(input).toHaveAttribute('name', 'custom_fields.display_name');

            await user.type(input, 'Alice');
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).toBeCalledWith({ custom_fields: { display_name: 'Alice' } });
        });

        test('renders raw field definition object (non-predefined, explicit type)', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'nickname', type: 'string', label: 'nickname' }]}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            expect(screen.getByRole('textbox', { name: 'nickname' })).toBeInTheDocument();
        });

        test('user-provided field definition overrides predefined label', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'email', label: 'Your Email' }]}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            expect(screen.getByRole('textbox', { name: 'Your Email' })).toBeInTheDocument();
            expect(screen.queryByRole('textbox', { name: 'email' })).not.toBeInTheDocument();
        });
    });

    describe('Address custom fields', () => {
        test('renders address custom fields alongside predefined address fields and submits them nested under addresses[0].custom_fields', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[
                            'address.streetAddress',
                            'address.custom_fields.cf_address_string',
                            'address.custom_fields.cf_address_integer',
                            'address.custom_fields.cf_address_decimal',
                            'address.custom_fields.cf_address_checkbox',
                        ]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            await user.type(
                screen.getByRole('textbox', { name: 'address.streetAddress' }),
                '10 rue Chaptal'
            );
            await user.type(
                screen.getByRole('textbox', { name: 'Building' }),
                'Résidence le diamant'
            );
            await user.type(screen.getByRole('spinbutton', { name: 'Floor' }), '50');
            await user.type(screen.getByRole('spinbutton', { name: 'Latitude' }), '48.87');
            await user.click(screen.getByRole('checkbox', { name: 'Has intercom' }));

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    addresses: [
                        {
                            streetAddress: '10 rue Chaptal',
                            custom_fields: {
                                cf_address_string: 'Résidence le diamant',
                                cf_address_integer: 50,
                                cf_address_decimal: 48.87,
                                cf_address_checkbox: true,
                            },
                        },
                    ],
                })
            );
        });

        test.each([
            [
                'snake_case name with address.custom_fields prefix',
                'address.custom_fields.cf_address_string',
            ],
            [
                'camelCase name with address.customFields prefix',
                'address.customFields.cfAddressString',
            ],
        ])('address custom field resolved by %s', async (_, fieldRef) => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={[fieldRef]} handler={onSubmit} />
                </WidgetContext>
            );

            const input = screen.getByRole('textbox', { name: 'Building' });
            expect(input).toHaveAttribute('name', 'addresses.0.custom_fields.cf_address_string');

            await user.type(input, 'Résidence le diamant');
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    addresses: [{ custom_fields: { cf_address_string: 'Résidence le diamant' } }],
                })
            );
        });

        test('select-type address custom field renders options and submits the selected value', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['address.custom_fields.cf_address_select']} handler={onSubmit} />
                </WidgetContext>
            );

            const trigger = screen.getByRole('combobox', { name: 'Delivery instructions' });
            await user.click(trigger);
            await user.click(screen.getByRole('option', { name: 'Signature required' }));

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    addresses: [{ custom_fields: { cf_address_select: 'signature_required' } }],
                })
            );
        });

        test('address custom field not found in config is ignored and logged instead of throwing', () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['address.streetAddress', 'address.custom_fields.unknown_field']}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            expect(
                screen.getByRole('textbox', { name: 'address.streetAddress' })
            ).toBeInTheDocument();
            expect(consoleError).toHaveBeenCalledWith(
                'Unknown field: address.custom_fields.unknown_field'
            );

            consoleError.mockRestore();
        });
    });

    describe('Field Validation', () => {
        test('required fields show errors on empty submit and clear when corrected', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[
                            { key: 'email', required: true },
                            { key: 'password', required: true },
                        ]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).not.toBeCalled();

            const emailInput = screen.getByRole('textbox', { name: 'email' });
            const passwordInput = screen.getByLabelText('password');
            expect(emailInput).toHaveAccessibleErrorMessage('validation.required');
            expect(passwordInput).toHaveAccessibleErrorMessage('validation.required');

            await user.type(emailInput, 'alice@reach5.co');
            expect(emailInput).not.toHaveAccessibleErrorMessage('validation.required');

            await user.type(passwordInput, 'Wond3rFu11_Pa55w0rD*$');
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).toBeCalled();
        });

        test('cross-field validation: passwordConfirmation must match password', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[
                            { key: 'password', required: true },
                            { key: 'passwordConfirmation', required: true },
                        ]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            const passwordInput = screen.getByLabelText('password');
            const confirmInput = screen.getByLabelText('passwordConfirmation');

            await user.type(passwordInput, 'Wond3rFu11_Pa55w0rD*$');
            await user.type(confirmInput, 'wrong_password');
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).not.toBeCalled();
            expect(confirmInput).toHaveAccessibleErrorMessage('validation.passwordMatch');

            await user.clear(confirmInput);
            await user.type(confirmInput, 'Wond3rFu11_Pa55w0rD*$');
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(confirmInput).not.toHaveAccessibleErrorMessage('validation.passwordMatch');
            expect(onSubmit).toBeCalled();
        });

        test("should be able to override 'required' rule", async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[
                            { key: 'email', required: true },
                            { key: 'phoneNumber', required: false },
                        ]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            const emailInput = screen.getByRole('textbox', { name: 'email' });
            const phoneInput = screen.getByRole('textbox', { name: 'phoneNumber' });

            const submitBtn = screen.getByRole('button', { name: 'Submit' });
            await user.click(submitBtn);

            expect(emailInput).toHaveAccessibleErrorMessage('validation.required');
            expect(phoneInput).not.toHaveAccessibleErrorMessage('validation.required');

            await user.type(emailInput, 'alice@reach5.co');

            expect(emailInput).not.toHaveAccessibleErrorMessage('validation.required');
            expect(phoneInput).not.toHaveAccessibleErrorMessage('validation.required');

            await user.click(submitBtn);

            expect(onSubmit).toBeCalledWith({
                email: 'alice@reach5.co',
                phoneNumber: undefined,
            });
        });

        test('email format validation triggers on invalid email', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['email']} handler={onSubmit} />
                </WidgetContext>
            );

            const emailInput = screen.getByRole('textbox', { name: 'email' });
            await user.type(emailInput, 'not-a-valid-email');

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).not.toBeCalled();
            expect(emailInput).toHaveAccessibleErrorMessage('validation.email');
        });
    });

    describe('Form Submission', () => {
        test('applies beforeSubmit transformation before calling handler', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: true }]}
                        beforeSubmit={data => ({
                            ...data,
                            givenName: String(data.givenName).toUpperCase(),
                        })}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            await user.type(screen.getByRole('textbox', { name: 'givenName' }), 'alice');
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).toBeCalledWith({ givenName: 'ALICE' });
        });

        test('select field with defaultValue submits the default when user does not interact', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[
                            {
                                key: 'custom_fields.country',
                                defaultValue: 'FRA',
                                required: true,
                            },
                        ]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    custom_fields: { country: 'FRA' },
                })
            );
        });

        describe('hidden field', () => {
            test('renders as input[type="hidden"] with defaultValue pre-filled', async () => {
                const user = userEvent.setup();
                const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

                render(
                    <WidgetContext
                        client={apiClient}
                        config={defaultConfig}
                        defaultMessages={defaultI18n}
                    >
                        <Form
                            fields={[{ key: 'party_type', defaultValue: 'PERSON', type: 'hidden' }]}
                            handler={onSubmit}
                        />
                    </WidgetContext>
                );

                const hiddenInput = screen.getByDisplayValue('PERSON');
                expect(hiddenInput).toHaveAttribute('type', 'hidden');

                await user.click(screen.getByRole('button', { name: 'Submit' }));

                await waitFor(() => expect(onSubmit).toBeCalledWith({ partyType: 'PERSON' }));
            });

            test('hidden custom field (in config) renders as input[type="hidden"] with defaultValue pre-filled', async () => {
                const user = userEvent.setup();
                const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

                const configWithPartyType = {
                    ...defaultConfig,
                    customFields: [
                        ...(defaultConfig.customFields ?? []),
                        { name: 'Party Type', path: 'party_type', dataType: 'string' as const },
                    ],
                };

                render(
                    <WidgetContext
                        client={apiClient}
                        config={configWithPartyType}
                        defaultMessages={defaultI18n}
                    >
                        <Form
                            fields={[{ key: 'party_type', defaultValue: 'PERSON', type: 'hidden' }]}
                            handler={onSubmit}
                        />
                    </WidgetContext>
                );

                const hiddenInput = screen.getByDisplayValue('PERSON');
                expect(hiddenInput).toHaveAttribute('type', 'hidden');
                expect(hiddenInput).toHaveAttribute('name', 'custom_fields.party_type');

                await user.click(screen.getByRole('button', { name: 'Submit' }));

                await waitFor(() =>
                    expect(onSubmit).toBeCalledWith({ custom_fields: { party_type: 'PERSON' } })
                );
            });

            test('does not log a controlled/uncontrolled input warning when defaultValue is set', () => {
                const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

                render(
                    <WidgetContext
                        client={apiClient}
                        config={defaultConfig}
                        defaultMessages={defaultI18n}
                    >
                        <Form
                            fields={[{ key: 'party_type', defaultValue: 'PERSON', type: 'hidden' }]}
                            handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                        />
                    </WidgetContext>
                );

                const hasValueDefaultValueWarning = consoleError.mock.calls.some(
                    call =>
                        typeof call[0] === 'string' &&
                        call[0].includes('both value and defaultValue props')
                );
                expect(hasValueDefaultValueWarning).toBe(false);

                consoleError.mockRestore();
            });
        });

        test('initialModel pre-fills form fields', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['email']}
                        initialModel={{ email: 'alice@reach5.co' }}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            const emailInput = screen.getByRole('textbox', { name: 'email' });
            expect(emailInput).toHaveValue('alice@reach5.co');

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            expect(onSubmit).toBeCalledWith({ email: 'alice@reach5.co' });
        });
    });

    describe('Success Handling', () => {
        test('onSuccess called with the value returned by handler', async () => {
            const user = userEvent.setup();
            const onSuccess = jest.fn<(result: { token: string }) => void>();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest
                            .fn<() => Promise<{ token: string }>>()
                            .mockResolvedValue({ token: 'abc123' })}
                        onSuccess={onSuccess}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(onSuccess).toBeCalledWith({ token: 'abc123' });
            });
        });

        test('resetAfterSuccess=true resets form fields after success', async () => {
            const user = userEvent.setup();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                        resetAfterSuccess
                    />
                </WidgetContext>
            );

            const input = screen.getByRole('textbox', { name: 'givenName' });
            await user.type(input, 'alice');
            expect(input).toHaveValue('alice');

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(input).toHaveValue('');
            });
        });

        test('resetAfterSuccess absent does not reset form', async () => {
            const user = userEvent.setup();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            const input = screen.getByRole('textbox', { name: 'givenName' });
            await user.type(input, 'alice');
            expect(input).toHaveValue('alice');

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            // Should still have the value after success without resetAfterSuccess
            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
            });
            expect(input).toHaveValue('alice');
        });
    });

    describe('Error Handling', () => {
        test('onError called when handler throws a generic error', async () => {
            const user = userEvent.setup();
            const onError = jest.fn<(err: unknown) => void>();
            const error = new Error('something went wrong');

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest
                            .fn<() => Promise<void>>()
                            .mockImplementation(() => Promise.reject(error))}
                        onError={onError}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(onError).toBeCalledWith(error);
            });
        });

        test('AppError: root error message displayed as role="alert"', async () => {
            const user = userEvent.setup();
            const appError = {
                errorId: '123',
                errorDescription: 'An error occurred',
                error: 'some_error',
                errorMessageKey: 'some.error.key',
            };
            const handler = jest.fn<() => Promise<void>>().mockRejectedValue(appError);

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={[{ key: 'givenName', required: false }]} handler={handler} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });
            // i18n falls back to errorDescription when key not found
            expect(screen.getByRole('alert')).toHaveTextContent('An error occurred');
        });

        test('AppError: errorDetails with valid field key sets field-level error', async () => {
            const user = userEvent.setup();
            const appError = {
                errorId: '123',
                errorDescription: 'Validation failed',
                error: 'validation_error',
                errorMessageKey: 'validation_error',
                errorDetails: [{ field: 'email', code: 'missing', message: 'Email is required' }],
            };
            const handler = jest.fn<() => Promise<void>>().mockRejectedValue(appError);

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['email']} handler={handler} />
                </WidgetContext>
            );

            // Fill a valid email so client-side validation passes, letting the handler run
            const emailInput = screen.getByRole('textbox', { name: 'email' });
            await user.type(emailInput, 'alice@reach5.co');

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(emailInput).toHaveAccessibleErrorMessage('validation.required');
            });
        });

        test('AppError: errorDetails with unknown field key still sets root error', async () => {
            const user = userEvent.setup();
            const appError = {
                errorId: '123',
                errorDescription: 'An error occurred',
                error: 'some_error',
                errorMessageKey: 'some.error.key',
                errorDetails: [
                    { field: 'unknownField', code: 'invalid', message: 'Field is invalid' },
                ],
            };
            const handler = jest.fn<() => Promise<void>>().mockRejectedValue(appError);

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={[{ key: 'givenName', required: false }]} handler={handler} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });
            expect(screen.getByRole('alert')).toHaveTextContent('An error occurred');
        });

        test('resetAfterError=true resets form fields after error', async () => {
            const user = userEvent.setup();
            const error = new Error('something went wrong');

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest
                            .fn<() => Promise<void>>()
                            .mockImplementation(() => Promise.reject(error))}
                        resetAfterError
                    />
                </WidgetContext>
            );

            const input = screen.getByRole('textbox', { name: 'givenName' });
            await user.type(input, 'alice');
            expect(input).toHaveValue('alice');

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(input).toHaveValue('');
            });
        });
    });

    describe('skipError', () => {
        test('skipError=true treats all handler errors as success (calls onSuccess)', async () => {
            const user = userEvent.setup();
            const onSuccess = jest.fn<() => void>();
            const onError = jest.fn<() => void>();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest
                            .fn<() => Promise<void>>()
                            .mockImplementation(() => Promise.reject(new Error('handler error')))}
                        skipError
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(onSuccess).toBeCalled();
            });
            expect(onError).not.toBeCalled();
        });

        test('skipError function: skips matching error and calls onSuccess', async () => {
            const user = userEvent.setup();
            const onSuccess = jest.fn<() => void>();
            const onError = jest.fn<() => void>();
            const specificError = new Error('specific error');

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest
                            .fn<() => Promise<void>>()
                            .mockImplementation(() => Promise.reject(specificError))}
                        skipError={err => err === specificError}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(onSuccess).toBeCalled();
            });
            expect(onError).not.toBeCalled();
        });

        test('skipError function: does not skip non-matching error and calls onError', async () => {
            const user = userEvent.setup();
            const onSuccess = jest.fn<() => void>();
            const onError = jest.fn<() => void>();
            const otherError = new Error('other error');

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'givenName', required: false }]}
                        handler={jest
                            .fn<() => Promise<void>>()
                            .mockImplementation(() => Promise.reject(otherError))}
                        skipError={err => err instanceof TypeError}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() => {
                expect(onError).toBeCalledWith(otherError);
            });
            expect(onSuccess).not.toBeCalled();
        });
    });

    describe('UI Props', () => {
        test('showLabels=true makes labels visible and shows required fields indicator', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['email']}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                        showLabels
                    />
                </WidgetContext>
            );

            // The required fields indicator paragraph should be visible
            expect(screen.getByText('form.required.fields')).toBeInTheDocument();

            // The label should NOT have sr-only class
            const labelEl = screen.getByText('email', { selector: 'label' });
            expect(labelEl).not.toHaveClass('sr-only');
        });

        test('showLabels=false (default) hides labels visually', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['email']}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            // The required fields indicator paragraph should NOT be shown
            expect(screen.queryByText('form.required.fields')).not.toBeInTheDocument();

            // The label should have sr-only class (visually hidden)
            const labelEl = screen.getByText('email', { selector: 'label' });
            expect(labelEl).toHaveClass('sr-only');
        });

        test('custom submitLabel shown on submit button', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[]}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                        submitLabel="my.custom.label"
                    />
                </WidgetContext>
            );

            expect(screen.getByRole('button', { name: 'my.custom.label' })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
        });

        test('custom SubmitComponent rendered instead of default Button', () => {
            const CustomSubmit = ({
                disabled,
                label,
                onClick,
            }: {
                disabled: boolean;
                label: string;
                onClick: React.MouseEventHandler<HTMLButtonElement>;
            }) => (
                <button
                    type="button"
                    data-testid="custom-submit"
                    disabled={disabled}
                    onClick={onClick}
                >
                    {label}
                </button>
            );

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[]}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                        SubmitComponent={CustomSubmit}
                    />
                </WidgetContext>
            );

            const customBtn = screen.getByTestId('custom-submit');
            expect(customBtn).toBeInTheDocument();
            expect(customBtn).toHaveTextContent('Submit');
            expect(customBtn).not.toBeDisabled();
        });

        test('<form> has aria-busy="true" while submitting', async () => {
            const user = userEvent.setup();

            let resolveHandler!: () => void;
            const handler = jest.fn<() => Promise<void>>(
                () =>
                    new Promise<void>(resolve => {
                        resolveHandler = resolve;
                    })
            );

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={[{ key: 'givenName', required: false }]} handler={handler} />
                </WidgetContext>
            );

            // eslint-disable-next-line testing-library/no-node-access
            const formEl = document.querySelector('form')!;

            // Before submit: not busy
            expect(formEl).toHaveAttribute('aria-busy', 'false');

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            // While handler is pending: aria-busy should be true
            await waitFor(() => {
                expect(formEl).toHaveAttribute('aria-busy', 'true');
            });

            // Resolve the handler
            resolveHandler();

            // After completion: aria-busy should be false again
            await waitFor(() => {
                expect(formEl).toHaveAttribute('aria-busy', 'false');
            });
        });
    });

    describe('Consent Field', () => {
        test('consent description is rendered', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['consents.optin_testing']}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            expect(screen.getByRole('checkbox', { name: 'Opt-in Testing v1' })).toBeInTheDocument();
            expect(screen.getByText('This is just a test')).toBeInTheDocument();
        });

        test('checking consent calls handler with full consent structure (consentType, consentVersion, granted)', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['consents.optin_testing']} handler={onSubmit} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('checkbox', { name: 'Opt-in Testing v1' }));
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    consents: {
                        optin_testing: expect.objectContaining({
                            consentType: 'opt-in',
                            consentVersion: expect.objectContaining({
                                versionId: 1,
                                language: 'fr',
                            }),
                            granted: true,
                        }),
                    },
                })
            );
        });

        test('consent initially checked via initialModel submits with granted: true', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['consents.optin_testing']}
                        initialModel={{ consents: { optin_testing: { granted: true } } }}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            const checkbox = screen.getByRole('checkbox', { name: 'Opt-in Testing v1' });
            expect(checkbox).toBeChecked();

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith(
                    expect.objectContaining({
                        consents: {
                            optin_testing: expect.objectContaining({ granted: true }),
                        },
                    })
                )
            );
        });

        test('opt-in consent: not required by default, submits with granted: false when unchecked', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['consents.optin_testing']} handler={onSubmit} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    consents: {
                        optin_testing: expect.objectContaining({ granted: false }),
                    },
                })
            );
        });

        test('opt-in consent with required: true — unchecking a pre-checked consent shows required error and blocks submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'consents.optin_testing', required: true }]}
                        initialModel={{ consents: { optin_testing: { granted: true } } }}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            const checkbox = screen.getByRole('checkbox', { name: 'Opt-in Testing v1' });
            expect(checkbox).toBeChecked();

            await user.click(checkbox);
            expect(checkbox).not.toBeChecked();

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(checkbox).toHaveAccessibleErrorMessage('validation.required')
            );
            expect(onSubmit).not.toBeCalled();
        });

        test('opt-in consent with required: true — submitting without checking shows required error and blocks submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'consents.optin_testing', required: true }]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            const checkbox = screen.getByRole('checkbox', { name: 'Opt-in Testing v1' });
            await waitFor(() =>
                expect(checkbox).toHaveAccessibleErrorMessage('validation.required')
            );
            expect(onSubmit).not.toBeCalled();
        });

        test('opt-in consent with required: true — checking then unchecking shows required error and blocks submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'consents.optin_testing', required: true }]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            const checkbox = screen.getByRole('checkbox', { name: 'Opt-in Testing v1' });
            await user.click(checkbox);
            await user.click(checkbox);

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(checkbox).toHaveAccessibleErrorMessage('validation.required')
            );
            expect(onSubmit).not.toBeCalled();
        });

        test('opt-out consent: is pre-checked by default and not required', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['consents.optout_testing']}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            const checkbox = screen.getByRole('checkbox', { name: 'Opt-out Testing v1' });
            expect(checkbox).toBeChecked();
            expect(checkbox).not.toBeRequired();
        });

        test('opt-out consent: submits with granted: true without user interaction', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['consents.optout_testing']} handler={onSubmit} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    consents: {
                        optout_testing: expect.objectContaining({
                            consentType: 'opt-out',
                            granted: true,
                        }),
                    },
                })
            );
        });

        test('opt-out consent: unchecking submits with granted: false', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['consents.optout_testing']} handler={onSubmit} />
                </WidgetContext>
            );

            const checkbox = screen.getByRole('checkbox', { name: 'Opt-out Testing v1' });
            await user.click(checkbox);

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    consents: {
                        optout_testing: expect.objectContaining({ granted: false }),
                    },
                })
            );
        });

        test('double-opt-in consent: not required by default, submits with granted: false when unchecked', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['consents.double_optin_testing']} handler={onSubmit} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    consents: {
                        double_optin_testing: expect.objectContaining({ granted: false }),
                    },
                })
            );
        });

        test('double-opt-in consent with required: true — submitting without checking shows required error and blocks submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={[{ key: 'consents.double_optin_testing', required: true }]}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );

            await user.click(screen.getByRole('button', { name: 'Submit' }));

            const checkbox = screen.getByRole('checkbox', { name: 'Double Opt-in Testing v1' });
            await waitFor(() =>
                expect(checkbox).toHaveAccessibleErrorMessage('validation.required')
            );
            expect(onSubmit).not.toBeCalled();
        });

        test('double-opt-in consent: checking submits with granted: true', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['consents.double_optin_testing']} handler={onSubmit} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('checkbox', { name: 'Double Opt-in Testing v1' }));
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    consents: {
                        double_optin_testing: expect.objectContaining({
                            consentType: 'double-opt-in',
                            granted: true,
                        }),
                    },
                })
            );
        });

        test('consent field key without the "consents." prefix resolves the same consent', () => {
            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['optin_testing']}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            expect(screen.getByRole('checkbox', { name: 'Opt-in Testing v1' })).toBeInTheDocument();
            expect(screen.getByText('This is just a test')).toBeInTheDocument();
        });

        test('checking a consent declared without the "consents." prefix submits under the `consents` key', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={['optin_testing']} handler={onSubmit} />
                </WidgetContext>
            );

            await user.click(screen.getByRole('checkbox', { name: 'Opt-in Testing v1' }));
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(onSubmit).toBeCalledWith({
                    consents: {
                        optin_testing: expect.objectContaining({
                            consentType: 'opt-in',
                            granted: true,
                        }),
                    },
                })
            );
        });

        test('consent field declared as an object without the "consents." prefix keeps its `required` option', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<() => Promise<void>>().mockResolvedValue();

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form fields={[{ key: 'optin_testing', required: true }]} handler={onSubmit} />
                </WidgetContext>
            );

            const checkbox = screen.getByRole('checkbox', { name: 'Opt-in Testing v1' });
            await user.click(checkbox);
            await user.click(checkbox);
            await user.click(screen.getByRole('button', { name: 'Submit' }));

            await waitFor(() =>
                expect(checkbox).toHaveAccessibleErrorMessage('validation.required')
            );
            expect(onSubmit).not.toBeCalled();
        });

        test('unknown bare field key is ignored and logged instead of throwing', () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

            render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fields={['email', 'unknown_field']}
                        handler={jest.fn<() => Promise<void>>().mockResolvedValue()}
                    />
                </WidgetContext>
            );

            expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
            expect(consoleError).toHaveBeenCalledWith('Unknown field: unknown_field');

            consoleError.mockRestore();
        });
    });
});
