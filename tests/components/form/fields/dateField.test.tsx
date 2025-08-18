/**
 * @jest-environment jest-fixed-jsdom
 */

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
import React from 'react';

import dateField from '../../../../src/components/form/fields/dateField';
import { createForm } from '../../../../src/components/form/formComponent';
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { Validator } from '../../../../src/core/validation';
import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    date: 'Date',
    year: 'Année',
    month: 'Mois',
    day: 'Jour',
};

const i18nResolver = resolveI18n(defaultI18n);

type Model = { date: string };

describe('DOM testing', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {};

    test('default settings', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

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

        const labelTag = screen.queryByText(i18nResolver(label));
        expect(labelTag).toBeInTheDocument();

        const yearInput = screen.getByRole('spinbutton', { name: defaultI18n.year });
        expect(yearInput).toBeInTheDocument();
        expect(yearInput).toHaveAttribute('type', 'number');
        expect(yearInput).toHaveAttribute('inputMode', 'numeric');
        expect(yearInput).toHaveAttribute('aria-label', i18nResolver('year'));
        expect(yearInput).toHaveAttribute('placeholder', i18nResolver('year'));
        expect(yearInput).not.toHaveValue();

        const monthInput = screen.getByRole('combobox', { name: defaultI18n.month });
        expect(monthInput).toBeInTheDocument();
        expect(monthInput).toHaveAttribute('aria-label', i18nResolver('month'));
        expect(monthInput).not.toHaveValue();
        const expectedMonthsOptions = ['', ...[...Array(12).keys()].map(value => String(value))];
        const options = getAllByRole(monthInput, 'option');
        expect(options.map(option => option.getAttribute('value'))).toEqual(
            expect.arrayContaining(expectedMonthsOptions)
        );
        const expectedMonthsOptionsIntl = [
            i18nResolver('month'),
            ...[...Array(12).keys()].map(value =>
                new Intl.DateTimeFormat(defaultConfig.language, { month: 'long' }).format(
                    new Date(2025, Number(value), 1)
                )
            ),
        ];
        expect(options.map(option => option.textContent)).toEqual(
            expect.arrayContaining(expectedMonthsOptionsIntl)
        );

        const dayInput = screen.getByRole('combobox', { name: defaultI18n.day });
        expect(dayInput).toBeInTheDocument();
        expect(dayInput).toHaveAttribute('aria-label', i18nResolver('day'));
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
        const month = 11; // December
        const day = 31;

        // await act(async () => {
        await user.clear(yearInput);
        await user.type(yearInput, String(year));

        // await user.clear(monthInput)
        await user.selectOptions(monthInput, String(month));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();
        // })

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

        // await user.clear(dayInput)
        await user.selectOptions(dayInput, String(day));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    date: formatISO(new Date(year, month, day), { representation: 'date' }),
                })
            )
        );

        await waitFor(async () => {
            const submitBtn = await screen.findByTestId('submit');
            await user.click(submitBtn);
        });

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
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTimeAsync });

        const key = 'date';
        const label = 'date';

        const validator = new Validator<Date>({
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

        const yearInput = screen.getByRole('spinbutton', { name: defaultI18n.year });
        const monthInput = screen.getByRole('combobox', { name: defaultI18n.month });
        const dayInput = screen.getByRole('combobox', { name: defaultI18n.day });

        const tenYearsOld = subYears(new Date(), 10);

        // await act(async () => {
        await user.clear(yearInput);
        await user.type(yearInput, String(getYear(tenYearsOld)));

        await user.selectOptions(monthInput, String(getMonth(tenYearsOld)));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await user.selectOptions(dayInput, String(getDate(tenYearsOld)));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();
        // })

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

        await waitFor(async () => {
            const yearInput = await screen.findByTestId<HTMLInputElement>('date.year');
            expect(yearInput).toBeInTheDocument();
        });

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await user.clear(yearInput);
        await user.type(yearInput, String(getYear(eighteenYearsOld)));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

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
