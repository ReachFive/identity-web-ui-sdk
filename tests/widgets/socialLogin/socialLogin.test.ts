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
import { type Provider, providers, type ProviderId } from '../../../src/providers/providers';
import socialLoginWidget from '../../../src/widgets/socialLogin/socialLoginWidget';

import type { Config, OnError, OnSuccess } from '../../../src/types';

const customProvider: Provider = {
    key: 'my-idp',
    name: 'My IdP',
    color: '#4c1d95',
    icon: 'my-idp.svg',
};

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google', 'my-idp'],
    customProviders: { 'my-idp': customProvider },
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

function expectSocialButtons(toBeInTheDocument = true) {
    defaultConfig.socialProviders.forEach(providerKey => {
        const provider =
            providers[providerKey as ProviderId] ?? defaultConfig.customProviders?.[providerKey];
        if (!provider) {
            throw new Error(`Unknown provider with key "${providerKey}".`);
        }
        if (toBeInTheDocument) {
            expect(screen.getByTitle(provider.name)).toBeInTheDocument();
        } else {
            expect(screen.queryByTitle(provider.name)).not.toBeInTheDocument();
        }
    });
}

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

            const { container } = render(widget);
            // Flush any state update triggered by a useEffect-initiated async call on
            // mount, so it lands inside this act() boundary instead of racing with
            // the snapshot assertion below.
            await waitFor(() => {});
            expect(container).toMatchSnapshot();
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

        expectSocialButtons(true);

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

    test('login with social failure', async () => {
        const user = userEvent.setup();

        const error = { error: 'Unexpected error' };
        loginWithSocialProvider.mockRejectedValue(error);

        await generateComponent({});

        expectSocialButtons(true);

        const provider = defaultConfig.socialProviders[0] as ProviderId;
        const button = screen.getByTitle(providers[provider].name);
        await user.click(button);

        expect(loginWithSocialProvider).toBeCalledWith(provider, undefined);

        expect(onSuccess).not.toBeCalled();
        expect(onError).toBeCalledWith(error);
    });
});
