/**
 * @jest-environment jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Client, MFA } from '@reachfive/identity-core';

import { AppError, UserError } from '../../../src/helpers/errors';
import { colorToHSL } from '../../../src/lib/utils';
import mfaListWidget from '../../../src/widgets/mfa/mfaListWidget';

import type { I18nMessages } from '../../../src/contexts/i18n';
import type { Config, OnError, OnSuccess } from '../../../src/types';
import type {
    ListedCredential,
    PasskeyCredential,
} from '../../../src/widgets/mfa/passkeyCredential';

/*
 * The tests referring to a Squash test case (SDK > SDK UI > 01.13 - MFA > 01.13.03 -
 * ShowMfaCredentials Passkeys) replay its steps on the widget, with the API mocked. The passkey
 * management view (01.13.03.03 to 01.13.03.05) is tested in mfaListPasskeysView.test.ts.
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
    'mfaList.removeConfirmation': 'Remove {identifier}?',
    'mfaList.remove': 'Remove',
    'mfaList.cancel': 'Cancel',
    'mfaList.passkeys': 'Passkeys',
    'mfaList.passkeyCount_one': '{count} passkey',
    'mfaList.passkeyCount_other': '{count} passkeys',
    'mfaList.alsoUsedToLogIn': 'Also used to log in',
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

interface RenderContext {
    config?: Partial<Config>;
    messages?: I18nMessages;
}

const renderWidget = async (
    options: Partial<Parameters<typeof mfaListWidget>[0]> = {},
    { config = {}, messages = defaultI18n }: RenderContext = {}
) => {
    const widget = await mfaListWidget(
        { accessToken: 'azerty', onError, onSuccess, ...options },
        { apiClient, config: { ...defaultConfig, ...config }, defaultI18n: messages }
    );
    return render(widget);
};

const successEvents = (name: string) =>
    onSuccess.mock.calls.filter(([event]) => event.name === name);

/** Presses the trash button named `name` and returns the inline confirmation it opens. */
const openConfirmation = async (name: string) => {
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name }));
    return { user, confirmation: await screen.findByRole('group', { name: /^Remove / }) };
};

beforeEach(() => {
    jest.resetAllMocks();
});

/**
 * Squash: 01.13.03.01
 */
