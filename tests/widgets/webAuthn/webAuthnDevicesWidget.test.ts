/**
 * @jest-environment jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/contexts/i18n';
import { UserError } from '../../../src/helpers/errors';
import webAuthnDevicesWidget from '../../../src/widgets/webAuthn/webAuthnDevicesWidget';

import type { Config, OnError, OnSuccess } from '../../../src/types';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: true,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
    customProviders: {},
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
    },
    loginTypeAllowed: {
        email: true,
        phoneNumber: true,
        customIdentifier: true,
    },
    isImplicitFlowForbidden: false,
};

const defaultI18n: I18nMessages = {};

const accessToken = 'azerty';

describe('DOM testing', () => {
    const listWebAuthnDevices = jest.fn<Client['listWebAuthnDevices']>();
    const addNewWebAuthnDevice = jest.fn<Client['addNewWebAuthnDevice']>();
    const removeWebAuthnDevice = jest.fn<Client['removeWebAuthnDevice']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        listWebAuthnDevices.mockClear();
        addNewWebAuthnDevice.mockClear();
        removeWebAuthnDevice.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    const generateComponent = async (
        options: Partial<Parameters<typeof webAuthnDevicesWidget>[0]> = {},
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            listWebAuthnDevices,
            addNewWebAuthnDevice,
            removeWebAuthnDevice,
        };

        const result = await webAuthnDevicesWidget(
            { onError, onSuccess, ...options, accessToken },
            { config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        const view = render(result);
        // The devices load through a suspense query: wait for the spinner to give way.
        await waitFor(() =>
            expect(view.container.querySelector('.animate-spin')).not.toBeInTheDocument()
        );
        return view;
    };

    const device = (id: string) => ({ id, friendlyName: id, createdAt: '', lastUsedAt: '' });

    const removeButtonOf = (name: string) => {
        const row = screen
            .getAllByTestId('device')
            .find(el => within(el).getByTestId('device-name').textContent === name);
        return within(row!).getByTestId('device-remove');
    };

    describe('webAuthn', () => {
        test('WebAuthn feature is not available', async () => {
            await expect(generateComponent({}, { webAuthn: false })).rejects.toThrow(
                'The WebAuthn feature is not available on your account.'
            );

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith(
                new UserError('The WebAuthn feature is not available on your account.')
            );
        });

        test('default', async () => {
            const user = userEvent.setup();

            listWebAuthnDevices
                // before add
                .mockResolvedValueOnce([
                    {
                        friendlyName: 'myOldDevice',
                        id: 'myOldDevice',
                        createdAt: '',
                        lastUsedAt: '',
                    },
                ])
                // after add
                .mockResolvedValueOnce([
                    {
                        friendlyName: 'myOldDevice',
                        id: 'myOldDevice',
                        createdAt: '',
                        lastUsedAt: '',
                    },
                    {
                        friendlyName: 'myNewDevice',
                        id: 'myNewDevice',
                        createdAt: '',
                        lastUsedAt: '',
                    },
                ])
                // after remove
                .mockResolvedValueOnce([
                    {
                        friendlyName: 'myNewDevice',
                        id: 'myNewDevice',
                        createdAt: '',
                        lastUsedAt: '',
                    },
                ]);

            addNewWebAuthnDevice.mockResolvedValue();
            removeWebAuthnDevice.mockResolvedValue();

            await generateComponent({});

            expect(listWebAuthnDevices).toBeCalledWith(accessToken);

            const devices = screen.queryAllByTestId('device');
            expect(devices).toHaveLength(1);

            const friendlyNameInput = screen.getByLabelText('webauthn.friendly.name');
            await user.type(friendlyNameInput, 'myNewDevice');

            const addBtn = screen.getByRole('button', { name: 'add' });

            await user.click(addBtn);

            expect(addNewWebAuthnDevice).toBeCalledWith(accessToken, 'myNewDevice');

            await waitFor(() => expect(screen.queryAllByTestId('device')).toHaveLength(2));
            const devicesAfterAdd = screen.queryAllByTestId('device');

            const deviceNames = screen.queryAllByTestId('device-name').map(el => el.textContent);
            expect(deviceNames).toEqual(['myOldDevice', 'myNewDevice']);

            const oldDevice = devicesAfterAdd.find(
                el => within(el).getByTestId('device-name').textContent === 'myOldDevice'
            );
            const removeOldDevice = within(oldDevice!).getByTestId('device-remove');
            expect(removeOldDevice).toBeInTheDocument();

            await user.click(removeOldDevice);
            await user.click(
                within(await screen.findByRole('alertdialog')).getByRole('button', {
                    name: 'remove',
                })
            );

            expect(removeWebAuthnDevice).toBeCalledWith(accessToken, 'myOldDevice');

            await waitFor(() => expect(screen.queryAllByTestId('device')).toHaveLength(1));

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    friendlyName: 'myNewDevice',
                    name: 'webauthn_credential_created',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('list devices api failure', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            listWebAuthnDevices.mockRejectedValue('Unexpected error');

            await generateComponent({});

            expect(screen.getByText('Unexpected error')).toBeInTheDocument();
            expect(screen.queryByTestId('device')).not.toBeInTheDocument();
            expect(onSuccess).not.toBeCalled();
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toBeCalledWith('Unexpected error');
            jest.mocked(console.error).mockRestore();
        });

        test('shows the empty state when there is no device', async () => {
            listWebAuthnDevices.mockResolvedValue([]);

            await generateComponent({});

            expect(screen.getByText('webauthn.registredDevices.no.list')).toBeInTheDocument();
        });

        test('removing a device asks for confirmation in a dialog first', async () => {
            const user = userEvent.setup();
            listWebAuthnDevices.mockResolvedValue([device('myOldDevice')]);

            await generateComponent({});
            await user.click(removeButtonOf('myOldDevice'));

            const dialog = await screen.findByRole('alertdialog', {
                name: 'webauthn.registredDevices.confirm.removal',
            });
            expect(
                within(dialog).getByRole('button', { name: 'confirmation.cancel' })
            ).toBeVisible();
            expect(within(dialog).getByRole('button', { name: 'remove' })).toBeVisible();
            expect(removeWebAuthnDevice).not.toHaveBeenCalled();
        });

        test('cancelling the dialog keeps the device and gives focus back to its remove button', async () => {
            const user = userEvent.setup();
            listWebAuthnDevices.mockResolvedValue([device('myOldDevice')]);

            await generateComponent({});
            const removeButton = removeButtonOf('myOldDevice');
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

            await generateComponent({});
            await user.click(removeButtonOf('second'));
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

        test('add new device api failure', async () => {
            const user = userEvent.setup();

            listWebAuthnDevices.mockResolvedValue([]);
            addNewWebAuthnDevice.mockRejectedValue('Unexpected error');

            await generateComponent({});

            const friendlyNameInput = screen.getByLabelText('webauthn.friendly.name');
            await user.type(friendlyNameInput, 'myNewDevice');

            const addBtn = screen.getByRole('button', { name: 'add' });
            await user.click(addBtn);

            expect(addNewWebAuthnDevice).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });

        test('remove device api failure', async () => {
            const user = userEvent.setup();

            listWebAuthnDevices.mockResolvedValue([
                {
                    friendlyName: 'myOldDevice',
                    id: 'myOldDevice',
                    createdAt: '',
                    lastUsedAt: '',
                },
            ]);
            removeWebAuthnDevice.mockRejectedValue('Unexpected error');

            await generateComponent({});

            const devices = screen.queryAllByTestId('device');
            const oldDevice = devices.find(
                el => within(el).getByTestId('device-name').textContent === 'myOldDevice'
            );
            const removeOldDevice = within(oldDevice!).getByTestId('device-remove');
            expect(removeOldDevice).toBeInTheDocument();

            await user.click(removeOldDevice);
            await user.click(
                within(await screen.findByRole('alertdialog')).getByRole('button', {
                    name: 'remove',
                })
            );

            expect(removeWebAuthnDevice).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
