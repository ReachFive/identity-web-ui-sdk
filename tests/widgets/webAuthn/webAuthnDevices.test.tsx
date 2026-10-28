/**
 * @jest-environment jsdom
 */
import React from 'react';

import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type Client, type DeviceCredential } from '@reachfive/identity-core';

import { WebAuthnDevices } from '@/widgets/webAuthn/webAuthnDevices';

import { WidgetContext } from '../../components/form/WidgetContext';

import type { Config, OnError, OnSuccess } from '@/types';

const config: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: true,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: [],
    customProviders: {},
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: { minLength: 8, minStrength: 2, allowUpdateWithAccessTokenOnly: true },
    loginTypeAllowed: { email: true, phoneNumber: true, customIdentifier: true },
    isImplicitFlowForbidden: false,
};

const accessToken = 'azerty';

const device = (id: string): DeviceCredential => ({
    id,
    friendlyName: id,
    createdAt: '',
    lastUsedAt: '',
});

describe('WebAuthnDevices', () => {
    const confirmMock = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    const listWebAuthnDevices = jest.fn<Client['listWebAuthnDevices']>();
    const addNewWebAuthnDevice = jest.fn<Client['addNewWebAuthnDevice']>();
    const removeWebAuthnDevice = jest.fn<Client['removeWebAuthnDevice']>();
    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        confirmMock.mockRestore();
    });

    const mount = () => {
        // @ts-expect-error partial Client
        const client: Client = { listWebAuthnDevices, addNewWebAuthnDevice, removeWebAuthnDevice };
        return render(
            <WidgetContext client={client} config={config} defaultMessages={{}}>
                <WebAuthnDevices
                    accessToken={accessToken}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            </WidgetContext>
        );
    };

    test('loads and lists the devices from the access token alone', async () => {
        listWebAuthnDevices.mockResolvedValue([device('myDevice')]);

        mount();

        await waitFor(() => expect(screen.queryAllByTestId('device')).toHaveLength(1));
        expect(listWebAuthnDevices).toHaveBeenCalledWith(accessToken);
        expect(screen.getByTestId('device-name')).toHaveTextContent('myDevice');
        expect(onError).not.toHaveBeenCalled();
    });

    test('shows the empty state when there is no device', async () => {
        listWebAuthnDevices.mockResolvedValue([]);

        mount();

        await waitFor(() =>
            expect(screen.getByText('webauthn.registredDevices.no.list')).toBeInTheDocument()
        );
    });

    test('calls onError once when the initial load fails', async () => {
        listWebAuthnDevices.mockRejectedValue('Unexpected error');

        mount();

        await waitFor(() => expect(onError).toHaveBeenCalledWith('Unexpected error'));
        expect(onError).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('device')).not.toBeInTheDocument();
    });

    test('removing a device emits webauthn_credential_deleted and refreshes the list', async () => {
        const user = userEvent.setup();
        listWebAuthnDevices
            .mockResolvedValueOnce([device('myOldDevice')])
            .mockResolvedValueOnce([]);
        removeWebAuthnDevice.mockResolvedValue();

        mount();

        await user.click(await screen.findByTestId('device-remove'));

        expect(removeWebAuthnDevice).toHaveBeenCalledWith(accessToken, 'myOldDevice');
        expect(onSuccess).toHaveBeenCalledWith({
            name: 'webauthn_credential_deleted',
            deviceId: 'myOldDevice',
        });
        await waitFor(() => expect(screen.queryByTestId('device')).not.toBeInTheDocument());
    });
});