describe('01.13.03.01 - Active MFA factors are listed, passkeys grouped in a single row', () => {
    test('the widget lists exactly the credentials returned by the API', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(phoneCredential, emailCredential));
        await renderWidget();

        await screen.findByText('root@reach5.co');
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.queryByText('No second factor yet')).not.toBeInTheDocument();
        expect(listMfaCredentials).toHaveBeenCalledWith('azerty');
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledWith({
            name: 'mfa_credentials_listed',
            credentials: [phoneCredential, emailCredential],
        });
        expect(onError).not.toHaveBeenCalled();
    });

    test('the email and phone number rows come before a single Passkeys row', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(
                passkeyCredential('a'),
                emailCredential,
                passkeyCredential('b'),
                phoneCredential
            )
        );
        await renderWidget();

        await screen.findByText('Passkeys');
        const rows = screen.getAllByRole('listitem');
        expect(rows).toHaveLength(3);
        expect(within(rows[0]).getByText('root@reach5.co')).toBeInTheDocument();
        expect(within(rows[1]).getByText('33612345678')).toBeInTheDocument();
        expect(within(rows[2]).getByText('Passkeys')).toBeInTheDocument();
    });

    test('the email row shows the address, the "Email" label and the creation date', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget();

        const row = await screen.findByRole('listitem');
        expect(within(row).getByText('root@reach5.co')).toBeInTheDocument();
        expect(within(row).getByText('Email')).toBeInTheDocument();
        expect(row).toHaveTextContent('Created on 21/09/2022');
    });

    test('the phone number row shows the number, the "Phone number" label and the creation date', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(phoneCredential));
        await renderWidget();

        const row = await screen.findByRole('listitem');
        expect(within(row).getByText('33612345678')).toBeInTheDocument();
        expect(within(row).getByText('Phone number')).toBeInTheDocument();
        expect(row).toHaveTextContent('Created on 21/09/2022');
    });

    test('email and phone number rows have their own icon and a remove button when removal is allowed', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        await screen.findByText('root@reach5.co');
        const [emailRow, phoneRow] = screen.getAllByRole('listitem');
        expect(emailRow.querySelector('svg')).toHaveClass('lucide-mail');
        expect(phoneRow.querySelector('svg')).toHaveClass('lucide-smartphone');
        expect(
            within(emailRow).getByRole('button', { name: 'mfa.remove.email' })
        ).toBeInTheDocument();
        expect(
            within(phoneRow).getByRole('button', { name: 'mfa.remove.phoneNumber' })
        ).toBeInTheDocument();
    });

    test('the Passkeys row shows the fingerprint icon and a chevron, but no remove button', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWidget({ showRemoveMfaCredential: true });

        const button = await screen.findByRole('button', { name: 'Passkeys' });
        const icons = screen.getByRole('listitem').querySelectorAll('svg');
        expect(icons[0]).toHaveClass('lucide-fingerprint');
        expect(icons[icons.length - 1]).toHaveClass('lucide-chevron-right');
        expect(screen.getAllByRole('button')).toEqual([button]);
    });

    test('with several passkeys, the Passkeys row shows their count and "Also used to log in", without the devices', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(passkeyCredential('a'), passkeyCredential('b'))
        );
        await renderWidget();

        const row = await screen.findByRole('listitem');
        expect(within(row).getByText('2 passkeys · Also used to log in')).toBeInTheDocument();
        expect(within(row).queryByText('Passkey a')).not.toBeInTheDocument();
        expect(listMfaCredentials).toHaveBeenCalledTimes(1);
        expect(listWebAuthnDevices).not.toHaveBeenCalled();
    });

    test('with a single passkey, the count is 1', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWidget();

        expect(await screen.findByText('1 passkey · Also used to log in')).toBeInTheDocument();
    });

    test('without passkey, there is no Passkeys row and the other factors stay listed', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget();

        await screen.findByText('root@reach5.co');
        expect(screen.getByText('33612345678')).toBeInTheDocument();
        expect(screen.queryByText('Passkeys')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Passkeys' })).not.toBeInTheDocument();
    });
});

/**
 * Squash: 01.13.03.06
 */
describe('01.13.03.06 - With the MFA/passkey option disabled, the widget keeps its former behaviour', () => {
    // With the option disabled, the API leaves the passkeys out of the MFA credentials list: the
    // widget only shows what it gets.
    test('email and phone number credentials are listed and removable, with no Passkeys row', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredential: true }, { config: { webAuthn: false } });

        await screen.findByText('root@reach5.co');
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.queryByText('Passkeys')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfa.remove.email' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfa.remove.phoneNumber' })).toBeInTheDocument();
    });

    test('once the option is enabled again, a profile with a passkey gets its Passkeys row', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, passkeyCredential('a'))
        );
        await renderWidget();

        expect(await screen.findByRole('button', { name: 'Passkeys' })).toBeInTheDocument();
    });
});

/**
 * Squash: 01.13.03.07
 */
