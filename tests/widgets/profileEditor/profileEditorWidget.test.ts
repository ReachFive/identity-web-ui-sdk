/**
 * @jest-environment jest-fixed-jsdom
 */
import { ComponentProps } from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client, type Profile } from '@reachfive/identity-core';

import { type I18nMessages } from '@/contexts/i18n';
import { OnError, OnSuccess } from '@/types';
import ProfileEditorWidget from '@/widgets/profileEditor/profileEditorWidget';

import { componentGenerator, defaultConfig, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    const generateSnapshot = (
        options: ComponentProps<typeof ProfileEditorWidget>,
        user: Partial<Profile>
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getUser: jest.fn<Client['getUser']>().mockResolvedValue(user as Profile),
        };

        const generate = snapshotGenerator(ProfileEditorWidget, apiClient, defaultI18n);

        return generate(options);
    };

    describe('profile editor', () => {
        test(
            'basic',
            generateSnapshot(
                {
                    accessToken: 'azerty',
                    fields: ['givenName', 'familyName'],
                },
                {
                    givenName: 'John',
                    familyName: 'Do',
                }
            )
        );
    });
});

describe('DOM testing', () => {
    const getUser = jest.fn<Client['getUser']>();
    const updateProfile = jest.fn<Client['updateProfile']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        getUser.mockClear();
        updateProfile.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getUser,
        updateProfile,
    };

    const generateComponent = componentGenerator(ProfileEditorWidget, apiClient, defaultI18n);

    describe('profileEditor', () => {
        test('default', async () => {
            const user = userEvent.setup();

            // @ts-expect-error partial Profile
            const profile: Profile = {
                givenName: 'John',
                familyName: 'Do',
                consents: {
                    optinTesting: {
                        granted: false,
                        consentType: 'opt-in',
                        consentVersion: {
                            versionId: 1,
                            language: 'fr',
                        },
                        date: '2021-01-01T00:00:00.000Z',
                    },
                },
            };

            getUser.mockResolvedValue(profile);

            updateProfile.mockResolvedValue();

            await generateComponent({
                accessToken: 'azerty',
                fields: ['given_name', 'family_name', 'optinTesting'],
                onError,
                onSuccess,
            });

            expect(getUser).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    fields: 'givenName,familyName,consents.optinTesting',
                })
            );

            const givenNameInput = screen.getByLabelText('givenName');
            expect(givenNameInput).toBeInTheDocument();
            expect(givenNameInput).toHaveValue(profile.givenName);

            const familyNameInput = screen.getByLabelText('familyName');
            expect(familyNameInput).toBeInTheDocument();
            expect(familyNameInput).toHaveValue(profile.familyName);

            await userEvent.clear(givenNameInput);
            await userEvent.type(givenNameInput, 'alice');
            await userEvent.clear(familyNameInput);
            await userEvent.type(familyNameInput, 'reachfive');

            // const consentCheckbox = screen.getByTestId('consents.optinTesting.1')
            const consentCheckbox = screen.getByLabelText(
                defaultConfig.consentsVersions.optinTesting.versions[0].title
            );
            await user.click(consentCheckbox);

            const submitBtn = screen.getByRole('button', { name: 'save' });
            expect(submitBtn).toBeInTheDocument();

            await user.click(submitBtn);

            expect(updateProfile).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    data: {
                        givenName: 'alice',
                        familyName: 'reachfive',
                        consents: {
                            optin_testing: {
                                // consent key should be snakecase
                                granted: true,
                                consentType: 'opt-in',
                                consentVersion: {
                                    versionId: 1,
                                    language: 'fr',
                                },
                            },
                        },
                    },
                })
            );

            expect(onSuccess).toBeCalledWith(expect.objectContaining({ name: 'user_updated' }));
            expect(onError).not.toBeCalled();
        });

        test('api get user failed', async () => {
            getUser.mockRejectedValue('Unexpected error');

            await generateComponent(
                {
                    accessToken: 'azerty',
                    fields: ['given_name', 'family_name'],
                    onError,
                    onSuccess,
                },
                {},
                () => expect(getUser).toBeCalled()
            );

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });

        test('api update user failed', async () => {
            const user = userEvent.setup();

            const profile = {
                givenName: 'John',
                familyName: 'Do',
            };

            getUser.mockResolvedValue(profile as Profile);

            updateProfile.mockRejectedValue('Unexpected error');

            await generateComponent({
                accessToken: 'azerty',
                fields: ['given_name', 'family_name'],
                onError,
                onSuccess,
            });

            expect(getUser).toBeCalled();

            const givenNameInput = screen.getByLabelText('givenName');
            await userEvent.clear(givenNameInput);
            await userEvent.type(givenNameInput, 'alice');

            const familyNameInput = screen.getByLabelText('familyName');
            await userEvent.clear(familyNameInput);
            await userEvent.type(familyNameInput, 'reachfive');

            const submitBtn = screen.getByRole('button', { name: 'save' });
            await user.click(submitBtn);

            expect(updateProfile).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
