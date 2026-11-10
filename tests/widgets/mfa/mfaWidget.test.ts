/**
 * @jest-environment jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Client, MFA } from '@reachfive/identity-core';

import { AppError } from '../../../src/helpers/errors';
import mfaWidget from '../../../src/widgets/mfa/mfaWidget';

import type { I18nMessages } from '../../../src/contexts/i18n';
import type { Config, OnError, OnSuccess } from '../../../src/types';
import type {
    ListedCredential,
    PasskeyCredential,
} from '../../../src/widgets/mfa/passkeyCredential';

/*
 * No Squash case exists yet for the showMfa factor choice: the tests are grouped by behaviour.
 */

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
    mfaSmsEnabled: true,
    mfaEmailEnabled: true,
    mfaWebauthnEnabled: true,
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

const defaultI18n: I18nMessages = {
    'mfaList.email': 'Email',
    'mfaList.phoneNumber': 'Phone number',
    'mfaList.removeConfirmation': 'Remove {identifier}?',
    'mfaList.remove': 'Remove',
    'mfaList.cancel': 'Cancel',
    'mfaList.passkeyCount_one': '{count} passkey',
    'mfaList.passkeyCount_other': '{count} passkeys',
    'mfa.code.sentTo': 'Code sent to {identifier}',
};

const profile = {
    email: 'root@reach5.co',
    emailVerified: true,
    phoneNumber: '33612345678',
    phoneNumberVerified: false,
};

