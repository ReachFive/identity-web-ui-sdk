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
    'mfaList.removeConfirmation': 'Remove {identifier}?',
    'mfaList.remove': 'Remove',
    'mfaList.cancel': 'Cancel',
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

const onError = jest.fn<OnError>();
const onSuccess = jest.fn<OnSuccess>();

// @ts-expect-error partial Client
const apiClient: Client = { listMfaCredentials, removeMfaEmail, removeMfaPhoneNumber };

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

    test('removal confirmation', async () => {
        const user = userEvent.setup();
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        const { container } = await renderWidget({ showRemoveMfaCredential: true });

        await user.click(await screen.findByRole('button', { name: 'mfa.remove.phoneNumber' }));
        await screen.findByRole('group', { name: 'Remove 33612345678?' });

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
});

describe('Criterion 4: email and phone number can only be removed when removal is enabled', () => {
    test('no remove button when showRemoveMfaCredential is false', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget({ showRemoveMfaCredential: false });

        await screen.findByText('root@reach5.co');
        expect(screen.queryByRole('button', { name: 'mfa.remove.email' })).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'mfa.remove.phoneNumber' })
        ).not.toBeInTheDocument();
    });

    test('no remove button by default', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
        await renderWidget();

        await screen.findByText('root@reach5.co');
        expect(screen.queryByRole('button', { name: 'mfa.remove.email' })).not.toBeInTheDocument();
    });

    test('each email and phone number row has a remove button when enabled', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget({ showRemoveMfaCredential: true });

        expect(await screen.findByRole('button', { name: 'mfa.remove.email' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfa.remove.phoneNumber' })).toBeInTheDocument();
    });
});

