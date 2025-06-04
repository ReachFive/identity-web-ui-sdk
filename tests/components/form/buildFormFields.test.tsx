/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import 'jest-styled-components';
import React from 'react';

import type { Config } from '../../../src/types';

import { Client, PasswordStrengthScore } from '@reachfive/identity-core';
import { createForm } from '../../../src/components/form/formComponent';
import { buildFormFields } from '../../../src/components/form/formFieldFactory';
import { I18nMessages } from '../../../src/core/i18n';
import { WidgetContext } from './WidgetContext';

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
            name: 'number',
            nameTranslations: [{ langCode: 'fr', label: 'Nombre' }],
            path: 'number',
            dataType: 'number',
        },
        {
            name: 'integer',
            nameTranslations: [{ langCode: 'fr', label: 'Entier' }],
            path: 'integer',
            dataType: 'integer',
        },
        {
            name: 'decimal',
            nameTranslations: [{ langCode: 'fr', label: 'Décimale' }],
            path: 'decimal',
            dataType: 'decimal',
        },
        {
            name: 'username',
            nameTranslations: [{ langCode: 'fr', label: "Nom d'utilisateur" }],
            path: 'username',
            dataType: 'string',
        },
        {
            name: 'birthdate',
            nameTranslations: [{ langCode: 'fr', label: 'Date de naissance' }],
            path: 'birthdate',
            dataType: 'date',
        },
        {
            name: 'checkbox',
            nameTranslations: [{ langCode: 'fr', label: 'Case à cocher' }],
            path: 'checkbox',
            dataType: 'checkbox',
        },
        {
            name: 'select',
            nameTranslations: [{ langCode: 'fr', label: 'Selecteur' }],
            path: 'select',
            dataType: 'select',
            selectableValues: [
                { value: 'cat', label: 'Cat', translations: [] },
                { value: 'dog', label: 'Dog', translations: [] },
            ],
        },
        {
            name: 'phone',
            nameTranslations: [{ langCode: 'fr', label: 'numero de téléphone' }],
            path: 'phone',
            dataType: 'phone',
        },
        {
            name: 'email',
            nameTranslations: [{ langCode: 'fr', label: 'adresse électronique' }],
            path: 'email',
            dataType: 'email',
        },
    ],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {
        myconsent: {
            key: 'myconsent',
            consentType: 'opt-in',
            status: 'active',
            versions: [
                {
                    versionId: 1,
                    description: 'Lorem ipsum',
                    title: 'My Consent',
                    language: 'fr',
                },
            ],
        },
        oldconsent: {
            key: 'oldconsent',
            consentType: 'opt-in',
            status: 'archived',
            versions: [
                {
                    versionId: 1,
                    description: 'Dolor sit amet',
                    title: 'Old Consent',
                    language: 'fr',
                },
            ],
        },
    },
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
};

// function customFieldLabel(path: string, langCode: string) {
//     return defaultConfig.customFields
//         .find(customFields => customFields.path === path)
//         ?.nameTranslations
//         ?.find(translation => translation.langCode == langCode)
//         ?.label
// }

const defaultI18n: I18nMessages = {
    simple: 'simple',
};

type Model = {
    customIdentifier: string;
    givenName: string;
    familyName: string;
    friendlyName: string;
    email: string;
    phoneNumber: string;
    password: string;
    passwordConfirmation: string;
    gender: string;
    birthdate: string;
    'address.streetAddress': string;
    'address.locality': string;
    'address.region': string;
    'address.postalCode': string;
    'address.country': string;
};