const phoneCredential: MFA.PhoneCredential = {
    type: 'sms',
    phoneNumber: '33612345678',
    friendlyName: '33612345678',
    createdAt: '2022-09-21',
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
const credentialsList = (...credentials: ListedCredential[]) =>
    ({ credentials }) as Awaited<ReturnType<Client['listMfaCredentials']>>;

const listMfaCredentials = jest.fn<Client['listMfaCredentials']>();
const getUser = jest.fn<Client['getUser']>();
const removeMfaEmail = jest.fn<Client['removeMfaEmail']>();
const removeMfaPhoneNumber = jest.fn<Client['removeMfaPhoneNumber']>();
const listWebAuthnDevices = jest.fn<Client['listWebAuthnDevices']>();
const addNewWebAuthnDevice = jest.fn<Client['addNewWebAuthnDevice']>();
const startMfaEmailRegistration = jest.fn<Client['startMfaEmailRegistration']>();
const startMfaPhoneNumberRegistration = jest.fn<Client['startMfaPhoneNumberRegistration']>();
const verifyMfaEmailRegistration = jest.fn<Client['verifyMfaEmailRegistration']>();
const verifyMfaPhoneNumberRegistration = jest.fn<Client['verifyMfaPhoneNumberRegistration']>();

const onError = jest.fn<OnError>();
const onSuccess = jest.fn<OnSuccess>();

// @ts-expect-error partial Client
const apiClient: Client = {
    listMfaCredentials,
    getUser,
    removeMfaEmail,
    removeMfaPhoneNumber,
    listWebAuthnDevices,
    addNewWebAuthnDevice,
    startMfaEmailRegistration,
    startMfaPhoneNumberRegistration,
    verifyMfaEmailRegistration,
    verifyMfaPhoneNumberRegistration,
};

const renderWidget = async (
    options: Partial<Parameters<typeof mfaWidget>[0]> = {},
    config: Partial<Config> = {}
) => {
    const widget = await mfaWidget(
        { accessToken: 'azerty', onError, onSuccess, ...options },
        { apiClient, config: { ...defaultConfig, ...config }, defaultI18n }
    );
    return render(widget);
};

const enabledGroup = () => screen.findByRole('list', { name: 'mfa.factors.enabled' });
const addGroup = () => screen.findByRole('list', { name: 'mfa.factors.add' });

const successEvents = (name: string) =>
    onSuccess.mock.calls.filter(([event]) => event.name === name);

beforeEach(() => {
    jest.resetAllMocks();
    // @ts-expect-error partial Profile
    getUser.mockResolvedValue(profile);
});

describe('Factor choice screen', () => {
    test('shows the title "mfa.manageFactors.title"', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget();

        expect(await screen.findByText('mfa.manageFactors.title')).toBeInTheDocument();
        expect(listMfaCredentials).toHaveBeenCalledWith('azerty');
        expect(getUser).toHaveBeenCalledWith({
            accessToken: 'azerty',
            fields: 'email,email_verified,phone_number,phone_number_verified',
        });
    });

    test('lists the enabled factors and the addable ones in two groups', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget();

        const enabled = await enabledGroup();
        const enabledRows = within(enabled).getAllByRole('listitem');
        expect(enabledRows).toHaveLength(1);
        expect(within(enabledRows[0]).getByText('root@reach5.co')).toBeInTheDocument();
        // The icon tile carries the tone; Testing Library has no query for it.
        // eslint-disable-next-line testing-library/no-node-access
        expect(enabledRows[0].querySelector('svg')?.parentElement).toHaveClass(
            'text-success',
            'bg-success/10'
        );

        const addRows = within(await addGroup()).getAllByRole('listitem');
        expect(addRows).toHaveLength(2);
        expect(within(addRows[0]).getByRole('button')).toHaveAccessibleName(
            'mfa.passkey mfa.factors.recommended'
        );
        expect(within(addRows[0]).getByRole('button')).toHaveAccessibleDescription(
            'mfa.passkey.description'
        );
        expect(within(addRows[1]).getByRole('button')).toHaveAccessibleName('Phone number');
        expect(within(addRows[1]).getByRole('button')).toHaveAccessibleDescription(
            'mfa.phoneNumber.description'
        );
        addRows.forEach(row => {
            expect(row).toHaveAttribute('data-slot', 'widget-mfa-add-factor');
            // The icon tile carries the tone; Testing Library has no query for it.
            // eslint-disable-next-line testing-library/no-node-access
            expect(row.querySelector('svg')?.parentElement).toHaveClass(
                'bg-muted',
                'text-muted-foreground'
            );
        });
    });

    test('groups passkeys in one row under Enabled', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(passkeyCredential('a'), passkeyCredential('b'))
        );
        await renderWidget();

        const enabled = await enabledGroup();
        const passkeys = within(enabled).getByRole('button', { name: 'mfaList.passkeys' });
        expect(passkeys).toHaveAccessibleDescription('2 passkeys · mfaList.alsoUsedToLogIn');
        expect(within(enabled).getAllByRole('listitem')).toHaveLength(1);
        expect(
            screen.queryByRole('button', { name: /mfa\.factors\.recommended/ })
        ).not.toBeInTheDocument();
    });

    test('hides the Passkey option when mfaWebauthnEnabled is off', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget({}, { mfaWebauthnEnabled: false });

        const addRows = within(await addGroup()).getAllByRole('listitem');
        expect(addRows.map(row => within(row).getByRole('button').textContent)).toEqual([
            'Email',
            'Phone number',
        ]);
    });

    test('hides a group without rows', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget();

        await addGroup();
        expect(screen.queryByRole('list', { name: 'mfa.factors.enabled' })).not.toBeInTheDocument();
        expect(screen.queryByText('mfa.factors.enabled')).not.toBeInTheDocument();
    });

    test('hides the "Add a factor" group when every factor is enabled', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, phoneCredential, passkeyCredential('a'))
        );
        await renderWidget();

        await enabledGroup();
        expect(screen.queryByText('mfa.factors.add')).not.toBeInTheDocument();
    });
});

describe('Navigation', () => {
    test('opens the Passkeys view and comes back', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        listWebAuthnDevices.mockResolvedValue([]);
        await renderWidget();

        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'mfaList.passkeys' }));
        const back = await screen.findByRole('button', { name: 'mfaList.back' });
        expect(screen.getByText('webauthn.registredDevices.list')).toBeInTheDocument();

        await user.click(back);

        const passkeys = await screen.findByRole('button', { name: 'mfaList.passkeys' });
        await waitFor(() => expect(passkeys).toHaveFocus());
        expect(screen.getByText('mfa.manageFactors.title')).toBeInTheDocument();
    });

    test('opens the enrollment screen of the selected factor', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget();

        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Phone number' }));

        expect(await screen.findByText('Phone number')).toBeInTheDocument();
        expect(screen.queryByText('mfa.manageFactors.title')).not.toBeInTheDocument();
        const back = screen.getByRole('button', { name: 'mfaList.back' });
        await waitFor(() => expect(back).toHaveFocus());

        await user.click(back);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Phone number' })).toHaveFocus()
        );
    });
});

