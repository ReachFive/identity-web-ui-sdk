/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/?email=alice@reach5.co&verificationCode=123456&email=alice@reach5.co&clientId=local"}
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import type { PasswordStrengthScore, Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import type { Config } from '../../../src/types';

import accountRecoveryWidget from '../../../src/widgets/accountRecovery/accountRecoveryWidget';

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

const getPasswordStrengthImplementation = (password: string) => {
    let score = 0
    if (password.match(/[a-z]+/)) score++
    if (password.match(/[0-9]+/)) score++
    if (password.match(/[^a-z0-9]+/)) score++
    if (password.length > 8) score++
    return Promise.resolve({ score: score as PasswordStrengthScore })
}

describe('DOM testing', () => {
    const getPasswordStrength = jest.fn<Client['getPasswordStrength']>().mockImplementation(getPasswordStrengthImplementation)
    const resetPasskeys = jest.fn<Client['resetPasskeys']>()
    const updatePassword = jest.fn<Client['updatePassword']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()
    
    beforeEach(() => {
        getPasswordStrength.mockClear()
        resetPasskeys.mockClear()
        updatePassword.mockClear()
        onError.mockClear()
        onSuccess.mockClear()
    })

    const generateComponent = async (options: Partial<Parameters<typeof accountRecoveryWidget>[0]> = {}, config: Partial<Config> = {}) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getPasswordStrength,
            resetPasskeys,
            updatePassword,
        }

        const result = await accountRecoveryWidget(
            { onError, onSuccess, ...options },
            {config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        return waitFor(async () => {
            return render(result);
        })
    };

    describe('accountRecovery', () => {
        test('default', async () => {
            const user = userEvent.setup()

            resetPasskeys.mockResolvedValue()

            await generateComponent({})
            
            const passkeyResetBtn = screen.getByRole('button', { name: 'accountRecovery.passkeyReset.button'})
            expect(passkeyResetBtn).toBeInTheDocument()

            await user.click(passkeyResetBtn)

            expect(resetPasskeys).toBeCalledWith(
                expect.objectContaining({
                    email: 'alice@reach5.co', /** @see @jest-environment-options on top of file */
                    verificationCode: '123456', /** @see @jest-environment-options on top of file */
                    clientId: 'local' /** @see @jest-environment-options on top of file */
                })
            )

            expect(screen.queryByText('accountRecovery.passkeyReset.successMessage')).toBeInTheDocument()

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('allowCreatePassword = false', async () => {
            await generateComponent({
                allowCreatePassword: false
            })

            const createNewPasswordBtn = screen.queryByRole('link', { name: "accountRecovery.password.title" })
            
            expect(createNewPasswordBtn).not.toBeInTheDocument()
        })

        test('Create a new password', async () => {
            const user = userEvent.setup()
    
            updatePassword.mockResolvedValue()
    
            await generateComponent({})
    
            const createNewPasswordBtn = screen.getByRole('link', { name: "accountRecovery.password.title" })
            expect(createNewPasswordBtn).toBeInTheDocument()
            
            await user.click(createNewPasswordBtn)
    
            const newPasswordInput = screen.getByLabelText('newPassword')
            await user.clear(newPasswordInput)
            await user.type(newPasswordInput, 'Wond3rFu11_Pa55w0rD*$')
    
            const passwordConfirmationInput = screen.getByLabelText('passwordConfirmation')
            await user.clear(passwordConfirmationInput)
            await user.type(passwordConfirmationInput, 'Wond3rFu11_Pa55w0rD*$')
            
            const submitBtn = screen.getByRole('button', { name: 'send'})
            expect(submitBtn).toBeInTheDocument()
    
            await user.click(submitBtn)
    
            expect(updatePassword).toBeCalledWith(
                expect.objectContaining({
                    password: 'Wond3rFu11_Pa55w0rD*$',
                    email: 'alice@reach5.co', /** @see @jest-environment-options on top of file */
                    verificationCode: '123456', /** @see @jest-environment-options on top of file */
                    clientId: 'local' /** @see @jest-environment-options on top of file */
                })
            )
    
            expect(screen.queryByText('passwordReset.successMessage')).toBeInTheDocument()
    
            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('resetPasskeys api failure', async () => {
            const user = userEvent.setup()

            resetPasskeys.mockRejectedValue('Unexpected error')

            await generateComponent({})
            
            const passkeyResetBtn = screen.getByRole('button', { name: 'accountRecovery.passkeyReset.button'})

            await user.click(passkeyResetBtn)

            expect(resetPasskeys).toBeCalled()

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalled()
        })

        test('updatePassword api failure', async () => {
            const user = userEvent.setup()

            updatePassword.mockRejectedValue('Unexpected error')

            await generateComponent({})
            
            const createNewPasswordBtn = screen.getByRole('link', { name: "accountRecovery.password.title" })

            await user.click(createNewPasswordBtn)

            const newPasswordInput = screen.getByLabelText('newPassword')
            await user.clear(newPasswordInput)
            await user.type(newPasswordInput, 'Wond3rFu11_Pa55w0rD*$')
    
            const passwordConfirmationInput = screen.getByLabelText('passwordConfirmation')
            await user.clear(passwordConfirmationInput)
            await user.type(passwordConfirmationInput, 'Wond3rFu11_Pa55w0rD*$')
            
            const submitBtn = screen.getByRole('button', { name: 'send'})
            expect(submitBtn).toBeInTheDocument()
    
            await user.click(submitBtn)
    
            expect(updatePassword).toBeCalled()

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalled()
        })
    })
})