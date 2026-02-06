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

import identifierField from '../../../../src/components/form/fields/identifierField';
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
    identifier: 'Identifiant',
    email: 'Mon Email',
    phoneNumber: 'Mon Numéro de téléphone',
};

type Model = { identifier: string };

describe('DOM testing', () => {
    test('with phone number enabled', async () => {
        const user = userEvent.setup();

        const key = 'identifier';
        const label = 'identifier';
        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [identifierField({ key, label, withPhoneNumber: true }, defaultConfig)],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveValue('');

        if (!input) return;

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: emailValue,
            })
        );

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: format(phoneValue, 'FR', 'INTERNATIONAL'),
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: otherValue,
            })
        );
    });

    test('with phone number disabled', async () => {
        const user = userEvent.setup();

        const key = 'identifier';
        const label = 'identifier';
        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [identifierField({ key, label, withPhoneNumber: false }, defaultConfig)],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveValue('');

        if (!input) return;

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: emailValue,
            })
        );

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        // phone value is handled as "other" value type
        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: phoneValue,
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: otherValue,
            })
        );
    });

    test('withPhoneNumber = true | loginTypeAllowed.phoneNumber = true | loginTypeAllowed.email = false | no key/label', async () => {
        const user = userEvent.setup();
        const configWithEmailLoginNotAllowed: Config = {
            ...defaultConfig,
            loginTypeAllowed: {
                email: false,
                phoneNumber: true,
                customIdentifier: true,
            },
        };
        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [identifierField({ withPhoneNumber: true }, configWithEmailLoginNotAllowed)],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Mon Numéro de téléphone');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', 'phone_number');
        expect(input).toHaveValue('');

        if (!input) return;

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                phoneNumber: emailValue,
            })
        );

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                phoneNumber: format(phoneValue, 'FR', 'INTERNATIONAL'),
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                phoneNumber: otherValue,
            })
        );
    });

    test('withPhoneNumber = false | loginTypeAllowed.phoneNumber = false | loginTypeAllowed.email = true | no key/label', async () => {
        const user = userEvent.setup();

        const configWithPhoneNumberLoginNotAllowed: Config = {
            ...defaultConfig,
            loginTypeAllowed: {
                email: true,
                phoneNumber: false,
                customIdentifier: true,
            },
        };

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [
                identifierField({ withPhoneNumber: false }, configWithPhoneNumberLoginNotAllowed),
            ],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Mon Email');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', 'email');
        expect(input).toHaveValue('');

        if (!input) return;

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                email: emailValue,
            })
        );

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        // phone value is handled as "other" value type
        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                email: phoneValue,
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                email: otherValue,
            })
        );
    });

    test('withPhoneNumber = false | loginTypeAllowed.phoneNumber = false | loginTypeAllowed.email = true | key/label', async () => {
        const user = userEvent.setup();

        const key = 'identifier';
        const label = 'identifier';

        const configWithEmailLoginNotAllowed: Config = {
            ...defaultConfig,
            loginTypeAllowed: {
                email: true,
                phoneNumber: false,
                customIdentifier: true,
            },
        };

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [
                identifierField(
                    { key, label, withPhoneNumber: true },
                    configWithEmailLoginNotAllowed
                ),
            ],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveValue('');

        if (!input) return;

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: emailValue,
            })
        );

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: format(phoneValue, 'FR', 'INTERNATIONAL'),
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: otherValue,
            })
        );
    });
    test('withPhoneNumber = false | loginTypeAllowed.phoneNumber = true | loginTypeAllowed.email = true | no key/label', async () => {
        const user = userEvent.setup();

        const configWithEmailLoginNotAllowed: Config = {
            ...defaultConfig,
            loginTypeAllowed: {
                email: false,
                phoneNumber: false,
                customIdentifier: true,
            },
        };

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [identifierField({ withPhoneNumber: false }, configWithEmailLoginNotAllowed)],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('');

        if (!input) return;

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: emailValue,
            })
        );

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: phoneValue,
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: otherValue,
            })
        );
    });

    test('with defaultIdentifier set', async () => {
        const user = userEvent.setup();

        const key = 'identifier';
        const label = 'identifier';
        const defaultValue = 'alice@reach5.co';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [
                identifierField({ key, label, defaultValue, withPhoneNumber: true }, defaultConfig),
            ],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveValue(defaultValue);

        if (!input) return;

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: format(phoneValue, 'FR', 'INTERNATIONAL'),
            })
        );

        const emailValue = 'bob@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: emailValue,
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: otherValue,
            })
        );
    });

    test('withPhoneNumber = true | loginTypeAllowed.phoneNumber = false | loginTypeAllowed.email = true | isWebAuthnLogin = true | no key/label', async () => {
        const user = userEvent.setup();

        const configWithEmailLoginNotAllowed: Config = {
            ...defaultConfig,
            loginTypeAllowed: {
                email: true,
                phoneNumber: false,
                customIdentifier: true,
            },
        };

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [
                identifierField(
                    { withPhoneNumber: false, isWebAuthnLogin: true },
                    configWithEmailLoginNotAllowed
                ),
            ],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        handler={onSubmit}
                        onFieldChange={onFieldChange}
                    />
                </WidgetContext>
            );
        });

        const input = screen.queryByLabelText('Identifiant');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('');

        if (!input) return;

        const emailValue = 'alice@reach5.co';
        await user.clear(input);
        await user.type(input, emailValue);
        expect(input).toHaveValue(emailValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: emailValue,
            })
        );

        const phoneValue = '+33123456789';
        await user.clear(input);
        await user.type(input, phoneValue);
        expect(input).toHaveValue(phoneValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: phoneValue,
            })
        );

        const otherValue = 'Alice971';
        await user.clear(input);
        await user.type(input, otherValue);
        expect(input).toHaveValue(otherValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: otherValue,
            })
        );
    });
});
