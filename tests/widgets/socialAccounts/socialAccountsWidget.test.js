/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import 'jest-styled-components';

import socialAccountsWidget from '../../../src/widgets/socialAccounts/socialAccountsWidget';

const defaultConfig = {
    domain: 'local.reach5.net',
    socialProviders: ['facebook', 'google', 'line:custom']
};

describe('Snapshot', () => {
    const generateSnapshot = ({ options = {}, config = defaultConfig, socialIdentities }) => async () => {
        const apiClient = {
            getUser: jest.fn().mockReturnValueOnce(Promise.resolve({ socialIdentities })),
            unlink: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
        };

        const widget = await socialAccountsWidget(
            { ...options, accessToken: 'azerty' },
            { config, apiClient }
        )

        const { container, rerender } = await render(widget);

        await waitFor(() => expect(apiClient.getUser).toHaveBeenCalled())

        await rerender(widget)
        
        expect(container).toMatchSnapshot();
    };

    test('basic', generateSnapshot({
        socialIdentities: [
            { id: '123456778', provider: 'facebook', name: 'John Doe' }
        ]
    }))
})

describe('DOM testing', () => {
    const handleUnlink = jest.fn().mockReturnValueOnce(Promise.resolve())

    const generateComponent = async ({ options = {}, config = defaultConfig, socialIdentities }) => {

        const apiClient = {
            getUser: jest.fn().mockReturnValueOnce(Promise.resolve({ socialIdentities })),
            unlink: handleUnlink,
            on: jest.fn(),
            off: jest.fn(),
        };

        const widget = await socialAccountsWidget(
            { ...options, accessToken: 'azerty' },
            { config, apiClient }
        )

        const { rerender } = await render(widget);

        await waitFor(() => expect(apiClient.getUser).toHaveBeenCalled())

        return await rerender(widget)
    };

    describe('with default config', () => {
        test('no identity', async () => {
            expect.assertions(3);

            await generateComponent({});

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).toBeInTheDocument();
        })

        test('with existing identity', async () => {
            expect.assertions(4);

            await generateComponent({
                socialIdentities: [
                    { id: '123456789', provider: 'facebook', name: 'John Doe' },
                ]
            });

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).not.toBeInTheDocument();
            expect(screen.queryByTestId('identity-facebook')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).toBeInTheDocument();
        })

        test('with all identities configured', async () => {
            expect.assertions(6);

            await generateComponent({
                socialIdentities: [
                    { id: '123456789', provider: 'facebook', name: 'John Doe' },
                    { id: '987654321', provider: 'google', name: 'John Doe' },
                    { id: '000000000', provider: 'line', name: 'John Doe' },
                ]
            });

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).not.toBeInTheDocument();
            expect(screen.queryByTestId('identity-facebook')).toBeInTheDocument();
            expect(screen.queryByTestId('identity-google')).toBeInTheDocument();
            expect(screen.queryByTestId('identity-line')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).not.toBeInTheDocument();
        })

        test('unlink identity', async () => {
            await generateComponent({
                socialIdentities: [
                    { id: '123456789', provider: 'facebook', name: 'John Doe' },
                    { id: '987654321', provider: 'google', name: 'John Doe' },
                    { id: '000000000', provider: 'line', name: 'John Doe' },
                ]
            });

            expect(screen.queryByTestId('identity-google')).toBeInTheDocument();
            
            const unlinkBtn = screen.queryByTestId('identity-google-unlink');
            expect(unlinkBtn).toBeInTheDocument();
            
            fireEvent.click(unlinkBtn)

            expect(handleUnlink).toHaveBeenCalledTimes(1)
            expect(handleUnlink.mock.calls[handleUnlink.mock.calls.length - 1][0].identityId).toBe('987654321') // Google

            await waitFor(() => {
                expect(screen.queryByTestId('identity-google')).not.toBeInTheDocument();
            })
        })
    })
})
