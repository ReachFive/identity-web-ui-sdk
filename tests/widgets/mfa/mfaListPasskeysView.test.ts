/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Client, DeviceCredential, MFA } from '@reachfive/identity-core';

import { AppError, UserError } from '../../../src/helpers/errors';
import mfaListWidget from '../../../src/widgets/mfa/mfaListWidget';

import type { I18nMessages } from '../../../src/contexts/i18n';
import type { Config, OnError, OnSuccess } from '../../../src/types';
import type { MfaCredential, PasskeyCredential } from '../../../src/widgets/mfa/passkeyCredential';

const config: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: true,
    language: 'en',
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

const messages: I18nMessages = {
    'mfaList.email': 'Email',
    'mfaList.createdOn': 'Created on {date}',
    'mfaList.empty': 'No second factor yet',
    'mfaList.passkeys': 'Passkeys',
    'mfaList.passkeyCount_one': '{count} passkey',
    'mfaList.passkeyCount_other': '{count} passkeys',
    'mfaList.alsoUsedToLogIn': 'Also used to log in',
    'mfaList.back': 'Back',
    'webauthn.registredDevices.list': 'Registered devices',
    'webauthn.registredDevices.no.list': 'No registered device',
    remove: 'Remove',
    add: 'Add',
};

const emailCredential: MFA.EmailCredential = {
    type: 'email',
    email: 'root@reach5.co',
    friendlyName: 'identifier',
    createdAt: '2022-09-21',
};

const passkeyCredential = (id: string): PasskeyCredential => ({
    type: 'webauthn',
    id,
    friendlyName: `Passkey ${id}`,
    createdAt: '2024-01-15',
});

/** Core 1.42.0 does not declare the `webauthn` credential yet (see passkeyCredential.ts). */
const credentialsList = (...credentials: MfaCredential[]) =>
    ({ credentials }) as Awaited<ReturnType<Client['listMfaCredentials']>>;

const device = (id: string): DeviceCredential => ({
    id,
    friendlyName: `Device ${id}`,
});

const listMfaCredentials = jest.fn<Client['listMfaCredentials']>();
const listWebAuthnDevices = jest.fn<Client['listWebAuthnDevices']>();
const addNewWebAuthnDevice = jest.fn<Client['addNewWebAuthnDevice']>();
const removeWebAuthnDevice = jest.fn<Client['removeWebAuthnDevice']>();

const onError = jest.fn<OnError>();
const onSuccess = jest.fn<OnSuccess>();

// @ts-expect-error partial Client
const apiClient: Client = {
    listMfaCredentials,
    listWebAuthnDevices,
    addNewWebAuthnDevice,
    removeWebAuthnDevice,
};

const renderWidget = async () => {
    const widget = await mfaListWidget(
        { accessToken: 'azerty', onError, onSuccess },
        { apiClient, config, defaultI18n: messages }
    );
    return render(widget);
};

const openPasskeysView = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole('button', { name: 'Passkeys' }));
    return screen.findByRole('button', { name: 'Back' });
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe('Criterion 3: the Passkeys row opens the passkey management view, with a way back', () => {
    test('activating the row shows the registered devices and a back arrow named "Back"', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, passkeyCredential('a'))
        );
        listWebAuthnDevices.mockResolvedValue([device('a')]);
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);

        expect(back).toBeInTheDocument();
        expect(await screen.findByText('Device a')).toBeInTheDocument();
        expect(screen.getByText('Registered devices')).toBeInTheDocument();
        expect(screen.queryByText('root@reach5.co')).not.toBeInTheDocument();
        expect(listWebAuthnDevices).toHaveBeenCalledWith('azerty');
    });

    test('the back arrow returns to the list of factors', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, passkeyCredential('a'))
        );
        listWebAuthnDevices.mockResolvedValue([device('a')]);
        await renderWidget();

        const user = userEvent.setup();
        await user.click(await openPasskeysView(user));

        expect(await screen.findByText('root@reach5.co')).toBeInTheDocument();
        expect(screen.queryByText('Registered devices')).not.toBeInTheDocument();
    });
});

describe('A failed device load shows the widget error output under the back arrow', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('a user error shows its message, calls onError once and the back arrow still works', async () => {
        const error = new UserError('Devices unavailable');
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, passkeyCredential('a'))
        );
        listWebAuthnDevices.mockRejectedValue(error);
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);

        expect(await screen.findByText('Devices unavailable')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(error);

        await user.click(back);
        expect(await screen.findByText('root@reach5.co')).toBeInTheDocument();
    });

    test('an API error shows the generic message', async () => {
        const error: AppError = {
            errorId: '0',
            error: 'unexpected_error',
            errorDescription: 'Boom',
        };
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        listWebAuthnDevices.mockRejectedValue(error);
        await renderWidget();

        await openPasskeysView(userEvent.setup());

        expect(await screen.findByText('Unexpected error')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
    });
});

