/**
 * @jest-environment jest-fixed-jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatISO, getDate, getMonth, getYear, startOfDay, subYears } from 'date-fns';
import 'jest-styled-components';
import React from 'react';

import birthdayField from '../../../../src/components/form/fields/birthdayField';
import { createForm } from '../../../../src/components/form/formComponent';
import { I18nMessages } from '../../../../src/core/i18n';
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
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        const key = 'birthday';
        const label = 'birthday';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [birthdayField({ key, label }, defaultConfig)],
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

        const fiveYearsOld = subYears(new Date(), 5);

        await user.clear(yearInput);
        await user.type(yearInput, String(getYear(fiveYearsOld)));

        await user.selectOptions(monthInput, String(getMonth(fiveYearsOld)));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await user.selectOptions(dayInput, String(getDate(fiveYearsOld)));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    birthday: formatISO(startOfDay(fiveYearsOld), { representation: 'date' }),
                })
            )
        );

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        const eighteenYearsOld = subYears(new Date(), 18);
        await user.clear(yearInput);
        await user.type(yearInput, String(getYear(eighteenYearsOld)));

        // Fast-forward until all timers have been executed (handle year debounced value)
        await jest.runOnlyPendingTimersAsync();

        await user.selectOptions(monthInput, String(getMonth(eighteenYearsOld)));
        await user.selectOptions(dayInput, String(getDate(eighteenYearsOld)));

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    birthday: formatISO(startOfDay(eighteenYearsOld), { representation: 'date' }),
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    birthday: formatISO(eighteenYearsOld, { representation: 'date' }), // value is formatted in handler data
                })
            )
        );

        jest.useRealTimers();
    });
});
