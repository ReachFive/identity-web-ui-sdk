/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { getAllByRole, screen, waitFor } from '@testing-library/react';
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

import dateField from '@/components/form/fields/dateField';
import { createForm } from '@/components/form/formComponent';
import { I18nMessages } from '@/contexts/i18n';
import { Validator } from '@/core/validation';

import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    date: 'Date',
    year: 'Année',
    month: 'Mois',
    day: 'Jour',
};

type Model = { date: string };

describe('DOM testing', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {};

    test('default settings', async () => {
        const user = userEvent.setup({
            advanceTimers: (delay: number) => jest.advanceTimersByTime(delay),
        });

        const key = 'date';
        const label = 'date';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [dateField({ key, label }, defaultConfig)],
        });

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            apiClient,
            defaultConfig,
            defaultI18n
        );

        jest.useFakeTimers();

        const labelTag = screen.queryByText('Date');
        expect(labelTag).toBeInTheDocument();

        const yearInput = screen.getByRole('combobox', { name: defaultI18n.year as string });
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

        const monthInput = screen.getByRole('combobox', { name: defaultI18n.month as string });
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

        const dayInput = screen.getByRole('combobox', { name: defaultI18n.day as string });
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

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        // month options should be updated
        const decemberExpectedDaysOptions = [
            '',
            ...[...Array(getDaysInMonth(new Date(year, month, 1))).keys()].map(value =>
                String(value + 1)
            ),
        ];
        await waitFor(() =>
            expect(
                getAllByRole(dayInput, 'option').map(option => option.getAttribute('value'))
            ).toEqual(expect.arrayContaining(decemberExpectedDaysOptions))
        );

        const day = 31;
        await user.selectOptions(dayInput, String(day));

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    date: formatISO(new Date(year, month, day), { representation: 'date' }),
                })
            )
        );

        const submitBtn = await screen.findByTestId('submit');
        await user.click(submitBtn);

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    date: formatISO(new Date(year, month, day), { representation: 'date' }), // value is formatted in handler data
                })
            )
        );

        jest.useRealTimers();
    });

    test('with custom validation', async () => {
        const user = userEvent.setup({
            advanceTimers: (delay: number) => jest.advanceTimersByTimeAsync(delay),
        });

        const key = 'date';
        const label = 'date';

        const validator = new Validator<Date, unknown>({
            rule: value => {
                return differenceInYears(new Date(), value) >= 18;
            },
            hint: 'age.minimun',
        });

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [dateField({ key, label, validator }, defaultConfig)],
        });

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            apiClient,
            defaultConfig,
            defaultI18n
        );

        jest.useFakeTimers();

        const yearInput = screen.getByRole('combobox', { name: defaultI18n.year as string });
        const monthInput = screen.getByRole('combobox', { name: defaultI18n.month as string });
        const dayInput = screen.getByRole('combobox', { name: defaultI18n.day as string });

        const tenYearsOld = subYears(new Date(), 10);
        await user.selectOptions(yearInput, String(getYear(tenYearsOld)));
        await user.selectOptions(monthInput, String(getMonth(tenYearsOld)));
        await user.selectOptions(dayInput, String(getDate(tenYearsOld)));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    date: formatISO(startOfDay(tenYearsOld), { representation: 'date' }),
                })
            )
        );

        const formError = await screen.findByTestId('form-error');
        expect(formError).toBeInTheDocument();
        expect(formError).toHaveTextContent('validation.age.minimun');

        onFieldChange.mockClear();

        const eighteenYearsOld = subYears(new Date(), 18);
        await user.selectOptions(yearInput, String(getYear(eighteenYearsOld)));

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    date: formatISO(startOfDay(eighteenYearsOld), { representation: 'date' }),
                })
            )
        );

        expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();

        jest.useRealTimers();
    });
});
