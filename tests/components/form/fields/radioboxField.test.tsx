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
import radioboxField from '../../../../src/components/form/fields/radioboxField'
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
    radiobox: 'Pet',
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

type Model = { check: string }

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup()

        const key = 'radiobox'
        const label = 'radiobox'
        const options = [
            { label: 'cat', value: 'cat' },
            { label: 'dog', value: 'dog' },
        ]

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                radioboxField({ key, label, options })
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

        options.map(option => {
            const input = screen.queryByLabelText(i18nResolver(option.label))
            expect(input).toBeInTheDocument()
            expect(input).not.toBeChecked()
        })

        const choice = options[1]
        const choiceInput = screen.queryByLabelText(i18nResolver(choice.label))
        if (!choiceInput) throw new Error('Radio input should be in document')
        await user.click(choiceInput)

        expect(choiceInput).toBeChecked()

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                radiobox: expect.objectContaining({
                    isDirty: false,
                    value: choice.value,
                })
            })
        ))

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                radiobox: choice.value
            })
        )
    })

    test('initially checked', async () => {
        const user = userEvent.setup()

        const key = 'radiobox'
        const label = 'radiobox'
        const options = [
            { label: 'cat', value: 'cat' },
            { label: 'dog', value: 'dog' },
        ]
        const defaultOption = options[1]

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                radioboxField({ key, label, options, defaultValue: defaultOption.value })
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

        // options.map(option => {
        //     const input = screen.queryByLabelText(i18nResolver(option.label))
        //     expect(input).toBeInTheDocument()
        //     if (option.value === defaultOption.value) {
        //         expect(input).toBeChecked()
        //     } else {
        //         expect(input).not.toBeChecked()
        //     }
        // })


        const choice = options[0]
        const choiceInput = screen.queryByLabelText(i18nResolver(choice.label))
        if (!choiceInput) throw new Error('Radio input should be in document')
        await user.click(choiceInput)

        expect(choiceInput).toBeChecked()

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                radiobox: expect.objectContaining({
                    isDirty: false,
                    value: choice.value,
                })
            })
        ))

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        await waitFor(() => expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                radiobox: choice.value
            })
        ))
    })

    test('with ReactNode option\'s label', async () => {
        const user = userEvent.setup()

        const key = 'radiobox'
        const label = 'radiobox'
        const options = [
            { label: <>Cat</>, value: 'cat' },
            { label: <>Dog</>, value: 'dog' },
        ]

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                radioboxField({ key, label, options })
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

        options.map(option => {
            const input = screen.queryByDisplayValue(option.value)
            expect(input).toBeInTheDocument()
            expect(input).not.toBeChecked()
        })

        const choice = options[1]
        const choiceInput = screen.queryByDisplayValue(choice.value)
        if (!choiceInput) throw new Error('Radio input should be in document')
        await user.click(choiceInput)

        expect(choiceInput).toBeChecked()

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                radiobox: expect.objectContaining({
                    isDirty: false,
                    value: choice.value,
                })
            })
        ))

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        await waitFor(() => expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                radiobox: choice.value
            })
        ))
    })
})