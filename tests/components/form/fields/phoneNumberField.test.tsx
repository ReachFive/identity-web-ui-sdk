/**
 * @jest-environment jsdom
 */

import React from 'react'
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen, queryHelpers, Matcher, RenderResult, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';
import { ThemeProvider } from 'styled-components';
import { formatPhoneNumberIntl, type Value } from 'react-phone-number-input';

// import labels from '../../../../node_modules/react-phone-number-input/locale/fr.json'

import type { Config } from '../../../../src/types';
import type { Theme } from '../../../../src/types/styled'

import phoneNumberField from '../../../../src/components/form/fields/phoneNumberField'
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { buildTheme } from '../../../../src/core/theme';

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
    consentsVersions: {}
};

const defaultI18n: I18nMessages = {
    phone: 'Phone number'
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

const queryByName = (renderResult: RenderResult, name: Matcher) => {
    const query = queryHelpers.queryByAttribute.bind(null, 'name')
    const element = query(renderResult.container, name)
    if (!element) {
        queryHelpers.getElementError(
            `Could not find element with ${name}`,
            renderResult.container
        )
    }
    return element
}

describe('DOM testing', () => {

    // See: https://www.npmjs.com/package/react-phone-number-input#localization
    // jest.mock('../../../../node_modules/react-phone-number-input/locale/fr.json.js', () => labels);

    test('with country select', async () => {
        const user = userEvent.setup()

        const defaultCountry = 'FR'
        const initialValue = '+33123456789'
        const key = 'phone_number'
        const label = 'phone'
        const onChange = jest.fn()

        const renderResult = await waitFor(async () => {
            const Field = phoneNumberField(
                {
                    defaultCountry,
                    i18n: i18nResolver,
                    key,
                    label,
                    withCountrySelect: true
                },
                defaultConfig
            )
                .create({
                    i18n: i18nResolver,
                    showLabel: true
                })
                .render({
                    defaultCountry,
                    i18n: i18nResolver,
                    inputId: key,
                    key,
                    label: i18nResolver(label),
                    onChange,
                    path: key,
                    state: {
                        value: initialValue as Value
                    },
                })
            
            return render(
                <ThemeProvider theme={theme}>
                    {Field}
                </ThemeProvider>
            )
        })

        const input = screen.queryByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('id', key)
        expect(input).toHaveValue(formatPhoneNumberIntl(initialValue))

        if (!input) return

        const countrySelect = queryByName(renderResult, 'phone_numberCountry')
        expect(countrySelect).toBeInTheDocument()
        expect(countrySelect).toHaveValue(defaultCountry)

        const newValue = '+12133734253'
        await user.clear(input)
        await user.type(input, newValue)
        expect(input).toHaveValue(formatPhoneNumberIntl(newValue))
        expect(countrySelect).toHaveValue('US')

        expect(onChange).toHaveBeenLastCalledWith({
            value: newValue,
        });
    })
})