describe('Removal', () => {
    const removeEmail = async () => {
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'mfa.remove.email' }));
        const confirmation = await screen.findByRole('group', { name: /^Remove / });
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));
    };

    test('removes the email row through the inline confirmation', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential, phoneCredential))
            .mockResolvedValueOnce(credentialsList(phoneCredential));
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget();

        await removeEmail();

        await waitFor(() => expect(screen.queryByText('root@reach5.co')).not.toBeInTheDocument());
        expect(removeMfaEmail).toHaveBeenCalledWith({ accessToken: 'azerty' });
        expect(successEvents('mfa_email_deleted')).toHaveLength(1);
        expect(within(await addGroup()).getByRole('button', { name: 'Email' })).toBeInTheDocument();
        expect(within(await enabledGroup()).getByText('33612345678')).toBeInTheDocument();
        expect(onError).not.toHaveBeenCalled();
    });

    test('removes the last credential and keeps focus in the widget', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential))
            .mockResolvedValueOnce(credentialsList());
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget();

        await removeEmail();

        await waitFor(() =>
            expect(
                screen.queryByRole('list', { name: 'mfa.factors.enabled' })
            ).not.toBeInTheDocument()
        );
        const add = await addGroup();
        expect(within(add).getByRole('button', { name: 'Email' })).toBeInTheDocument();
        // The removed row was the first one: the first row of the screen takes the focus.
        await waitFor(() => expect(within(add).getAllByRole('button')[0]).toHaveFocus());
    });

    test('hides the trash buttons when showRemoveMfaCredentials is false', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredentials: false });

        await enabledGroup();
        expect(screen.queryByRole('button', { name: 'mfa.remove.email' })).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'mfa.remove.phoneNumber' })
        ).not.toBeInTheDocument();
    });
});

describe('Errors', () => {
    test('passes a failed load to onError once and shows the widget error', async () => {
        const error: AppError = {
            errorId: '0',
            error: 'unexpected_error',
            errorDescription: 'Unexpected error',
        };
        listMfaCredentials.mockRejectedValue(error);
        await renderWidget();

        expect(await screen.findByText('Unexpected error')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(error);
    });
});

describe('Passkey enrollment', () => {
    const openPasskeyScreen = async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget();
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: /^mfa\.passkey/ }));
        await screen.findByText('mfa.passkey.deviceName');
        return user;
    };

    test('creates a passkey with the device name', async () => {
        addNewWebAuthnDevice.mockResolvedValue(undefined as never);
        const user = await openPasskeyScreen();

        await user.type(screen.getByLabelText('mfa.passkey.deviceName'), 'iPhone de Marie');
        await user.click(screen.getByRole('button', { name: 'mfa.passkey.create' }));

        await waitFor(() =>
            expect(addNewWebAuthnDevice).toHaveBeenCalledWith('azerty', 'iPhone de Marie')
        );
        await waitFor(() =>
            expect(successEvents('webauthn_credential_created')).toEqual([
                [{ name: 'webauthn_credential_created', friendlyName: 'iPhone de Marie' }],
            ])
        );
        await waitFor(() =>
            expect(screen.queryByText('mfa.passkey.deviceName')).not.toBeInTheDocument()
        );
    });

    test('has no trust device checkbox', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget({ allowTrustDevice: true });
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: /^mfa\.passkey/ }));
        await screen.findByText('mfa.passkey.deviceName');

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    test('requires a device name', async () => {
        const user = await openPasskeyScreen();

        await user.click(screen.getByRole('button', { name: 'mfa.passkey.create' }));

        expect(await screen.findByText('validation.required')).toBeInTheDocument();
        expect(addNewWebAuthnDevice).not.toHaveBeenCalled();
    });

    test('stays on the screen and reports a refused creation', async () => {
        const error: AppError = {
            errorId: '1',
            error: 'unexpected_error',
            errorDescription: 'Creation refused',
        };
        addNewWebAuthnDevice.mockRejectedValue(error);
        const user = await openPasskeyScreen();

        await user.type(screen.getByLabelText('mfa.passkey.deviceName'), 'iPhone de Marie');
        await user.click(screen.getByRole('button', { name: 'mfa.passkey.create' }));

        expect(await screen.findByText('Creation refused')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(screen.getByText('mfa.passkey')).toBeInTheDocument();
        expect(successEvents('webauthn_credential_created')).toHaveLength(0);
    });
});

