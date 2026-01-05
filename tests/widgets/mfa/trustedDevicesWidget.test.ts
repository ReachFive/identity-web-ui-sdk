import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';

import { Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/contexts/i18n';
import { AppError } from '../../../src/helpers/errors';
import trustedDevicesWidget from '../../../src/widgets/mfa/trustedDevicesWidget';

import type { Config, OnError, OnSuccess } from '../../../src/types';

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
    mfaSmsEnabled: true,
    mfaEmailEnabled: true,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
};
const defaultI18n: I18nMessages = {};

describe('DOM testing', () => {
    const listTrustedDevices = jest.fn<Client['listTrustedDevices']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        onError.mockClear();
        onSuccess.mockClear();
        listTrustedDevices.mockClear();
    });

    const generateComponent = async (
        options: Partial<Parameters<typeof trustedDevicesWidget>[0]>,
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listTrustedDevices,
        };
        const result = await trustedDevicesWidget(
            {
                accessToken: 'azerty',
                onError,
                onSuccess,
                ...options,
            },
            {
                apiClient,
                config: { ...defaultConfig, ...config },
                defaultI18n,
            }
        );
        return await waitFor(async () => render(result));
    };

    describe('trustedDevices', () => {
        test('no trusted device', async () => {
            listTrustedDevices.mockResolvedValue({ trustedDevices: [] });
            await generateComponent({ showRemoveTrustedDevice: true }, defaultConfig);

            expect(screen.queryByText('trustedDevices.empty')).toBeInTheDocument();
        });

        test('has trusted devices', async () => {
            listTrustedDevices.mockResolvedValue({
                trustedDevices: [
                    { id: 'id1', userId: 'userid1', createdAt: '2022-09-21', metadata: {} },
                    { id: 'id2', userId: 'userid2', createdAt: '2022-09-21', metadata: {} },
                    { id: 'id3', userId: 'userid3', createdAt: '2022-09-21', metadata: {} },
                ],
            });
            await generateComponent({ showRemoveTrustedDevice: true }, defaultConfig);

            const trustedDevices = screen.queryAllByTestId('trustedDevice');
            expect(trustedDevices).toHaveLength(3);

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    devices: expect.arrayContaining([
                        expect.objectContaining({
                            id: 'id1',
                            userId: 'userid1',
                            createdAt: '2022-09-21',
                            metadata: {},
                        }),
                        expect.objectContaining({
                            id: 'id2',
                            userId: 'userid2',
                            createdAt: '2022-09-21',
                            metadata: {},
                        }),
                        expect.objectContaining({
                            id: 'id3',
                            userId: 'userid3',
                            createdAt: '2022-09-21',
                            metadata: {},
                        }),
                    ]),
                    name: 'mfa_trusted_device_listed',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('api error', async () => {
            const error: AppError = {
                errorId: '0',
                error: 'unexpected_error',
                errorDescription: 'Unexpected error',
            };
            listTrustedDevices.mockRejectedValue(error);

            await generateComponent({}, defaultConfig);
            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith(error);
        });
    });
});
