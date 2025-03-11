/**
 * @jest-environment jest-fixed-jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Profile, type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import SocialAccountsWidget from '../../../src/widgets/socialAccounts/socialAccountsWidget';
import { componentGenerator, snapshotGenerator } from '../renderer';
import { ComponentProps } from 'react';

const defaultI18n: I18nMessages = {}

describe('Snapshot', () => {
    const generateSnapshot = (
        options: ComponentProps<typeof SocialAccountsWidget>,
        config: Partial<Config> = {},
        socialIdentities: Profile['socialIdentities'] = []
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            // @ts-expect-error partial Profile
            getUser: jest.fn<Client['getUser']>().mockResolvedValue({ socialIdentities }),
            unlink: jest.fn<Client['unlink']>(),
            on: jest.fn(),
            off: jest.fn(),
        };

        const generate = snapshotGenerator(SocialAccountsWidget, apiClient, defaultI18n)

        return generate(options, config)
    };

    test('basic', generateSnapshot(
        { accessToken: 'azerty' },
        {},
        [
            { id: '123456778', provider: 'facebook', username: 'John Doe' }
        ]
    ))
})

describe('DOM testing', () => {
    const getUser = jest.fn<Client['getUser']>()
    const unlink = jest.fn<Client['unlink']>()
    const on = jest.fn()
    const off = jest.fn()

    const onError = jest.fn()
    const onSuccess = jest.fn()
    
    beforeEach(() => {
        getUser.mockClear()
        unlink.mockClear()
        on.mockClear()
        off.mockClear()
        onError.mockClear()
        onSuccess.mockClear()
    })

    const generateComponent = async (
        options: ComponentProps<typeof SocialAccountsWidget>,
        config: Partial<Config> = {},
        socialIdentities: Profile['socialIdentities'] = []
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            // @ts-expect-error partial Profile
            getUser: getUser.mockResolvedValue({ socialIdentities }),
            unlink,
            on,
            off,
        };

        const generate = componentGenerator(SocialAccountsWidget, apiClient, defaultI18n)
        
        return await generate(options, config)
    }

    describe('with default config', () => {
        test('no identity', async () => {
            expect.assertions(6);

            await generateComponent({ accessToken: 'azerty', onError, onSuccess });

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).toBeInTheDocument();
        })

        test('with existing identity', async () => {
            expect.assertions(7);

            await generateComponent(
                { accessToken: 'azerty', onError, onSuccess },
                {},
                [
                    { id: '123456789', provider: 'facebook', username: 'John Doe' },
                ]
            );

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).not.toBeInTheDocument();
            expect(screen.queryByTestId('identity-facebook')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).toBeInTheDocument();
        })

        test('with all identities configured', async () => {
            expect.assertions(9);

            await generateComponent(
                { accessToken: 'azerty', onError, onSuccess },
                {},
                [
                    { id: '123456789', provider: 'facebook', username: 'John Doe' },
                    { id: '987654321', provider: 'google', username: 'John Doe' },
                    { id: '000000000', provider: 'line', username: 'John Doe' },
                ]
            );

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).not.toBeInTheDocument();
            expect(screen.queryByTestId('identity-facebook')).toBeInTheDocument();
            expect(screen.queryByTestId('identity-google')).toBeInTheDocument();
            expect(screen.queryByTestId('identity-line')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).not.toBeInTheDocument();
        })

        test('unlink identity', async () => {
            const user = userEvent.setup()

            unlink.mockResolvedValue()

            await generateComponent(
                { accessToken: 'azerty', onError, onSuccess },
                {},
                [
                    { id: '123456789', provider: 'facebook', username: 'John Doe' },
                    { id: '987654321', provider: 'google', username: 'John Doe' },
                    { id: '000000000', provider: 'line', username: 'John Doe' },
                ]
            );

            expect(screen.queryByTestId('identity-google')).toBeInTheDocument();
            
            const unlinkBtn = screen.getByTestId('identity-google-unlink');
            expect(unlinkBtn).toBeInTheDocument();
            
            await user.click(unlinkBtn)

            expect(unlink).toHaveBeenCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    identityId: '987654321' // Google
                })
            )

            expect(screen.queryByTestId('identity-google')).not.toBeInTheDocument();

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('unlink api failure', async () => {
            const user = userEvent.setup()

            unlink.mockRejectedValue(new Error('Unexpected error'))

            await generateComponent(
                { accessToken: 'azerty', onError, onSuccess },
                {},
                [
                    { id: '123456789', provider: 'facebook', username: 'John Doe' },
                    { id: '987654321', provider: 'google', username: 'John Doe' },
                    { id: '000000000', provider: 'line', username: 'John Doe' },
                ]
            );

            const unlinkBtn = screen.getByTestId('identity-google-unlink');
            await user.click(unlinkBtn)

            expect(unlink).toBeCalled()

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalled()
        })
    })
})
