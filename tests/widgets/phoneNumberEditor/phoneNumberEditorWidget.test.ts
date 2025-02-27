/**
 * @jest-environment jest-fixed-jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';

import PhoneNumberEditorWidget from '../../../src/widgets/phoneNumberEditor/phoneNumberEditorWidget';
import { componentGenerator, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {}

describe('Snapshot', () => {
    // @ts-expect-error partial Client
    const apiClient: Client = {
        updatePhoneNumber: jest.fn<Client['updatePhoneNumber']>().mockResolvedValue()
    }

    const generateSnapshot = snapshotGenerator(PhoneNumberEditorWidget, apiClient, defaultI18n)

    describe('phone number editor', () => {
        test('basic',
            generateSnapshot({ accessToken: 'azerty' })
        );
    });
})

describe('DOM testing', () => {
    const updatePhoneNumber = jest.fn<Client['updatePhoneNumber']>()
    const verifyPhoneNumber = jest.fn<Client['verifyPhoneNumber']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()
    
    beforeEach(() => {
        updatePhoneNumber.mockClear()
        onError.mockClear()
        onSuccess.mockClear()
    })

    // @ts-expect-error partial Client
    const apiClient: Client = {
        updatePhoneNumber,
        verifyPhoneNumber,
    }

    const generateComponent = componentGenerator(PhoneNumberEditorWidget, apiClient, defaultI18n)

    describe('phoneNumberEditor', () => {
        test('default', async () => {
            const user = userEvent.setup()

            updatePhoneNumber.mockResolvedValue()
            verifyPhoneNumber.mockResolvedValue()

            await generateComponent({ accessToken: 'azerty', onError, onSuccess })

            const phoneNumberInput = screen.getByLabelText('phoneNumber')
            expect(phoneNumberInput).toBeInTheDocument()
            
            await userEvent.clear(phoneNumberInput)
            await userEvent.type(phoneNumberInput, '+33123456789')
            
            const submitBtn = screen.getByRole('button', { name: 'send'})
            expect(submitBtn).toBeInTheDocument()

            await user.click(submitBtn)

            expect(updatePhoneNumber).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    phoneNumber: '+33123456789',
                })
            )

            const verificationCodeInput = screen.getByLabelText('verificationCode')
            expect(verificationCodeInput).toBeInTheDocument()
            
            await userEvent.clear(verificationCodeInput)
            await userEvent.type(verificationCodeInput, '123456')
            
            const submitCodeBtn = screen.getByRole('button', { name: 'send'})
            expect(submitCodeBtn).toBeInTheDocument()

            await user.click(submitCodeBtn)

            expect(verifyPhoneNumber).toBeCalledWith(
                expect.objectContaining({
                    accessToken: 'azerty',
                    phoneNumber: '+33123456789',
                    verificationCode: '123456',
                })
            )

            expect(onSuccess).toBeCalled()
            expect(onError).not.toBeCalled()
        })

        test('api update phoneNumber failed', async () => {
            const user = userEvent.setup()

            updatePhoneNumber.mockRejectedValue(new Error('Unexpected error'))

            await generateComponent({ accessToken: 'azerty', onError, onSuccess })

            const phoneNumberInput = screen.getByLabelText('phoneNumber')
            expect(phoneNumberInput).toBeInTheDocument()
            
            await userEvent.clear(phoneNumberInput)
            await userEvent.type(phoneNumberInput, '+33123456789')
            
            const submitBtn = screen.getByRole('button', { name: 'send'})

            await user.click(submitBtn)

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalledWith(new Error('Unexpected error'))
        })

        test('api code verificationfailed', async () => {
            const user = userEvent.setup()

            updatePhoneNumber.mockResolvedValue()
            verifyPhoneNumber.mockRejectedValue(new Error('Unexpected error'))

            await generateComponent({ accessToken: 'azerty', onError, onSuccess })

            const phoneNumberInput = screen.getByLabelText('phoneNumber')
            expect(phoneNumberInput).toBeInTheDocument()
            
            await userEvent.clear(phoneNumberInput)
            await userEvent.type(phoneNumberInput, '+33123456789')
            
            const submitBtn = screen.getByRole('button', { name: 'send'})
            expect(submitBtn).toBeInTheDocument()

            await user.click(submitBtn)

            expect(updatePhoneNumber).toBeCalled()

            const verificationCodeInput = screen.getByLabelText('verificationCode')
            expect(verificationCodeInput).toBeInTheDocument()
            
            await userEvent.clear(verificationCodeInput)
            await userEvent.type(verificationCodeInput, '123456')
            
            const submitCodeBtn = screen.getByRole('button', { name: 'send'})

            await user.click(submitCodeBtn)

            expect(verifyPhoneNumber).toBeCalled()

            expect(onSuccess).not.toBeCalled()
            expect(onError).toBeCalledWith(new Error('Unexpected error'))
        })
    })

})
