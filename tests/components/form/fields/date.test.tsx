/**
 * @jest-environment jsdom
 */
import React from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatISO, getDaysInMonth, getYear } from 'date-fns';
import 'jest-styled-components';

import { DateField } from '../../../../src/components/form/field2/date';
import { type I18nMessages } from '../../../../src/contexts/i18n';
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
        customIdentifier: true,
    },
    isImplicitFlowForbidden: false,
};

const defaultI18n: I18nMessages = {
    date: 'Date',
    year: 'Année',
    month: 'Mois',
    day: 'Jour',
};

describe('DOM testing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('default settings — triggers render and locale ordering', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <DateField label="date" onChange={onChange} showLabels={true} />
            </WidgetContext>
        );

        const labelTag = screen.queryByText('Date');
        expect(labelTag).toBeInTheDocument();

        const yearTrigger = screen.getByRole('combobox', { name: 'Année' });
        expect(yearTrigger).toBeInTheDocument();

        const monthTrigger = screen.getByRole('combobox', { name: 'Mois' });
        expect(monthTrigger).toBeInTheDocument();

        const dayTrigger = screen.getByRole('combobox', { name: 'Jour' });
        expect(dayTrigger).toBeInTheDocument();

        // Fields should be ordered according to locale (fr: day < month < year)
        expect(yearTrigger.compareDocumentPosition(monthTrigger)).toEqual(
            Node.DOCUMENT_POSITION_PRECEDING
        );
        expect(monthTrigger.compareDocumentPosition(dayTrigger)).toEqual(
            Node.DOCUMENT_POSITION_PRECEDING
        );

        // Select a year
        const year = 2024;
        await user.click(yearTrigger);
        await user.click(screen.getByRole('option', { name: String(year) }));

        // Select a month (December = index 11)
        const month = 11;
        await user.click(monthTrigger);
        // December is the 12th month name in French
        const decemberLabel = new Intl.DateTimeFormat('fr', { month: 'long' }).format(
            new Date(2000, 11, 1)
        );
        await user.click(screen.getByRole('option', { name: decemberLabel }));

        // Verify day options for December 2024 (31 days)
        await user.click(dayTrigger);
        const expectedDaysCount = getDaysInMonth(new Date(year, month));
        const dayOptions = screen.getAllByRole('option');
        expect(dayOptions.length).toBe(expectedDaysCount);

        // Select day 31
        const day = 31;
        await user.click(screen.getByRole('option', { name: String(day) }));

        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith(
                formatISO(new Date(year, month, day), { representation: 'date' })
            )
        );
    });

    test('onChange fires with ISO string when all parts selected', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <DateField label="date" onChange={onChange} showLabels={true} />
            </WidgetContext>
        );

        const currentYear = getYear(new Date());
        const yearTrigger = screen.getByRole('combobox', { name: 'Année' });
        const monthTrigger = screen.getByRole('combobox', { name: 'Mois' });
        const dayTrigger = screen.getByRole('combobox', { name: 'Jour' });

        await user.click(yearTrigger);
        await user.click(screen.getByRole('option', { name: String(currentYear) }));

        const januaryLabel = new Intl.DateTimeFormat('fr', { month: 'long' }).format(
            new Date(2000, 0, 1)
        );
        await user.click(monthTrigger);
        await user.click(screen.getByRole('option', { name: januaryLabel }));

        await user.click(dayTrigger);
        await user.click(screen.getByRole('option', { name: '15' }));

        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith(
                formatISO(new Date(currentYear, 0, 15), { representation: 'date' })
            )
        );
    });

    test('day options update when month changes', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        const onChange = jest.fn();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <DateField label="date" onChange={onChange} showLabels={true} />
            </WidgetContext>
        );

        const yearTrigger = screen.getByRole('combobox', { name: 'Année' });
        const monthTrigger = screen.getByRole('combobox', { name: 'Mois' });
        const dayTrigger = screen.getByRole('combobox', { name: 'Jour' });

        // Select year 2024
        await user.click(yearTrigger);
        await user.click(screen.getByRole('option', { name: '2024' }));

        // Select February (month index 1 = February)
        const februaryLabel = new Intl.DateTimeFormat('fr', { month: 'long' }).format(
            new Date(2000, 1, 1)
        );
        await user.click(monthTrigger);
        await user.click(screen.getByRole('option', { name: februaryLabel }));

        // Open day picker and count options — 2024 is a leap year (29 days in February)
        await user.click(dayTrigger);
        const dayOptions = screen.getAllByRole('option');
        expect(dayOptions.length).toBe(getDaysInMonth(new Date(2024, 1)));
    });
});
