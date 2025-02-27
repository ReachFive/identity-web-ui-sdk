/**
 * @jest-environment jest-fixed-jsdom
 */

import { beforeEach, afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import MfaStepUpWidget from '../../../src/widgets/stepUp/mfaStepUpWidget';
import { I18nMessages } from '../../../src/core/i18n';
import { Client } from '@reachfive/identity-core';
import { componentGenerator } from '../renderer';

const defaultI18n: I18nMessages = {}

const auth = {
    redirectUri: 'http://localhost/'
};

const myStepUpToken = 'myStepUpToken';
const myChallengeId = 'myChallengeId';
const myVerificationCode = '1234';

describe('DOM testing', () => {
    const { location } = window;

    const replaceMock = jest.fn()

    const getMfaStepUpToken = jest.fn<Client['getMfaStepUpToken']>()
    const startPasswordless = jest.fn<Client['startPasswordless']>()
    const verifyMfaPasswordless = jest.fn<Client['verifyMfaPasswordless']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()

    beforeEach(() => {
        replaceMock.mockClear();
        onError.mockClear()
        onSuccess.mockClear()
        getMfaStepUpToken.mockClear()
        startPasswordless.mockClear()
        verifyMfaPasswordless.mockClear()
    })

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: {
                replace: replaceMock
            },
            writable: true
        });
    })

    afterAll(() => {
        window.location = location;
    })

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getMfaStepUpToken,
        startPasswordless,
        verifyMfaPasswordless,
    }

    const generateComponent = componentGenerator(MfaStepUpWidget, apiClient, defaultI18n)

    const assertStepUpWorkflow = async (user: UserEvent, amr: string[]) => {
        expect(getMfaStepUpToken).toHaveBeenCalledTimes(1);

        // When more than one amr options, display radio input selector
        if (amr.length > 1) {
            expect(await screen.findByText('mfa.select.factor')).toBeInTheDocument()
            amr.forEach(value => {
                expect(screen.getByLabelText(value)).toBeInTheDocument()
            })
            await user.click(screen.getByLabelText('sms'))
            await user.click(screen.getByTestId('submit'))
        }

        await waitFor(async () => {
            expect(startPasswordless).toHaveBeenNthCalledWith(1,
                expect.objectContaining({
                    authType: 'sms',
                    stepUp: myStepUpToken,
                })
            );
        })

        // wait for view redirect to code verification view
        expect(await screen.findByText('passwordless.sms.verification.intro')).toBeInTheDocument();

        expect(screen.queryByLabelText('verificationCode')).toBeInTheDocument();
        const input = screen.getByPlaceholderText('verificationCode')
        expect(input).toBeInTheDocument();
        const submitBtn = screen.getByTestId('submit')
        expect(submitBtn).toBeInTheDocument();

        await user.type(input, myVerificationCode);
        await user.click(submitBtn);

        await waitFor(() => expect(verifyMfaPasswordless).toHaveBeenNthCalledWith(1,
            expect.objectContaining({
                challengeId: expect.stringMatching(myChallengeId),
                verificationCode: expect.stringMatching(myVerificationCode),
            })
        ))

        expect(onSuccess).toBeCalled()
        expect(onError).not.toBeCalled()

        await waitFor(() => expect(window.location.replace).toHaveBeenCalledWith(
            expect.stringContaining(auth.redirectUri)
        ))
    }

    describe('with single amr (sms)', () => {

        beforeAll(() => {
            getMfaStepUpToken.mockResolvedValue({
                amr: ['sms'],
                token: myStepUpToken,
            })
            startPasswordless.mockResolvedValue({
                challengeId: myChallengeId,
            }),
            verifyMfaPasswordless.mockResolvedValue({})
        })

        test('showStepUpStart: true', async () => {
            expect.assertions(15);

            const user = userEvent.setup()

            await generateComponent({
                auth,
                showStepUpStart: true,
                onError,
                onSuccess,
            });

            // StepUp start button
            const stepUpStartBtn = screen.getByText('mfa.stepUp.start')
            expect(stepUpStartBtn).toBeInTheDocument();

            await user.click(stepUpStartBtn);

            await assertStepUpWorkflow(user, ['sms'])
        })

        test('showStepUpStart: false', async () => {
            expect.assertions(15);

            const user = userEvent.setup()

            await generateComponent({
                auth,
                showStepUpStart: false,
                onError,
                onSuccess,
            });

            // StepUp start button
            const stepUpStartBtn = screen.queryByText('mfa.stepUp.start')
            expect(stepUpStartBtn).not.toBeInTheDocument();

            await assertStepUpWorkflow(user, ['sms'])
        })
    })

    describe('with multiple amr', () => {
        
        beforeAll(() => {
            getMfaStepUpToken.mockResolvedValue({
                amr: ['email', 'sms'],
                token: myStepUpToken,
            })
            startPasswordless.mockResolvedValue({
                challengeId: myChallengeId,
            }),
            verifyMfaPasswordless.mockResolvedValue({})
        })
        
        test('showStepUpStart: false', async () => {
            expect.assertions(18);

            const user = userEvent.setup()

            await generateComponent({
                auth,
                showStepUpStart: false,
                onError,
                onSuccess,
            });

            // StepUp start button
            const stepUpStartBtn = screen.queryByText('mfa.stepUp.start')
            expect(stepUpStartBtn).not.toBeInTheDocument();

            await assertStepUpWorkflow(user, ['email', 'sms'])
        })
    })

})
