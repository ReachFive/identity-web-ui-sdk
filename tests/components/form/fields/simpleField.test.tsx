/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { simpleField } from '@/components/form/fields/simpleField';
import { createForm } from '@/components/form/formComponent';
import resolveI18n, { I18nMessages } from '@/core/i18n';
import { Validator } from '@/core/validation';

import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    simple: 'simple',
};

const i18nResolver = resolveI18n(defaultI18n);

type Model = { simple: string };

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup();

        const key = 'simple';
        const label = 'simple';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [simpleField({ type: 'text', key, label })],
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

        const input = screen.getByLabelText(i18nResolver(label));
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveValue('');

        const newValue = 'azerty';
        await user.clear(input);
        await user.type(input, newValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                simple: newValue,
            })
        );

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    simple: newValue,
                })
            )
        );
    });

    test('custom type, placeholder and default value', async () => {
        const key = 'simple';
        const label = 'simple';
        const type = 'email';
        const placeholder = 'simple placeholder';
        const defaultValue = 'my value';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [simpleField({ key, label, type, placeholder, defaultValue })],
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

        const input = screen.queryByLabelText(i18nResolver(label));
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveAttribute('type', type);
        expect(input).toHaveAttribute('placeholder', placeholder);
        expect(input).toHaveValue(defaultValue);
    });

    test('extends validators', async () => {
        const matchValidator = (matchText: string) =>
            new Validator<string>({
                rule: value => value === matchText,
                hint: 'value.match',
            });

        const user = userEvent.setup();

        const key = 'simple';
        const label = 'simple';
        const matchPassword = 'match value';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [
                simpleField({
                    type: 'text',
                    key,
                    label,
                    validator: matchValidator(matchPassword),
                }),
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

        const input = screen.getByLabelText(i18nResolver(label));
        expect(input).toHaveAttribute('placeholder', i18nResolver(label));
        expect(input).toBeInTheDocument();

        const invalidValue = 'ILoveApples';
        await user.clear(input);
        await user.type(input, invalidValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                simple: invalidValue,
            })
        );
    });
});