describe('Email enrollment', () => {
    const openEmailScreen = async (
        options: Partial<Parameters<typeof mfaWidget>[0]> = {},
        config: Partial<Config> = {}
    ) => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget(options, config);
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Email' }));
        await screen.findByRole('button', { name: 'mfaList.back' });
        return user;
    };

    test('sends a code to the profile email', async () => {
        // @ts-expect-error partial Profile
        getUser.mockResolvedValue({ ...profile, emailVerified: false });
        startMfaEmailRegistration.mockResolvedValue({ status: 'email_sent' });
        const user = await openEmailScreen(
            { action: 'mfa_registration', allowTrustDevice: true },
            { rbaEnabled: true }
        );

        expect(screen.getByText('mfa.email.intro')).toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'mfa.sendCode' }));

        expect(await screen.findByText('mfa.code.title')).toBeInTheDocument();
        expect(startMfaEmailRegistration).toHaveBeenCalledTimes(1);
        expect(startMfaEmailRegistration.mock.calls[0][0]).toStrictEqual({
            accessToken: 'azerty',
            action: 'mfa_registration',
        });
        expect(successEvents('mfa_email_start_registration')).toHaveLength(1);
        expect(successEvents('mfa_trusted_device_added')).toHaveLength(0);
    });

    test('adds a verified email without a code', async () => {
        startMfaEmailRegistration.mockResolvedValue({
            status: 'enabled',
            credential: emailCredential,
        });
        const user = await openEmailScreen({ allowTrustDevice: true }, { rbaEnabled: true });

        expect(screen.getByText('mfa.identifierVerified')).toBeInTheDocument();
        await user.click(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' }));
        await user.click(screen.getByRole('button', { name: 'add' }));

        expect(await screen.findByText('mfa.factorAdded.email')).toBeInTheDocument();
        expect(startMfaEmailRegistration).toHaveBeenCalledWith({
            accessToken: 'azerty',
            trustDevice: true,
        });
        expect(successEvents('mfa_email_start_registration')).toHaveLength(1);
        expect(successEvents('mfa_trusted_device_added')).toHaveLength(1);
    });

    test('shows no trust device checkbox without allowTrustDevice and rbaEnabled', async () => {
        await openEmailScreen({ allowTrustDevice: true });

        expect(screen.getByText('mfa.identifierVerified')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'add' })).toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    test('the response wins over a predicted code', async () => {
        // @ts-expect-error partial Profile
        getUser.mockResolvedValue({ ...profile, emailVerified: false });
        startMfaEmailRegistration.mockResolvedValue({
            status: 'enabled',
            credential: emailCredential,
        });
        const user = await openEmailScreen();

        await user.click(screen.getByRole('button', { name: 'mfa.sendCode' }));

        expect(await screen.findByText('mfa.factorAdded.email')).toBeInTheDocument();
    });

    test('a failed start stays on the screen and calls onError once', async () => {
        const error: AppError = {
            errorId: '2',
            error: 'unexpected_error',
            errorDescription: 'Start refused',
        };
        startMfaEmailRegistration.mockRejectedValue(error);
        const user = await openEmailScreen();

        await user.click(screen.getByRole('button', { name: 'add' }));

        expect(await screen.findByText('Start refused')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(error);
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(successEvents('mfa_email_start_registration')).toHaveLength(0);
    });

    test('back returns to the choice screen', async () => {
        const user = await openEmailScreen();

        await user.click(screen.getByRole('button', { name: 'mfaList.back' }));

        expect(await screen.findByText('mfa.manageFactors.title')).toBeInTheDocument();
    });
});

