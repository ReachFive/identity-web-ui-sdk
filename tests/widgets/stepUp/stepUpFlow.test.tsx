/**
 * @jest-environment jsdom
 */
import React from 'react';

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
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
const onError = jest.fn<OnError>();
const onSuccess = jest.fn<OnSuccess>();
const replace = jest.fn();

// @ts-expect-error partial Client
const client: Client = { startPasswordless, verifyMfaPasswordless };

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

    test('keeps the only factor offered when its code cannot be sent', async () => {
        const error = new Error('cannot send');
        startPasswordless.mockRejectedValueOnce(error);
        const user = userEvent.setup();
        renderFlow({ amr: ['email'] });

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(error);
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
});
