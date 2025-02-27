/**
 * @jest-environment jest-fixed-jsdom
 */

import { ComponentProps } from 'react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Profile, type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';

import ProfileEditorWidget from '../../../src/widgets/profileEditor/profileEditorWidget';

import { componentGenerator, snapshotGenerator } from '../renderer'

const defaultI18n: I18nMessages = {}

describe('Snapshot', () => {
    const generateSnapshot = (options: ComponentProps<typeof ProfileEditorWidget>, user: Partial<Profile>) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getUser: jest.fn<Client['getUser']>().mockResolvedValue(user as Profile)
        }

        const generate = snapshotGenerator(ProfileEditorWidget, apiClient, defaultI18n)
        
        return generate(options)
    }

    describe('profile editor', () => {
        test('basic',
            generateSnapshot(
                {
                    accessToken: 'azerty',
                    fields: [
                        'givenName',
                        'familyName'
                    ],
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

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getUser,
        updateProfile,
    }

    const generateComponent = componentGenerator(ProfileEditorWidget, apiClient, defaultI18n)

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
                accessToken: 'azerty',
                fields: [
                    'given_name',
                    'family_name'
                ],
                onError,
                onSuccess,
            })

            expect(getUser).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    fields: 'givenName,familyName',
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
            getUser.mockRejectedValue(new Error('Unexpected error'))

            await generateComponent(
                {
                    accessToken: 'azerty',
                    fields: [
                        'given_name',
                        'family_name'
                    ],
                    onError,
                    onSuccess,
                },
                {},
                () => expect(getUser).toBeCalled()
            )

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalled()
            expect(onError).toBeCalledWith(new Error('Unexpected error'))
        })

        test('api update user failed', async () => {
            const user = userEvent.setup()

            const profile = {
                givenName: 'John',
                familyName: 'Do',
            }

            getUser.mockResolvedValue(profile as Profile)

            updateProfile.mockRejectedValue(new Error('Unexpected error'))

            await generateComponent({
                accessToken: 'azerty',
                fields: [
                    'given_name',
                    'family_name'
                ],
                onError,
                onSuccess,
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
            expect(onError).toBeCalledWith(new Error('Unexpected error'))
        })
    })

})
