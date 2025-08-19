/**
 * @jest-environment jest-fixed-jsdom
 */
import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '@/core/i18n';
import { UserError } from '@/helpers/errors';
import { OnError, OnSuccess } from '@/types';
import WebAuthnDevicesWidget from '@/widgets/webAuthn/webAuthnDevicesWidget';

import { componentGenerator } from '../renderer';

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

    // @ts-expect-error partial Client
    const apiClient: Client = {
        listWebAuthnDevices,
        addNewWebAuthnDevice,
        removeWebAuthnDevice,
    };

    const generateComponent = componentGenerator(WebAuthnDevicesWidget, apiClient, defaultI18n);

    describe('webAuthn', () => {
        test('WebAuthn feature is not available', async () => {
            await generateComponent(
                { accessToken: 'azerty', onError, onSuccess },
                { webAuthn: false },
                () => {}
            );

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith(
                new UserError('The WebAuthn feature is not available on your account.')
            );
        });

        test('default', async () => {
            const user = userEvent.setup();

            // before add
            listWebAuthnDevices.mockResolvedValue([
                {
                    friendlyName: 'myOldDevice',
                    id: 'myOldDevice',
                    createdAt: '',
                    lastUsedAt: '',
                },
            ]);

            addNewWebAuthnDevice.mockResolvedValue();
            removeWebAuthnDevice.mockResolvedValue();

            await generateComponent({ accessToken, onError, onSuccess }, { webAuthn: true });

            expect(listWebAuthnDevices).toBeCalledWith(accessToken);

            const devices = screen.queryAllByTestId('device');
            expect(devices).toHaveLength(1);

            const friendlyNameInput = screen.getByLabelText('webauthn.friendly.name');
            await user.type(friendlyNameInput, 'myNewDevice');

            const addBtn = screen.getByRole('button', { name: 'add' });

            // after add
            listWebAuthnDevices.mockResolvedValueOnce([
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
            ]);

            await user.click(addBtn);

            expect(addNewWebAuthnDevice).toBeCalledWith(accessToken, 'myNewDevice');

            expect(listWebAuthnDevices).toBeCalledWith(accessToken);

            const devicesAfterAdd = await screen.findAllByTestId('device');
            expect(devicesAfterAdd).toHaveLength(2);

            const deviceNames = screen.queryAllByTestId('device-name').map(el => el.textContent);
            expect(deviceNames).toEqual(['myOldDevice', 'myNewDevice']);

            // after remove
            listWebAuthnDevices.mockResolvedValueOnce([
                {
                    friendlyName: 'myNewDevice',
                    id: 'myNewDevice',
                    createdAt: '',
                    lastUsedAt: '',
                },
            ]);

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
            listWebAuthnDevices.mockRejectedValue(new Error('Unexpected error'));

            await generateComponent(
                { accessToken, onError, onSuccess },
                { webAuthn: true },
                () => {}
            );

            expect(listWebAuthnDevices).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith(new Error('Unexpected error'));
        });

        test('add new device api failure', async () => {
            const user = userEvent.setup();

            listWebAuthnDevices.mockResolvedValue([]);
            addNewWebAuthnDevice.mockRejectedValue(new Error('Unexpected error'));

            await generateComponent({ accessToken, onError, onSuccess }, { webAuthn: true });

            const friendlyNameInput = screen.getByLabelText('webauthn.friendly.name');
            await user.type(friendlyNameInput, 'myNewDevice');

            const addBtn = screen.getByRole('button', { name: 'add' });
            await user.click(addBtn);

            expect(addNewWebAuthnDevice).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith(new Error('Unexpected error'));
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
            removeWebAuthnDevice.mockRejectedValue(new Error('Unexpected error'));

            await generateComponent({ accessToken, onError, onSuccess }, { webAuthn: true });

            const devices = screen.queryAllByTestId('device');
            const oldDevice = devices.find(el => el.textContent === 'myOldDevice');
            const removeOldDevice = oldDevice?.querySelector('[data-testid="device-remove"]');
            expect(removeOldDevice).toBeInTheDocument();

            await user.click(removeOldDevice!);

            expect(confirmMock).toBeCalled();

            expect(removeWebAuthnDevice).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith(new Error('Unexpected error'));
        });
    });
});