describe('01.13.03.07 - Email and phone number factors are removed through an inline confirmation', () => {
    test('with showRemoveMfaCredential, each email and phone number row has a remove button, not the Passkeys row', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, phoneCredential, passkeyCredential('a'))
        );
        await renderWidget({ showRemoveMfaCredential: true });

        expect(await screen.findByRole('button', { name: 'mfa.remove.email' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfa.remove.phoneNumber' })).toBeInTheDocument();
        const passkeysRow = screen.getAllByRole('listitem')[2];
        expect(within(passkeysRow).getAllByRole('button')).toEqual([
            within(passkeysRow).getByRole('button', { name: 'Passkeys' }),
        ]);
    });

    test('without showRemoveMfaCredential, the factors are listed without remove buttons and the Passkeys row still opens', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, phoneCredential, passkeyCredential('a'))
        );
        await renderWidget({ showRemoveMfaCredential: false });

        await screen.findByText('root@reach5.co');
        expect(screen.getByText('33612345678')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'mfa.remove.email' })).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'mfa.remove.phoneNumber' })
        ).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Passkeys' })).toBeEnabled();
    });

    test('removal is disabled by default', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget();

        await screen.findByText('root@reach5.co');
        expect(screen.queryByRole('button', { name: 'mfa.remove.email' })).not.toBeInTheDocument();
    });

    test('the email remove button turns the row into a confirmation, other rows dimmed', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, phoneCredential, passkeyCredential('a'))
        );
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.email');

        expect(confirmation).toHaveAccessibleName('Remove root@reach5.co?');
        expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(within(confirmation).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
        expect(confirmation.querySelector('svg')).toHaveClass('lucide-mail');
        const [emailRow, phoneRow, passkeysRow] = screen.getAllByRole('listitem');
        expect(emailRow).toContainElement(confirmation);
        expect(emailRow).not.toHaveAttribute('inert');
        for (const row of [phoneRow, passkeysRow]) {
            expect(row).toHaveAttribute('inert');
            expect(row).toHaveClass('opacity-45');
        }
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(removeMfaEmail).not.toHaveBeenCalled();
    });

    test('Cancel closes the confirmation and keeps the email, without any removal call', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByRole('group', { name: /^Remove / })).not.toBeInTheDocument();
        expect(screen.getByText('root@reach5.co')).toBeInTheDocument();
        screen.getAllByRole('listitem').forEach(row => expect(row).not.toHaveAttribute('inert'));
        expect(removeMfaEmail).not.toHaveBeenCalled();
    });

    test('Remove deletes the email: the row disappears and mfa_email_deleted fires', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential, phoneCredential))
            .mockResolvedValueOnce(credentialsList(phoneCredential));
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() => expect(screen.queryByText('root@reach5.co')).not.toBeInTheDocument());
        expect(removeMfaEmail).toHaveBeenCalledWith({ accessToken: 'azerty' });
        expect(removeMfaPhoneNumber).not.toHaveBeenCalled();
        expect(screen.getByText('33612345678')).toBeInTheDocument();
        expect(successEvents('mfa_email_deleted')).toHaveLength(1);
        expect(onError).not.toHaveBeenCalled();
    });

    test('the phone number remove button opens its own confirmation, other rows dimmed', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.phoneNumber');

        expect(confirmation).toHaveAccessibleName('Remove 33612345678?');
        expect(confirmation.querySelector('svg')).toHaveClass('lucide-smartphone');
        const [emailRow, phoneRow] = screen.getAllByRole('listitem');
        expect(phoneRow).toContainElement(confirmation);
        expect(emailRow).toHaveAttribute('inert');
        expect(emailRow).toHaveClass('opacity-45');
    });

    test('Remove deletes the phone number: the row disappears and mfa_phone_number_deleted fires', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential, phoneCredential))
            .mockResolvedValueOnce(credentialsList(emailCredential));
        removeMfaPhoneNumber.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.phoneNumber');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() => expect(screen.queryByText('33612345678')).not.toBeInTheDocument());
        expect(removeMfaPhoneNumber).toHaveBeenCalledWith({
            accessToken: 'azerty',
            phoneNumber: '33612345678',
        });
        expect(removeMfaEmail).not.toHaveBeenCalled();
        expect(screen.getByText('root@reach5.co')).toBeInTheDocument();
        expect(successEvents('mfa_phone_number_deleted')).toHaveLength(1);
        expect(successEvents('mfa_email_deleted')).toHaveLength(0);
    });

    test('a failed removal keeps the factor and passes the error to onError', async () => {
        const error: AppError = {
            errorId: '1',
            error: 'forbidden',
            errorDescription: 'Forbidden',
        };
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        removeMfaEmail.mockRejectedValue(error);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() =>
            expect(screen.queryByRole('group', { name: /^Remove / })).not.toBeInTheDocument()
        );
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(error);
        expect(successEvents('mfa_email_deleted')).toHaveLength(0);
        expect(listMfaCredentials).toHaveBeenCalledTimes(1);
        expect(screen.getByText('root@reach5.co')).toBeInTheDocument();
        screen.getAllByRole('listitem').forEach(row => expect(row).not.toHaveAttribute('inert'));
    });
});