describe('Adding or removing a passkey refreshes the list of factors', () => {
    beforeEach(() => {
        jest.spyOn(window, 'confirm').mockReturnValue(true);
    });

    test('removing a passkey emits webauthn_credential_deleted and the count is fresh on return', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(
                credentialsList(emailCredential, passkeyCredential('a'), passkeyCredential('b'))
            )
            .mockResolvedValue(credentialsList(emailCredential, passkeyCredential('b')));
        listWebAuthnDevices
            .mockResolvedValueOnce([device('a'), device('b')])
            .mockResolvedValue([device('b')]);
        removeWebAuthnDevice.mockResolvedValue();
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);
        await screen.findByText('Device a');
        await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

        await waitFor(() => expect(screen.queryByText('Device a')).not.toBeInTheDocument());
        expect(removeWebAuthnDevice).toHaveBeenCalledWith('azerty', 'a');
        expect(onSuccess).toHaveBeenCalledWith({
            name: 'webauthn_credential_deleted',
            deviceId: 'a',
        });
        await waitFor(() => expect(listMfaCredentials).toHaveBeenCalledTimes(2));

        await user.click(back);
        expect(
            await screen.findByRole('button', { name: 'Passkeys' })
        ).toHaveAccessibleDescription('1 passkey · Also used to log in');
    });

    test('adding a passkey emits webauthn_credential_created and the count is fresh on return', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(passkeyCredential('a')))
            .mockResolvedValue(credentialsList(passkeyCredential('a'), passkeyCredential('b')));
        listWebAuthnDevices
            .mockResolvedValueOnce([device('a')])
            .mockResolvedValue([device('a'), device('b')]);
        addNewWebAuthnDevice.mockResolvedValue();
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);
        await screen.findByText('Device a');
        await user.type(screen.getByRole('textbox'), 'Device b');
        await user.click(screen.getByRole('button', { name: 'Add' }));

        expect(await screen.findByText('Device b')).toBeInTheDocument();
        expect(onSuccess).toHaveBeenCalledWith({
            name: 'webauthn_credential_created',
            friendlyName: 'Device b',
        });
        await waitFor(() => expect(listMfaCredentials).toHaveBeenCalledTimes(2));

        await user.click(back);
        expect(
            await screen.findByRole('button', { name: 'Passkeys' })
        ).toHaveAccessibleDescription('2 passkeys · Also used to log in');
    });

    test('after removing the last passkey, going back shows no Passkeys row', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential, passkeyCredential('a')))
            .mockResolvedValue(credentialsList(emailCredential));
        listWebAuthnDevices.mockResolvedValueOnce([device('a')]).mockResolvedValue([]);
        removeWebAuthnDevice.mockResolvedValue();
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);
        await screen.findByText('Device a');
        await user.click(screen.getByRole('button', { name: 'Remove' }));
        await screen.findByText('No registered device');
        await waitFor(() => expect(listMfaCredentials).toHaveBeenCalledTimes(2));

        await user.click(back);
        expect(await screen.findByText('root@reach5.co')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Passkeys' })).not.toBeInTheDocument();
    });

    test('after removing the only factor, going back shows the empty state', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(passkeyCredential('a')))
            .mockResolvedValue(credentialsList());
        listWebAuthnDevices.mockResolvedValueOnce([device('a')]).mockResolvedValue([]);
        removeWebAuthnDevice.mockResolvedValue();
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);
        await screen.findByText('Device a');
        await user.click(screen.getByRole('button', { name: 'Remove' }));
        await waitFor(() => expect(listMfaCredentials).toHaveBeenCalledTimes(2));

        await user.click(back);
        expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
    });

    test('a failed refresh of the list keeps the previous count and calls onError once', async () => {
        const error = new Error('Refresh failed');
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(passkeyCredential('a'), passkeyCredential('b')))
            .mockRejectedValue(error);
        listWebAuthnDevices
            .mockResolvedValueOnce([device('a'), device('b')])
            .mockResolvedValue([device('b')]);
        removeWebAuthnDevice.mockResolvedValue();
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);
        await screen.findByText('Device a');
        await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

        await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
        expect(onError).toHaveBeenCalledTimes(1);

        await user.click(back);
        expect(
            await screen.findByRole('button', { name: 'Passkeys' })
        ).toHaveAccessibleDescription('2 passkeys · Also used to log in');
    });
});

describe('Focus follows the view change', () => {
    test('opening the Passkeys view moves focus to the back arrow', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        listWebAuthnDevices.mockResolvedValue([device('a')]);
        await renderWidget();

        const user = userEvent.setup();
        const back = await openPasskeysView(user);

        expect(back).toHaveFocus();
    });

    test('coming back moves focus to the Passkeys row', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, passkeyCredential('a'))
        );
        listWebAuthnDevices.mockResolvedValue([device('a')]);
        await renderWidget();

        const user = userEvent.setup();
        await user.click(await openPasskeysView(user));

        expect(await screen.findByRole('button', { name: 'Passkeys' })).toHaveFocus();
    });

    test('the Passkeys row does not take focus on the first display of the list', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWidget();

        expect(await screen.findByRole('button', { name: 'Passkeys' })).not.toHaveFocus();
    });
});
