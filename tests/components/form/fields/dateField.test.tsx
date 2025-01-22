/**
 * @jest-environment jsdom
 */

import React from 'react'
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';
import { DateTime, Duration } from 'luxon';

import type { Config } from '../../../../src/types';

import { createForm } from '../../../../src/components/form/formComponent'
import dateField from '../../../../src/components/form/fields/dateField'
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { Validator } from '../../../../src/core/validation';
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
    date: 'Date',
    year: 'Année',
    month: 'Mois',
    day: 'Jour',
}

const i18nResolver = resolveI18n(defaultI18n)

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
                <WidgetContext
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
        const expectedMonthsOptions = ['', ...[...Array(12).keys()].map(value => String(value + 1))]
        expect(getAllByRole(monthInput, 'option').map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(expectedMonthsOptions)
        )
        
        const dayInput = screen.getByTestId('date.day')
        expect(dayInput).toBeInTheDocument()
        expect(dayInput).toHaveAttribute('aria-label', i18nResolver('day'))
        expect(dayInput).not.toHaveValue()
        // default is based on current date
        const expectedDaysOptions = ['', ...[...Array(DateTime.now().month).keys()].map(value => String(value + 1))]
        expect(getAllByRole(dayInput, 'option').map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(expectedDaysOptions)
        )

        // fields should be ordered according to locale ([day|month|year] with "fr" locale)
        expect(yearInput.compareDocumentPosition(monthInput)).toEqual(Node.DOCUMENT_POSITION_PRECEDING)
        expect(monthInput.compareDocumentPosition(dayInput)).toEqual(Node.DOCUMENT_POSITION_PRECEDING)

        const year = 2024
        // await user.clear(yearInput)
        await user.type(yearInput, String(year))

        const month = 12
        // await user.clear(monthInput)
        await user.selectOptions(monthInput, String(month))

        // month options should be updated
        const decemberExpectedDaysOptions = ['', ...[...Array(month).keys()].map(value => String(value + 1))]
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
                    value: DateTime.fromObject({ year, month, day }),
                })
            })
        ))

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                date: DateTime.fromObject({ year, month, day }).toISODate() // value is formatted in handler data
            })
        )

    })

    test('with custom validation', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync })

        const key = 'date'
        const label = 'date'

        const validator = new Validator<DateTime>({
            rule: (value) => value.diffNow('years').as('years') <= -18,
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
                <WidgetContext
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

        const yearInput = screen.getByTestId('date.year')
        const monthInput = screen.getByTestId('date.month')
        const dayInput = screen.getByTestId('date.day')

        const tenYearsOld = DateTime.now().minus(Duration.fromObject({ year: 10 }))
        await user.clear(yearInput)
        await user.type(yearInput, String(tenYearsOld.year))

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await user.selectOptions(monthInput, String(tenYearsOld.month))
        await user.selectOptions(dayInput, String(tenYearsOld.day))

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                date: expect.objectContaining({
                    isDirty: true,
                    value: tenYearsOld.startOf('day'),
                    validation: {
                        valid: false,
                        error: "validation.age.minimun"
                    }
                })
            })
        ))

        onFieldChange.mockClear()

        const formError = await screen.findByTestId('form-error')
        expect(formError).toBeInTheDocument()
        expect(formError).toHaveTextContent('validation.age.minimun')

        const eighteenYearsOld = DateTime.now().minus(Duration.fromObject({ year: 18 }))
        await user.clear(yearInput)
        await user.type(yearInput, String(eighteenYearsOld.year))
        
        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                date: expect.objectContaining({
                    isDirty: true,
                    value: eighteenYearsOld.startOf('day'),
                })
            })
        ))

        await waitFor(() => {
            const formError = screen.queryByTestId('form-error')
            expect(formError).not.toBeInTheDocument()
        })
    })
})