describe('Criterion 5: removal goes through an inline confirmation', () => {
    const openConfirmation = async (name: string) => {
        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name }));
        return { user, confirmation: await screen.findByRole('group', { name: /^Remove / }) };
    };

    test('the trash button turns the row into a confirmation, without any dialog', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [phoneCredential] });
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.phoneNumber');

        expect(confirmation).toHaveAccessibleName('Remove 33612345678?');
        expect(within(confirmation).getByText('Remove 33612345678?')).toBeInTheDocument();
        expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(within(confirmation).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
        expect(screen.getByRole('listitem')).toContainElement(confirmation);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(removeMfaPhoneNumber).not.toHaveBeenCalled();
    });

    test('the confirmation exposes the public widget-mfa-credential-confirm slot', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.email');

        expect(confirmation).toHaveAttribute('data-slot', 'widget-mfa-credential-confirm');
    });

    test('focus moves to Cancel when the confirmation opens', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.email');

        expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    test('other rows are dimmed and inert while a confirmation is open', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget({ showRemoveMfaCredential: true });

        const { confirmation } = await openConfirmation('mfa.remove.phoneNumber');

        const [emailRow, phoneRow] = screen.getAllByRole('listitem');
        expect(emailRow).toHaveAttribute('inert');
        expect(emailRow).toHaveClass('opacity-45');
        expect(phoneRow).not.toHaveAttribute('inert');
        expect(phoneRow).toContainElement(confirmation);
    });

    test('only one confirmation can be open at a time', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget({ showRemoveMfaCredential: true });

        await openConfirmation('mfa.remove.phoneNumber');

        expect(screen.getAllByRole('group', { name: /^Remove / })).toHaveLength(1);
        // The email row is inert: its trash button is out of the accessibility tree's reach.
        const [emailRow] = screen.getAllByRole('listitem');
        expect(emailRow).toHaveAttribute('inert');
    });

    test('Cancel closes the confirmation and returns focus to the trash button', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByRole('group', { name: /^Remove / })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'mfa.remove.email' })).toHaveFocus();
        screen.getAllByRole('listitem').forEach(row => expect(row).not.toHaveAttribute('inert'));
        expect(screen.getByText('root@reach5.co')).toBeInTheDocument();
        expect(removeMfaEmail).not.toHaveBeenCalled();
    });

    test('Escape closes the confirmation and returns focus to the trash button', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
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
            .mockResolvedValueOnce({ credentials: [emailCredential] })
            .mockResolvedValueOnce({ credentials: [] });
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

    test('Remove deletes the email: the row disappears and mfa_email_deleted fires', async () => {
        listMfaCredentials
            .mockResolvedValueOnce({ credentials: [emailCredential] })
            .mockResolvedValueOnce({ credentials: [] });
        removeMfaEmail.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
        expect(screen.queryByText('root@reach5.co')).not.toBeInTheDocument();
        expect(removeMfaEmail).toHaveBeenCalledWith({ accessToken: 'azerty' });
        expect(successEvents('mfa_email_deleted')).toHaveLength(1);
        expect(successEvents('mfa_credentials_listed')).toHaveLength(1);
        expect(onError).not.toHaveBeenCalled();
    });

    test('with an email and a phone number, removing the phone number removes only the phone number', async () => {
        listMfaCredentials
            .mockResolvedValueOnce({ credentials: [emailCredential, phoneCredential] })
            .mockResolvedValueOnce({ credentials: [emailCredential] });
        removeMfaPhoneNumber.mockResolvedValue(undefined);
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.phoneNumber');
        expect(confirmation).toHaveAccessibleName('Remove 33612345678?');
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

    test('Remove shows a pending state and cannot be triggered twice', async () => {
        let resolveRemoval: () => void = () => {};
        listMfaCredentials
            .mockResolvedValueOnce({ credentials: [emailCredential] })
            .mockResolvedValueOnce({ credentials: [] });
        removeMfaEmail.mockReturnValue(
            new Promise<void>(resolve => {
                resolveRemoval = resolve;
            })
        );
        await renderWidget({ showRemoveMfaCredential: true });

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        const remove = within(confirmation).getByRole('button', { name: 'Remove' });
        await user.click(remove);

        expect(remove).toBeDisabled();
        expect(remove).toHaveAttribute('aria-busy', 'true');
        expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await user.click(remove);
        expect(removeMfaEmail).toHaveBeenCalledTimes(1);

        resolveRemoval();
        expect(await screen.findByText('No second factor yet')).toBeInTheDocument();
        expect(removeMfaEmail).toHaveBeenCalledTimes(1);
    });

    test('a failed removal returns the row to normal, keeps the factor and calls onError once', async () => {
        const error: AppError = {
            errorId: '1',
            error: 'forbidden',
            errorDescription: 'Forbidden',
        };
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential, phoneCredential] });
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
        expect(screen.getByRole('button', { name: 'mfa.remove.email' })).toHaveFocus();
        screen.getAllByRole('listitem').forEach(row => expect(row).not.toHaveAttribute('inert'));
    });

    test('a failed refresh after removal keeps the list and calls onError once', async () => {
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

        const { user, confirmation } = await openConfirmation('mfa.remove.email');
        await user.click(within(confirmation).getByRole('button', { name: 'Remove' }));

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledWith(error);
        expect(successEvents('mfa_email_deleted')).toHaveLength(1);
        expect(await screen.findByText('root@reach5.co')).toBeInTheDocument();
    });

    test('the confirmation labels can be overridden through the i18n option', async () => {
        listMfaCredentials.mockResolvedValue({ credentials: [emailCredential] });
        await renderWidget({
            showRemoveMfaCredential: true,
            i18n: {
                'mfaList.removeConfirmation': 'Retirer {identifier} ?',
                'mfaList.remove': 'Retirer',
                'mfaList.cancel': 'Annuler',
            },
        });

        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'mfa.remove.email' }));

        const confirmation = await screen.findByRole('group', { name: 'Retirer root@reach5.co ?' });
        expect(within(confirmation).getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
        expect(within(confirmation).getByRole('button', { name: 'Retirer' })).toBeInTheDocument();
    });
});
