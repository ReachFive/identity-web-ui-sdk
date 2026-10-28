/**
 * @jest-environment jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Client, MFA } from '@reachfive/identity-core';

import { AppError, UserError } from '../../../src/helpers/errors';
import mfaListWidget from '../../../src/widgets/mfa/mfaListWidget';

import type { I18nMessages } from '../../../src/contexts/i18n';
import type { Config, OnError, OnSuccess } from '../../../src/types';
import type { MfaCredential, PasskeyCredential } from '../../../src/widgets/mfa/passkeyCredential';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
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

const defaultI18n: I18nMessages = {
    'mfaList.email': 'Email',
    'mfaList.phoneNumber': 'Phone number',
    'mfaList.createdOn': 'Created on {date}',
    'mfaList.empty': 'No second factor yet',
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

const listMfaCredentials = jest.fn<Client['listMfaCredentials']>();
const removeMfaEmail = jest.fn<Client['removeMfaEmail']>();
const removeMfaPhoneNumber = jest.fn<Client['removeMfaPhoneNumber']>();
const listWebAuthnDevices = jest.fn<Client['listWebAuthnDevices']>();

const onError = jest.fn<OnError>();
const onSuccess = jest.fn<OnSuccess>();

// @ts-expect-error partial Client
const apiClient: Client = {
    listMfaCredentials,
    removeMfaEmail,
    removeMfaPhoneNumber,
    listWebAuthnDevices,
};

const renderWidget = async (options: Partial<Parameters<typeof mfaListWidget>[0]> = {}) => {
    const widget = await mfaListWidget(
        { accessToken: 'azerty', onError, onSuccess, ...options },
        { apiClient, config: defaultConfig, defaultI18n }
    );
    return render(widget);
};

const successEvents = (name: string) =>
    onSuccess.mock.calls.filter(([event]) => event.name === name);

beforeEach(() => {
    jest.resetAllMocks();
});

describe('Snapshot', () => {
    test('empty', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [] });
        const { container } = await renderWidget();

        await screen.findByText('No second factor yet');

        expect(container).toMatchSnapshot();
    });

    test('basic', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [phoneCredential, emailCredential] });
        const { container } = await renderWidget();

        await screen.findByText('root@reach5.co');

        expect(container).toMatchSnapshot();
    });

    test('client theme', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        const { container } = await renderWidget({
            showRemoveMfaCredential: true,
            theme: {
                primaryColor: '#274890',
                successColor: '#274890',
                textColor: '#2b2f36',
                borderColor: '#d9dde3',
                borderRadius: 6,
            },
        });

        await screen.findByText('root@reach5.co');

        expect(container).toMatchSnapshot();
    });
});

describe('Criterion 2: email and phone number rows show their creation date', () => {
    test('the email row shows the address, the "Email" label and the creation date', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
        await renderWidget();

        const row = await screen.findByRole('listitem');
        expect(within(row).getByText('root@reach5.co')).toBeInTheDocument();
        expect(within(row).getByText('Email')).toBeInTheDocument();
        expect(within(row).getByText('Created on 21/09/2022')).toBeInTheDocument();
    });

    test('the phone number row shows the number, the "Phone number" label and the creation date', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [phoneCredential] });
        await renderWidget();

        const row = await screen.findByRole('listitem');
        expect(within(row).getByText('33612345678')).toBeInTheDocument();
        expect(within(row).getByText('Phone number')).toBeInTheDocument();
        expect(within(row).getByText('Created on 21/09/2022')).toBeInTheDocument();
    });

    test('the creation date follows the configured language', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
        const widget = await mfaListWidget(
            { accessToken: 'azerty', onError, onSuccess },
            { apiClient, config: { ...defaultConfig, language: 'en-US' }, defaultI18n }
        );
        render(widget);

        expect(await screen.findByText('Created on 9/21/2022')).toBeInTheDocument();
    });

    test('email and phone number rows are listed in the order returned', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget();

        await screen.findByText('root@reach5.co');
        const rows = screen.getAllByRole('listitem');
        expect(rows).toHaveLength(2);
        expect(within(rows[0]).getByText('Email')).toBeInTheDocument();
        expect(within(rows[1]).getByText('Phone number')).toBeInTheDocument();
    });
});

describe('Criterion 6: an empty state is shown without any MFA credential', () => {
    test('"No second factor yet" is shown and no row is listed', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [] });
        await renderWidget();

        expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
});

describe('Criterion 7: theme attributes are respected and every new label is translatable', () => {
    test('every new label can be overridden through the i18n option', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget({
            i18n: {
                'mfaList.email': 'Courriel',
                'mfaList.phoneNumber': 'Téléphone',
                'mfaList.createdOn': 'Ajouté le {date}',
            },
        });

        await screen.findByText('Courriel');
        expect(screen.getByText('Téléphone')).toBeInTheDocument();
        expect(screen.getAllByText('Ajouté le 21/09/2022')).toHaveLength(2);
    });

    test('the empty state label can be overridden through the i18n option', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [] });
        await renderWidget({ i18n: { 'mfaList.empty': 'Aucun second facteur' } });

        expect(await screen.findByText('Aucun second facteur')).toBeInTheDocument();
    });

    test('factor icons use the theme success colour, overridable via successColor', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
        const { container } = await renderWidget({ theme: { successColor: '#274890' } });

        const row = await screen.findByRole('listitem');
        const tile = row.querySelector('svg')?.parentElement;
        expect(tile).toHaveClass('text-success', 'bg-success/10');
        expect(container.querySelector('style')?.textContent).toContain(
            '--success:221.14 57.38% 35.88%'
        );
    });

    test('each row exposes the public widget-mfa-credential slot', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget();

        const rows = await screen.findAllByRole('listitem');
        rows.forEach(row => expect(row).toHaveAttribute('data-slot', 'widget-mfa-credential'));
    });
});

describe('DOM testing', () => {
    describe('mfaCredentials', () => {
        test('loads the credentials only once the widget is rendered', async () => {
            listMfaCredentials.mockResolvedValue({ credentials: [] });
            const widget = await mfaListWidget(
                { accessToken: 'azerty', onError, onSuccess },
                { apiClient, config: defaultConfig, defaultI18n }
            );

            expect(listMfaCredentials).not.toHaveBeenCalled();

            render(widget);

            await screen.findByText('No second factor yet');
            expect(listMfaCredentials).toHaveBeenCalledWith('azerty');
        });

        test('no credentials', async () => {
            listMfaCredentials.mockResolvedValue({ credentials: [] });
            await renderWidget();

            expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
            expect(screen.queryAllByRole('listitem')).toHaveLength(0);

            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledWith({
                name: 'mfa_credentials_listed',
                credentials: [],
            });
            expect(onError).not.toHaveBeenCalled();
        });

        test('with credentials', async () => {
            listMfaCredentials.mockResolvedValue({
                credentials: [phoneCredential, emailCredential],
            });
            await renderWidget();

            await screen.findByText('root@reach5.co');
            expect(screen.queryByText('No second factor yet')).not.toBeInTheDocument();
            expect(screen.queryAllByRole('listitem')).toHaveLength(2);

            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledWith({
                name: 'mfa_credentials_listed',
                credentials: [phoneCredential, emailCredential],
            });
            expect(onError).not.toHaveBeenCalled();
        });

        test('shows a spinner while the credentials are loading', async () => {
            listMfaCredentials.mockReturnValue(new Promise(() => {}));
            const { container } = await renderWidget();

            expect(container.querySelector('.animate-spin')).toBeInTheDocument();
            expect(screen.queryByText('No second factor yet')).not.toBeInTheDocument();
        });

        test('api error', async () => {
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
            expect(onSuccess).not.toHaveBeenCalled();
        });

        test('api error shows the user error message', async () => {
            listMfaCredentials.mockRejectedValue(new UserError('Access denied'));
            await renderWidget();

            expect(await screen.findByText('Access denied')).toBeInTheDocument();
            expect(onError).toHaveBeenCalledTimes(1);
        });
    });

    describe('removal', () => {
        test('no remove button unless enabled', async () => {
            listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
            await renderWidget();

            await screen.findByText('root@reach5.co');
            expect(
                screen.queryByRole('button', { name: 'mfa.remove.email' })
            ).not.toBeInTheDocument();
        });

        test('removes the email after confirmation', async () => {
            const user = userEvent.setup();
            listMfaCredentials
                .mockResolvedValueOnce({ credentials: [emailCredential] })
                .mockResolvedValueOnce({ credentials: [] });
            removeMfaEmail.mockResolvedValue(undefined);
            await renderWidget({ showRemoveMfaCredential: true });

            await user.click(await screen.findByRole('button', { name: 'mfa.remove.email' }));
            const dialog = await screen.findByRole('alertdialog');
            expect(within(dialog).getByText('mfa.remove.email')).toBeInTheDocument();
            await user.click(within(dialog).getByRole('button', { name: 'confirmation.yes' }));

            await waitFor(() =>
                expect(screen.queryByText('root@reach5.co')).not.toBeInTheDocument()
            );
            expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
            expect(removeMfaEmail).toHaveBeenCalledWith({ accessToken: 'azerty' });
            expect(successEvents('mfa_email_deleted')).toHaveLength(1);
            expect(successEvents('mfa_credentials_listed')).toHaveLength(1);
            expect(onError).not.toHaveBeenCalled();
        });

        test('removes the phone number after confirmation', async () => {
            const user = userEvent.setup();
            listMfaCredentials
                .mockResolvedValueOnce({ credentials: [phoneCredential] })
                .mockResolvedValueOnce({ credentials: [] });
            removeMfaPhoneNumber.mockResolvedValue(undefined);
            await renderWidget({ showRemoveMfaCredential: true });

            await user.click(await screen.findByRole('button', { name: 'mfa.remove.phoneNumber' }));
            const dialog = await screen.findByRole('alertdialog');
            await user.click(within(dialog).getByRole('button', { name: 'confirmation.yes' }));

            await waitFor(() => expect(screen.queryAllByText('33612345678')).toHaveLength(0));
            expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
            expect(removeMfaPhoneNumber).toHaveBeenCalledWith({
                accessToken: 'azerty',
                phoneNumber: '33612345678',
            });
            expect(successEvents('mfa_phone_number_deleted')).toHaveLength(1);
            expect(successEvents('mfa_credentials_listed')).toHaveLength(1);
            expect(onError).not.toHaveBeenCalled();
        });

        test('cancelling keeps the credential', async () => {
            const user = userEvent.setup();
            listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
            await renderWidget({ showRemoveMfaCredential: true });

            await user.click(await screen.findByRole('button', { name: 'mfa.remove.email' }));
            const dialog = await screen.findByRole('alertdialog');
            await user.click(within(dialog).getByRole('button', { name: 'confirmation.cancel' }));

            await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
            expect(removeMfaEmail).not.toHaveBeenCalled();
            expect(screen.getByText('root@reach5.co')).toBeInTheDocument();
        });

        test('a failed removal keeps the credential and calls onError once', async () => {
            const user = userEvent.setup();
            const error: AppError = {
                errorId: '1',
                error: 'forbidden',
                errorDescription: 'Forbidden',
            };
            listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
            removeMfaEmail.mockRejectedValue(error);
            await renderWidget({ showRemoveMfaCredential: true });

            await user.click(await screen.findByRole('button', { name: 'mfa.remove.email' }));
            const dialog = await screen.findByRole('alertdialog');
            await user.click(within(dialog).getByRole('button', { name: 'confirmation.yes' }));

            await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
            expect(onError).toHaveBeenCalledWith(error);
            expect(successEvents('mfa_email_deleted')).toHaveLength(0);
            expect(listMfaCredentials).toHaveBeenCalledTimes(1);
            expect(await screen.findByText('root@reach5.co')).toBeInTheDocument();
        });

        test('a failed refresh after removal keeps the list and calls onError once', async () => {
            const user = userEvent.setup();
            const error: AppError = {
                errorId: '2',
                error: 'unexpected_error',
                errorDescription: 'Unexpected error',
            };
            listMfaCredentials
                .mockResolvedValueOnce({ credentials: [emailCredential] })
                .mockRejectedValueOnce(error);
            removeMfaEmail.mockResolvedValue(undefined);
            await renderWidget({ showRemoveMfaCredential: true });

            await user.click(await screen.findByRole('button', { name: 'mfa.remove.email' }));
            const dialog = await screen.findByRole('alertdialog');
            await user.click(within(dialog).getByRole('button', { name: 'confirmation.yes' }));

            await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
            expect(onError).toHaveBeenCalledWith(error);
            expect(successEvents('mfa_email_deleted')).toHaveLength(1);
            expect(await screen.findByText('root@reach5.co')).toBeInTheDocument();
        });
    });
});

const passkeyCredential = (id: string): PasskeyCredential => ({
    type: 'webauthn',
    id,
    friendlyName: `Passkey ${id}`,
    createdAt: '2024-01-15',
});

/** Core 1.42.0 does not declare the `webauthn` credential yet (see passkeyCredential.ts). */
const credentialsList = (...credentials: MfaCredential[]) =>
    ({ credentials }) as Awaited<ReturnType<Client['listMfaCredentials']>>;