describe('Phone number enrollment', () => {
    const verifiedProfile = { ...profile, phoneNumber: '+33612345678', phoneNumberVerified: true };

    const openPhoneScreen = async (
        options: Partial<Parameters<typeof mfaWidget>[0]> = {},
        config: Partial<Config> = {}
    ) => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget(options, config);
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Phone number' }));
        await screen.findByRole('textbox', { name: 'phoneNumber' });
        return user;
    };

    test('sends a code to the typed number', async () => {
        startMfaPhoneNumberRegistration.mockResolvedValue({ status: 'sms_sent' });
        const user = await openPhoneScreen(
            { action: 'mfa_registration', allowTrustDevice: true },
            { rbaEnabled: true }
        );

        expect(screen.getByText('mfa.phoneNumber.intro')).toBeInTheDocument();
        await user.type(screen.getByRole('textbox', { name: 'phoneNumber' }), '+33123456789');
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'mfa.sendCode' }));

        expect(await screen.findByText('mfa.code.title')).toBeInTheDocument();
        expect(startMfaPhoneNumberRegistration).toHaveBeenCalledTimes(1);
        expect(startMfaPhoneNumberRegistration.mock.calls[0][0]).toStrictEqual({
            accessToken: 'azerty',
            action: 'mfa_registration',
            phoneNumber: '+33123456789',
        });
        expect(successEvents('mfa_phone_number_start_registration')).toHaveLength(1);
    });

    test('hides the country select by default', async () => {
        await openPhoneScreen();

        expect(screen.queryByRole('button', { name: 'address.country' })).not.toBeInTheDocument();
    });

    test('shows the country select with withCountrySelect: true', async () => {
        await openPhoneScreen({ phoneNumberOptions: { withCountrySelect: true } });

        expect(screen.getByRole('button', { name: 'address.country' })).toBeInTheDocument();
    });

    test('follows the number as it is typed', async () => {
        // @ts-expect-error partial Profile
        getUser.mockResolvedValue(verifiedProfile);
        startMfaPhoneNumberRegistration.mockResolvedValue({ status: 'sms_sent' });
        const user = await openPhoneScreen({ allowTrustDevice: true }, { rbaEnabled: true });
        const input = screen.getByRole('textbox', { name: 'phoneNumber' });

        await user.type(input, '+33612345678');
        expect(
            await screen.findByRole('checkbox', { name: 'mfa.stepUp.trustDevice' })
        ).toBeInTheDocument();
        expect(screen.getByText('mfa.identifierVerified')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'add' })).toBeInTheDocument();
        await user.click(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' }));

        await user.type(input, '{Backspace}9');
        await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument());
        expect(screen.getByText('mfa.phoneNumber.intro')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'mfa.sendCode' }));

        // the box checked before the number changed is not sent
        await waitFor(() =>
            expect(startMfaPhoneNumberRegistration.mock.calls[0]?.[0]).toStrictEqual({
                accessToken: 'azerty',
                action: undefined,
                phoneNumber: '+33612345679',
            })
        );
    });

    test('the response wins over a predicted no-code', async () => {
        // @ts-expect-error partial Profile
        getUser.mockResolvedValue(verifiedProfile);
        startMfaPhoneNumberRegistration.mockResolvedValue({ status: 'sms_sent' });
        const user = await openPhoneScreen();

        await user.type(screen.getByRole('textbox', { name: 'phoneNumber' }), '+33612345678');
        await user.click(await screen.findByRole('button', { name: 'add' }));

        expect(await screen.findByText('mfa.code.title')).toBeInTheDocument();
    });
});

