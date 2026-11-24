/**
 * @jest-environment jsdom
 */
import React from 'react';

import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Client } from '@reachfive/identity-core';

import { StepUpFlow, type StepUpFlowProps } from '../../../src/widgets/stepUp/stepUpFlow';
import { WidgetContext } from '../../components/form/WidgetContext';

import type { Config, OnError, OnSuccess } from '../../../src/types';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: [],
    customProviders: {},
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
    loginTypeAllowed: {
        email: true,
        phoneNumber: true,
        customIdentifier: true,
    },
    isImplicitFlowForbidden: false,
};

const startPasswordless = jest.fn<Client['startPasswordless']>();
const verifyMfaPasswordless = jest.fn<Client['verifyMfaPasswordless']>();
const achieveStepUpWithWebAuthn = jest.fn<Client['achieveStepUpWithWebAuthn']>();
const onError = jest.fn<OnError>();
const onSuccess = jest.fn<OnSuccess>();
const replace = jest.fn();

// @ts-expect-error partial Client
const client: Client = { startPasswordless, verifyMfaPasswordless, achieveStepUpWithWebAuthn };

const renderFlow = (
    props: Partial<StepUpFlowProps> = {},
    config: Partial<Config> = {},
    { strict = false } = {}
) => {
    const flow = (
        <WidgetContext
            client={client}
            config={{ ...defaultConfig, ...config }}
            defaultMessages={{}}
        >
            <StepUpFlow
                token="tkn"
                amr={['email', 'sms']}
                auth={{ redirectUri: 'http://localhost/' }}
                onSuccess={onSuccess}
                onError={onError}
                {...props}
            />
        </WidgetContext>
    );
    return render(strict ? <React.StrictMode>{flow}</React.StrictMode> : flow);
};

const codeInput = () => screen.getByRole('textbox', { name: 'verificationCode' });

