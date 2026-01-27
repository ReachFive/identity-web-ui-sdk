/**
 * @jest-environment jsdom
 */
import React from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    differenceInYears,
    formatISO,
    getDate,
    getDaysInMonth,
    getMonth,
    getYear,
    startOfDay,
    subYears,
} from 'date-fns';
import 'jest-styled-components';

import dateField from '../../../../src/components/form/fields/dateField';
import { createForm } from '../../../../src/components/form/formComponent';
import { type I18nMessages } from '../../../../src/contexts/i18n';
import { Validator } from '../../../../src/core/validation';
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
        customIdentifier: true
    },
    isImplicitFlowForbidden: false
};

const defaultI18n: I18nMessages = {
    date: 'Date',
    year: 'Année',
    month: 'Mois',
    day: 'Jour',
};

type Model = { date: string };

describe('DOM testing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('default settings', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        const key = 'date';
        const label = 'date';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [dateField({ key, label }, defaultConfig)],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        onFieldChange={onFieldChange}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );
        });

        const labelTag = screen.queryByText('Date');
        expect(labelTag).toBeInTheDocument();

        const yearInput = screen.getByTestId('date.year');
        expect(yearInput).toBeInTheDocument();
        expect(yearInput).toHaveAttribute('aria-label', 'Année');
        expect(yearInput).not.toHaveValue();
        // Verify year options (current year to current year - 120)
        const currentYear = getYear(new Date());
        const expectedYearsOptions = [
            '',
            ...Array.from({ length: 121 }, (_, i) => String(currentYear - i)),
        ];
        const yearOptions = getAllByRole(yearInput, 'option');
        expect(yearOptions.map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(expectedYearsOptions)
        );
        // Verify placeholder option exists
        const placeholderOption = yearOptions[0];
        expect(placeholderOption).toHaveTextContent('Année');
        expect(placeholderOption).toHaveAttribute('value', '');
        expect(placeholderOption).toBeDisabled();

        const monthInput = screen.getByTestId('date.month');
        expect(monthInput).toBeInTheDocument();
        expect(monthInput).toHaveAttribute('aria-label', 'Mois');
        expect(monthInput).not.toHaveValue();
        const expectedMonthsOptions = ['', ...[...Array(12).keys()].map(value => String(value))];
        const options = getAllByRole(monthInput, 'option');
        expect(options.map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(expectedMonthsOptions)
        );
        const expectedMonthsOptionsIntl = [
            'Mois',
            ...[...Array(12).keys()].map(value =>
                new Intl.DateTimeFormat(defaultConfig.language, { month: 'long' }).format(
                    new Date(2025, Number(value), 1)
                )
            ),
        ];
        expect(options.map(option => option.textContent)).toEqual(
            expect.arrayContaining(expectedMonthsOptionsIntl)
        );

        const dayInput = screen.getByTestId('date.day');
        expect(dayInput).toBeInTheDocument();
        expect(dayInput).toHaveAttribute('aria-label', 'Jour');
        expect(dayInput).not.toHaveValue();
        // default is based on current date
        const expectedDaysOptions = [
            '',
            ...[...Array(getDaysInMonth(new Date())).keys()].map(value => String(value + 1)),
        ];
        expect(
            getAllByRole(dayInput, 'option').map(option => option.getAttribute('value'))
        ).toEqual(expect.arrayContaining(expectedDaysOptions));

        // fields should be ordered according to locale ([day|month|year] with "fr" locale)
        expect(yearInput.compareDocumentPosition(monthInput)).toEqual(
            Node.DOCUMENT_POSITION_PRECEDING
        );
        expect(monthInput.compareDocumentPosition(dayInput)).toEqual(
            Node.DOCUMENT_POSITION_PRECEDING
        );

        const year = 2024;
        await user.selectOptions(yearInput, String(year));

        const month = 11; // December
        await user.selectOptions(monthInput, String(month));

        // month options should be updated
        const decemberExpectedDaysOptions = [
            '',
            ...[...Array(getDaysInMonth(new Date(year, month, 1))).keys()].map(value =>
                String(value + 1)
            ),
        ];
        expect(
            getAllByRole(dayInput, 'option').map(option => option.getAttribute('value'))
        ).toEqual(expect.arrayContaining(decemberExpectedDaysOptions));

        const day = 31;
        await user.selectOptions(dayInput, String(day));

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    date: formatISO(new Date(year, month, day), { representation: 'date' }),
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                date: formatISO(new Date(year, month, day), { representation: 'date' }), // value is formatted in handler data
            })
        );
    });

    test('with custom validation', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });

        const key = 'date';
        const label = 'date';

        const validator = new Validator<Date, unknown>({
            rule: value => {
                return differenceInYears(new Date(), value) >= 18;
            },
            hint: 'age.minimun',
        });

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [dateField({ key, label, validator }, defaultConfig)],
        });

        await waitFor(async () => {
            return render(
                <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                    <Form
                        fieldValidationDebounce={0} // trigger validation instantly
                        onFieldChange={onFieldChange}
                        handler={onSubmit}
                    />
                </WidgetContext>
            );
        });

        const yearInput = screen.getByTestId('date.year');
        const monthInput = screen.getByTestId('date.month');
        const dayInput = screen.getByTestId('date.day');

        const tenYearsOld = subYears(new Date(), 10);
        await user.selectOptions(yearInput, String(getYear(tenYearsOld)));
        await user.selectOptions(monthInput, String(getMonth(tenYearsOld)));
        await user.selectOptions(dayInput, String(getDate(tenYearsOld)));

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    date: formatISO(startOfDay(tenYearsOld), { representation: 'date' }),
                })
            )
        );

        onFieldChange.mockClear();

        const formError = await screen.findByTestId('form-error');
        expect(formError).toBeInTheDocument();
        expect(formError).toHaveTextContent('validation.age.minimun');

        const eighteenYearsOld = subYears(new Date(), 18);
        await user.selectOptions(yearInput, String(getYear(eighteenYearsOld)));

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    date: formatISO(startOfDay(eighteenYearsOld), { representation: 'date' }),
                })
            )
        );

        await waitFor(() => {
            const formError = screen.queryByTestId('form-error');
            expect(formError).not.toBeInTheDocument();
        });
    });
});
