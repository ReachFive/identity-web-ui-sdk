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
import PasswordlessWidget from '@/widgets/passwordless/passwordlessWidget';

import { componentGenerator, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {};

    const generateSnapshot = snapshotGenerator(PasswordlessWidget, apiClient, defaultI18n);

    describe('passwordless', () => {
        test('default', generateSnapshot({}));

        test('no intro', generateSnapshot({ showIntro: false }));

        test('sms', generateSnapshot({ authType: 'sms' }));
    });
});

describe('DOM testing', () => {
    const startPasswordless = jest.fn<Client['startPasswordless']>();
    const verifyPasswordless = jest.fn<Client['verifyPasswordless']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        startPasswordless.mockClear();
        verifyPasswordless.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        startPasswordless,
        verifyPasswordless,
    };

    const generateComponent = componentGenerator(PasswordlessWidget, apiClient, defaultI18n);

    describe('passwordless', () => {
        test('default', async () => {
            const user = userEvent.setup();

            startPasswordless.mockResolvedValue({});

            await generateComponent({ onError, onSuccess });

            // Intro
            expect(screen.getByText('passwordless.intro')).toBeInTheDocument();

            // Label
            expect(screen.getByLabelText('email')).toBeInTheDocument();

            // Input email
            const emailInput = screen.getByTestId('email');
            expect(emailInput).toBeInTheDocument();

            // Form button
            const submitBtn = screen.getByTestId('submit');
            expect(submitBtn).toHaveTextContent('send');

            await user.type(emailInput, 'alice@reach5.co');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalledWith(
                expect.objectContaining({
                    authType: 'magic_link',
                    email: 'alice@reach5.co',
                }),
                undefined // auth
            );

            expect(screen.getByText('passwordless.emailSent')).toBeInTheDocument();

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    authType: 'magic_link',
                    name: 'otp_sent',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('no intro', async () => {
            await generateComponent({ showIntro: false, onError, onSuccess });

            // Intro
            expect(screen.queryByText('passwordless.intro')).not.toBeInTheDocument();
            expect(screen.queryByText('passwordless.sms.intro')).not.toBeInTheDocument();
        });

        test('by phone number', async () => {
            const user = userEvent.setup();

            startPasswordless.mockResolvedValue({
                challengeId: 'azerty',
            });

            verifyPasswordless.mockResolvedValue({
                accessToken: 'abcd1234',
            });

            await generateComponent({ authType: 'sms', onError, onSuccess });

            // Intro
            expect(screen.getByText('passwordless.sms.intro')).toBeInTheDocument();

            // Label
            expect(screen.getByLabelText('phoneNumber')).toBeInTheDocument();

            // Input phone number
            const phoneNumberInput = screen.getByTestId('phone_number');
            expect(phoneNumberInput).toBeInTheDocument();

            // Form button
            const submitBtn = screen.getByTestId('submit');
            expect(submitBtn).toHaveTextContent('send');

            await user.type(phoneNumberInput, '+33612345678');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalledWith(
                expect.objectContaining({
                    authType: 'sms',
                    phoneNumber: '+33612345678',
                }),
                undefined // auth
            );

            const verificationCodeInput = screen.getByTestId('verification_code');
            expect(verificationCodeInput).toBeInTheDocument();

            const submitCodeBtn = screen.getByTestId('submit');
            expect(submitCodeBtn).toHaveTextContent('send');

            await user.type(verificationCodeInput, '123456');
            await user.click(submitCodeBtn);

            expect(verifyPasswordless).toBeCalledWith(
                expect.objectContaining({
                    authType: 'sms',
                    phoneNumber: '+33612345678',
                    verificationCode: '123456',
                })
            );

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    authResult: expect.objectContaining({ accessToken: 'abcd1234' }),
                    name: 'login',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('api failure', async () => {
            const user = userEvent.setup();

            startPasswordless.mockRejectedValue('Unexpected error');

            await generateComponent({ onError, onSuccess });

            const emailInput = screen.getByTestId('email');
            const submitBtn = screen.getByTestId('submit');

            await user.type(emailInput, 'alice@reach5.co');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });

        test('api failure on code verification', async () => {
            const user = userEvent.setup();

            startPasswordless.mockResolvedValue({
                challengeId: 'azerty',
            });

            verifyPasswordless.mockRejectedValue('Unexpected error');

            await generateComponent({ authType: 'sms', onSuccess, onError });

            const phoneNumberInput = screen.getByTestId('phone_number');
            const submitBtn = screen.getByTestId('submit');

            await user.type(phoneNumberInput, '+33612345678');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalled();

            const verificationCodeInput = screen.getByTestId('verification_code');
            const submitCodeBtn = screen.getByTestId('submit');

            await user.type(verificationCodeInput, '123456');
            await user.click(submitCodeBtn);

            expect(verifyPasswordless).toBeCalled();

            expect(onSuccess).not.toBeCalledWith(expect.objectContaining({ name: 'login' }));
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
