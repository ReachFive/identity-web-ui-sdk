/**
 * @jest-environment jest-fixed-jsdom
 */

import { ComponentProps } from 'react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import type { Client, MFA } from '@reachfive/identity-core';

import type { Config } from '../../../src/types';
import type { I18nMessages } from '../../../src/core/i18n';

import MfaListWidget from '../../../src/widgets/mfa/mfaListWidget';
import { AppError } from '../../../src/helpers/errors';
import { componentGenerator, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {}

describe('Snapshot', () => {
    const generateSnapshot = (
        options: ComponentProps<typeof MfaListWidget>,
        config: Partial<Config> = {},
        credentials: (MFA.EmailCredential | MFA.PhoneCredential)[]
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listMfaCredentials: jest.fn<Client['listMfaCredentials']>().mockResolvedValue({ credentials }),
        }

        const generate = snapshotGenerator(MfaListWidget, apiClient, defaultI18n)
        
        return generate(options, config)
    };

    test('empty', generateSnapshot({ accessToken: 'azerty' }, undefined, []))

    test('basic', generateSnapshot({ accessToken: 'azerty' }, undefined, [
        { type: 'sms', phoneNumber: '33612345678', friendlyName: '33612345678', createdAt: '2022-09-21' },
        { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
    ]))
})

describe('DOM testing', () => {
    const listMfaCredentials = jest.fn<Client['listMfaCredentials']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()

    beforeEach(() => {
        onError.mockClear()
        onSuccess.mockClear()
        listMfaCredentials.mockClear()
    })

    // @ts-expect-error partial Client
    const apiClient: Client = {
        listMfaCredentials,
    }

    const generateComponent = componentGenerator(MfaListWidget, apiClient, defaultI18n)

    describe('mfaCredentials', () => {
        test('no credentials', async () => {
            listMfaCredentials.mockResolvedValue({ credentials: [] })
            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            const noCredentials = screen.queryByText('mfaList.noCredentials')
            expect(noCredentials).toBeInTheDocument()

            const credential = screen.queryAllByTestId('credential')
            expect(credential).toHaveLength(0)

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('with credentials', async () => {
            listMfaCredentials.mockResolvedValue({ credentials: [
                { type: 'sms', phoneNumber: '33612345678', friendlyName: '33612345678', createdAt: '2022-09-21' } as MFA.PhoneCredential,
                { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' } as MFA.EmailCredential
            ]})
            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            expect(listMfaCredentials).toBeCalled()

            const noCredentials = screen.queryByText('mfaList.noCredentials')
            expect(noCredentials).not.toBeInTheDocument()

            const credential = screen.queryAllByTestId('credential')
            expect(credential).toHaveLength(2)

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('api error', async () => {
            const error: AppError = { errorId: '0', error: 'unexpected_error', errorDescription: "Unexpected error" }
            listMfaCredentials.mockRejectedValue(error)
            
            await generateComponent(
                { accessToken: 'azerty', onError, onSuccess },
                {},
                () => expect(listMfaCredentials).toBeCalled()
            )
            
            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalledWith(error)
        })
    })

})
