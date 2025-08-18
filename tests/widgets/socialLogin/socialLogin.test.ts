/**
 * @jest-environment jest-fixed-jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import { providers, type ProviderId } from '../../../src/providers/providers';

import { OnError, OnSuccess } from '@/types';
import SocialLoginWidget from '../../../src/widgets/socialLogin/socialLoginWidget';
import { componentGenerator, defaultConfig, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {};

    const generateSnapshot = snapshotGenerator(SocialLoginWidget, apiClient, defaultI18n);

    describe('social login', () => {
        test('basic', generateSnapshot({}));
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

    // @ts-expect-error partial Client
    const apiClient: Client = {
        loginWithSocialProvider,
    };

    const generateComponent = componentGenerator(SocialLoginWidget, apiClient, defaultI18n);

    test('basic', async () => {
        const user = userEvent.setup();

        loginWithSocialProvider.mockResolvedValue(undefined);

        await generateComponent({ onError, onSuccess });

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
            onError,
            onSuccess,
        });

        defaultConfig.socialProviders.forEach(provider => {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument();
        });
    });

    test('login with social failure', async () => {
        const user = userEvent.setup();

        const error = { error: 'Unexpected error' };
        loginWithSocialProvider.mockRejectedValue(error);

        await generateComponent({ onError, onSuccess });

        defaultConfig.socialProviders.forEach(provider => {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument();
        });

        const provider = defaultConfig.socialProviders[0] as ProviderId;
        const button = screen.getByTitle(providers[provider].name);
        await user.click(button);

        await waitFor(() => expect(loginWithSocialProvider).toBeCalledWith(provider, undefined));

        expect(onSuccess).not.toBeCalled();
        expect(onError).toBeCalledWith(error);
    });
});
