/**
 * @jest-environment jsdom
 */

import { afterEach, afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { Client, RemoteSettings } from '@reachfive/identity-core'

import mfaStepUpWidget from '../../../src/widgets/stepUp/mfaStepUpWidget';
import { Config } from '../../../src/types';
import { I18nMessages } from '../../../src/core/i18n';

const remoteSettings: RemoteSettings = {
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    countryCode: 'fr',
    pkceEnforced: false,
    isPublic: true,
    scope: '',
    socialProviders: ['facebook', 'google'],
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
    consents: [],
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
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

const defaultI18n: I18nMessages = {
    date: 'Date',
    year: 'Année',
    month: 'Mois',
    day: 'Jour',
}

const auth = {
    redirectUri: 'http://localhost/'
};

const authType = 'sms';
const myStepUpToken = 'myStepUpToken';
const myChallengeId = 'myChallengeId';
const myVerificationCode = '1234';

describe('DOM testing', () => {
    const originalLocationReplace = window.location.replace;
    const locationReplaceMock = jest.fn()

    const apiClient: jest.Mocked<Client> = {
        addNewWebAuthnDevice: jest.fn<Client['addNewWebAuthnDevice']>(),
        checkSession: jest.fn<Client['checkSession']>(),
        checkUrlFragment: jest.fn<Client['checkUrlFragment']>(),
        exchangeAuthorizationCodeWithPkce: jest.fn<Client['exchangeAuthorizationCodeWithPkce']>(),
        getMfaStepUpToken: jest.fn<Client['getMfaStepUpToken']>().mockResolvedValue({
            amr: [authType],
            token: myStepUpToken,
        }),
        getSessionInfo: jest.fn<Client['getSessionInfo']>(),
        getSignupData: jest.fn<Client['getSignupData']>(),
        getUser: jest.fn<Client['getUser']>(),
        listMfaCredentials: jest.fn<Client['listMfaCredentials']>(),
        listTrustedDevices: jest.fn<Client['listTrustedDevices']>(),
        listWebAuthnDevices: jest.fn<Client['listWebAuthnDevices']>(),
        loginFromSession: jest.fn<Client['loginFromSession']>(),
        loginWithCredentials: jest.fn<Client['loginWithCredentials']>(),
        loginWithCustomToken: jest.fn<Client['loginWithCustomToken']>(),
        loginWithPassword: jest.fn<Client['loginWithPassword']>(),
        instantiateOneTap: jest.fn<Client['instantiateOneTap']>(),
        loginWithSocialProvider: jest.fn<Client['loginWithSocialProvider']>(),
        loginWithWebAuthn: jest.fn<Client['loginWithWebAuthn']>(),
        logout: jest.fn<Client['logout']>(),
        // @ts-ignore 
        off: jest.fn<Client['off']>(),
        // @ts-ignore 
        on: jest.fn<Client['on']>(),
        refreshTokens: jest.fn<Client['refreshTokens']>(),
        remoteSettings: jest.mocked(Promise.resolve(remoteSettings)),
        removeMfaEmail: jest.fn<Client['removeMfaEmail']>(),
        removeMfaPhoneNumber: jest.fn<Client['removeMfaPhoneNumber']>(),
        removeTrustedDevice: jest.fn<Client['removeTrustedDevice']>(),
        removeWebAuthnDevice: jest.fn<Client['removeWebAuthnDevice']>(),
        requestAccountRecovery: jest.fn<Client['requestAccountRecovery']>(),
        requestPasswordReset: jest.fn<Client['requestPasswordReset']>(),
        resetPasskeys: jest.fn<Client['resetPasskeys']>(),
        sendEmailVerification: jest.fn<Client['sendEmailVerification']>(),
        sendPhoneNumberVerification: jest.fn<Client['sendPhoneNumberVerification']>(),
        signup: jest.fn<Client['signup']>(),
        signupWithWebAuthn: jest.fn<Client['signupWithWebAuthn']>(),
        startMfaEmailRegistration: jest.fn<Client['startMfaEmailRegistration']>(),
        startMfaPhoneNumberRegistration: jest.fn<Client['startMfaPhoneNumberRegistration']>(),
        startPasswordless: jest.fn<Client['startPasswordless']>().mockResolvedValue({
            challengeId: myChallengeId,
        }),
        unlink: jest.fn<Client['unlink']>(),
        updateEmail: jest.fn<Client['updateEmail']>(),
        updatePassword: jest.fn<Client['updatePassword']>(),
        updatePhoneNumber: jest.fn<Client['updatePhoneNumber']>(),
        updateProfile: jest.fn<Client['updateProfile']>(),
        verifyMfaEmailRegistration: jest.fn<Client['verifyMfaEmailRegistration']>(),
        verifyMfaPasswordless: jest.fn<Client['verifyMfaPasswordless']>().mockResolvedValue({}),
        verifyMfaPhoneNumberRegistration: jest.fn<Client['verifyMfaPhoneNumberRegistration']>(),
        verifyPasswordless: jest.fn<Client['verifyPasswordless']>(),
        verifyPhoneNumber: jest.fn<Client['verifyPhoneNumber']>(),
    }

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: {
                replace: locationReplaceMock
            }
        });
    })

    afterEach(() => {
        locationReplaceMock.mockClear();
        apiClient.getMfaStepUpToken.mockClear();
        apiClient.startPasswordless.mockClear();
        apiClient.verifyMfaPasswordless.mockClear();
    })

    afterAll(() => {
        window.location.replace = originalLocationReplace;
    })

    const generateComponent = async (options: Parameters<typeof mfaStepUpWidget>[0] = {}, config: Config = defaultConfig) => {
        const result = await mfaStepUpWidget(options, { config, apiClient: apiClient, defaultI18n });
        return await waitFor(async () => {   
            return render(result)
        })
    };

    const assertStepUpWorkflow = async (user: UserEvent) => {
        expect(apiClient.getMfaStepUpToken).toHaveBeenCalledTimes(1);

        // When more than one amr options, display radio input selector
        const mfaStepUpTokenResult = apiClient.getMfaStepUpToken.mock.results.pop()
        if (mfaStepUpTokenResult?.type === 'return' && (await mfaStepUpTokenResult.value).amr.length > 1) {
            const amr = (await mfaStepUpTokenResult.value).amr
            const radioOptions = screen.getAllByLabelText<HTMLInputElement>('authType')
            expect(radioOptions.map(radioOption => radioOption.value)).toEqual(amr)
            user.click(radioOptions.find(radioOption => radioOption.value === 'sms')!)
        }

        expect(apiClient.startPasswordless).toHaveBeenNthCalledWith(1,
            expect.objectContaining({
                authType: expect.stringMatching(authType),
                stepUp: expect.stringMatching(myStepUpToken),
            })
        );

        // wait for view redirect to code verification view
        await waitFor(async () => {
            expect(screen.queryByText('passwordless.sms.verification.intro')).toBeInTheDocument();
        })

        expect(screen.queryByLabelText('verificationCode')).toBeInTheDocument();
        const input = screen.getByPlaceholderText('verificationCode')
        expect(input).toBeInTheDocument();
        const submitBtn = screen.getByTestId('submit')
        expect(submitBtn).toBeInTheDocument();

        await user.type(input, myVerificationCode);
        await user.click(submitBtn);

        expect(apiClient.verifyMfaPasswordless).toHaveBeenNthCalledWith(1,
            expect.objectContaining({
                challengeId: expect.stringMatching(myChallengeId),
                verificationCode: expect.stringMatching(myVerificationCode),
            })
        )

        expect(window.location.replace).toHaveBeenCalledWith(
            expect.stringContaining(auth.redirectUri)
        )
    }

    describe('mfaStepUp', () => {
        test('showStepUpStart: true', async () => {
            expect.assertions(9);

            const user = userEvent.setup()

            await generateComponent({
                auth,
                showStepUpStart: true
            });

            // StepUp start button
            const stepUpStartBtn = screen.getByText('mfa.stepUp.start')
            expect(stepUpStartBtn).toBeInTheDocument();
            
            await user.click(stepUpStartBtn);

            await assertStepUpWorkflow(user)
        })

        test('showStepUpStart: false', async () => {
            expect.assertions(9);

            const user = userEvent.setup()

            await generateComponent({
                auth,
                showStepUpStart: false
            });

            // StepUp start button
            const stepUpStartBtn = screen.queryByText('mfa.stepUp.start')
            expect(stepUpStartBtn).not.toBeInTheDocument();

            await assertStepUpWorkflow(user)
        })
    })

})
