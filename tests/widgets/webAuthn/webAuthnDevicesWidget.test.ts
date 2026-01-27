/**
 * @jest-environment jsdom
 */
import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

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
        customIdentifier: true
    },
    isImplicitFlowForbidden: false
};

const defaultI18n: I18nMessages = {};

const accessToken = 'azerty';

describe('DOM testing', () => {
    const confirmMock = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    const listWebAuthnDevices = jest.fn<Client['listWebAuthnDevices']>();
    const addNewWebAuthnDevice = jest.fn<Client['addNewWebAuthnDevice']>();
    const removeWebAuthnDevice = jest.fn<Client['removeWebAuthnDevice']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        confirmMock.mockClear();
        listWebAuthnDevices.mockClear();
        addNewWebAuthnDevice.mockClear();
        removeWebAuthnDevice.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    afterAll(() => {
        confirmMock.mockRestore();
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

        return waitFor(async () => {
            return render(result);
        });
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

            expect(listWebAuthnDevices).toBeCalledWith(accessToken);

            const devicesAfterAdd = screen.queryAllByTestId('device');
            expect(devicesAfterAdd).toHaveLength(2);

            const deviceNames = screen.queryAllByTestId('device-name').map(el => el.textContent);
            expect(deviceNames).toEqual(['myOldDevice', 'myNewDevice']);

            const oldDevice = devicesAfterAdd.find(el => el.textContent === 'myOldDevice');
            const removeOldDevice = oldDevice?.querySelector('[data-testid="device-remove"]');
            expect(removeOldDevice).toBeInTheDocument();

            await user.click(removeOldDevice!);

            expect(confirmMock).toBeCalled();

            expect(removeWebAuthnDevice).toBeCalledWith(accessToken, 'myOldDevice');

            const devicesAfterRemove = screen.queryAllByTestId('device');
            expect(devicesAfterRemove).toHaveLength(1);

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    friendlyName: 'myNewDevice',
                    name: 'webauthn_credential_created',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('list devices api failure', async () => {
            listWebAuthnDevices.mockRejectedValue('Unexpected error');

            await expect(generateComponent({})).rejects.toMatch('Unexpected error');

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
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
            const oldDevice = devices.find(el => el.textContent === 'myOldDevice');
            const removeOldDevice = oldDevice?.querySelector('[data-testid="device-remove"]');
            expect(removeOldDevice).toBeInTheDocument();

            await user.click(removeOldDevice!);

            expect(confirmMock).toBeCalled();

            expect(removeWebAuthnDevice).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
