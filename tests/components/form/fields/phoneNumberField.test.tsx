/**
 * @jest-environment jsdom
 */

import React from 'react'
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen, queryHelpers, Matcher, RenderResult, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';
import { formatPhoneNumberIntl, type Value } from 'react-phone-number-input';

import type { Config } from '../../../../src/types';

import phoneNumberField from '../../../../src/components/form/fields/phoneNumberField'
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { createForm } from '../../../../src/components/form/formComponent';
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
    }
};

const defaultI18n: I18nMessages = {
    phone: 'Phone number'
}

const i18nResolver = resolveI18n(defaultI18n)

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

type Model = { phoneNumber: string }

describe('DOM testing', () => {

    // @ts-expect-error partial Client
    const apiClient: Client = {}

    test('with country select', async () => {
        const user = userEvent.setup()

        const country = 'FR'
        const initialValue = '+33123456789'
        const key = 'phone_number'
        const label = 'phone'
        
        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                phoneNumberField({
                    key,
                    label,
                    country,
                    defaultValue: initialValue as Value,
                    withCountrySelect: true
                }, defaultConfig)
            ],
        })

        const renderResult = await waitFor(async () => {   
            return render(
                <WidgetContext
                    client={apiClient}
                    config={defaultConfig}
                    defaultMessages={defaultI18n}
                >
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        onFieldChange={onFieldChange}
                        handler={onSubmit}
                    />
                </WidgetContext>
            )
        })

        const input = screen.queryByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('id', key)
        expect(input).toHaveValue(formatPhoneNumberIntl(initialValue))

        if (!input) return

        const countrySelect = queryByName(renderResult, 'phone_numberCountry')
        expect(countrySelect).toBeInTheDocument()
        expect(countrySelect).toHaveValue(country)

        const newValue = '+12133734253'
        await user.clear(input)
        await user.type(input, newValue)
        expect(input).toHaveValue(formatPhoneNumberIntl(newValue))
        expect(countrySelect).toHaveValue('US')

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                phone_number: expect.objectContaining({
                    value: newValue,
                })
            })
        );

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                phoneNumber: newValue
            })
        )
    })
})