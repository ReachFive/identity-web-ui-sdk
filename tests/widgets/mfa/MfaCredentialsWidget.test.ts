/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
// import renderer from 'react-test-renderer';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'

import { Client, MFA } from '@reachfive/identity-core';

import type { Config } from '../../../src/types';
import { I18nMessages } from '../../../src/core/i18n';

import mfaCredentialsWidget from "../../../src/widgets/mfa/MfaCredentialsWidget";

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
    }
};

const defaultI18n: I18nMessages = {}

// const i18nResolver = resolveI18n(defaultI18n)

describe('Snapshot', () => {
    const generateSnapshot = (
        options: Partial<Parameters<typeof mfaCredentialsWidget>[0]>,
        config: Config = defaultConfig,
        credentials: (MFA.EmailCredential | MFA.PhoneCredential)[]
    ) => async () => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listMfaCredentials: jest.fn<Client['listMfaCredentials']>().mockReturnValueOnce(Promise.resolve({ credentials })),
        };
        
        const widget = await mfaCredentialsWidget(
            { accessToken: 'azerty', showIntro: true, ...options },
            { apiClient, config, defaultI18n }
        )

        await waitFor(async () => {
            const { container, rerender } = await render(widget);

            await waitFor(() => expect(apiClient.listMfaCredentials).toHaveBeenCalled())
    
            await rerender(widget)

            expect(container).toMatchSnapshot();
        })
    };

    describe('mfaCredentials', () => {
        test('default', generateSnapshot({}, undefined, []));

        test('no intro', generateSnapshot({ showIntro: false }, undefined, [
            { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
            { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
        ]));
    });
});

describe('DOM testing', () => {
    const listMfaCredentials = jest.fn<Client['listMfaCredentials']>()
    const startMfaEmailRegistration = jest.fn<Client['startMfaEmailRegistration']>()
    const startMfaPhoneNumberRegistration = jest.fn<Client['startMfaPhoneNumberRegistration']>()
    const verifyMfaEmailRegistration = jest.fn<Client['verifyMfaEmailRegistration']>()
    
    const onSuccess = jest.fn()

    beforeEach(() => {
        onSuccess.mockClear()
        listMfaCredentials.mockClear()
        startMfaEmailRegistration.mockClear()
    })

    const generateComponent = async (
        options: Partial<Parameters<typeof mfaCredentialsWidget>[0]>,
        config: Config = defaultConfig,
        credentials: (MFA.EmailCredential | MFA.PhoneCredential)[]
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listMfaCredentials: listMfaCredentials.mockReturnValueOnce(Promise.resolve({ credentials })),
            startMfaEmailRegistration: startMfaEmailRegistration.mockResolvedValue({ status: 'email_sent' }),
            startMfaPhoneNumberRegistration: startMfaPhoneNumberRegistration.mockResolvedValue({ status: 'sms_sent' }),
            verifyMfaEmailRegistration: verifyMfaEmailRegistration.mockResolvedValue()
        }
        const result = await mfaCredentialsWidget({ accessToken: 'azerty', onSuccess, ...options }, { apiClient, config, defaultI18n });
        return await waitFor(async () => {
            return render(result);
        })
    };

    describe('mfaCredentials', () => {
        test('no credentials', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, []);
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument();
            
            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).not.toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).not.toBeInTheDocument();
        });

        test('register email', async () => {
            const user = userEvent.setup()

            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, []);

            // Form button email
            const emailButton = screen.getByText('mfa.register.email')
            expect(emailButton).toBeInTheDocument();
            
            await user.click(emailButton)
            expect(startMfaEmailRegistration).toBeCalled()

            await waitFor(async () => {
                expect(screen.queryByText('mfa.verify.email')).toBeInTheDocument();
            })

            const verificationCodeInput = screen.getByTestId('verification_code')
            expect(verificationCodeInput).toBeInTheDocument();
            await user.type(verificationCodeInput, '123456')
            await user.click(screen.getByTestId('submit'))

            await waitFor(async () => {
                expect(screen.queryByText('mfa.email.registered')).toBeInTheDocument();
                expect(onSuccess).toBeCalled()
            })
        });

        test('register phone number', async () => {
            const user = userEvent.setup()

            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, []);

            // Form button phone number
            const phoneNumberButton = screen.getByText('mfa.register.phoneNumber')
            expect(phoneNumberButton).toBeInTheDocument();
            
            await user.click(phoneNumberButton)
            screen.debug()
            expect(startMfaPhoneNumberRegistration).toBeCalled()

            await waitFor(async () => {
                expect(screen.queryByText('mfa.verify.sms')).toBeInTheDocument();
            })

            const verificationCodeInput = screen.getByTestId('verification_code')
            expect(verificationCodeInput).toBeInTheDocument();
            await user.type(verificationCodeInput, '123456')
            await user.click(screen.getByTestId('submit'))

            await waitFor(async () => {
                expect(screen.queryByText('mfa.sms.registered')).toBeInTheDocument();
                expect(onSuccess).toBeCalled()
            })
        });

        test('requireMfaRegistration', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true, requireMfaRegistration: true}, defaultConfig, []);
            // Email intro
            expect(screen.queryByText('mfa.email.explain.required')).toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument();

            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).not.toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).not.toBeInTheDocument();
        });

        test('only email credential', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, [
                { type: 'email', email: 'alice@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' },
            ]);
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).not.toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).not.toBeInTheDocument();

            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).not.toBeInTheDocument();
        });

        test('only sms credential', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, [
                { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
            ]);
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument();
            
            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).not.toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).not.toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).not.toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).toBeInTheDocument();
        });

        test('all credentials', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, [
                { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
                { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
            ]);
            // Intro
            expect(screen.queryByText('mfa.email.explain')).not.toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).not.toBeInTheDocument();

            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).not.toBeInTheDocument();
            
            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).not.toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).toBeInTheDocument();
        });
    });
});