const passkeyI18n: I18nMessages = {
    ...defaultI18n,
    'mfaList.passkeys': 'Passkeys',
    'mfaList.passkeyCount_one': '{count} passkey',
    'mfaList.passkeyCount_other': '{count} passkeys',
    'mfaList.alsoUsedToLogIn': 'Also used to log in',
    'mfaList.managePasskeys': 'Manage passkeys',
};

const renderWithMessages = async (messages: I18nMessages, language = defaultConfig.language) => {
    const widget = await mfaListWidget(
        { accessToken: 'azerty', onError, onSuccess },
        { apiClient, config: { ...defaultConfig, language }, defaultI18n: messages }
    );
    return render(widget);
};

describe('i18n: the passkey count uses native plurals from the default messages', () => {
    test('1 passkey uses the "_one" form', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWithMessages(passkeyI18n);

        expect(await screen.findByText('1 passkey · Also used to log in')).toBeInTheDocument();
    });

    test('2 passkeys use the "_other" form', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(passkeyCredential('a'), passkeyCredential('b'))
        );
        await renderWithMessages(passkeyI18n);

        expect(await screen.findByText('2 passkeys · Also used to log in')).toBeInTheDocument();
    });

    test('the plural form follows the configured language, not the browser one', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(...['a', 'b', 'c', 'd', 'e'].map(passkeyCredential))
        );
        await renderWithMessages(
            {
                ...passkeyI18n,
                'mfaList.passkeyCount_one': '{count} ключ',
                'mfaList.passkeyCount_few': '{count} ключа',
                'mfaList.passkeyCount_many': '{count} ключей',
                'mfaList.passkeyCount_other': '{count} ключа (other)',
            },
            'ru'
        );

        expect(await screen.findByText('5 ключей · Also used to log in')).toBeInTheDocument();
    });
});