describe('StepUpFlow', () => {
    const { location } = window;

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: { search: '', replace },
            writable: true,
        });
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', { value: location, writable: true });
    });

    beforeEach(() => {
        jest.resetAllMocks();
        startPasswordless.mockResolvedValue({ challengeId: 'challenge-1' });
        verifyMfaPasswordless.mockResolvedValue({ idToken: 'id-token' });
    });

    test('lists the code factors under the title', () => {
        renderFlow();

        expect(screen.getByRole('heading', { name: 'mfa.stepUp.title' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfaList.email' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfaList.phoneNumber' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'mfaList.back' })).not.toBeInTheDocument();
    });

    test('sends a code and opens the code screen', async () => {
        const user = userEvent.setup();
        renderFlow();

        await user.click(screen.getByRole('button', { name: 'mfaList.phoneNumber' }));

        expect(startPasswordless).toHaveBeenCalledWith({ authType: 'sms', stepUp: 'tkn' });
        expect(await screen.findByRole('heading', { name: 'mfa.code.title' })).toBeInTheDocument();
        expect(screen.getByText('passwordless.sms.verification.intro')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'mfaList.back' }));

        expect(screen.getByRole('heading', { name: 'mfa.stepUp.title' })).toBeInTheDocument();
    });

    test('starts the only factor directly', async () => {
        // StrictMode runs the mount effect twice: the code must still be sent once
        renderFlow({ amr: ['email', 'totp'] }, {}, { strict: true });

        expect(await screen.findByRole('heading', { name: 'mfa.code.title' })).toBeInTheDocument();
        expect(startPasswordless).toHaveBeenCalledTimes(1);
        expect(startPasswordless).toHaveBeenCalledWith({ authType: 'email', stepUp: 'tkn' });
        expect(screen.getByText('passwordless.email.verification.intro')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'mfaList.back' })).not.toBeInTheDocument();
    });

    test('stays on the list when the code cannot be sent', async () => {
        const error = new Error('cannot send');
        startPasswordless.mockRejectedValue(error);
        const user = userEvent.setup();
        renderFlow();

        await user.click(screen.getByRole('button', { name: 'mfaList.email' }));

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(error);
        expect(screen.getByRole('heading', { name: 'mfa.stepUp.title' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfaList.email' })).not.toHaveAttribute(
            'aria-busy'
        );
    });

    test('labels the list with the title', () => {
        renderFlow();

        expect(screen.getByRole('list', { name: 'mfa.stepUp.title' })).toBeInTheDocument();
    });

    test('shows why the code cannot be sent until the next attempt', async () => {
        startPasswordless.mockRejectedValueOnce(new Error('cannot send'));
        let sent: (response: { challengeId: string }) => void = () => undefined;
        startPasswordless.mockReturnValueOnce(new Promise(resolve => (sent = resolve)));
        const user = userEvent.setup();
        renderFlow();

        await user.click(screen.getByRole('button', { name: 'mfaList.email' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('cannot send');
        expect(onError).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'mfaList.email' }));

        expect(screen.getByRole('button', { name: 'mfaList.email' })).toHaveAttribute(
            'aria-busy',
            'true'
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        sent({ challengeId: 'challenge-1' });

        expect(await screen.findByRole('heading', { name: 'mfa.code.title' })).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
    });

    test('keeps the only factor offered when its code cannot be sent', async () => {
        const error = new Error('cannot send');
        startPasswordless.mockRejectedValueOnce(error);
        const user = userEvent.setup();
        renderFlow({ amr: ['email'] });

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(error);
        expect(screen.getByRole('alert')).toHaveTextContent('cannot send');
        const row = screen.getByRole('button', { name: 'mfaList.email' });
        expect(row).not.toHaveAttribute('aria-busy');

        await user.click(row);

        expect(await screen.findByRole('heading', { name: 'mfa.code.title' })).toBeInTheDocument();
        expect(startPasswordless).toHaveBeenCalledTimes(2);
        expect(screen.queryByRole('button', { name: 'mfaList.back' })).not.toBeInTheDocument();
    });

    test('treats a code sent without a challenge as a failure', async () => {
        startPasswordless.mockResolvedValueOnce({});
        const user = userEvent.setup();
        renderFlow();

        await user.click(screen.getByRole('button', { name: 'mfaList.email' }));

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(screen.getByRole('heading', { name: 'mfa.stepUp.title' })).toBeInTheDocument();
    });

    test('reports a refused code', async () => {
        const error = new Error('invalid code');
        verifyMfaPasswordless.mockRejectedValue(error);
        const user = userEvent.setup();
        renderFlow();

        await user.click(screen.getByRole('button', { name: 'mfaList.email' }));
        await screen.findByRole('heading', { name: 'mfa.code.title' });
        await user.type(codeInput(), '123456');

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(error);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });

    test('verifies the code and redirects', async () => {
        const user = userEvent.setup();
        renderFlow();

        await user.click(screen.getByRole('button', { name: 'mfaList.email' }));
        await screen.findByRole('heading', { name: 'mfa.code.title' });
        // the last digit submits the code
        await user.type(codeInput(), '123456');

        await waitFor(() =>
            expect(verifyMfaPasswordless).toHaveBeenCalledWith({
                challengeId: 'challenge-1',
                verificationCode: '123456',
                trustDevice: undefined,
            })
        );
        expect(onSuccess).toHaveBeenCalledWith({
            name: 'login_2nd_step',
            authType: 'email',
            authResult: { idToken: 'id-token' },
        });
        expect(replace).toHaveBeenCalledWith('http://localhost/?id_token=id-token');
        expect(onError).not.toHaveBeenCalled();
    });

    test('trusts the device', async () => {
        const user = userEvent.setup();
        renderFlow({ allowTrustDevice: true }, { rbaEnabled: true });

        await user.click(screen.getByRole('button', { name: 'mfaList.phoneNumber' }));
        await screen.findByRole('heading', { name: 'mfa.code.title' });
        await user.type(codeInput(), '123456');
        // an auto-submit would start on the next tick: let it run before checking it did not
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(verifyMfaPasswordless).not.toHaveBeenCalled();

        await user.click(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' }));
        await user.click(screen.getByRole('button', { name: 'mfa.verify' }));

        await waitFor(() =>
            expect(verifyMfaPasswordless).toHaveBeenCalledWith({
                challengeId: 'challenge-1',
                verificationCode: '123456',
                trustDevice: true,
            })
        );
        expect(onSuccess).toHaveBeenCalledWith({ name: 'mfa_trusted_device_added' });
    });

    test('sends a new code with the same token', async () => {
        const user = userEvent.setup();
        renderFlow();

        await user.click(screen.getByRole('button', { name: 'mfaList.phoneNumber' }));
        await screen.findByRole('heading', { name: 'mfa.code.title' });

        startPasswordless.mockResolvedValueOnce({ challengeId: 'challenge-2' });
        await user.click(screen.getByRole('button', { name: 'verificationCode.resend.count' }));

        expect(startPasswordless).toHaveBeenCalledTimes(2);
        expect(startPasswordless).toHaveBeenLastCalledWith({ authType: 'sms', stepUp: 'tkn' });

        await user.type(codeInput(), '123456');

        await waitFor(() =>
            expect(verifyMfaPasswordless).toHaveBeenCalledWith(
                expect.objectContaining({ challengeId: 'challenge-2' })
            )
        );
    });

    test('reports a step-up with no factor it can offer', async () => {
        // a passkey disabled for the tenant, and no code factor
        renderFlow({ amr: ['webauthn', 'totp'] }, { webAuthn: false }, { strict: true });

        expect(screen.getByRole('heading', { name: 'mfa.stepUp.title' })).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('unexpectedErrorOccurred');
        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(startPasswordless).not.toHaveBeenCalled();
    });

    test('hides the passkey from a browser without WebAuthn', () => {
        renderFlow({ amr: ['webauthn', 'email', 'sms'] }, { webAuthn: true });

        expect(screen.getByRole('button', { name: 'mfaList.email' })).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /mfa\.stepUp\.usePasskey/ })
        ).not.toBeInTheDocument();
    });

    describe('with a passkey', () => {
        const passkeyAmr = ['webauthn', 'email', 'sms'];

        // jsdom has no WebAuthn
        beforeEach(() => {
            Object.defineProperty(window, 'PublicKeyCredential', {
                value: class {},
                configurable: true,
            });
        });

        afterEach(() => {
            Reflect.deleteProperty(window, 'PublicKeyCredential');
        });
        const passkeyCard = () =>
            screen.getByRole('button', { name: 'mfa.stepUp.usePasskey mfa.factors.recommended' });
        const anotherMethodLink = () =>
            screen.getByRole('button', { name: 'mfa.stepUp.useAnotherMethod' });

        test('shows only the passkey card with another-method link', () => {
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            expect(passkeyCard()).toBeInTheDocument();
            expect(screen.getByText('mfa.passkey.description')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'mfaList.email' })).not.toBeInTheDocument();
            expect(anotherMethodLink()).toBeInTheDocument();
            expect(startPasswordless).not.toHaveBeenCalled();
        });

        test('lists the other methods with a back arrow', async () => {
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(anotherMethodLink());

            expect(
                screen.getByRole('heading', { name: 'mfa.stepUp.chooseAnotherMethod' })
            ).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'mfaList.email' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'mfaList.phoneNumber' })).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'mfaList.back' }));

            expect(passkeyCard()).toBeInTheDocument();
            expect(anotherMethodLink()).toHaveFocus();
        });

        test('labels each list with its own heading', async () => {
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            expect(screen.getByRole('list', { name: 'mfa.stepUp.title' })).toBeInTheDocument();

            await user.click(anotherMethodLink());

            expect(
                screen.getByRole('list', { name: 'mfa.stepUp.chooseAnotherMethod' })
            ).toBeInTheDocument();
        });

        test('keeps the trust box across views', async () => {
            const user = userEvent.setup();
            renderFlow(
                { amr: passkeyAmr, allowTrustDevice: true },
                { webAuthn: true, rbaEnabled: true }
            );

            await user.click(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' }));
            await user.click(anotherMethodLink());
            await user.click(screen.getByRole('button', { name: 'mfaList.back' }));

            expect(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' })).toBeChecked();

            // the code screen starts with the choice made on the first one
            await user.click(anotherMethodLink());
            await user.click(screen.getByRole('button', { name: 'mfaList.email' }));
            await screen.findByRole('heading', { name: 'mfa.code.title' });

            expect(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' })).toBeChecked();
        });

        test('hides the trust box without risk-based authentication', () => {
            renderFlow({ amr: passkeyAmr, allowTrustDevice: true }, { webAuthn: true });

            expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        });

        test('steps up with the passkey', async () => {
            achieveStepUpWithWebAuthn.mockResolvedValue({ idToken: 'id-token' });
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(passkeyCard());

            expect(achieveStepUpWithWebAuthn).toHaveBeenCalledWith({
                stepUpToken: 'tkn',
                trustDevice: false,
            });
            await waitFor(() =>
                expect(onSuccess).toHaveBeenCalledWith({
                    name: 'login_2nd_step',
                    authType: 'webauthn',
                    authResult: { idToken: 'id-token' },
                })
            );
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(replace).not.toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
        });

        test('trusts the device with the passkey', async () => {
            achieveStepUpWithWebAuthn.mockResolvedValue({ idToken: 'id-token' });
            const user = userEvent.setup();
            renderFlow(
                { amr: passkeyAmr, allowTrustDevice: true },
                { webAuthn: true, rbaEnabled: true }
            );

            await user.click(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' }));
            await user.click(passkeyCard());

            expect(achieveStepUpWithWebAuthn).toHaveBeenCalledWith({
                stepUpToken: 'tkn',
                trustDevice: true,
            });
            await waitFor(() =>
                expect(onSuccess).toHaveBeenCalledWith({ name: 'mfa_trusted_device_added' })
            );
        });

        test('ignores a second click while the passkey prompt is open', async () => {
            achieveStepUpWithWebAuthn.mockReturnValue(new Promise(() => {}));
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(passkeyCard());
            await user.click(passkeyCard());

            expect(achieveStepUpWithWebAuthn).toHaveBeenCalledTimes(1);
            // no waiting state while the browser prompt is open
            expect(passkeyCard()).not.toHaveAttribute('aria-busy');
        });

        test('leaves the passkey error behind on another screen', async () => {
            achieveStepUpWithWebAuthn.mockRejectedValueOnce(new Error('passkey refused'));
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(passkeyCard());
            expect(await screen.findByRole('alert')).toHaveTextContent('passkey refused');

            await user.click(anotherMethodLink());

            expect(
                screen.getByRole('heading', { name: 'mfa.stepUp.chooseAnotherMethod' })
            ).toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        test('leaves a send error behind when going back to the passkey', async () => {
            startPasswordless.mockRejectedValueOnce(new Error('cannot send'));
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(anotherMethodLink());
            await user.click(screen.getByRole('button', { name: 'mfaList.email' }));
            expect(await screen.findByRole('alert')).toHaveTextContent('cannot send');

            await user.click(screen.getByRole('button', { name: 'mfaList.back' }));

            expect(passkeyCard()).toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        test('does not open the passkey prompt again after a success', async () => {
            achieveStepUpWithWebAuthn.mockResolvedValue({ idToken: 'id-token' });
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(passkeyCard());
            await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
            await user.click(passkeyCard());

            expect(achieveStepUpWithWebAuthn).toHaveBeenCalledTimes(1);
        });

        test('shows why the passkey failed', async () => {
            const error = new Error('passkey refused');
            achieveStepUpWithWebAuthn.mockRejectedValueOnce(error);
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(passkeyCard());

            expect(await screen.findByRole('alert')).toHaveTextContent('passkey refused');
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(error);
        });

        test('stays in place when the passkey is cancelled', async () => {
            const error = new DOMException('cancelled', 'NotAllowedError');
            achieveStepUpWithWebAuthn.mockRejectedValueOnce(error);
            achieveStepUpWithWebAuthn.mockResolvedValueOnce({ idToken: 'id-token' });
            const user = userEvent.setup();
            renderFlow({ amr: passkeyAmr }, { webAuthn: true });

            await user.click(passkeyCard());

            await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
            expect(onError).toHaveBeenCalledWith(error);
            expect(onSuccess).not.toHaveBeenCalled();
            // the user closed the prompt: nothing to tell them
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();

            await user.click(passkeyCard());

            expect(achieveStepUpWithWebAuthn).toHaveBeenCalledTimes(2);
            await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
        });

        test('does not start a passkey alone', () => {
            renderFlow({ amr: ['webauthn'] }, { webAuthn: true }, { strict: true });

            expect(passkeyCard()).toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: 'mfa.stepUp.useAnotherMethod' })
            ).not.toBeInTheDocument();
            expect(achieveStepUpWithWebAuthn).not.toHaveBeenCalled();
        });

        test('does not send the code of a single factor offered with a passkey', () => {
            renderFlow({ amr: ['webauthn', 'email'] }, { webAuthn: true }, { strict: true });

            expect(passkeyCard()).toBeInTheDocument();
            expect(startPasswordless).not.toHaveBeenCalled();
        });

        test('hides the passkey when WebAuthn is off', () => {
            renderFlow({ amr: passkeyAmr }, { webAuthn: false });

            expect(screen.getByRole('heading', { name: 'mfa.stepUp.title' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'mfaList.email' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'mfaList.phoneNumber' })).toBeInTheDocument();
            expect(
                screen.queryByRole('button', { name: /mfa\.stepUp\.usePasskey/ })
            ).not.toBeInTheDocument();
        });
    });
});
