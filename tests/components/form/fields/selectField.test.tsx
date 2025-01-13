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
import selectField from '../../../../src/components/form/fields/selectField'
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
    selectbox: 'Pet',
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

        const key = 'selectbox'
        const label = 'selectbox'
        const options = [
            { label: 'cat', value: 'cat' },
            { label: 'dog', value: 'dog' },
        ]

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                selectField({ key, label, values: options })
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

        const selectbox = screen.getByLabelText(i18nResolver(label))
        
        expect(selectbox).toHaveValue('')
        options.forEach((option) => {
            expect(screen.getByRole<HTMLOptionElement>("option", { name: option.value }).selected).toBe(false)
        })

        const choice = options[1]
        await user.selectOptions(selectbox, choice.value)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                selectbox: expect.objectContaining({
                    isDirty: false,
                    value: choice.value,
                })
            })
        )

        expect(selectbox).toHaveValue(choice.value)
        expect(screen.getByRole<HTMLOptionElement>('option', { name: choice.value }).selected).toBe(true)

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        await waitFor(() => expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                selectbox: choice.value
            })
        ))
    })

    test('initially selected value', async () => {
        const user = userEvent.setup()

        const key = 'selectbox'
        const label = 'selectbox'
        const options = [
            { label: 'cat', value: 'cat' },
            { label: 'dog', value: 'dog' },
        ]
        const defaultOption = options[1]

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                selectField({ key, label, values: options, defaultValue: defaultOption.value })
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

        const selectbox = screen.getByLabelText(i18nResolver(label))
        
        expect(selectbox).toHaveValue(defaultOption.value)
        expect(screen.getByRole<HTMLOptionElement>('option', { name: defaultOption.value }).selected).toBe(true)

        const choice = options[1]
        await user.selectOptions(selectbox, choice.value)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                selectbox: expect.objectContaining({
                    isDirty: false,
                    value: choice.value,
                })
            })
        )

        expect(selectbox).toHaveValue(choice.value)
        expect(screen.getByRole<HTMLOptionElement>('option', { name: choice.value }).selected).toBe(true)

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        await waitFor(() => expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                selectbox: choice.value
            })
        ))
    })
})