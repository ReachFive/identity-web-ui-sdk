/**
 * @jest-environment jest-fixed-jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '@/core/i18n';
import { OnError, OnSuccess } from '@/types';
import EmailEditorWidget from '@/widgets/emailEditor/emailEditorWidget';

import { componentGenerator, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {
        updateEmail: jest.fn<Client['updateEmail']>().mockResolvedValue(),
    };

    const generateSnapshot = snapshotGenerator(EmailEditorWidget, apiClient, defaultI18n);

    describe('email editor', () => {
        test('basic', generateSnapshot({ accessToken: 'azerty' }));
    });
});

describe('DOM testing', () => {
    const updateEmail = jest.fn<Client['updateEmail']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        updateEmail.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        updateEmail,
    };

    const generateComponent = componentGenerator(EmailEditorWidget, apiClient, defaultI18n);

    describe('emailEditor', () => {
        test('default', async () => {
            const user = userEvent.setup();

            updateEmail.mockResolvedValue();

            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            const emailInput = screen.getByLabelText('email');
            expect(emailInput).toBeInTheDocument();

            await userEvent.clear(emailInput);
            await userEvent.type(emailInput, 'alice@reach5.co');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(updateEmail).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    email: 'alice@reach5.co',
                })
            );

            expect(onSuccess).toBeCalledWith(expect.objectContaining({ name: 'email_updated' }));
            expect(onError).not.toBeCalled();
        });

        test('api update email failed', async () => {
            const user = userEvent.setup();

            updateEmail.mockRejectedValue('Unexpected error');

            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            const emailInput = screen.getByLabelText('email');
            expect(emailInput).toBeInTheDocument();

            await userEvent.clear(emailInput);
            await userEvent.type(emailInput, 'alice@reach5.co');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
