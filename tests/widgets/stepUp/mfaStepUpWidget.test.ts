/**
 * @jest-environment jsdom
 */
import React from 'react';

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/contexts/i18n';
import mfaStepUpWidget from '../../../src/widgets/stepUp/mfaStepUpWidget';

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
    customProviders: {},
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
    loginTypeAllowed: {
        email: true,
        phoneNumber: true,
        customIdentifier: true,
    },
    isImplicitFlowForbidden: false,
};

const defaultI18n: I18nMessages = {};

const auth = { redirectUri: 'http://localhost/' };

describe('showStepUp', () => {
    const { location } = window;

    const getMfaStepUpToken = jest.fn<Client['getMfaStepUpToken']>();
    const startPasswordless = jest.fn<Client['startPasswordless']>();
    const verifyMfaPasswordless = jest.fn<Client['verifyMfaPasswordless']>();
    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();
    const replace = jest.fn();

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: { search: '', replace },
            writable: true,
        });
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', { value: location, writable: true });
    });

    beforeEach(() => {
        jest.resetAllMocks();
        getMfaStepUpToken.mockResolvedValue({ amr: ['sms'], token: 'tkn' });
        startPasswordless.mockResolvedValue({ challengeId: 'challenge-1' });
        verifyMfaPasswordless.mockResolvedValue({});
    });

    const show = async (
        options: Partial<Parameters<typeof mfaStepUpWidget>[0]> = {},
        config: Partial<Config> = {},
        { strict = false } = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = { getMfaStepUpToken, startPasswordless, verifyMfaPasswordless };
        const element = await mfaStepUpWidget(
            { auth, onError, onSuccess, ...options },
            { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
        );
        return render(strict ? React.createElement(React.StrictMode, null, element) : element);
    };

    test('requests the step-up token on mount', async () => {
        getMfaStepUpToken.mockResolvedValue({ amr: ['email', 'sms'], token: 'tkn' });

        await show({ accessToken: 'at', action: 'act' });

        expect(
            await screen.findByRole('heading', { name: 'mfa.stepUp.title' })
        ).toBeInTheDocument();
        expect(screen.queryByText('mfa.stepUp.start')).not.toBeInTheDocument();
        expect(getMfaStepUpToken).toHaveBeenCalledTimes(1);
        expect(getMfaStepUpToken).toHaveBeenCalledWith({
            options: auth,
            accessToken: 'at',
            action: 'act',
        });
    });

    test('requests a single token under StrictMode', async () => {
        getMfaStepUpToken.mockResolvedValue({ amr: ['email', 'sms'], token: 'tkn' });

        await show({}, {}, { strict: true });

        expect(
            await screen.findByRole('heading', { name: 'mfa.stepUp.title' })
        ).toBeInTheDocument();
        expect(getMfaStepUpToken).toHaveBeenCalledTimes(1);
    });

    test('warns once that showStepUpStart is deprecated', async () => {
        const warn = jest.spyOn(window.console, 'warn').mockImplementation(() => {});

        await show({ showStepUpStart: true });
        await screen.findByRole('heading', { name: 'mfa.code.title' });

        const deprecations = warn.mock.calls.filter(([m]) => String(m).includes('showStepUpStart'));
        expect(deprecations).toEqual([
            [
                'showStepUpStart is deprecated and has no effect: the step-up starts when the widget opens.',
            ],
        ]);
        warn.mockRestore();
    });

    test('does not warn when showStepUpStart is not given', async () => {
        const warn = jest.spyOn(window.console, 'warn').mockImplementation(() => {});

        await show();
        await screen.findByRole('heading', { name: 'mfa.code.title' });

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test('shows the error when the token cannot be requested', async () => {
        const error = new Error('boom');
        getMfaStepUpToken.mockRejectedValue(error);
        const consoleError = jest.spyOn(window.console, 'error').mockImplementation(() => {});

        await show();

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(error);
        consoleError.mockRestore();
    });

    test('sends the code of a single factor, then resends it up to the tenant limit', async () => {
        const user = userEvent.setup();

        await show({}, { stepUpTokenMaxUses: 2 });

        expect(await screen.findByText('passwordless.sms.verification.intro')).toBeInTheDocument();
        expect(startPasswordless).toHaveBeenCalledTimes(1);

        startPasswordless.mockResolvedValueOnce({ challengeId: 'myOtherChallengeId' });
        await user.click(screen.getByRole('button', { name: 'verificationCode.resend.count' }));

        expect(startPasswordless).toHaveBeenLastCalledWith({ authType: 'sms', stepUp: 'tkn' });
        // the token may send no more code than the tenant allows, the first one included
        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: 'verificationCode.resend.count' })
            ).toBeDisabled()
        );

        await user.type(screen.getByRole('textbox', { name: 'verificationCode' }), '123456');

        await waitFor(() =>
            expect(verifyMfaPasswordless).toHaveBeenCalledWith(
                expect.objectContaining({ challengeId: 'myOtherChallengeId' })
            )
        );
        expect(onSuccess).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'login_2nd_step', authType: 'sms' })
        );
        await waitFor(() =>
            expect(replace).toHaveBeenCalledWith(expect.stringContaining(auth.redirectUri))
        );
        expect(onError).not.toHaveBeenCalled();
    });
});