/**
 * Squash: 01.13.03.08
 */
describe('01.13.03.08 - Without any active MFA factor, an empty state is shown', () => {
    test('"No second factor yet" is shown with a shield icon, with no row and no remove action', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget({ showRemoveMfaCredential: true });

        const label = await screen.findByText('No second factor yet');
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
        expect(screen.queryAllByRole('button')).toHaveLength(0);
        const emptyState = label.closest('[data-slot="item"]');
        expect(emptyState?.querySelector('svg')).toHaveClass('lucide-shield');
    });
});

/**
 * Squash: 01.13.03.09
 */
describe('01.13.03.09 - Theme attributes are respected and every new label is translatable', () => {
    const styleOf = (container: HTMLElement) => container.querySelector('style')?.textContent ?? '';

    test('factor icons use the success colour of the theme, green by default', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        const { container } = await renderWidget();

        const row = await screen.findByRole('listitem');
        expect(row.querySelector('svg')?.parentElement).toHaveClass(
            'text-success',
            'bg-success/10'
        );
        expect(styleOf(container)).toContain(`--success:${colorToHSL('#229955')}`);
    });

    test('a custom success colour applies to the factor icons, not the primary colour', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        const { container } = await renderWidget({
            theme: { primaryColor: '#d0021b', successColor: '#274890' },
        });

        await screen.findByRole('listitem');
        expect(styleOf(container)).toContain(`--success:${colorToHSL('#274890')}`);
        expect(styleOf(container)).toContain(`--primary:${colorToHSL('#d0021b')}`);
    });

    test('the creation date follows the configured language', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget({}, { config: { language: 'en-US' } });

        expect(await screen.findByRole('listitem')).toHaveTextContent('Created on 9/21/2022');
    });

    test('the passkey count follows the plural rules of the configured language', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(...['a', 'b', 'c', 'd', 'e'].map(passkeyCredential))
        );
        await renderWidget(
            {},
            {
                config: { language: 'ru' },
                messages: {
                    ...defaultI18n,
                    'mfaList.passkeyCount_one': '{count} ключ',
                    'mfaList.passkeyCount_few': '{count} ключа',
                    'mfaList.passkeyCount_many': '{count} ключей',
                    'mfaList.passkeyCount_other': '{count} ключа (other)',
                },
            }
        );

        expect(await screen.findByText('5 ключей · Also used to log in')).toBeInTheDocument();
    });

    test('the row labels can be overridden through the i18n option', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, phoneCredential, passkeyCredential('a'))
        );
        await renderWidget({
            i18n: {
                'mfaList.email': 'Courriel',
                'mfaList.phoneNumber': 'Téléphone',
                'mfaList.createdOn': 'Ajouté le {date}',
                'mfaList.passkeys': 'Clés d’accès',
                'mfaList.passkeyCount_one': '{count} clé',
                'mfaList.alsoUsedToLogIn': 'Sert aussi à se connecter',
            },
        });

        await screen.findByText('Courriel');
        expect(screen.getByText('Téléphone')).toBeInTheDocument();
        const [emailRow, phoneRow] = screen.getAllByRole('listitem');
        expect(emailRow).toHaveTextContent('Ajouté le 21/09/2022');
        expect(phoneRow).toHaveTextContent('Ajouté le 21/09/2022');
        expect(screen.getByRole('button', { name: 'Clés d’accès' })).toHaveAccessibleDescription(
            '1 clé · Sert aussi à se connecter'
        );
    });

    test('the remove buttons and the confirmation labels can be overridden through the i18n option', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({
            showRemoveMfaCredential: true,
            i18n: {
                'mfa.remove.email': 'Supprimer l’email',
                'mfa.remove.phoneNumber': 'Supprimer le téléphone',
                'mfaList.removeConfirmation': 'Retirer {identifier} ?',
                'mfaList.remove': 'Retirer',
                'mfaList.cancel': 'Annuler',
            },
        });

        expect(
            await screen.findByRole('button', { name: 'Supprimer le téléphone' })
        ).toBeInTheDocument();
        await userEvent.setup().click(screen.getByRole('button', { name: 'Supprimer l’email' }));

        const confirmation = await screen.findByRole('group', { name: 'Retirer root@reach5.co ?' });
        expect(within(confirmation).getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
        expect(within(confirmation).getByRole('button', { name: 'Retirer' })).toBeInTheDocument();
    });

    test('the empty state label can be overridden through the i18n option', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        await renderWidget({ i18n: { 'mfaList.empty': 'Aucun second facteur' } });

        expect(await screen.findByText('Aucun second facteur')).toBeInTheDocument();
    });
});

