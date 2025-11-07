/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/contexts/i18n';
import type { Config, OnError, OnSuccess } from '../../../src/types';

import phoneNumberEditorWidget from '../../../src/widgets/phoneNumberEditor/phoneNumberEditorWidget';

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

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    const generateSnapshot =
        (
            options: Partial<Parameters<typeof phoneNumberEditorWidget>[0]> = {},
            config: Partial<Config> = {}
        ) =>
        async () => {
            // @ts-expect-error partial Client
            const apiClient: Client = {
                updatePhoneNumber: jest.fn<Client['updatePhoneNumber']>().mockResolvedValue(),
            };

            const widget = await phoneNumberEditorWidget(
                { ...options, accessToken: 'azerty' },
                { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
            );

            await waitFor(async () => {
                const { container } = await render(widget);
                expect(container).toMatchSnapshot();
            });
        };

    describe('phone number editor', () => {
        test('basic', generateSnapshot({}));
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

    const generateComponent = async (
        options: Partial<Parameters<typeof phoneNumberEditorWidget>[0]> = {},
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            updatePhoneNumber,
            verifyPhoneNumber,
        };

        const result = await phoneNumberEditorWidget(
            { onError, onSuccess, ...options, accessToken: 'azerty' },
            { config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        return waitFor(async () => {
            return render(result);
        });
    };

    describe('phoneNumberEditor', () => {
        test('default', async () => {
            const user = userEvent.setup();

            updatePhoneNumber.mockResolvedValue();
            verifyPhoneNumber.mockResolvedValue();

            await generateComponent({});

            const phoneNumberInput = screen.getByLabelText('phoneNumber');
            expect(phoneNumberInput).toBeInTheDocument();

            await userEvent.clear(phoneNumberInput);
            await userEvent.type(phoneNumberInput, '+33123456789');

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

            await userEvent.clear(verificationCodeInput);
            await userEvent.type(verificationCodeInput, '123456');

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

            await generateComponent({});

            const phoneNumberInput = screen.getByLabelText('phoneNumber');
            expect(phoneNumberInput).toBeInTheDocument();

            await userEvent.clear(phoneNumberInput);
            await userEvent.type(phoneNumberInput, '+33123456789');

            const submitBtn = screen.getByRole('button', { name: 'send' });

            await user.click(submitBtn);

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });

        test('api code verificationfailed', async () => {
            const user = userEvent.setup();

            updatePhoneNumber.mockResolvedValue();
            verifyPhoneNumber.mockRejectedValue('Unexpected error');

            await generateComponent({});

            const phoneNumberInput = screen.getByLabelText('phoneNumber');
            expect(phoneNumberInput).toBeInTheDocument();

            await userEvent.clear(phoneNumberInput);
            await userEvent.type(phoneNumberInput, '+33123456789');

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

            await waitFor(async () => {
                expect(onSuccess).toBeCalledWith(
                    expect.objectContaining({ name: 'phone_number_updated' })
                );
                expect(onError).toBeCalled();
            });
        });
    });
});
