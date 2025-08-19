/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import selectField from '@/components/form/fields/selectField';
import { createForm } from '@/components/form/formComponent';
import resolveI18n, { I18nMessages } from '@/core/i18n';

import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    selectbox: 'Pet',
};

const i18nResolver = resolveI18n(defaultI18n);

type Model = { check: string };

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup();

        const key = 'selectbox';
        const label = 'selectbox';
        const options = [
            { label: 'cat', value: 'cat' },
            { label: 'dog', value: 'dog' },
        ];

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [selectField({ key, label, values: options })],
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

        const selectbox = screen.getByLabelText(i18nResolver(label));

        expect(selectbox).toHaveValue('');
        options.forEach(option => {
            expect(
                screen.getByRole<HTMLOptionElement>('option', { name: option.value }).selected
            ).toBe(false);
        });

        const choice = options[1];
        await user.selectOptions(selectbox, choice.value);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                selectbox: choice.value,
            })
        );

        expect(selectbox).toHaveValue(choice.value);
        expect(screen.getByRole<HTMLOptionElement>('option', { name: choice.value }).selected).toBe(
            true
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    selectbox: choice.value,
                })
            )
        );
    });

    test('initially selected value', async () => {
        const user = userEvent.setup();

        const key = 'selectbox';
        const label = 'selectbox';
        const options = [
            { label: 'cat', value: 'cat' },
            { label: 'dog', value: 'dog' },
        ];
        const defaultOption = options[1];

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [
                selectField({ key, label, values: options, defaultValue: defaultOption.value }),
            ],
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

        const selectbox = screen.getByLabelText(i18nResolver(label));

        expect(selectbox).toHaveValue(defaultOption.value);
        expect(
            screen.getByRole<HTMLOptionElement>('option', { name: defaultOption.value }).selected
        ).toBe(true);

        const choice = options[1];
        await user.selectOptions(selectbox, choice.value);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                selectbox: choice.value,
            })
        );

        expect(selectbox).toHaveValue(choice.value);
        expect(screen.getByRole<HTMLOptionElement>('option', { name: choice.value }).selected).toBe(
            true
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    selectbox: choice.value,
                })
            )
        );
    });
});