describe('Loading the credentials', () => {
    test('loads the credentials only once the widget is rendered', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        const widget = await mfaListWidget(
            { accessToken: 'azerty', onError, onSuccess },
            { apiClient, config: defaultConfig, defaultI18n }
        );

        expect(listMfaCredentials).not.toHaveBeenCalled();

        render(widget);

        await screen.findByText('No second factor yet');
        expect(listMfaCredentials).toHaveBeenCalledWith('azerty');
        expect(onSuccess).toHaveBeenCalledWith({ name: 'mfa_credentials_listed', credentials: [] });
    });

    test('shows a spinner while the credentials are loading', async () => {
        listMfaCredentials.mockReturnValue(new Promise(() => {}));
        const { container } = await renderWidget();

        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        expect(screen.queryByText('No second factor yet')).not.toBeInTheDocument();
    });

    test('an API error shows its description and calls onError once', async () => {
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

    test('a user error shows its message', async () => {
        listMfaCredentials.mockRejectedValue(new UserError('Access denied'));
        await renderWidget();

        expect(await screen.findByText('Access denied')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledTimes(1);
    });

    test('a failed first load is logged like any widget display failure', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        listMfaCredentials.mockRejectedValue(new UserError('Access denied'));
        await renderWidget();

        await screen.findByText('Access denied');
        expect(consoleError).toHaveBeenCalledWith(
            'ReachFive widget display fails:',
            new UserError('Access denied')
        );
        consoleError.mockRestore();
    });

    test('coming back to the page does not refetch the credentials', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget();

        await screen.findByText('root@reach5.co');
        // Suspense queries stay fresh for 1s: move past it so the data is stale.
        const now = Date.now();
        const dateNow = jest.spyOn(Date, 'now').mockReturnValue(now + 60_000);
        window.dispatchEvent(new Event('visibilitychange'));
        await new Promise(resolve => setTimeout(resolve, 0));
        dateNow.mockRestore();

        expect(listMfaCredentials).toHaveBeenCalledTimes(1);
    });

    test('with only passkeys, the Passkeys row is shown instead of the empty state', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWidget();

        expect(await screen.findAllByRole('listitem')).toHaveLength(1);
        expect(screen.queryByText('No second factor yet')).not.toBeInTheDocument();
    });
});

describe('The creation date', () => {
    test('is a machine-readable <time> element inside the translated label', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget({ i18n: { 'mfaList.createdOn': 'Ajouté le {date} (UTC)' } });

        const row = await screen.findByRole('listitem');
        const time = row.querySelector('time');
        expect(time).toHaveAttribute('dateTime', '2022-09-21');
        expect(time).toHaveTextContent(/^21\/09\/2022$/);
        expect(time?.parentElement).toHaveTextContent(/^Ajouté le 21\/09\/2022 \(UTC\)$/);
    });
});