describe('Code screen', () => {
    const openCodeScreen = async (
        factor: 'email' | 'sms',
        options: Partial<Parameters<typeof mfaWidget>[0]> = {},
        config: Partial<Config> = {}
    ) => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        // @ts-expect-error partial Profile
        getUser.mockResolvedValue({ ...profile, emailVerified: false });
        startMfaEmailRegistration.mockResolvedValue({ status: 'email_sent' });
        startMfaPhoneNumberRegistration.mockResolvedValue({ status: 'sms_sent' });
        await renderWidget({ action: 'mfa_registration', ...options }, config);
        const user = userEvent.setup();
        if (factor === 'email') {
            await user.click(await screen.findByRole('button', { name: 'Email' }));
        } else {
            await user.click(await screen.findByRole('button', { name: 'Phone number' }));
            await user.type(
                await screen.findByRole('textbox', { name: 'phoneNumber' }),
                '+33123456778'
            );
        }
        await user.click(await screen.findByRole('button', { name: 'mfa.sendCode' }));
        await screen.findByText('mfa.code.title');
        return user;
    };

    test('shows where the code was sent', async () => {
        await openCodeScreen('sms');
        expect(screen.getByText('Code sent to ••78')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfa.verify' })).toBeInTheDocument();
    });

    test('shows the full email address', async () => {
        await openCodeScreen('email');
        expect(screen.getByText('Code sent to root@reach5.co')).toBeInTheDocument();
    });

    test('verifies the code', async () => {
        verifyMfaPhoneNumberRegistration.mockResolvedValue();
        const user = await openCodeScreen('sms');

        // the last digit submits the code
        await user.type(screen.getByRole('textbox', { name: 'verificationCode' }), '123456');

        expect(await screen.findByText('mfa.factorAdded.phoneNumber')).toBeInTheDocument();
        expect(verifyMfaPhoneNumberRegistration).toHaveBeenCalledTimes(1);
        expect(verifyMfaPhoneNumberRegistration.mock.calls[0][0]).toStrictEqual({
            accessToken: 'azerty',
            verificationCode: '123456',
            trustDevice: false,
        });
        expect(successEvents('mfa_phone_number_verify_registration')).toHaveLength(1);
        expect(successEvents('mfa_trusted_device_added')).toHaveLength(0);
    });

    test('verifies an email code', async () => {
        verifyMfaEmailRegistration.mockResolvedValue();
        const user = await openCodeScreen('email');

        // the last digit submits the code
        await user.type(screen.getByRole('textbox', { name: 'verificationCode' }), '123456');

        expect(await screen.findByText('mfa.factorAdded.email')).toBeInTheDocument();
        expect(successEvents('mfa_email_verify_registration')).toHaveLength(1);
    });

    test('offers trust device when allowTrustDevice and rbaEnabled', async () => {
        verifyMfaPhoneNumberRegistration.mockResolvedValue();
        const user = await openCodeScreen('sms', { allowTrustDevice: true }, { rbaEnabled: true });

        await user.click(screen.getByRole('checkbox', { name: 'mfa.stepUp.trustDevice' }));
        // the last digit submits the code
        await user.type(screen.getByRole('textbox', { name: 'verificationCode' }), '123456');

        expect(await screen.findByText('mfa.factorAdded.phoneNumber')).toBeInTheDocument();
        expect(verifyMfaPhoneNumberRegistration.mock.calls[0][0]).toStrictEqual({
            accessToken: 'azerty',
            verificationCode: '123456',
            trustDevice: true,
        });
        expect(successEvents('mfa_trusted_device_added')).toHaveLength(1);
    });

    test.each([
        ['allowTrustDevice is off', {}, { rbaEnabled: true }],
        ['rbaEnabled is off', { allowTrustDevice: true }, { rbaEnabled: false }],
    ])('hides trust device when %s', async (_, options, config) => {
        await openCodeScreen('sms', options, config);
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    test('resends the code with the same request', async () => {
        const user = await openCodeScreen('sms');

        await user.click(
            await screen.findByRole('button', { name: 'verificationCode.resend.count' })
        );

        await waitFor(() => expect(startMfaPhoneNumberRegistration).toHaveBeenCalledTimes(2));
        expect(startMfaPhoneNumberRegistration.mock.calls[1][0]).toStrictEqual({
            accessToken: 'azerty',
            action: 'mfa_registration',
            phoneNumber: '+33123456778',
            trustDevice: false,
        });
        expect(successEvents('mfa_phone_number_start_registration')).toHaveLength(2);
    });

    test('a refused code shows under the slots and goes to onError', async () => {
        const error: AppError = {
            error: 'invalid_grant',
            errorId: '1',
            errorDescription: 'Invalid code',
            errorUserMsg: 'Invalid code',
            errorMessageKey: 'error.invalidCode',
        };
        verifyMfaPhoneNumberRegistration.mockRejectedValue(error);
        const user = await openCodeScreen('sms');

        // the last digit submits the code
        await user.type(screen.getByRole('textbox', { name: 'verificationCode' }), '123456');

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(error);
        expect(await screen.findByText('Invalid code')).toBeInTheDocument();
        expect(screen.queryByText('mfa.factorAdded.phoneNumber')).not.toBeInTheDocument();
    });

    test('back returns to the enrollment screen', async () => {
        const user = await openCodeScreen('sms');

        await user.click(screen.getByRole('button', { name: 'mfaList.back' }));

        expect(await screen.findByRole('textbox', { name: 'phoneNumber' })).toBeInTheDocument();
    });
});
