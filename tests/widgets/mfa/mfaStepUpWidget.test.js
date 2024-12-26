/**
 * @jest-environment jsdom
 */

import { afterEach, afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { findByText, render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom'
import 'jest-styled-components';

import mfaStepUpWidget from '../../../src/widgets/stepUp/mfaStepUpWidget';

const defaultConfig = { domain: 'local.reach5.net', language: 'fr' };

const auth = {
    redirectUri: 'http://localhost/'
};

const myStepUpToken = 'myStepUpToken';
const myChallengeId = 'myChallengeId';
const myVerificationCode = '1234';

const apiClient = {
    getMfaStepUpToken: jest.fn(),
    startPasswordless: jest.fn(),
    verifyMfaPasswordless: jest.fn()
};

describe('DOM testing', () => {
    const { location } = window;

    afterEach(() => {
        apiClient.getMfaStepUpToken.mockClear();
        apiClient.startPasswordless.mockClear();
        apiClient.verifyMfaPasswordless.mockClear();
        window.location.replace.mockClear();
    })

    beforeAll(() => {
        delete window.location;
        window.location = { replace: jest.fn() };
    })

    afterAll(() => {
        window.location = location;
    })

    const generateComponent = async (options = {}, config = defaultConfig) => {
        const result = await mfaStepUpWidget(options, { config, apiClient });
        return await waitFor(async () => render(result));
    };

    const assertStepUpWorkflow = async (user, amr) => {
        expect(apiClient.getMfaStepUpToken).toHaveBeenCalledTimes(1)

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
            expect(apiClient.startPasswordless).toHaveBeenNthCalledWith(1,
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

        await waitFor(() => expect(apiClient.verifyMfaPasswordless).toHaveBeenNthCalledWith(1,
            expect.objectContaining({
                challengeId: expect.stringMatching(myChallengeId),
                verificationCode: expect.stringMatching(myVerificationCode),
            })
        ))

        await waitFor(() => expect(window.location.replace).toHaveBeenCalledWith(
            expect.stringContaining(auth.redirectUri)
        ))
    }

    describe('with single amr (sms)', () => {

        beforeAll(() => {
            apiClient.getMfaStepUpToken.mockResolvedValue({
                amr: ['sms'],
                token: myStepUpToken,
            })
            apiClient.startPasswordless.mockResolvedValue({
                challengeId: myChallengeId,
            }),
            apiClient.verifyMfaPasswordless.mockResolvedValue({})
        })

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

            await assertStepUpWorkflow(user, ['sms'])
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

            await assertStepUpWorkflow(user, ['sms'])
        })
    })

    describe('with multiple amr', () => {
        
        beforeAll(() => {
            apiClient.getMfaStepUpToken.mockResolvedValue({
                amr: ['email', 'sms'],
                token: myStepUpToken,
            })
            apiClient.startPasswordless.mockResolvedValue({
                challengeId: myChallengeId,
            }),
            apiClient.verifyMfaPasswordless.mockResolvedValue({})
        })
        
        test('showStepUpStart: false', async () => {
            expect.assertions(12);

            const user = userEvent.setup()

            await generateComponent({
                auth,
                showStepUpStart: false
            });

            // StepUp start button
            const stepUpStartBtn = screen.queryByText('mfa.stepUp.start')
            expect(stepUpStartBtn).not.toBeInTheDocument();

            await assertStepUpWorkflow(user, ['email', 'sms'])
        })
    })

})