describe('The removal confirmation, for keyboard and assistive technology users', () => {
    test('focus moves to Cancel when the confirmation opens', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.email');

        expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    test('only one confirmation can be open at a time: the other rows are inert', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        await openConfirmation('mfa.remove.phoneNumber');

        expect(screen.getAllByRole('group', { name: /^Remove / })).toHaveLength(1);
        const [emailRow] = screen.getAllByRole('listitem');
        expect(emailRow).toHaveAttribute('inert');
    });

    test('Cancel returns focus to the trash button', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

        expect(screen.getByRole('button', { name: 'mfa.remove.email' })).toHaveFocus();
    });

    test('Escape closes the confirmation and returns focus to the trash button', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        const { user } = await openConfirmation('mfa.remove.phoneNumber');
        await user.keyboard('{Escape}');

        expect(screen.queryByRole('group', { name: /^Remove / })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfa.remove.phoneNumber' })).toHaveFocus();
        expect(removeMfaPhoneNumber).not.toHaveBeenCalled();
    });

    test('the confirmation can be reached and confirmed with the keyboard', async () => {
        const user = userEvent.setup();
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential))
            .mockResolvedValueOnce(credentialsList());
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        await screen.findByRole('button', { name: 'mfa.remove.email' });
        await user.tab();
        expect(screen.getByRole('button', { name: 'mfa.remove.email' })).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(await screen.findByRole('button', { name: 'Cancel' })).toHaveFocus();
        await user.tab();
        expect(screen.getByRole('button', { name: 'Remove' })).toHaveFocus();
        await user.keyboard('{Enter}');

        expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
        expect(removeMfaEmail).toHaveBeenCalledTimes(1);
    });

    test('Remove shows a pending state and cannot be triggered twice', async () => {
        let resolveRemoval: () => void = () => {};
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential))
            .mockResolvedValueOnce(credentialsList());
        removeMfaEmail.mockReturnValue(
            new Promise<void>(resolve => {
                resolveRemoval = resolve;
            })
        );
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        const remove = within(confirmation).getByRole('button', { name: 'Remove' });
        await user.click(remove);

        // aria-disabled, not disabled: a disabled button would drop the focus to <body>.
        expect(remove).toHaveFocus();
        expect(remove).toHaveAttribute('aria-disabled', 'true');
        expect(remove).toHaveAttribute('aria-busy', 'true');
        const cancel = within(confirmation).getByRole('button', { name: 'Cancel' });
        expect(cancel).toHaveAttribute('aria-disabled', 'true');
        await user.click(remove);
        expect(removeMfaEmail).toHaveBeenCalledTimes(1);
        await user.click(cancel);
        expect(screen.getByRole('group', { name: /^Remove / })).toBeInTheDocument();

        resolveRemoval();
        expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
        expect(removeMfaEmail).toHaveBeenCalledTimes(1);
    });

    test('a failed removal returns focus to the trash button', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        removeMfaEmail.mockRejectedValue(new UserError('Forbidden'));
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'mfa.remove.email' })).toHaveFocus()
        );
    });

    test('a failed refresh after removal keeps the list and calls onError once', async () => {
        const error: AppError = {
            errorId: '2',
            error: 'unexpected_error',
            errorDescription: 'Unexpected error',
        };
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential))
            .mockRejectedValueOnce(error);
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(error);
        expect(successEvents('mfa_email_deleted')).toHaveLength(1);
        expect(await screen.findByText('root@reach5.co')).toBeInTheDocument();
    });

    test('after removing a row, focus moves to the trash button of the next row', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential, phoneCredential))
            .mockResolvedValueOnce(credentialsList(phoneCredential));
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'mfa.remove.phoneNumber' })).toHaveFocus()
        );
    });

    test('after removing the last row, focus moves to the trash button of the previous row', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential, phoneCredential))
            .mockResolvedValueOnce(credentialsList(emailCredential));
        removeMfaPhoneNumber.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.phoneNumber');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'mfa.remove.email' })).toHaveFocus()
        );
    });

    test('after removing the factor above it, focus moves to the Passkeys row', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential, passkeyCredential('a')))
            .mockResolvedValueOnce(credentialsList(passkeyCredential('a')));
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() => expect(screen.getByRole('button', { name: 'Passkeys' })).toHaveFocus());
    });

    test('after removing the only factor, focus moves to the empty state', async () => {
        listMfaCredentials
            .mockResolvedValueOnce(credentialsList(emailCredential))
            .mockResolvedValueOnce(credentialsList());
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        const empty = await screen.findByText('No second factor yet');
        await waitFor(() => {
            expect(document.activeElement).not.toBe(document.body);
            expect(document.activeElement).toContainElement(empty);
        });
    });

    test('the Passkeys row is dimmed and inert while a confirmation is open, like the other rows', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, passkeyCredential('a'))
        );
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        const [, passkeysRow] = screen.getAllByRole('listitem');
        expect(passkeysRow).toHaveAttribute('inert');

        await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));
        expect(passkeysRow).not.toHaveAttribute('inert');
        expect(passkeysRow).not.toHaveClass('opacity-45');
    });
});

