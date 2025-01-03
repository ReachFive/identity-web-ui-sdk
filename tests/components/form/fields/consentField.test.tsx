/**
 * @jest-environment jsdom
 */

import React from 'react'
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';
import { ThemeProvider } from 'styled-components';

import type { Config } from '../../../../src/types';
import type { Theme } from '../../../../src/types/styled'

import { createForm } from '../../../../src/components/form/formComponent'
import consentField from '../../../../src/components/form/fields/consentField'
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { buildTheme } from '../../../../src/core/theme';
import { I18nProvider } from '../../../../src/contexts/i18n';
import { ConfigProvider } from '../../../../src/contexts/config';

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
    }
};

const defaultI18n: I18nMessages = {
    checkbox: 'Check?',
}

const i18nResolver = resolveI18n(defaultI18n)

const theme: Theme = buildTheme({
    primaryColor: '#ff0000',
    spacing: 20,
    input: {
        borderWidth: 1,
        paddingX: 16,
        paddingY: 8,
        height: 40,
    }
})

type Model = { 'consents.myconsent.1': string }

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup()

        const label = 'My Consent'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                consentField({
                    key: `consents.myconsent.1`,
                    path: `consents.myconsent`, // Will target the same profile consent value for different versions of the consent
                    label,
                    type: 'opt-in',
                    extendedParams: {
                        version: {
                            versionId: 1,
                            language: defaultConfig.language
                        },
                        description: 'Lorem ipsum sit amet',
                        consentCannotBeGranted: false
                    }
                })
            ],
        })

        await waitFor(async () => {   
            return render(
                <ConfigProvider config={defaultConfig}>
                    <ThemeProvider theme={theme}>
                        <I18nProvider defaultMessages={defaultI18n}>
                            <Form
                                fieldValidationDebounce={0} // trigger validation instantly
                                onFieldChange={onFieldChange}
                                handler={onSubmit}
                            />
                        </I18nProvider>
                    </ThemeProvider>
                </ConfigProvider>
            )
        })

        const checkbox = screen.queryByLabelText(i18nResolver(label))
        expect(checkbox).not.toBeChecked()

        const description = screen.queryByTestId('consents.myconsent.1.description')
        expect(description).toBeInTheDocument()
        // expect(description).toHaveTextContent('Lorem ipsum sit amet')
        
        if (!checkbox) throw new Error('Input should be in document')

        await user.click(checkbox)

        expect(checkbox).toBeChecked()

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                'consents.myconsent.1': expect.objectContaining({
                    isDirty: true,
                    value: true,
                })
            })
        )

        const submitBtn = screen.getByRole('button')
        user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                consents: expect.objectContaining({
                    'myconsent': expect.objectContaining({
                        consentType: 'opt-in',
                        consentVersion: expect.objectContaining({
                            language: defaultConfig.language,
                            versionId: 1
                        }),
                        granted: true
                    })
                })
            })
        )
    })

    test('initially checked', async () => {
        const user = userEvent.setup()

        const label = 'My Consent'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                consentField({
                    label,
                    key: `consents.myconsent.1`,
                    path: `consents.myconsent`, // Will target the same profile consent value for different versions of the consent
                    type: 'opt-in',
                    extendedParams: {
                        version: {
                            versionId: 1,
                            language: defaultConfig.language
                        },
                        description: 'Lorem ipsum sit amet',
                        consentCannotBeGranted: false,
                    },
                    defaultValue: true,
                })
            ],
        })

        await waitFor(async () => {   
            return render(
                <ConfigProvider config={defaultConfig}>
                    <ThemeProvider theme={theme}>
                        <I18nProvider defaultMessages={defaultI18n}>
                            <Form
                                fieldValidationDebounce={0} // trigger validation instantly
                                onFieldChange={onFieldChange}
                                handler={onSubmit}
                            />
                        </I18nProvider>
                    </ThemeProvider>
                </ConfigProvider>
            )
        })

        const checkbox = screen.queryByLabelText(i18nResolver(label))
        expect(checkbox).toBeChecked()
        
        if (!checkbox) throw new Error('Input should be in document')

        await user.click(checkbox)

        expect(checkbox).not.toBeChecked()

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                'consents.myconsent.1': expect.objectContaining({
                    isDirty: true,
                    value: false,
                })
            })
        )

        const submitBtn = screen.getByRole('button')
        user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                consents: expect.objectContaining({
                    'myconsent': expect.objectContaining({
                        consentType: 'opt-in',
                        consentVersion: {
                            language: "fr",
                            versionId: 1
                        },
                        granted: false
                    })
                })
            })
        )
    })
})