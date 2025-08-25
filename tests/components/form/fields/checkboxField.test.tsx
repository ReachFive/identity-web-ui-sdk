/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import checkboxField from '@/components/form/fields/checkboxField';
import { createForm } from '@/components/form/formComponent';
import resolveI18n, { I18nMessages } from '@/core/i18n';

import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    checkbox: 'Check?',
};

const i18nResolver = resolveI18n(defaultI18n);

type Model = { check: string };

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup();

        const key = 'checkbox';
        const label = 'checkbox';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [checkboxField({ key, label })],
        });

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            // @ts-expect-error partial Client
            {},
            defaultConfig,
            defaultI18n
        );

        const checkbox = screen.getByLabelText(i18nResolver(label));
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);

        expect(checkbox).toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    checkbox: true,
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    checkbox: true,
                })
            )
        );
    });

    test('initially checked', async () => {
        const user = userEvent.setup();

        const key = 'checkbox';
        const label = 'checkbox';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [checkboxField({ key, label, defaultValue: true })],
        });

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            // @ts-expect-error partial Client
            {},
            defaultConfig,
            defaultI18n
        );

        const checkbox = screen.getByLabelText(i18nResolver(label));
        expect(checkbox).toBeChecked();

        await user.click(checkbox);

        expect(checkbox).not.toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    checkbox: false,
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    checkbox: false,
                })
            )
        );
    });
});
