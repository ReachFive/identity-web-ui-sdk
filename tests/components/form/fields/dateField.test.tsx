/**
 * @jest-environment jsdom
 */

import React from 'react'
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';
import { ThemeProvider } from 'styled-components';
import { differenceInYears, formatISO, getDate, getDaysInMonth, getMonth, getYear, startOfDay, subYears } from 'date-fns';

import type { Config } from '../../../../src/types';
import type { Theme } from '../../../../src/types/styled'

import { createForm } from '../../../../src/components/form/formComponent'
import dateField from '../../../../src/components/form/fields/dateField'
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { buildTheme } from '../../../../src/core/theme';
import { I18nProvider } from '../../../../src/contexts/i18n';
import { ConfigProvider } from '../../../../src/contexts/config';
import { Validator } from '../../../../src/core/validation';

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
    date: 'Date',
    year: 'Année',
    month: 'Mois',
    day: 'Jour',
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

type Model = { date: string }

describe('DOM testing', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    })

    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers();
    });

    test('default settings', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

        const key = 'date'
        const label = 'date'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                dateField({ key, label }, defaultConfig)
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

        const labelTag = screen.queryByText(i18nResolver(label))
        expect(labelTag).toBeInTheDocument()

        const yearInput = screen.getByTestId('date.year')
        expect(yearInput).toBeInTheDocument()
        expect(yearInput).toHaveAttribute('type', 'number')
        expect(yearInput).toHaveAttribute('inputMode', 'numeric')
        expect(yearInput).toHaveAttribute('aria-label', i18nResolver('year'))
        expect(yearInput).toHaveAttribute('placeholder', i18nResolver('year'))
        expect(yearInput).not.toHaveValue()
        
        const monthInput = screen.getByTestId('date.month')
        expect(monthInput).toBeInTheDocument()
        expect(monthInput).toHaveAttribute('aria-label', i18nResolver('month'))
        expect(monthInput).not.toHaveValue()
        const expectedMonthsOptions = ['', ...[...Array(12).keys()].map(value => String(value))]
        const options = getAllByRole(monthInput, 'option')
        expect(options.map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(expectedMonthsOptions)
        )
        const expectedMonthsOptionsIntl = [
            i18nResolver('month'),
            ...[...Array(12).keys()].map(value =>
                new Intl.DateTimeFormat(defaultConfig.language, { month: "long" }).format(new Date(2025, Number(value), 1))
            )
        ]
        expect(options.map(option => option.textContent)).toEqual(
            expect.arrayContaining(expectedMonthsOptionsIntl)
        )
        
        const dayInput = screen.getByTestId('date.day')
        expect(dayInput).toBeInTheDocument()
        expect(dayInput).toHaveAttribute('aria-label', i18nResolver('day'))
        expect(dayInput).not.toHaveValue()
        // default is based on current date
        const expectedDaysOptions = ['', ...[...Array(getDaysInMonth(new Date())).keys()].map(value => String(value + 1))]
        expect(getAllByRole(dayInput, 'option').map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(expectedDaysOptions)
        )

        // fields should be ordered according to locale ([day|month|year] with "fr" locale)
        expect(yearInput.compareDocumentPosition(monthInput)).toEqual(Node.DOCUMENT_POSITION_PRECEDING)
        expect(monthInput.compareDocumentPosition(dayInput)).toEqual(Node.DOCUMENT_POSITION_PRECEDING)

        const year = 2024
        // await user.clear(yearInput)
        await user.type(yearInput, String(year))

        const month = 11 // December
        // await user.clear(monthInput)
        await user.selectOptions(monthInput, String(month))

        // month options should be updated
        const decemberExpectedDaysOptions = ['', ...[...Array(getDaysInMonth(new Date(year, month, 1))).keys()].map(value => String(value + 1))]
        expect(getAllByRole(dayInput, 'option').map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(decemberExpectedDaysOptions)
        )

        const day = 31
        // await user.clear(dayInput)
        await user.selectOptions(dayInput, String(day))
        
        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();
    
        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                date: expect.objectContaining({
                    isDirty: true,
                    value: new Date(year, month, day),
                })
            })
        ))

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                date: formatISO(new Date(year, month, day)) // value is formatted in handler data
            })
        )

    })

    test('with custom validation', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync })

        const key = 'date'
        const label = 'date'

        const validator = new Validator<Date>({
            rule: (value) => {
                console.log(value, differenceInYears(new Date(), value))
                return differenceInYears(new Date(), value) >= 18
            },
            hint: 'age.minimun'
        })

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                dateField({ key, label, validator }, defaultConfig)
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

        const yearInput = screen.getByTestId('date.year')
        const monthInput = screen.getByTestId('date.month')
        const dayInput = screen.getByTestId('date.day')

        const tenYearsOld = subYears(new Date(), 10)
        await user.clear(yearInput)
        await user.type(yearInput, String(getYear(tenYearsOld)))

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await user.selectOptions(monthInput, String(getMonth(tenYearsOld)))
        await user.selectOptions(dayInput, String(getDate(tenYearsOld)))

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                date: expect.objectContaining({
                    isDirty: true,
                    value: startOfDay(tenYearsOld),
                    validation: {
                        error: "validation.age.minimun"
                    }
                })
            })
        ))

        onFieldChange.mockClear()

        const formError = await screen.findByTestId('form-error')
        expect(formError).toBeInTheDocument()
        expect(formError).toHaveTextContent('validation.age.minimun')

        const eighteenYearsOld = subYears(new Date(), 18)
        await user.clear(yearInput)
        await user.type(yearInput, String(getYear(eighteenYearsOld)))
        
        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                date: expect.objectContaining({
                    isDirty: true,
                    value: startOfDay(eighteenYearsOld),
                })
            })
        ))

        await waitFor(() => {
            const formError = screen.queryByTestId('form-error')
            expect(formError).not.toBeInTheDocument()
        })
    })
})
