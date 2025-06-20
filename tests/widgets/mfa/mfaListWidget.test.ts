/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import 'jest-styled-components';

import type { Client, MFA } from '@reachfive/identity-core';

import type { I18nMessages } from '../../../src/core/i18n';
import type { Config, OnError, OnSuccess } from '../../../src/types';

import { AppError } from '../../../src/helpers/errors';
import mfaListWidget from '../../../src/widgets/mfa/mfaListWidget';

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

describe('Snapshot', () => {
    const generateSnapshot =
        (
            options: Partial<Parameters<typeof mfaListWidget>[0]>,
            config: Partial<Config> = {},
            credentials: (MFA.EmailCredential | MFA.PhoneCredential)[]
        ) =>
        async () => {
            // @ts-expect-error partial Client
            const apiClient: Client = {
                listMfaCredentials: jest
                    .fn<Client['listMfaCredentials']>()
                    .mockResolvedValue({ credentials }),
            };

            const widget = await mfaListWidget(
                { accessToken: 'azerty', ...options },
                { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
            );

            await waitFor(async () => {
                const { container, rerender } = await render(widget);

                await waitFor(() => expect(apiClient.listMfaCredentials).toHaveBeenCalled());

                rerender(widget);

                expect(container).toMatchSnapshot();
            });
        };

    test('empty', generateSnapshot({}, undefined, []));

    test(
        'basic',
        generateSnapshot({}, undefined, [
            {
                type: 'sms',
                phoneNumber: '33612345678',
                friendlyName: '33612345678',
                createdAt: '2022-09-21',
            },
            {
                type: 'email',
                email: 'root@reach5.co',
                friendlyName: 'identifier',
                createdAt: '2022-09-21',
            },
        ])
    );
});

describe('DOM testing', () => {
    const listMfaCredentials = jest.fn<Client['listMfaCredentials']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        onError.mockClear();
        onSuccess.mockClear();
        listMfaCredentials.mockClear();
    });

    const generateComponent = async (
        options: Partial<Parameters<typeof mfaListWidget>[0]>,
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listMfaCredentials,
        };
        const result = await mfaListWidget(
            { accessToken: 'azerty', onError, onSuccess, ...options },
            { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
        );
        return await waitFor(async () => {
            return render(result);
        });
    };

    describe('mfaCredentials', () => {
        test('no credentials', async () => {
            listMfaCredentials.mockResolvedValue({ credentials: [] });
            await generateComponent({}, defaultConfig);

            const noCredentials = screen.queryByText('mfaList.noCredentials');
            expect(noCredentials).toBeInTheDocument();

            const credential = screen.queryAllByTestId('credential');
            expect(credential).toHaveLength(0);

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    credentials: expect.arrayContaining([]),
                    name: 'mfa_credentials_listed',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('with credentials', async () => {
            listMfaCredentials.mockResolvedValue({
                credentials: [
                    {
                        type: 'sms',
                        phoneNumber: '33612345678',
                        friendlyName: '33612345678',
                        createdAt: '2022-09-21',
                    } as MFA.PhoneCredential,
                    {
                        type: 'email',
                        email: 'root@reach5.co',
                        friendlyName: 'identifier',
                        createdAt: '2022-09-21',
                    } as MFA.EmailCredential,
                ],
            });
            await generateComponent({}, defaultConfig);

            const noCredentials = screen.queryByText('mfaList.noCredentials');
            expect(noCredentials).not.toBeInTheDocument();

            const credential = screen.queryAllByTestId('credential');
            expect(credential).toHaveLength(2);

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    credentials: expect.arrayContaining([
                        {
                            type: 'sms',
                            phoneNumber: '33612345678',
                            friendlyName: '33612345678',
                            createdAt: '2022-09-21',
                        },
                        {
                            type: 'email',
                            email: 'root@reach5.co',
                            friendlyName: 'identifier',
                            createdAt: '2022-09-21',
                        },
                    ]),
                    name: 'mfa_credentials_listed',
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
            listMfaCredentials.mockRejectedValue(error);
            await expect(generateComponent({}, defaultConfig)).rejects.toEqual(error);
            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith(error);
        });
    });
});
