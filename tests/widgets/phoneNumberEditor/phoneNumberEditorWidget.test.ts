/**
 * @jest-environment jest-fixed-jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '@/contexts/i18n';
import { OnError, OnSuccess } from '@/types';
import PhoneNumberEditorWidget from '@/widgets/phoneNumberEditor/phoneNumberEditorWidget';

import { componentGenerator, defaultConfig, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

const customConfig = {
    ...defaultConfig,
    countryCode: 'FR',
};

describe('Snapshot', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {
        updatePhoneNumber: jest.fn<Client['updatePhoneNumber']>().mockResolvedValue(),
    };

    const generateSnapshot = snapshotGenerator(PhoneNumberEditorWidget, apiClient, defaultI18n);

    describe('phone number editor', () => {
        test('basic', generateSnapshot({ accessToken: 'azerty' }, customConfig));
    });
});

describe('DOM testing', () => {
    const updatePhoneNumber = jest.fn<Client['updatePhoneNumber']>();
    const verifyPhoneNumber = jest.fn<Client['verifyPhoneNumber']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        updatePhoneNumber.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        updatePhoneNumber,
        verifyPhoneNumber,
    };

    const generateComponent = componentGenerator(PhoneNumberEditorWidget, apiClient, defaultI18n);

    describe('phoneNumberEditor', () => {
        test('default', async () => {
            const user = userEvent.setup();

            updatePhoneNumber.mockResolvedValue();
            verifyPhoneNumber.mockResolvedValue();

            await generateComponent({ accessToken: 'azerty', onError, onSuccess }, customConfig);

            const phoneNumberInput = screen.getByLabelText('phoneNumber');
            expect(phoneNumberInput).toBeInTheDocument();

            await userEvent.clear(phoneNumberInput);
            await userEvent.type(phoneNumberInput, '0123456789');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(updatePhoneNumber).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    phoneNumber: '+33123456789',
                })
            );

            const verificationCodeInput = screen.getByLabelText('verificationCode');
            expect(verificationCodeInput).toBeInTheDocument();

            await user.clear(verificationCodeInput);
            await user.type(verificationCodeInput, '123456');

            const submitCodeBtn = screen.getByRole('button', { name: 'send' });
            expect(submitCodeBtn).toBeInTheDocument();

            await user.click(submitCodeBtn);

            expect(verifyPhoneNumber).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    phoneNumber: '+33123456789',
                    verificationCode: '123456',
                })
            );

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    name: 'phone_number_verified',
                    phoneNumber: '+33123456789',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('api update phoneNumber failed', async () => {
            const user = userEvent.setup();

            updatePhoneNumber.mockRejectedValue('Unexpected error');

            await generateComponent({ accessToken: 'azerty', onError, onSuccess }, customConfig);

            const phoneNumberInput = screen.getByLabelText('phoneNumber');
            expect(phoneNumberInput).toBeInTheDocument();

            await user.clear(phoneNumberInput);
            await user.type(phoneNumberInput, '0123456789');

            const submitBtn = screen.getByRole('button', { name: 'send' });

            await user.click(submitBtn);

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });

        test('api code verificationfailed', async () => {
            const user = userEvent.setup();

            updatePhoneNumber.mockResolvedValue();
            verifyPhoneNumber.mockRejectedValue('Unexpected error');

            await generateComponent({ accessToken: 'azerty', onError, onSuccess }, customConfig);

            const phoneNumberInput = screen.getByLabelText('phoneNumber');
            expect(phoneNumberInput).toBeInTheDocument();

            await user.clear(phoneNumberInput);
            await user.type(phoneNumberInput, '0123456789');

            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(updatePhoneNumber).toBeCalled();

            const verificationCodeInput = screen.getByLabelText('verificationCode');
            expect(verificationCodeInput).toBeInTheDocument();

            await userEvent.clear(verificationCodeInput);
            await userEvent.type(verificationCodeInput, '123456');

            const submitCodeBtn = screen.getByRole('button', { name: 'send' });

            await user.click(submitCodeBtn);

            expect(verifyPhoneNumber).toBeCalled();

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({ name: 'phone_number_updated' })
            );
            expect(onError).toBeCalled();
        });
    });
});
