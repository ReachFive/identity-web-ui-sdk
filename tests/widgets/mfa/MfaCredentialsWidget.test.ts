/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Client, MFA } from '@reachfive/identity-core'

import { I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import mfaCredentialsWidget from '../../../src/widgets/mfa/MfaCredentialsWidget';

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
    mfaSmsEnabled: true,
    mfaEmailEnabled: true,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
};

const defaultI18n: I18nMessages = {};
const profile = {
    emailVerified: true,
    authTypes: [],
    emails: {
        verified: [],
        unverified: [],
    },
    thirdPartyGrants: [],
    tokenRevocationRecord: {
        allLongLived: undefined,
        longLivedByClient: {},
    },
    providers: [],
    likesFriendsRatio: 0,
    localFriendsCount: 0,
    loginsCount: 0,
    origins: [],
    devices: [],
    hasPassword: false,
    socialIdentities: [],
    hasManagedProfile: false,
    providerDetails: [],
};

describe('Snapshot', () => {
    const generateSnapshot =
        (
            options: Partial<Parameters<typeof mfaCredentialsWidget>[0]>,
            config: Partial<Config> = {},
            credentials: (MFA.EmailCredential | MFA.PhoneCredential)[]
        ) =>
        async () => {
            // @ts-expect-error partial Client
            const apiClient: Client = {
                listMfaCredentials: jest
                    .fn<Client['listMfaCredentials']>()
                    .mockResolvedValue({ credentials }),
                getUser: jest.fn<Client['getUser']>().mockResolvedValue(profile),
            };

            const widget = await mfaCredentialsWidget(
                { accessToken: 'azerty', showIntro: true, ...options },
                { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
            );

            await waitFor(async () => {
                const { container, rerender } = await render(widget);

                await waitFor(() => expect(apiClient.listMfaCredentials).toHaveBeenCalled());

                await rerender(widget);

                expect(container).toMatchSnapshot();
            });
        };

    describe('mfaCredentials', () => {
        test('default', generateSnapshot({}, undefined, []))

        test(
            'no intro',
            generateSnapshot({ showIntro: false }, undefined, [
                {
                    type: 'sms',
                    phoneNumber: '33612345678',
                    friendlyName: 'identifier',
                    createdAt: '2022-09-21',
                },
                {
                    type: 'email',
                    email: 'root@reach5.co',
                    friendlyName: 'identifier',
                    createdAt: '2022-09-21',
                },
            ])
        );
    });
});

describe('DOM testing', () => {
    const listMfaCredentials = jest.fn<Client['listMfaCredentials']>();
    const startMfaEmailRegistration = jest.fn<Client['startMfaEmailRegistration']>();
    const startMfaPhoneNumberRegistration = jest.fn<Client['startMfaPhoneNumberRegistration']>();
    const verifyMfaEmailRegistration = jest.fn<Client['verifyMfaEmailRegistration']>();
    const verifyMfaPhoneNumberRegistration = jest.fn<Client['verifyMfaPhoneNumberRegistration']>();
    const getUser = jest.fn<Client['getUser']>();

    const onError = jest.fn();
    const onSuccess = jest.fn();

    beforeEach(() => {
        onError.mockClear();
        onSuccess.mockClear();
        listMfaCredentials.mockClear();
        startMfaEmailRegistration.mockClear();
        startMfaPhoneNumberRegistration.mockClear();
        verifyMfaEmailRegistration.mockClear();
        verifyMfaPhoneNumberRegistration.mockClear();
        getUser.mockClear();
    });

    const generateComponent = async (
        options: Partial<Parameters<typeof mfaCredentialsWidget>[0]>,
        config: Partial<Config> = {},
        credentials: (MFA.EmailCredential | MFA.PhoneCredential)[]
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listMfaCredentials: listMfaCredentials.mockResolvedValue({ credentials }),
            startMfaEmailRegistration: startMfaEmailRegistration.mockResolvedValue({
                status: 'email_sent',
            }),
            startMfaPhoneNumberRegistration: startMfaPhoneNumberRegistration.mockResolvedValue({
                status: 'sms_sent',
            }),
            verifyMfaEmailRegistration: verifyMfaEmailRegistration.mockResolvedValue(),
            verifyMfaPhoneNumberRegistration: verifyMfaEmailRegistration.mockResolvedValue(),
            getUser: getUser.mockResolvedValue(profile),
        };
        const result = await mfaCredentialsWidget(
            {
                accessToken: 'azerty',
                onError,
                onSuccess,
                ...options,
            },
            {
                apiClient,
                config: { ...defaultConfig, ...config },
                defaultI18n,
            }
        );
        return await waitFor(async () => render(result));
    };

    describe('mfaCredentials', () => {
        test('no credentials', async () => {
            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true },
                defaultConfig,
                []
            );
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).toBeInTheDocument()

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument()

            // Sms intro
            expect(
                screen.queryByText('mfa.phoneNumber.explain')
            ).toBeInTheDocument()

            // Form button sms
            expect(
                screen.queryByText('mfa.register.phoneNumber')
            ).toBeInTheDocument()

            // Form button remove email
            expect(
                screen.queryByText('mfa.remove.email')
            ).not.toBeInTheDocument()

            // Form button remove phone number
            expect(
                screen.queryByText('mfa.remove.phoneNumber')
            ).not.toBeInTheDocument()
        })

        test('register email', async () => {
            const user = userEvent.setup();

            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true },
                defaultConfig,
                []
            );

            // Form button email
            const emailButton = screen.getByText('mfa.register.email');
            expect(emailButton).toBeInTheDocument();

            await user.click(emailButton);
            expect(startMfaEmailRegistration).toBeCalled();

            await waitFor(async () => {
                expect(screen.queryByText('mfa.verify.email')).toBeInTheDocument();
            });

            const verificationCodeInput = screen.getByTestId('verification_code');
            expect(verificationCodeInput).toBeInTheDocument();
            await user.type(verificationCodeInput, '123456');

            verifyMfaEmailRegistration.mockReset().mockRejectedValue(new Error('Invalid code'));

            await user.click(screen.getByTestId('submit'));

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalled();

            verifyMfaEmailRegistration.mockReset().mockResolvedValue();
            onSuccess.mockReset();
            onError.mockReset();

            await user.click(screen.getByTestId('submit'));

            await waitFor(async () => {
                expect(screen.queryByText('mfa.email.registered')).toBeInTheDocument();
                expect(onSuccess).toBeCalled();
                expect(onError).not.toBeCalled();
            });
        });

        test('register phone number', async () => {
            const user = userEvent.setup();

            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true },
                defaultConfig,
                []
            );

            // phone number input
            const phoneNumberInput = screen.getByTestId('phone_number');
            await user.type(phoneNumberInput, '+33123456789');

            // Form button phone number
            const phoneNumberButton = screen.getByText('mfa.register.phoneNumber');
            expect(phoneNumberButton).toBeInTheDocument();

            await user.click(phoneNumberButton);
            expect(startMfaPhoneNumberRegistration).toBeCalled();

            await waitFor(async () => {
                expect(screen.queryByText('mfa.verify.sms')).toBeInTheDocument();
            });

            const verificationCodeInput = screen.getByTestId('verification_code');
            expect(verificationCodeInput).toBeInTheDocument();
            await user.type(verificationCodeInput, '123456');
            await user.click(screen.getByTestId('submit'));

            await waitFor(async () => {
                expect(screen.queryByText('mfa.phoneNumber.registered')).toBeInTheDocument();
                expect(onSuccess).toBeCalled();
                expect(onError).not.toBeCalled();
            });
        });

        test('requireMfaRegistration', async () => {
            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true, requireMfaRegistration: true },
                defaultConfig,
                []
            );
            // Email intro
            expect(
                screen.queryByText('mfa.email.explain.required')
            ).toBeInTheDocument()

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument()

            // Sms intro
            expect(
                screen.queryByText('mfa.phoneNumber.explain')
            ).toBeInTheDocument()

            // Form button sms
            expect(
                screen.queryByText('mfa.register.phoneNumber')
            ).toBeInTheDocument()

            // Form button remove email
            expect(
                screen.queryByText('mfa.remove.email')
            ).not.toBeInTheDocument()

            // Form button remove phone number
            expect(
                screen.queryByText('mfa.remove.phoneNumber')
            ).not.toBeInTheDocument()
        })

        test('only email credential', async () => {
            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true },
                defaultConfig,
                [
                    {
                        type: 'email',
                        email: 'alice@reach5.co',
                        friendlyName: 'identifier',
                        createdAt: '2022-09-21',
                    },
                ]
            );
            // Email intro
            expect(
                screen.queryByText('mfa.email.explain')
            ).not.toBeInTheDocument()

            // Form button email
            expect(
                screen.queryByText('mfa.register.email')
            ).not.toBeInTheDocument()

            // Sms intro
            expect(
                screen.queryByText('mfa.phoneNumber.explain')
            ).toBeInTheDocument()

            // Form button sms
            expect(
                screen.queryByText('mfa.register.phoneNumber')
            ).toBeInTheDocument()

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).toBeInTheDocument()

            // Form button remove phone number
            expect(
                screen.queryByText('mfa.remove.phoneNumber')
            ).not.toBeInTheDocument()
        })

        test('only sms credential', async () => {
            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true },
                defaultConfig,
                [
                    {
                        type: 'sms',
                        phoneNumber: '33612345678',
                        friendlyName: 'identifier',
                        createdAt: '2022-09-21',
                    },
                ]
            );
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).toBeInTheDocument()

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument()

            // Sms intro
            expect(
                screen.queryByText('mfa.phoneNumber.explain')
            ).not.toBeInTheDocument()

            // Form button sms
            expect(
                screen.queryByText('mfa.register.phoneNumber')
            ).not.toBeInTheDocument()

            // Form button remove email
            expect(
                screen.queryByText('mfa.remove.email')
            ).not.toBeInTheDocument()

            // Form button remove phone number
            expect(
                screen.queryByText('mfa.remove.phoneNumber')
            ).toBeInTheDocument()
        })

        test('all credentials', async () => {
            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true },
                defaultConfig,
                [
                    {
                        type: 'sms',
                        phoneNumber: '33612345678',
                        friendlyName: 'identifier',
                        createdAt: '2022-09-21',
                    },
                    {
                        type: 'email',
                        email: 'root@reach5.co',
                        friendlyName: 'identifier',
                        createdAt: '2022-09-21',
                    },
                ]
            );
            // Intro
            expect(
                screen.queryByText('mfa.email.explain')
            ).not.toBeInTheDocument()

            // Form button email
            expect(
                screen.queryByText('mfa.register.email')
            ).not.toBeInTheDocument()

            // Sms intro
            expect(
                screen.queryByText('mfa.phoneNumber.explain')
            ).not.toBeInTheDocument()

            // Form button sms
            expect(
                screen.queryByText('mfa.register.phoneNumber')
            ).not.toBeInTheDocument()

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).toBeInTheDocument()

            // Form button remove phone number
            expect(
                screen.queryByText('mfa.remove.phoneNumber')
            ).toBeInTheDocument()
        })
    })
})
