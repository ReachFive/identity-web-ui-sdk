/**
 * @jest-environment jest-fixed-jsdom
 */
import { ComponentProps } from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import 'jest-styled-components';

import type { Client, MFA } from '@reachfive/identity-core';

import { AppError } from '@/helpers/errors';
import MfaListWidget from '@/widgets/mfa/mfaListWidget';

import { componentGenerator, snapshotGenerator } from '../renderer';

import type { I18nMessages } from '@/core/i18n';
import type { Config, OnError, OnSuccess } from '@/types';

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    const generateSnapshot = (
        options: ComponentProps<typeof MfaListWidget>,
        config: Partial<Config> = {},
        credentials: (MFA.EmailCredential | MFA.PhoneCredential)[]
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listMfaCredentials: jest
                .fn<Client['listMfaCredentials']>()
                .mockResolvedValue({ credentials }),
        };

        const generate = snapshotGenerator(MfaListWidget, apiClient, defaultI18n);

        return generate(options, config);
    };

    test('empty', generateSnapshot({ accessToken: 'azerty' }, undefined, []));

    test(
        'basic',
        generateSnapshot({ accessToken: 'azerty' }, undefined, [
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

    // @ts-expect-error partial Client
    const apiClient: Client = {
        listMfaCredentials,
    };

    const generateComponent = componentGenerator(MfaListWidget, apiClient, defaultI18n);

    describe('mfaCredentials', () => {
        test('no credentials', async () => {
            listMfaCredentials.mockResolvedValue({ credentials: [] });
            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

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
            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            expect(listMfaCredentials).toBeCalled();

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

            expect(
                async () =>
                    await generateComponent({ accessToken: 'azerty', onError, onSuccess }, {}, () =>
                        expect(listMfaCredentials).toBeCalled()
                    )
            ).rejects.toThrow();

            expect(onSuccess).not.toBeCalled();
            // expect(onError).toBeCalledWith(error);
        });
    });
});
