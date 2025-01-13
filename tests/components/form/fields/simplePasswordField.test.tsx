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
import simplePasswordField from '../../../../src/components/form/fields/simplePasswordField'
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
};

const defaultI18n: I18nMessages = {
    password: 'password'
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

type Model = { password: string }

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup()

        const key = 'password'
        const label = 'password'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                simplePasswordField({ key, label })
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

        const input = screen.getByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('id', key)
        expect(input).toHaveAttribute('type', 'password')
        expect(input).toHaveAttribute('placeholder', i18nResolver(label))
        expect(input).toHaveValue('')

        expect(screen.queryByTestId('show-password-btn')).not.toBeInTheDocument()
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument()

        const newValue = 'azerty'
        await user.clear(input)
        await user.type(input, newValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                password: expect.objectContaining({
                    isDirty: false,
                    value: newValue,
                })
            })
        )

        expect(screen.queryByTestId('show-password-btn')).not.toBeInTheDocument()
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument()

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        await waitFor(() => expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                password: newValue
            })
        ))
    })

    test('custom type, placeholder and default value', async () => {
        const key = 'password'
        const label = 'password'
        const placeholder = 'password placeholder'
        const defaultValue = "my value"

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                simplePasswordField({ key, label, placeholder, defaultValue })
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

        const input = screen.queryByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('id', key)
        expect(input).toHaveAttribute('placeholder', placeholder)
        expect(input).toHaveValue(defaultValue)

    })

    test('with canShowPassword = true', async () => {
        const user = userEvent.setup()

        const key = 'password'
        const label = 'password'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                simplePasswordField({ key, label, canShowPassword: true })
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

        const input = screen.getByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'password')

        expect(screen.queryByTestId('show-password-btn')).toBeInTheDocument()
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument()

        const newValue = 'azerty'
        await user.clear(input)
        await user.type(input, newValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                password: expect.objectContaining({
                    isDirty: false,
                    value: newValue,
                })
            })
        )

        expect(screen.queryByTestId('show-password-btn')).toBeInTheDocument()
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument()

        await user.click(screen.queryByTestId('show-password-btn')!)

        expect(input).toHaveAttribute('type', 'text')
        expect(screen.queryByTestId('show-password-btn')).not.toBeInTheDocument()
        expect(screen.queryByTestId('hide-password-btn')).toBeInTheDocument()

        await user.click(screen.queryByTestId('hide-password-btn')!)

        expect(input).toHaveAttribute('type', 'password')
        expect(screen.queryByTestId('show-password-btn')).toBeInTheDocument()
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument()
    })
})
