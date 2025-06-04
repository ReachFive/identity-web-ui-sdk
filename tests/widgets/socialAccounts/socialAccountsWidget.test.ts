/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client, type Profile } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import socialAccountsWidget from '../../../src/widgets/socialAccounts/socialAccountsWidget';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google', 'line:custom'],
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
            options = {},
            config = defaultConfig,
            socialIdentities: Profile['socialIdentities'] = []
        ) =>
        async () => {
            // @ts-expect-error partial Client
            const apiClient: Client = {
                // @ts-expect-error partial Profile
                getUser: jest.fn<Client['getUser']>().mockResolvedValue({ socialIdentities }),
                unlink: jest.fn<Client['unlink']>(),
                on: jest.fn(),
                off: jest.fn(),
            };

            const widget = await socialAccountsWidget(
                { ...options, accessToken: 'azerty' },
                { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
            );

            await waitFor(async () => {
                const { container, rerender } = await render(widget);

                await waitFor(() => expect(apiClient.getUser).toHaveBeenCalled());

                await rerender(widget);

                expect(container).toMatchSnapshot();
            });
        };

    test(
        'basic',
        generateSnapshot({
            socialIdentities: [{ id: '123456778', provider: 'facebook', name: 'John Doe' }],
        })
    );
});

describe('DOM testing', () => {
    const getUser = jest.fn<Client['getUser']>();
    const unlink = jest.fn<Client['unlink']>();
    const on = jest.fn();
    const off = jest.fn();

    const onError = jest.fn();
    const onSuccess = jest.fn();

    beforeEach(() => {
        getUser.mockClear();
        unlink.mockClear();
        on.mockClear();
        off.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    const generateComponent = async (
        options: Partial<Parameters<typeof socialAccountsWidget>[0]> = {},
        config = defaultConfig,
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

        const widget = await socialAccountsWidget(
            { onError, onSuccess, ...options, accessToken: 'azerty' },
            { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
        );

        await waitFor(async () => {
            const { rerender } = await render(widget);

            await waitFor(() => expect(apiClient.getUser).toHaveBeenCalled());

            await rerender(widget);
        });
    };

    describe('with default config', () => {
        test('no identity', async () => {
            expect.assertions(3);

            await generateComponent({});

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).toBeInTheDocument();
        });

        test('with existing identity', async () => {
            expect.assertions(4);

            await generateComponent({}, defaultConfig, [
                { id: '123456789', provider: 'facebook', username: 'John Doe' },
            ]);

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).not.toBeInTheDocument();
            expect(screen.queryByTestId('identity-facebook')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).toBeInTheDocument();
        });

        test('with all identities configured', async () => {
            expect.assertions(6);

            await generateComponent({}, defaultConfig, [
                { id: '123456789', provider: 'facebook', username: 'John Doe' },
                { id: '987654321', provider: 'google', username: 'John Doe' },
                { id: '000000000', provider: 'line', username: 'John Doe' },
            ]);

            expect(screen.queryByText('socialAccounts.noLinkedAccount')).not.toBeInTheDocument();
            expect(screen.queryByTestId('identity-facebook')).toBeInTheDocument();
            expect(screen.queryByTestId('identity-google')).toBeInTheDocument();
            expect(screen.queryByTestId('identity-line')).toBeInTheDocument();
            expect(screen.queryByText('socialAccounts.linkNewAccount')).not.toBeInTheDocument();
        });

        test('unlink identity', async () => {
            const user = userEvent.setup();

            unlink.mockResolvedValue();

            await generateComponent({}, defaultConfig, [
                { id: '123456789', provider: 'facebook', username: 'John Doe' },
                { id: '987654321', provider: 'google', username: 'John Doe' },
                { id: '000000000', provider: 'line', username: 'John Doe' },
            ]);

            expect(screen.queryByTestId('identity-google')).toBeInTheDocument();

            const unlinkBtn = screen.getByTestId('identity-google-unlink');
            expect(unlinkBtn).toBeInTheDocument();

            await user.click(unlinkBtn);

            expect(unlink).toHaveBeenCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    identityId: '987654321', // Google
                })
            );

            expect(screen.queryByTestId('identity-google')).not.toBeInTheDocument();

            expect(onSuccess).toBeCalled();
            expect(onError).not.toBeCalled();
        });

        test('unlink api failure', async () => {
            const user = userEvent.setup();

            unlink.mockRejectedValue('Unexpected error');

            await generateComponent({}, defaultConfig, [
                { id: '123456789', provider: 'facebook', username: 'John Doe' },
                { id: '987654321', provider: 'google', username: 'John Doe' },
                { id: '000000000', provider: 'line', username: 'John Doe' },
            ]);

            const unlinkBtn = screen.getByTestId('identity-google-unlink');
            await user.click(unlinkBtn);

            expect(unlink).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalled();
        });
    });
});
