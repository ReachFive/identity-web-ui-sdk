/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import simplePasswordField from '@/components/form/fields/simplePasswordField';
import { createForm } from '@/components/form/formComponent';
import { I18nMessages } from '@/contexts/i18n';

import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    password: 'password',
};

type Model = { password: string };

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup();

        const key = 'password';
        const label = 'password';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [simplePasswordField({ key, label })],
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

        const input = screen.getByLabelText('password');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveAttribute('type', 'password');
        expect(input).toHaveAttribute('placeholder', 'password');
        expect(input).toHaveValue('');

        expect(screen.queryByTestId('show-password-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument();

        const newValue = 'azerty';
        await user.clear(input);
        await user.type(input, newValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                password: newValue,
            })
        );

        expect(screen.queryByTestId('show-password-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument();

        const submitBtn = screen.getByRole('button');
        await user.click(submitBtn);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        await waitFor(() =>
            expect(onSubmit).toBeCalledWith(
                expect.objectContaining({
                    password: newValue,
                })
            )
        );
    });

    test('custom type, placeholder and default value', async () => {
        const key = 'password';
        const label = 'password';
        const placeholder = 'password placeholder';
        const defaultValue = 'my value';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [simplePasswordField({ key, label, placeholder, defaultValue })],
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

        const input = screen.queryByLabelText('password');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', key);
        expect(input).toHaveAttribute('placeholder', placeholder);
        expect(input).toHaveValue(defaultValue);
    });

    test('with canShowPassword = true', async () => {
        const user = userEvent.setup();

        const key = 'password';
        const label = 'password';

        const onFieldChange = jest.fn();
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) =>
            Promise.resolve(data)
        );

        const Form = createForm<Model>({
            fields: [simplePasswordField({ key, label, canShowPassword: true })],
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

        const input = screen.getByLabelText('password');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'password');

        expect(screen.getByTestId('show-password-btn')).toBeInTheDocument();
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument();

        const newValue = 'azerty';
        await user.clear(input);
        await user.type(input, newValue);

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                password: newValue,
            })
        );

        expect(screen.getByTestId('show-password-btn')).toBeInTheDocument();
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument();

        await user.click(screen.queryByTestId('show-password-btn')!);

        expect(input).toHaveAttribute('type', 'text');
        expect(screen.queryByTestId('show-password-btn')).not.toBeInTheDocument();
        expect(screen.getByTestId('hide-password-btn')).toBeInTheDocument();

        await user.click(screen.queryByTestId('hide-password-btn')!);

        expect(input).toHaveAttribute('type', 'password');
        expect(screen.getByTestId('show-password-btn')).toBeInTheDocument();
        expect(screen.queryByTestId('hide-password-btn')).not.toBeInTheDocument();
    });
});
