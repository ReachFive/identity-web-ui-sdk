/**
 * @jest-environment jsdom
 */

import { afterEach, afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom'
import 'jest-styled-components';

import mfaStepUpWidget from '../../../src/widgets/stepUp/mfaStepUpWidget';

const defaultConfig = { domain: 'local.reach5.net', language: 'fr' };

const auth = {
    redirectUri: 'http://localhost/'
};

const authType = 'sms';
const myStepUpToken = 'myStepUpToken';
const myChallengeId = 'myChallengeId';
const myVerificationCode = '1234';

const apiClient = {
    getMfaStepUpToken: jest.fn().mockResolvedValue({
        amr: [authType],
        token: myStepUpToken,
    }),
    startPasswordless: jest.fn().mockResolvedValue({
        challengeId: myChallengeId,
    }),
    verifyMfaPasswordless: jest.fn().mockResolvedValue({})
};

describe('DOM testing', () => {
    const { location } = window;

    afterEach(() => {
        apiClient.getMfaStepUpToken?.mockClear();
        apiClient.startPasswordless?.mockClear();
        window.location.replace?.mockClear();
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
        return render(result);
    };

    const assertStepUpWorkflow = async (user) => {
        return await waitFor(async () => {
            expect(apiClient.getMfaStepUpToken).toHaveBeenCalledTimes(1);

            expect(apiClient.startPasswordless).toHaveBeenNthCalledWith(1,
                expect.objectContaining({
                    authType: expect.stringMatching(authType),
                    stepUp: expect.stringMatching(myStepUpToken),
                })
            );

            expect(screen.queryByText('passwordless.sms.verification.intro')).toBeInTheDocument();
            expect(screen.queryByLabelText('verificationCode')).toBeInTheDocument();
            const input = screen.queryByPlaceholderText('verificationCode')
            expect(input).toBeInTheDocument();
            const submitBtn = screen.queryByTestId('submit')
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
        })
    }

    describe('mfaStepUp', () => {
        test('showStepUpStart: true', async () => {
            expect.assertions(9);

            const user = userEvent.setup()

            await waitFor(async () => {
                await generateComponent({
                    auth,
                    showStepUpStart: true
                }, defaultConfig, []);
                
                // StepUp start button
                const stepUpStartBtn = screen.queryByText('mfa.stepUp.start')
                expect(stepUpStartBtn).toBeInTheDocument();

                await user.click(stepUpStartBtn);

                await assertStepUpWorkflow(user)
            })
        })

        test('showStepUpStart: false', async () => {
            expect.assertions(11);

            const user = userEvent.setup()

            await waitFor(async () => {
                await generateComponent({
                    auth,
                    showStepUpStart: false
                }, defaultConfig, []);

                // StepUp start button
                expect(screen.queryByText('mfa.stepUp.start')).not.toBeInTheDocument();

                await assertStepUpWorkflow(user)
            })
        })
    })

})