describe('The Passkeys row, for assistive technology users', () => {
    test('is a button announced as opening the passkeys view, with the count as description', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(passkeyCredential('a')));
        await renderWidget();

        const button = await screen.findByRole('button', { name: 'Passkeys' });
        expect(button).toHaveAccessibleDescription('1 passkey · Also used to log in');
        // The visible label is the name: no aria-label overriding it.
        expect(button).not.toHaveAttribute('aria-label');
        // Phrasing content only: a <button> cannot hold <div> or <p>.
        expect(button.querySelector('div, p')).toBeNull();
    });
});

describe('Public styling slots', () => {
    test('every row shape carries widget-mfa-credential on its list item', async () => {
        listMfaCredentials.mockResolvedValue(
            credentialsList(emailCredential, phoneCredential, passkeyCredential('a'))
        );
        await renderWidget({ showRemoveMfaCredential: true });

        await openConfirmation('mfa.remove.email');

        const rows = screen.getAllByRole('listitem');
        expect(rows).toHaveLength(3);
        rows.forEach(row => expect(row).toHaveAttribute('data-slot', 'widget-mfa-credential'));
        expect(document.querySelectorAll('[data-slot="widget-mfa-credential"]')).toHaveLength(3);
    });

    test('the confirmation carries widget-mfa-credential-confirm', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential));
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.email');

        expect(confirmation).toHaveAttribute('data-slot', 'widget-mfa-credential-confirm');
    });
});

describe('Snapshot', () => {
    test('empty', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList());
        const { container } = await renderWidget();

        await screen.findByText('No second factor yet');

        expect(container).toMatchSnapshot();
    });

    test('basic', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(phoneCredential, emailCredential));
        const { container } = await renderWidget();

        await screen.findByText('root@reach5.co');

        expect(container).toMatchSnapshot();
    });

    test('client theme', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
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

    test('removal confirmation', async () => {
        listMfaCredentials.mockResolvedValue(credentialsList(emailCredential, phoneCredential));
        const { container } = await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.phoneNumber');
        // The question id comes from useId, whose value depends on the ids earlier tests consumed:
        // pin it so the snapshot does not change with the test order or the tests run.
        container
            .querySelector(`[id="${confirmation.getAttribute('aria-labelledby')}"]`)
            ?.setAttribute('id', 'confirmation-question');
        confirmation.setAttribute('aria-labelledby', 'confirmation-question');

        expect(container).toMatchSnapshot();
    });
});

test('Snapshot: with passkeys', async () => {
    listMfaCredentials.mockResolvedValue(
        credentialsList(emailCredential, passkeyCredential('a'), passkeyCredential('b'))
    );
    const { container } = await renderWidget();

    await screen.findByText('Passkeys');
    // The count id comes from useId, whose value depends on the ids earlier tests consumed: pin
    // it so the snapshot does not change with the test order or the tests run.
    const button = screen.getByRole('button', { name: 'Passkeys' });
    container
        .querySelector(`[id="${button.getAttribute('aria-describedby')}"]`)
        ?.setAttribute('id', 'passkey-count');
    button.setAttribute('aria-describedby', 'passkey-count');

    expect(container).toMatchSnapshot();
});
