/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import radioboxField from '@/components/form/fields/radioboxField';
import { createForm } from '@/components/form/formComponent';
import { I18nMessages } from '@/contexts/i18n';

import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    radiobox: 'Pet',
};

type Model = { check: string };

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup();

        const key = 'radiobox';
        const label = 'radiobox';
        const options = [
            { label: 'cat', value: 'cat' },
            { label: 'dog', value: 'dog' },
        ];

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [radioboxField({ key, label, options })],
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

        options.map(option => {
            const input = screen.queryByLabelText(option.label);
            expect(input).toBeInTheDocument();
            expect(input).not.toBeChecked();
        });

        const choice = options[1];
        const choiceInput = screen.getByLabelText('dog');
        await user.click(choiceInput);

        expect(choiceInput).toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    radiobox: choice.value,
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                radiobox: choice.value,
            })
        );
    });

    test('initially checked', async () => {
        const user = userEvent.setup();

        const key = 'radiobox';
        const label = 'radiobox';
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
            fields: [radioboxField({ key, label, options, defaultValue: defaultOption.value })],
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

        // options.map(option => {
        //     const input = screen.queryByLabelText(i18nResolver(option.label))
        //     expect(input).toBeInTheDocument()
        //     if (option.value === defaultOption.value) {
        //         expect(input).toBeChecked()
        //     } else {
        //         expect(input).not.toBeChecked()
        //     }
        // })

        const choice = options[0];
        const choiceInput = screen.getByLabelText('cat');
        await user.click(choiceInput);

        expect(choiceInput).toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    radiobox: choice.value,
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    radiobox: choice.value,
                })
            )
        );
    });

    test("with ReactNode option's label", async () => {
        const user = userEvent.setup();

        const key = 'radiobox';
        const label = 'radiobox';
        const options = [
            { label: <>Cat</>, value: 'cat' },
            { label: <>Dog</>, value: 'dog' },
        ];

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [radioboxField({ key, label, options })],
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

        options.map(option => {
            const input = screen.queryByDisplayValue(option.value);
            expect(input).toBeInTheDocument();
            expect(input).not.toBeChecked();
        });

        const choice = options[1];
        const choiceInput = screen.getByDisplayValue(choice.value);
        await user.click(choiceInput);

        expect(choiceInput).toBeChecked();

        await waitFor(() =>
            expect(onFieldChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    radiobox: choice.value,
                })
            )
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    radiobox: choice.value,
                })
            )
        );
    });
});
