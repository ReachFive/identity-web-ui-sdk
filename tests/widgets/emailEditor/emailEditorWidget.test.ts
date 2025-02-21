/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import emailEditorWidget from '../../../src/widgets/emailEditor/emailEditorWidget';

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
    const generateSnapshot = (options: Partial<Parameters<typeof emailEditorWidget>[0]> = {}, config: Partial<Config> = {}) => async () => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            updateEmail: jest.fn<Client['updateEmail']>().mockResolvedValue()
        }

        const widget = await emailEditorWidget(
            { ...options, accessToken: 'azerty' },
            { apiClient,config: { ...defaultConfig, ...config }, defaultI18n }
        )

        await waitFor(async () => {
            const { container } = await render(widget);
            expect(container).toMatchSnapshot();
        })
    };

    describe('email editor', () => {
        test('basic',
            generateSnapshot({})
        );
    });
})

describe('DOM testing', () => {
    const updateEmail = jest.fn<Client['updateEmail']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()
    
    beforeEach(() => {
        updateEmail.mockClear()
        onError.mockClear()
        onSuccess.mockClear()
    })

    const generateComponent = async (options: Partial<Parameters<typeof emailEditorWidget>[0]> = {}, config: Partial<Config> = {}) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            updateEmail,
        }

        const result = await emailEditorWidget(
            { onError, onSuccess, ...options, accessToken: 'azerty' },
            {config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        return waitFor(async () => {
            return render(result);
        })
    };

    describe('emailEditor', () => {
        test('default', async () => {
            const user = userEvent.setup()

            updateEmail.mockResolvedValue()

            await generateComponent({})

            const emailInput = screen.getByLabelText('email')
            expect(emailInput).toBeInTheDocument()
            
            await userEvent.clear(emailInput)
            await userEvent.type(emailInput, 'alice@reach5.co')
            
            const submitBtn = screen.getByRole('button', { name: 'send'})
            expect(submitBtn).toBeInTheDocument()

            await user.click(submitBtn)

            expect(updateEmail).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    email: 'alice@reach5.co',
                })
            )

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('api update email failed', async () => {
            const user = userEvent.setup()

            updateEmail.mockRejectedValue('Unexpected error')

            await generateComponent({})

            const emailInput = screen.getByLabelText('email')
            expect(emailInput).toBeInTheDocument()
            
            await userEvent.clear(emailInput)
            await userEvent.type(emailInput, 'alice@reach5.co')
            
            const submitBtn = screen.getByRole('button', { name: 'send'})
            expect(submitBtn).toBeInTheDocument()

            await user.click(submitBtn)

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalledWith('Unexpected error')
        })
    })

})
