/**
 * @jest-environment jsdom
 */
import React from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor, within } from '@testing-library/react';
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
    const listWebAuthnDevices = jest.fn<Client['listWebAuthnDevices']>();
    const addNewWebAuthnDevice = jest.fn<Client['addNewWebAuthnDevice']>();
    const removeWebAuthnDevice = jest.fn<Client['removeWebAuthnDevice']>();
    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        jest.clearAllMocks();
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

    const removeButtonOf = async (name: string) => {
        const row = (await screen.findAllByTestId('device')).find(
            el => within(el).getByTestId('device-name').textContent === name
        );
        return within(row!).getByTestId('device-remove');
    };

    test('removing a device asks for confirmation in a dialog first', async () => {
        const user = userEvent.setup();
        const confirmSpy = jest.spyOn(window, 'confirm');
        listWebAuthnDevices.mockResolvedValue([device('myOldDevice')]);

        mount();

        await user.click(await removeButtonOf('myOldDevice'));

        const dialog = await screen.findByRole('alertdialog', {
            name: 'webauthn.registredDevices.confirm.removal',
        });
        expect(within(dialog).getByRole('button', { name: 'confirmation.cancel' })).toBeVisible();
        expect(within(dialog).getByRole('button', { name: 'remove' })).toBeVisible();
        expect(removeWebAuthnDevice).not.toHaveBeenCalled();
        expect(confirmSpy).not.toHaveBeenCalled();
        confirmSpy.mockRestore();
    });

    test('cancelling the dialog keeps the device and gives focus back to its remove button', async () => {
        const user = userEvent.setup();
        listWebAuthnDevices.mockResolvedValue([device('myOldDevice')]);

        mount();

        const removeButton = await removeButtonOf('myOldDevice');
        await user.click(removeButton);
        await user.click(await screen.findByRole('button', { name: 'confirmation.cancel' }));

        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        expect(removeWebAuthnDevice).not.toHaveBeenCalled();
        expect(screen.getAllByTestId('device')).toHaveLength(1);
        expect(removeButton).toHaveFocus();
    });

    test('confirming removes the device whose button was pressed and refreshes the list', async () => {
        const user = userEvent.setup();
        listWebAuthnDevices
            .mockResolvedValueOnce([device('first'), device('second')])
            .mockResolvedValueOnce([device('first')]);
        removeWebAuthnDevice.mockResolvedValue();

        mount();

        await user.click(await removeButtonOf('second'));
        await user.click(await screen.findByRole('button', { name: 'remove' }));

        expect(removeWebAuthnDevice).toHaveBeenCalledTimes(1);
        expect(removeWebAuthnDevice).toHaveBeenCalledWith(accessToken, 'second');
        expect(onSuccess).toHaveBeenCalledWith({
            name: 'webauthn_credential_deleted',
            deviceId: 'second',
        });
        await waitFor(() => expect(screen.getAllByTestId('device')).toHaveLength(1));
        expect(screen.getByTestId('device-name')).toHaveTextContent('first');
    });
});
