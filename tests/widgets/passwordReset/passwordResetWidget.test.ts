/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/?email=alice@reach5.co&verificationCode=123456"}
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import passwordResetWidget from '../../../src/widgets/passwordReset/passwordResetWidget';

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
    }
};

const defaultI18n: I18nMessages = {}

describe('Snapshot', () => {
    const generateSnapshot = (options: Parameters<typeof passwordResetWidget>[0] = {}, config: Partial<Config> = {}) => async () => {
        // @ts-expect-error partial Client
        const apiClient: Client = {}

        const widget = await passwordResetWidget(options, {config: { ...defaultConfig, ...config }, apiClient, defaultI18n })
                
        await waitFor(async () => {
            const { container } = await render(widget);
            expect(container).toMatchSnapshot();
        })
    };

    describe('password-reset', () => {
        test('default', generateSnapshot());
    });
});

describe('DOM testing', () => {
    const updatePassword = jest.fn<Client['updatePassword']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()
    
    beforeEach(() => {
        updatePassword.mockClear()
        onError.mockClear()
        onSuccess.mockClear()
    })

    const generateComponent = async (options: Parameters<typeof passwordResetWidget>[0] = {}, config: Partial<Config> = {}) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            updatePassword
        }

        const result = await passwordResetWidget({ onError, onSuccess, ...options }, {config: { ...defaultConfig, ...config }, apiClient, defaultI18n });

        return render(result);
    };

    describe('password-reset', () => {
        test('basic', async () => {
            expect.assertions(6);
            
            const user = userEvent.setup()

            updatePassword.mockResolvedValue()

            await generateComponent();

            const password = screen.getByTestId('password')
            expect(password).toBeInTheDocument();
            
            const passwordConfirmation = screen.getByTestId('password_confirmation')
            expect(passwordConfirmation).toBeInTheDocument();
            
            const submitBtn = screen.getByTestId('submit')
            expect(submitBtn).toHaveTextContent('send');

            await user.type(password, 'azerty')
            await user.type(passwordConfirmation, 'azerty')
            await user.click(submitBtn)

            expect(updatePassword).toBeCalledWith({
                password: 'azerty',
                email: 'alice@reach5.co', /** @see @jest-environment-options on top of file */
                verificationCode: '123456', /** @see @jest-environment-options on top of file */
            })

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        });

        test('api failure', async () => {
            const user = userEvent.setup()

            updatePassword.mockRejectedValue('Unexpected error')

            await generateComponent();

            const password = screen.getByTestId('password')
            const passwordConfirmation = screen.getByTestId('password_confirmation')
            const submitBtn = screen.getByTestId('submit')

            await user.type(password, 'azerty')
            await user.type(passwordConfirmation, 'azerty')
            await user.click(submitBtn)

            expect(updatePassword).toBeCalled()

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalledWith('Unexpected error')
        });
    });
});
