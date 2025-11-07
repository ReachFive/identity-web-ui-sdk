/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatISO, getDate, getMonth, getYear, startOfDay, subYears } from 'date-fns';
import 'jest-styled-components';
import React from 'react';

import type { Config } from '../../../../src/types';

import birthdayField from '../../../../src/components/form/fields/birthdayField';
import { createForm } from '../../../../src/components/form/formComponent';
import { type I18nMessages } from '../../../../src/contexts/i18n';
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
    },
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

        const key = 'birthday';
        const label = 'birthday';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data));

        const Form = createForm<Model>({
            fields: [birthdayField({ key, label }, defaultConfig)],
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

        const yearInput = screen.getByTestId('birthday.year');
        const monthInput = screen.getByTestId('birthday.month');
        const dayInput = screen.getByTestId('birthday.day');

        const fiveYearsOld = subYears(new Date(), 5);
        await user.selectOptions(yearInput, String(getYear(fiveYearsOld)));
        await user.selectOptions(monthInput, String(getMonth(fiveYearsOld)));
        await user.selectOptions(dayInput, String(getDate(fiveYearsOld)));

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    birthday: formatISO(startOfDay(fiveYearsOld), { representation: 'date' }),
                })
            )
        );

        const eighteenYearsOld = subYears(new Date(), 18);
        await user.selectOptions(yearInput, String(getYear(eighteenYearsOld)));
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

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                birthday: formatISO(eighteenYearsOld, { representation: 'date' }), // value is formatted in handler data
            })
        );
    });
});