describe('DOM testing', () => {
    const getPasswordStrength = jest.fn<Client['getPasswordStrength']>();

    getPasswordStrength.mockImplementation((password: string) => {
        let score = 0;
        if (password.match(/[a-z]+/)) score++;
        if (password.match(/[0-9]+/)) score++;
        if (password.match(/[^a-z0-9]+/)) score++;
        if (password.length > 8) score++;
        return Promise.resolve({ score: score as PasswordStrengthScore });
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getPasswordStrength,
    };

    beforeEach(() => {
        getPasswordStrength.mockClear();
    });

    test('build predefined fields', async () => {
        const fields = buildFormFields(
            [
                'customIdentifier',
                'givenName',
                'familyName',
                'friendlyName',
                'email',
                'phoneNumber',
                'password',
                'passwordConfirmation',
                'gender',
                'birthdate',
                'address.streetAddress',
                'address.locality',
                'address.region',
                'address.postalCode',
                'address.country',
            ],
            defaultConfig
        );

        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields,
        });

        await waitFor(async () => {
            return render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form handler={onSubmit} />
                </WidgetContext>
            );
        });

        expect(screen.queryByTestId('customIdentifier')).toBeInTheDocument();
        expect(screen.queryByTestId('givenName')).toBeInTheDocument();
        expect(screen.queryByTestId('familyName')).toBeInTheDocument();
        expect(screen.queryByTestId('friendlyName')).toBeInTheDocument();
        expect(screen.queryByTestId('email')).toBeInTheDocument();
        expect(screen.queryByTestId('phoneNumber')).toBeInTheDocument();
        expect(screen.queryByTestId('password')).toBeInTheDocument();
        expect(screen.queryByTestId('passwordConfirmation')).toBeInTheDocument();
        expect(screen.queryByTestId('gender')).toBeInTheDocument();
        expect(screen.queryByTestId('birthdate.day')).toBeInTheDocument();
        expect(screen.queryByTestId('birthdate.month')).toBeInTheDocument();
        expect(screen.queryByTestId('birthdate.year')).toBeInTheDocument();
        expect(screen.queryByTestId('address.streetAddress')).toBeInTheDocument();
        expect(screen.queryByTestId('address.locality')).toBeInTheDocument();
        expect(screen.queryByTestId('address.region')).toBeInTheDocument();
        expect(screen.queryByTestId('address.postalCode')).toBeInTheDocument();
        expect(screen.queryByTestId('address.country')).toBeInTheDocument();
    });

    test('build custom fields', async () => {
        const fields = buildFormFields(
            [
                { key: 'customFields.integer' },
                { key: 'customFields.decimal' },
                { key: 'customFields.username' },
                { key: 'customFields.birthdate' },
                { key: 'customFields.checkbox' },
                { key: 'customFields.select' },
                { key: 'customFields.phone' },
                { key: 'customFields.email' },
            ],
            defaultConfig
        );

        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields,
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form handler={onSubmit} />
                </WidgetContext>
            );
        });

        // const label = customFieldLabel('custom_fields.username', 'fr')
        // const input = screen.queryByLabelText(label!)
        // expect(input).toBeInTheDocument()

        const integer = screen.queryByTestId('custom_fields.integer');
        expect(integer).toBeInTheDocument();
        expect(integer).toHaveAttribute('type', 'number');

        const decimal = screen.queryByTestId('custom_fields.decimal');
        expect(decimal).toBeInTheDocument();
        expect(decimal).toHaveAttribute('type', 'number');

        const username = screen.queryByTestId('custom_fields.username');
        expect(username).toBeInTheDocument();

        expect(screen.queryByTestId('custom_fields.birthdate.day')).toBeInTheDocument();
        expect(screen.queryByTestId('custom_fields.birthdate.month')).toBeInTheDocument();
        expect(screen.queryByTestId('custom_fields.birthdate.year')).toBeInTheDocument();

        const checkbox = screen.queryByTestId('custom_fields.checkbox');
        expect(checkbox).toBeInTheDocument();

        const select = screen.queryByTestId('custom_fields.select');
        expect(select).toBeInTheDocument();
        defaultConfig.customFields
            .find(({ path }) => path === 'select')
            ?.selectableValues?.forEach(value => {
                expect(screen.getByRole('option', { name: value.label })).toBeInTheDocument();
            });

        const phone = screen.queryByTestId('custom_fields.phone');
        expect(phone).toBeInTheDocument();
        expect(phone).toHaveAttribute('type', 'tel');

        const email = screen.queryByTestId('custom_fields.email');
        expect(email).toBeInTheDocument();
        expect(email).toHaveAttribute('type', 'email');
    });

    test('build consent fields', async () => {
        const fields = buildFormFields(
            [{ key: 'consents.myconsent' }, { key: 'consents.oldconsent' }],
            { ...defaultConfig }
        );

        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields,
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form handler={onSubmit} />
                </WidgetContext>
            );
        });

        const myconsent = screen.getByLabelText('My Consent');
        expect(myconsent).toBeInTheDocument();
        expect(myconsent).toHaveAttribute('name', 'consents.myconsent.1');

        const myconsentDescription = screen.queryByTestId('consents.myconsent.1.description');
        expect(myconsentDescription).toBeInTheDocument();
        expect(myconsentDescription).toHaveTextContent('Lorem ipsum');

        const oldconsent = screen.getByLabelText('Old Consent');
        expect(oldconsent).toBeInTheDocument();
    });

    test('build archived consent field with option `errorArchivedConsents = true` should throw an error', async () => {
        expect(() => {
            buildFormFields([{ key: 'consents.myconsent' }, { key: 'consents.oldconsent' }], {
                ...defaultConfig,
                errorArchivedConsents: true,
            });
        }).toThrow("The 'oldconsent' consent is archived and cannot be displayed.");
    });
});