describe('Criterion 1: a Passkeys row is shown if and only if the user has a passkey', () => {
    test('with passkeys, a single Passkeys row comes after the email and phone number rows', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(
                passkeyCredential('a'),
                emailCredential,
                passkeyCredential('b'),
                phoneCredential
            )
        );
        await renderWithMessages(passkeyI18n);

        await screen.findByText('Passkeys');
        const rows = screen.getAllByRole('listitem');
        expect(rows).toHaveLength(3);
        expect(within(rows[0]).getByText('root@reach5.co')).toBeInTheDocument();
        expect(within(rows[1]).getByText('33612345678')).toBeInTheDocument();
        expect(within(rows[2]).getByText('Passkeys')).toBeInTheDocument();
        expect(within(rows[2]).getByText('2 passkeys · Also used to log in')).toBeInTheDocument();
    });

    test('without passkey, there is no Passkeys row', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWithMessages(passkeyI18n);

        await screen.findByText('root@reach5.co');
        expect(screen.queryByText('Passkeys')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Manage passkeys' })).not.toBeInTheDocument();
    });

    test('with only passkeys, the Passkeys row is shown instead of the empty state', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWithMessages(passkeyI18n);

        expect(await screen.findAllByRole('listitem')).toHaveLength(1);
        expect(screen.queryByText('No second factor yet')).not.toBeInTheDocument();
    });

    test('the count comes from the MFA credentials list, with no device call', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(passkeyCredential('a'), passkeyCredential('b'))
        );
        await renderWithMessages(passkeyI18n);

        await screen.findByText('2 passkeys · Also used to log in');
        expect(listMfaCredentials).toHaveBeenCalledTimes(1);
        expect(listWebAuthnDevices).not.toHaveBeenCalled();
    });

    test('the row is a button announced as opening the passkeys view, with the count as description', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWithMessages(passkeyI18n);

        const button = await screen.findByRole('button', { name: 'Manage passkeys' });
        expect(button).toHaveAccessibleDescription('1 passkey · Also used to log in');
        expect(button).toHaveAttribute('data-slot', 'widget-mfa-credential');
    });

    test('the row shows the fingerprint icon in the success colour and a chevron, but no remove button', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        const widget = await mfaListWidget(
            { accessToken: 'azerty', onError, onSuccess, showRemoveMfaCredential: true },
            { apiClient, config: defaultConfig, defaultI18n: passkeyI18n }
        );
        render(widget);

        const button = await screen.findByRole('button', { name: 'Manage passkeys' });
        const icons = button.querySelectorAll('svg');
        expect(icons[0]).toHaveClass('lucide-fingerprint');
        expect(icons[0].parentElement).toHaveClass('text-success', 'bg-success/10');
        expect(icons[icons.length - 1]).toHaveClass('lucide-chevron-right');
        expect(screen.getAllByRole('button')).toEqual([button]);
    });
});

test('Snapshot: with passkeys', async () => {
    listMfaCredentials.mockResolvedValue(
        credentialsList(emailCredential, passkeyCredential('a'), passkeyCredential('b'))
    );
    const { container } = await renderWithMessages(passkeyI18n);

    await screen.findByText('Passkeys');

    expect(container).toMatchSnapshot();
});
