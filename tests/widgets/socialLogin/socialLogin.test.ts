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
import { providers, type ProviderId } from '../../../src/providers/providers';
import socialLoginWidget from '../../../src/widgets/socialLogin/socialLoginWidget';

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
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
    loginTypeAllowed: {
        email: true,
        phoneNumber: true,
        customIdentifier: true,
    },
    isImplicitFlowForbidden: false,
};

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    const generateSnapshot =
        (options: Parameters<typeof socialLoginWidget>[0] = {}, config: Partial<Config> = {}) =>
        async () => {
            // @ts-expect-error partial Client
            const apiClient: Client = {};

            const widget = await socialLoginWidget(options, {
                config: { ...defaultConfig, ...config },
                apiClient,
                defaultI18n,
            });

            await waitFor(async () => {
                const { container } = await render(widget);
                expect(container).toMatchSnapshot();
            });
        };

    describe('social login', () => {
        test('basic', generateSnapshot());
    });
});

describe('DOM testing', () => {
    const loginWithSocialProvider = jest.fn<Client['loginWithSocialProvider']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        loginWithSocialProvider.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    const generateComponent = async (
        options: Parameters<typeof socialLoginWidget>[0] = {},
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            loginWithSocialProvider,
        };

        const result = await socialLoginWidget(
            { onError, onSuccess, ...options },
            { config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        return render(result);
    };

    test('basic', async () => {
        const user = userEvent.setup();

        loginWithSocialProvider.mockResolvedValue({});

        await generateComponent({});

        defaultConfig.socialProviders.forEach(provider => {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument();
        });

        const provider = defaultConfig.socialProviders[0] as ProviderId;
        const button = screen.getByTitle(providers[provider].name);
        await user.click(button);

        expect(loginWithSocialProvider).toBeCalledWith(provider, undefined);

        expect(onSuccess).toBeCalledWith(
            expect.objectContaining({
                name: 'login',
                authResult: expect.objectContaining({ providerName: 'facebook' }),
            })
        );
        expect(onError).not.toBeCalled();
    });

    test('themed', async () => {
        await generateComponent({
            theme: {
                primaryColor: '#ff0000',
            },
        });

        defaultConfig.socialProviders.forEach(provider => {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument();
        });
    });

    test('login with social failure', async () => {
        const user = userEvent.setup();

        const error = { error: 'Unexpected error' };
        loginWithSocialProvider.mockRejectedValue(error);

        await generateComponent({});

        defaultConfig.socialProviders.forEach(provider => {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument();
        });

        const provider = defaultConfig.socialProviders[0] as ProviderId;
        const button = screen.getByTitle(providers[provider].name);
        await user.click(button);

        expect(loginWithSocialProvider).toBeCalledWith(provider, undefined);

        expect(onSuccess).not.toBeCalled();
        expect(onError).toBeCalledWith(error);
    });
});
