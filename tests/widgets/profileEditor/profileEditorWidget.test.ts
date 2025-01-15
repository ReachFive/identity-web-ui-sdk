/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Profile, type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import profileEditorWidget from '../../../src/widgets/profileEditor/profileEditorWidget';

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
    const generateSnapshot = (options: Partial<Parameters<typeof profileEditorWidget>[0]> = {}, user: Partial<Profile>, config: Partial<Config> = {}) => async () => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getUser: jest.fn<Client['getUser']>().mockResolvedValue(user as Profile)
        }

        const widget = await profileEditorWidget(
            { ...options, accessToken: 'azerty' },
            { apiClient,config: { ...defaultConfig, ...config }, defaultI18n }
        )

        await waitFor(async () => {
            const { container, rerender } = await render(widget);

            await waitFor(() => expect(apiClient.getUser).toHaveBeenCalled())
    
            await rerender(widget)

            expect(container).toMatchSnapshot();
        })
    };

    describe('profile editor', () => {
        test('basic',
            generateSnapshot(
                {
                    fields: [
                        'given_name',
                        'family_name'
                    ]
                },
                {
                    givenName: 'John',
                    familyName: 'Do',
                }
            )
        );
    });
})

describe('DOM testing', () => {
    const getUser = jest.fn<Client['getUser']>()
    const updateProfile = jest.fn<Client['updateProfile']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()
    
    beforeEach(() => {
        getUser.mockClear()
        updateProfile.mockClear()
        onError.mockClear()
        onSuccess.mockClear()
    })

    const generateComponent = async (options: Partial<Parameters<typeof profileEditorWidget>[0]> = {}, config: Partial<Config> = {}) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getUser,
            updateProfile,
        }

        const result = await profileEditorWidget(
            { onError, onSuccess, ...options, accessToken: 'azerty' },
            {config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        return waitFor(async () => {
            return render(result);
        })
    };

    describe('profileEditor', () => {
        test('default', async () => {
            const user = userEvent.setup()

            const profile = {
                givenName: 'John',
                familyName: 'Do',
            }

            getUser.mockResolvedValue(profile as Profile)

            updateProfile.mockResolvedValue()

            await generateComponent({
                fields: [
                    'given_name',
                    'family_name'
                ]
            })

            expect(getUser).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    fields: 'given_name,family_name',
                })
            )

            const givenNameInput = screen.getByLabelText('givenName')
            expect(givenNameInput).toBeInTheDocument()
            expect(givenNameInput).toHaveValue(profile.givenName)
            
            const familyNameInput = screen.getByLabelText('familyName')
            expect(familyNameInput).toBeInTheDocument()
            expect(familyNameInput).toHaveValue(profile.familyName)
            
            await userEvent.clear(givenNameInput)
            await userEvent.type(givenNameInput, 'alice')
            await userEvent.clear(familyNameInput)
            await userEvent.type(familyNameInput, 'reachfive')
            
            const submitBtn = screen.getByRole('button', { name: 'save'})
            expect(submitBtn).toBeInTheDocument()

            await user.click(submitBtn)

            expect(updateProfile).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    data: {
                        givenName: 'alice',
                        familyName: 'reachfive',
                    }
                })
            )

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('api get user failed', async () => {
            getUser.mockRejectedValue('Unexpected error')

            await expect(
                generateComponent({
                    fields: [
                        'given_name',
                        'family_name'
                    ]
                })
            ).rejects.toEqual('Unexpected error')

            expect(getUser).toBeCalled()

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalledWith('Unexpected error')
        })

        test('api update user failed', async () => {
            const user = userEvent.setup()

            const profile = {
                givenName: 'John',
                familyName: 'Do',
            }

            getUser.mockResolvedValue(profile as Profile)

            updateProfile.mockRejectedValue('Unexpected error')

            await generateComponent({
                fields: [
                    'given_name',
                    'family_name'
                ]
            })

            expect(getUser).toBeCalled()

            const givenNameInput = screen.getByLabelText('givenName')
            await userEvent.clear(givenNameInput)
            await userEvent.type(givenNameInput, 'alice')

            const familyNameInput = screen.getByLabelText('familyName')
            await userEvent.clear(familyNameInput)
            await userEvent.type(familyNameInput, 'reachfive')
            
            const submitBtn = screen.getByRole('button', { name: 'save'})
            await user.click(submitBtn)

            expect(updateProfile).toBeCalled()

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalledWith('Unexpected error')
        })
    })

})
